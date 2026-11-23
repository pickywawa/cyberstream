//! Incremental Xtream list import. Panels return either arrays or keyed objects.
//! Only an unfinished record and the rows for the current network chunk stay live.
use crate::{language, text};
use serde_json::{Value, json};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

fn string(v: &Value) -> String {
    match v {
        Value::String(s) => s.clone(),
        Value::Number(n) => n.to_string(),
        _ => String::new(),
    }
}
fn number(v: &Value) -> Option<f64> {
    v.as_f64()
        .or_else(|| v.as_str()?.trim().parse().ok())
        .filter(|n| n.is_finite())
}
fn nonzero(v: &Value) -> Option<f64> {
    number(v).filter(|n| *n != 0.)
}

struct Category {
    raw: String,
    universe: String,
}

#[wasm_bindgen]
pub struct XtreamList {
    kind: String,
    source: String,
    profile: String,
    cats: HashMap<String, Category>,
    category_rows: Vec<Value>,
    // A category change also changes languages, grouping or display labels on its rows.
    category_stamp: u64,
    previous: HashMap<String, u64>,
    observed: HashMap<String, u64>,
    restricted: bool,
    requested: String,
    root: u8,
    finished: bool,
    quoted: bool,
    escape: bool,
    depth: i32,
    record: Vec<u8>,
    seen: usize,
    valid: usize,
}
#[wasm_bindgen]
impl XtreamList {
    #[wasm_bindgen(constructor)]
    pub fn new(kind: &str, source: &str, profile: &str, categories: &str) -> Result<Self, String> {
        let cat_prefix = match kind {
            "live" => "lc",
            "vod" => "vc",
            "series" => "sc",
            _ => return Err("Unknown catalogue".into()),
        };
        let cats: Vec<Value> =
            serde_json::from_str(categories).map_err(|_| "Invalid categories")?;
        let mut lookup = HashMap::new();
        let mut rows = Vec::new();
        for (idx, c) in cats.into_iter().enumerate() {
            let raw = string(&c["category_name"]);
            let cat = string(&c["category_id"]);
            let universe = text::universe(&raw);
            rows.push(json!({"id":format!("{source}:{cat_prefix}:{cat}"),"sourceId":source,"profileId":profile,"kind":kind,"name":text::clean_name(&raw),"universe":universe,"order":idx}));
            lookup.insert(cat, Category { raw, universe });
        }
        Ok(Self {
            kind: kind.into(),
            source: source.into(),
            profile: profile.into(),
            cats: lookup,
            category_rows: rows,
            category_stamp: fingerprint(categories.as_bytes(), 0xcbf29ce484222325),
            previous: HashMap::new(),
            observed: HashMap::new(),
            restricted: false,
            requested: String::new(),
            root: 0,
            finished: false,
            quoted: false,
            escape: false,
            depth: 0,
            record: Vec::new(),
            seen: 0,
            valid: 0,
        })
    }
    pub fn restore(&mut self, bytes: &[u8]) -> Result<(), String> {
        let len = bytes
            .get(..4)
            .and_then(|b| b.try_into().ok())
            .map(u32::from_le_bytes)
            .ok_or("Index de source invalide")?;
        if len > 64 * 1024 * 1024 {
            return Err("Index de source trop grand".into());
        }
        let data =
            lz4_flex::decompress_size_prepended(bytes).map_err(|_| "Index de source corrompu")?;
        self.previous = postcard::from_bytes(&data).map_err(|_| "Index de source incompatible")?;
        Ok(())
    }
    pub fn snapshot(&self) -> Result<Vec<u8>, String> {
        let bytes =
            postcard::to_allocvec(&self.observed).map_err(|_| "Index de source invalide")?;
        Ok(lz4_flex::compress_prepend_size(&bytes))
    }
    pub fn categories(&self) -> String {
        serde_json::to_string(&self.category_rows).unwrap()
    }
    pub fn next_document(&mut self, requested: &str, restricted: bool) -> Result<(), String> {
        if self.root != 0 && !self.finished {
            return Err("Liste précédente incomplète".into());
        }
        self.root = 0;
        self.finished = false;
        self.seen = 0;
        self.valid = 0;
        self.requested = requested.into();
        self.restricted = restricted;
        Ok(())
    }
    pub fn feed(&mut self, chunk: &[u8], end: bool) -> Result<String, String> {
        let mut batch = Vec::new();
        for &byte in chunk {
            if self.root == 0 {
                if byte.is_ascii_whitespace() {
                    continue;
                }
                if !matches!(byte, b'[' | b'{') {
                    return Err("Liste Xtream invalide".into());
                }
                self.root = byte;
                continue;
            }
            if self.finished {
                if !byte.is_ascii_whitespace() {
                    return Err("Données après la liste".into());
                }
                continue;
            }
            if !self.quoted && self.depth == 0 && matches!(byte, b',' | b']' | b'}') {
                let close = byte != b',';
                if close && byte != if self.root == b'[' { b']' } else { b'}' } {
                    return Err("Fin de liste invalide".into());
                }
                if self.record.iter().any(|b| !b.is_ascii_whitespace()) {
                    let value = if self.root == b'{' {
                        let mut des = serde_json::Deserializer::from_slice(&self.record)
                            .into_iter::<String>();
                        des.next()
                            .transpose()
                            .map_err(|_| "Clé invalide")?
                            .ok_or("Clé absente")?;
                        let tail = &self.record[des.byte_offset()..];
                        let colon = tail
                            .iter()
                            .position(|b| !b.is_ascii_whitespace())
                            .ok_or("Valeur absente")?;
                        if tail[colon] != b':' {
                            return Err("Clé invalide".into());
                        }
                        &tail[colon + 1..]
                    } else {
                        &self.record
                    };
                    let row: Value =
                        serde_json::from_slice(value).map_err(|_| "Entrée Xtream invalide")?;
                    self.seen += 1;
                    let stamp = fingerprint(value, self.category_stamp);
                    let id = string(
                        &row[if self.kind == "series" {
                            "series_id"
                        } else {
                            "stream_id"
                        }],
                    );
                    let cat = string(&row["category_id"]);
                    if !self.requested.is_empty() && !id.is_empty() && cat != self.requested {
                        return Err("Catégorie ignorée par le serveur".into());
                    }
                    if self.restricted && !self.cats.contains_key(&cat) {
                        self.valid += usize::from(!id.is_empty());
                        self.record.clear();
                        self.finished = close;
                        continue;
                    }
                    if !id.is_empty()
                        && self.observed.get(&id).or_else(|| self.previous.get(&id)) == Some(&stamp)
                    {
                        let prefix = match self.kind.as_str() {
                            "series" => "s",
                            "live" => "l",
                            _ => "m",
                        };
                        batch.push(Value::String(format!("{}:{prefix}:{id}", self.source)));
                        self.observed.insert(id, stamp);
                        self.valid += 1;
                    } else if let Some(row) = self.convert(&row) {
                        self.observed.insert(id, stamp);
                        batch.push(row);
                        self.valid += 1
                    }
                } else if !close || self.seen != 0 {
                    return Err("Entrée manquante".into());
                }
                self.record.clear();
                self.finished = close;
                continue;
            }
            self.record.push(byte);
            if self.record.len() > 8 * 1024 * 1024 {
                return Err("Entrée Xtream trop grande".into());
            }
            if self.escape {
                self.escape = false
            } else if self.quoted && byte == b'\\' {
                self.escape = true
            } else if byte == b'"' {
                self.quoted = !self.quoted
            } else if !self.quoted {
                match byte {
                    b'[' | b'{' => self.depth += 1,
                    b']' | b'}' => self.depth -= 1,
                    _ => (),
                }
            }
        }
        if end && (!self.finished || (self.root == b'{' && self.seen > 0 && self.valid == 0)) {
            return Err("Liste Xtream incomplète".into());
        }
        serde_json::to_string(&batch).map_err(|_| "Catalogue invalide".into())
    }
}
impl XtreamList {
    fn convert(&self, s: &Value) -> Option<Value> {
        let live = self.kind == "live";
        let series = self.kind == "series";
        let id = string(&s[if series { "series_id" } else { "stream_id" }]);
        if id.is_empty() {
            return None;
        }
        let name = string(&s["name"]);
        let cid = string(&s["category_id"]);
        let (prefix, cp) = if live {
            ("l", "lc")
        } else if series {
            ("s", "sc")
        } else {
            ("m", "vc")
        };
        let cat = self.cats.get(&cid);
        let raw_cat = cat.map_or("", |c| &c.raw);
        let mut r = json!({"id":format!("{}:{prefix}:{id}",self.source),"sourceId":self.source,"profileId":self.profile,"extId":id,"rawName":name,"categoryId":format!("{}:{cp}:{cid}",self.source)});
        let universe = cat
            .filter(|c| c.universe != "other")
            .map(|c| c.universe.clone())
            .unwrap_or_else(|| {
                if live {
                    text::universe(&name)
                } else if series {
                    "series".into()
                } else {
                    "cinema".into()
                }
            });
        r["universe"] = universe.into();
        if live {
            if !matches!(
                s["stream_type"].as_str(),
                None | Some("" | "live" | "created_live")
            ) {
                return None;
            }
            let clean = text::clean_name(&name);
            let epg = string(&s["epg_channel_id"]).to_lowercase();
            let country = language::channel_country(&name, raw_cat, &epg, "");
            let archived = number(&s["tv_archive"]) == Some(1.);
            r["quality"] = text::quality(&name).into();
            r["catchupMode"] = if archived { "xc".into() } else { Value::Null };
            r["catchupDays"] = json!(if archived {
                nonzero(&s["tv_archive_duration"]).unwrap_or(1.)
            } else {
                0.
            });
            r["num"] = number(&s["num"]).unwrap_or((self.valid + 1) as f64).into();
            r["groupKey"] = format!("ch:{}", text::norm(&clean).replace(' ', "")).into();
            r["langs"] = json!(language::channel_languages(
                &name,
                raw_cat,
                &epg,
                "",
                country.as_deref().unwrap_or("")
            ));
            r["name"] = clean.into();
            if !epg.is_empty() {
                r["epgId"] = epg.into()
            }
            if let Some(c) = country {
                r["country"] = c.into()
            }
            copy_text(s, &mut r, "stream_icon", "logo");
        } else {
            let (title, y) = text::title_year(&name);
            let year = if series {
                y.or_else(|| {
                    s["releaseDate"]
                        .as_str()
                        .or(s["release_date"].as_str())?
                        .get(..4)?
                        .parse()
                        .ok()
                })
            } else {
                number(&s["year"])
                    .map(|v| v as u16)
                    .filter(|n| *n != 0)
                    .or(y)
            };
            let tmdb = nonzero(&s["tmdb"])
                .or_else(|| nonzero(&s["tmdb_id"]))
                .map(|v| v as u64);
            let gp = if series { "sr" } else { "mv" };
            let key = if let Some(id) = tmdb {
                format!("{gp}:t{id}")
            } else {
                let t = text::norm(&title).replace(' ', "");
                if series {
                    format!("{gp}:{t}")
                } else {
                    format!(
                        "{gp}:{t}:{}",
                        year.map(|y| y.to_string()).unwrap_or_default()
                    )
                }
            };
            let langs = language::detect(&[&name, raw_cat]);
            r["title"] = title.into();
            r["langs"] = json!(langs.audio);
            r["subs"] = json!(langs.subs);
            r["groupKey"] = key.into();
            r["enrichedAt"] = 0.into();
            r["addedAt"] =
                (number(&s[if series { "last_modified" } else { "added" }]).unwrap_or(0.) * 1000.)
                    .into();
            if let Some(y) = year {
                r["year"] = y.into()
            }
            if let Some(t) = tmdb {
                r["tmdbId"] = t.into()
            }
            let rating = nonzero(&s["rating"]).or_else(|| {
                if series {
                    None
                } else {
                    nonzero(&s["rating_5based"]).map(|v| 2. * v)
                }
            });
            if let Some(v) = rating {
                r["rating"] = v.into()
            }
            copy_text(
                s,
                &mut r,
                if series { "cover" } else { "stream_icon" },
                "poster",
            );
            if series {
                copy_text(s, &mut r, "plot", "plot");
                if let Some(b) = s["backdrop_path"]
                    .as_array()
                    .and_then(|a| a.first())
                    .or_else(|| s["backdrop_path"].as_object()?.values().next())
                {
                    r["backdrop"] = b.clone()
                }
                for (src, dst, sep, max) in [
                    ("genre", "genres", &[',', '/'][..], usize::MAX),
                    ("cast", "cast", &[','][..], 10),
                ] {
                    if let Some(v) = s[src].as_str().filter(|s| !s.is_empty()) {
                        r[dst] = json!(
                            v.split(sep)
                                .map(str::trim)
                                .filter(|s| !s.is_empty())
                                .take(max)
                                .collect::<Vec<_>>()
                        )
                    }
                }
            } else {
                r["ext"] = s["container_extension"]
                    .as_str()
                    .filter(|v| !v.is_empty())
                    .unwrap_or("mp4")
                    .into()
            }
        }
        Some(r)
    }
}
fn fingerprint(bytes: &[u8], seed: u64) -> u64 {
    bytes.iter().fold(seed, |hash, &byte| {
        (hash ^ u64::from(byte)).wrapping_mul(0x100000001b3)
    })
}
fn copy_text(from: &Value, to: &mut Value, src: &str, dst: &str) {
    if let Some(s) = from[src].as_str().filter(|s| !s.is_empty()) {
        to[dst] = s.into()
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn accepts_fragmented_object_maps_and_rejects_truncation() {
        let mut p = XtreamList::new("vod", "s", "p", "[]").unwrap();
        let input =
            br#"{"a":{"stream_id":1,"name":"M, [I] \"x\" (2000)"},"b":{"stream_id":2,"name":"B"}}"#;
        for b in input {
            p.feed(&[*b], false).unwrap();
        }
        assert!(p.feed(&[], true).is_ok());
        assert_eq!(p.valid, 2);
        let mut p = XtreamList::new("live", "s", "p", "[]").unwrap();
        assert!(p.feed(br#"[{"stream_id":1}"#, true).is_err());
    }
}

/// Queries are encoded as HTML form values, including literal '+' characters in credentials.
#[wasm_bindgen]
pub fn xtream_endpoint(
    server: &str,
    user: &str,
    password: &str,
    xml: bool,
    action: &str,
    params: Vec<String>,
) -> String {
    fn form(value: &str) -> String {
        use std::fmt::Write;
        let mut out = String::new();
        for b in value.bytes() {
            if b == b' ' {
                out.push('+')
            } else if b.is_ascii_alphanumeric() || b"*-._".contains(&b) {
                out.push(b as char)
            } else {
                write!(out, "%{b:02X}").unwrap()
            }
        }
        out
    }
    let file = if xml { "xmltv" } else { "player_api" };
    let mut url = format!(
        "{}/{file}.php?username={}&password={}",
        crate::playback::normalize_server(server),
        form(user),
        form(password)
    );
    for pair in params.as_chunks::<2>().0 {
        url.push_str(&format!("&{}={}", form(&pair[0]), form(&pair[1])));
    }
    if !action.is_empty() {
        url.push_str("&action=");
        url.push_str(&form(action));
    }
    url
}
#[wasm_bindgen]
pub fn xtream_account(raw: &str) -> Result<String, String> {
    let r: Value = serde_json::from_str(raw).map_err(|_| "Compte Xtream invalide")?;
    let ui = &r["user_info"];
    let mut result = json!({"auth":ui["auth"]==1 || ui["auth"]=="1","status":ui["status"],"expiresAt":number(&ui["exp_date"]).map(|n|n*1000.),"maxConn":number(&ui["max_connections"]),"activeCons":number(&ui["active_cons"]),"formats":ui["allowed_output_formats"].as_array(),"timezone":r["server_info"]["timezone"]});
    result.as_object_mut().unwrap().retain(|_, v| !v.is_null());
    Ok(result.to_string())
}

#[wasm_bindgen]
pub fn xtream_episodes(
    raw: &str,
    source: &str,
    series: &str,
    title: &str,
) -> Result<String, String> {
    let mut data: Value = serde_json::from_str(raw).map_err(|_| "Série Xtream invalide")?;
    let by_season = data["episodes"].take();
    let mut seasons: Vec<(String, Value)> = match by_season {
        Value::Object(map) => map.into_iter().collect(),
        Value::Array(items) => items
            .into_iter()
            .enumerate()
            .map(|(i, v)| (i.to_string(), v))
            .collect(),
        _ => return Err("Liste des épisodes absente".into()),
    };
    seasons.sort_by_key(|(season, _)| season.parse::<u32>().unwrap_or(u32::MAX));
    let prefix = regex::Regex::new(&format!(r"(?i)^{}\s*[-–:]?\s*", regex::escape(title)))
        .map_err(|_| "Titre de série invalide")?;
    let mut episodes = Vec::new();
    for (season, list) in seasons {
        let rows: Vec<Value> = match list {
            Value::Array(a) => a,
            Value::Object(m) => m.into_iter().map(|(_, v)| v).collect(),
            _ => continue,
        };
        for row in rows {
            let id = string(&row["id"]);
            if id.is_empty() {
                continue;
            }
            let label = crate::text::clean_name(&string(&row["title"]));
            let label = prefix.replace(&label, "");
            let n = number(&row["episode_num"]).unwrap_or((episodes.len() + 1) as f64);
            let mut ep = json!({"id":format!("{source}:e:{id}"),"seriesId":series,"sourceId":source,"extId":id,
                "season":number(&row["season"]).or_else(||season.parse::<f64>().ok().filter(|v|*v!=0.)).unwrap_or(1.),"episode":n,
                "title":if label.is_empty(){format!("Épisode {n}")}else{label.into_owned()},
                "plot":row["info"]["plot"],"still":row["info"]["movie_image"],"durationSec":number(&row["info"]["duration_secs"]),
                "ext":row["container_extension"].as_str().filter(|e|!e.is_empty()).unwrap_or("mp4")});
            ep.as_object_mut()
                .unwrap()
                .retain(|_, v| !v.is_null() && v.as_str() != Some(""));
            episodes.push(ep);
        }
    }
    serde_json::to_string(&episodes).map_err(|_| "Épisodes invalides".into())
}
