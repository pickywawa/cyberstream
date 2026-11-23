use chrono::NaiveDate;
use quick_xml::{
    Reader,
    escape::unescape,
    events::{BytesStart, Event},
};
use serde::Serialize;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn xmltv_date(raw: &str) -> f64 {
    fn parse(raw: &str) -> Option<i64> {
        let s = raw.trim();
        let digit = |a, b| s.get(a..b)?.parse::<u32>().ok();
        let date = NaiveDate::from_ymd_opt(digit(0, 4)? as i32, digit(4, 6)?, digit(6, 8)?)?;
        let seconds = digit(12, 14);
        let at = date
            .and_hms_opt(digit(8, 10)?, digit(10, 12)?, seconds.unwrap_or(0))?
            .and_utc();
        let tz = s
            .get(if seconds.is_some() { 14 } else { 12 }..)?
            .trim()
            .replace(':', "");
        let offset = match tz.as_bytes().first() {
            Some(b'+' | b'-') => {
                let h = tz.get(1..3)?.parse::<i64>().ok()?;
                let m = tz.get(3..5).unwrap_or("0").parse::<i64>().ok()?;
                (h * 60 + m) * if tz.starts_with('-') { -1 } else { 1 }
            }
            _ => 0,
        };
        Some(at.timestamp_millis() - offset * 60_000)
    }
    parse(raw).map_or(f64::NAN, |v| v as f64)
}

#[derive(Default, Serialize)]
struct Channel {
    id: String,
    names: Vec<String>,
    #[serde(skip_serializing_if = "String::is_empty")]
    icon: String,
}
#[derive(Default, Serialize)]
#[serde(rename_all = "camelCase")]
struct Program {
    epg_id: String,
    start: f64,
    stop: f64,
    title: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    sub_title: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    desc: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    category: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    episode_num: String,
    #[serde(skip_serializing_if = "String::is_empty")]
    icon: String,
}
#[derive(Default, Serialize)]
struct Batch {
    channels: Vec<Channel>,
    programs: Vec<Program>,
    started: bool,
}
#[wasm_bindgen]
pub struct Guide {
    from: f64,
    to: f64,
    closed_tv: bool,
    partial: String,
    channel: Option<Channel>,
    program: Option<Program>,
    field: String,
    text: String,
}
fn attr(tag: &BytesStart, key: &[u8]) -> String {
    tag.attributes()
        .flatten()
        .find(|a| a.key.as_ref() == key)
        .and_then(|a| a.unescape_value().ok().map(|s| s.into_owned()))
        .unwrap_or_default()
}
impl Guide {
    fn open(&mut self, t: &BytesStart, b: &mut Batch) {
        match t.name().as_ref() {
            b"channel" => {
                self.channel = Some(Channel {
                    id: attr(t, b"id"),
                    ..Default::default()
                })
            }
            b"programme" => {
                b.started = true;
                let start = xmltv_date(&attr(t, b"start"));
                let end = xmltv_date(&attr(t, b"stop"));
                let stop = if end.is_finite() {
                    end
                } else {
                    start + 3_600_000.
                };
                self.program = (start < self.to && stop > self.from).then(|| Program {
                    epg_id: attr(t, b"channel"),
                    start,
                    stop,
                    ..Default::default()
                });
            }
            b"icon" => {
                if let Some(p) = &mut self.program {
                    if p.icon.is_empty() {
                        p.icon = attr(t, b"src")
                    }
                } else if let Some(c) = &mut self.channel {
                    c.icon = attr(t, b"src")
                }
            }
            name if (self.channel.is_some() && name == b"display-name")
                || (self.program.is_some()
                    && matches!(
                        name,
                        b"title" | b"sub-title" | b"desc" | b"category" | b"episode-num"
                    )) =>
            {
                self.field = String::from_utf8_lossy(name).into_owned();
                self.text.clear();
            }
            _ => (),
        }
    }
    fn close(&mut self, name: &[u8], b: &mut Batch) {
        if name == b"tv" {
            self.closed_tv = true;
        }
        if self.field.as_bytes() == name {
            let value = self.text.trim();
            if let Some(c) = &mut self.channel {
                c.names.push(value.into())
            } else if let Some(p) = &mut self.program {
                let target = match name {
                    b"title" => &mut p.title,
                    b"sub-title" => &mut p.sub_title,
                    b"desc" => &mut p.desc,
                    b"category" => &mut p.category,
                    _ => &mut p.episode_num,
                };
                if target.is_empty() {
                    target.push_str(value)
                }
            }
            self.field.clear();
        } else if name == b"channel" {
            b.channels.extend(self.channel.take())
        } else if name == b"programme" {
            b.programs.extend(self.program.take())
        }
    }
}
#[wasm_bindgen]
impl Guide {
    #[wasm_bindgen(constructor)]
    pub fn new(from: f64, to: f64) -> Self {
        Self {
            from,
            to,
            closed_tv: false,
            partial: String::new(),
            channel: None,
            program: None,
            field: String::new(),
            text: String::new(),
        }
    }
    pub fn feed(&mut self, chunk: &str, end: bool) -> Result<String, String> {
        let mut bytes = std::mem::take(&mut self.partial);
        bytes.push_str(chunk);
        let mut reader = Reader::from_str(&bytes);
        reader.config_mut().check_end_names = false;
        reader.config_mut().allow_unmatched_ends = true;
        let mut batch = Batch::default();
        loop {
            let pos = reader.buffer_position() as usize;
            if pos == bytes.len() {
                break;
            }
            let event = reader.read_event();
            // quick-xml treats its slice as EOF. Preserve a partial token for the next network read.
            if !end
                && (event.is_err()
                    || (reader.buffer_position() as usize == bytes.len()
                        && (!bytes.ends_with('>') || matches!(&event, Ok(Event::Text(_))))))
            {
                self.partial.push_str(&bytes[pos..]);
                break;
            }
            match event.map_err(|_| "Guide XMLTV invalide")? {
                Event::Start(t) => self.open(&t, &mut batch),
                Event::Empty(t) => {
                    self.open(&t, &mut batch);
                    self.close(t.name().as_ref(), &mut batch)
                }
                Event::End(t) => self.close(t.name().as_ref(), &mut batch),
                Event::Text(t) if !self.field.is_empty() => self
                    .text
                    .push_str(&t.decode().map_err(|_| "Texte XMLTV invalide")?),
                Event::CData(t) if !self.field.is_empty() => self
                    .text
                    .push_str(&t.decode().map_err(|_| "CDATA invalide")?),
                Event::GeneralRef(t) if !self.field.is_empty() => {
                    let entity = format!("&{};", t.decode().map_err(|_| "Entité invalide")?);
                    self.text
                        .push_str(&unescape(&entity).map_err(|_| "Entité invalide")?);
                }
                Event::Eof => break,
                _ => (),
            }
        }
        if self.partial.len() > 8 * 1024 * 1024
            || (end && (!self.closed_tv || self.channel.is_some() || self.program.is_some()))
        {
            return Err("Guide XMLTV incomplet".into());
        }
        serde_json::to_string(&batch).map_err(|_| "Guide invalide".into())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn valid_at_every_chunk_boundary() {
        let xml = r#"<?xml version="1.0"?><tv><!-- a > b --><channel id="a"><display-name>A &amp; B</display-name></channel><programme channel="a" start="20240101100000" stop="20240101103000"><title>A &amp; B</title><desc><![CDATA[weather > 20°]]></desc></programme></tv>"#;
        for (cut, _) in xml.char_indices() {
            let mut g = Guide::new(0., 2e12);
            let a: serde_json::Value =
                serde_json::from_str(&g.feed(&xml[..cut], false).unwrap()).unwrap();
            let b: serde_json::Value = serde_json::from_str(
                &g.feed(&xml[cut..], true)
                    .unwrap_or_else(|e| panic!("cut {cut}: {e}")),
            )
            .unwrap();
            let p = a["programs"]
                .as_array()
                .unwrap()
                .iter()
                .chain(b["programs"].as_array().unwrap())
                .next()
                .unwrap();
            assert_eq!(p["title"], "A & B", "cut {cut}");
            assert_eq!(p["desc"], "weather > 20°", "cut {cut}");
        }
    }
}

/// Keep stable database ids for the same channel/time slot. Most refreshed EPG rows are identical.
#[wasm_bindgen]
pub fn guide_delta(existing: &str, incoming: &str) -> Result<String, String> {
    use serde_json::{Value, json};
    use std::collections::{HashMap, VecDeque};
    fn rows(raw: &str) -> Result<Vec<Value>, String> {
        serde_json::from_str(raw).map_err(|_| "Programmes invalides".into())
    }
    let mut old: HashMap<i64, VecDeque<(Value, Value)>> = HashMap::new();
    for mut row in rows(existing)? {
        let start = row["start"].as_i64().ok_or("Horaire invalide")?;
        let id = row
            .as_object_mut()
            .and_then(|m| m.remove("id"))
            .ok_or("Programme sans identifiant")?;
        old.entry(start).or_default().push_back((id, row));
    }
    let mut write = Vec::new();
    for mut row in rows(incoming)? {
        let start = row["start"].as_i64().ok_or("Horaire invalide")?;
        if let Some((id, previous)) = old.get_mut(&start).and_then(VecDeque::pop_front) {
            if previous == row {
                continue;
            }
            row["id"] = id;
        }
        write.push(row);
    }
    let remove: Vec<_> = old.into_values().flatten().map(|(id, _)| id).collect();
    Ok(json!({"write":write,"remove":remove}).to_string())
}
