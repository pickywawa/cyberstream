use chrono::{DateTime, Utc};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn normalize_server(raw: &str) -> String {
    let s = raw.trim().trim_end_matches('/');
    let base = re!(r"(?i)/(player_api|get)\.php.*$").replace(s, "");
    if re!(r"(?i)^https?://").is_match(&base) {
        base.into_owned()
    } else {
        format!("http://{base}")
    }
}
// Encode exactly one URL path component; credentials can contain spaces, slashes or '#'.
fn segment(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    use std::fmt::Write;
    for b in s.bytes() {
        if b.is_ascii_alphanumeric() || b"-._~".contains(&b) {
            out.push(b as char)
        } else {
            write!(out, "%{b:02X}").unwrap()
        }
    }
    out
}
#[wasm_bindgen]
pub fn media_url(
    server: &str,
    kind: &str,
    user: &str,
    password: &str,
    id: &str,
    ext: &str,
) -> String {
    format!(
        "{}/{}/{}/{}/{}.{}",
        normalize_server(server),
        kind,
        segment(user),
        segment(password),
        segment(id),
        segment(ext)
    )
}
#[wasm_bindgen]
pub fn live_extension(formats: Option<String>, hls: bool) -> String {
    let (preferred, fallback) = if hls { ("m3u8", "ts") } else { ("ts", "m3u8") };
    if formats
        .as_ref()
        .is_none_or(|s| s.split(',').any(|f| f == preferred))
    {
        preferred
    } else {
        fallback
    }
    .into()
}
#[wasm_bindgen]
pub fn xtream_catchup(
    server: &str,
    user: &str,
    pass: &str,
    id: &str,
    stamp: &str,
    minutes: u32,
) -> String {
    format!(
        "{}/timeshift/{}/{}/{}/{}/{}.ts",
        normalize_server(server),
        segment(user),
        segment(pass),
        minutes.max(1),
        stamp,
        segment(id)
    )
}
#[wasm_bindgen]
pub fn playlist_catchup(
    mode: &str,
    url: &str,
    template: &str,
    start: f64,
    stop: f64,
    now: f64,
) -> Option<String> {
    let start = start.floor() as i64;
    let stop = stop.floor() as i64;
    let now = now.floor() as i64;
    let date = DateTime::<Utc>::from_timestamp(start, 0)?;
    let end = DateTime::<Utc>::from_timestamp(stop, 0)?;
    let duration = stop - start;
    let min = ((duration + 59) / 60).max(1);
    match mode {
        "xc" => {
            let m = re!(r"^(https?://[^/]+)/(?:live/)?([^/]+)/([^/]+)/(\d+)(?:\.\w+)?$")
                .captures(url)?;
            // The user/pass in a playlist URL are already encoded.
            Some(format!(
                "{}/timeshift/{}/{}/{}/{}/{}.ts",
                &m[1],
                &m[2],
                &m[3],
                min,
                date.format("%Y-%m-%d:%H-%M"),
                &m[4]
            ))
        }
        "shift" => Some(format!(
            "{url}{}utc={start}&lutc={now}",
            if url.contains('?') { "&" } else { "?" }
        )),
        "flussonic" => {
            let m = re!(r"^(.*)/(?:index|video|mono)[^/]*\.(m3u8|ts)(\?.*)?$").captures(url);
            Some(if let Some(m) = m {
                format!(
                    "{}/archive-{start}-{}.{}{}",
                    &m[1],
                    min * 60,
                    &m[2],
                    m.get(3).map_or("", |v| v.as_str())
                )
            } else {
                format!("{}/timeshift_abs-{start}.ts", url.trim_end_matches('/'))
            })
        }
        "default" | "append" if !template.is_empty() => {
            let mut s = template.to_owned();
            for (token, value) in [
                ("${start}", start.to_string()),
                ("${end}", stop.to_string()),
                ("${timestamp}", now.to_string()),
                ("{start}", start.to_string()),
                ("{utc}", start.to_string()),
                ("{timestamp}", start.to_string()),
                ("{end}", stop.to_string()),
                ("{utcend}", stop.to_string()),
                ("{lutc}", now.to_string()),
                ("{now}", now.to_string()),
                ("${duration}", duration.to_string()),
                ("{duration}", duration.to_string()),
                ("${offset}", (now - start).to_string()),
                ("{offset}", (now - start).to_string()),
                ("{utc:YmdHMS}", date.format("%Y%m%d%H%M%S").to_string()),
                ("{utcend:YmdHMS}", end.format("%Y%m%d%H%M%S").to_string()),
            ] {
                s = s.replace(token, &value)
            }
            for (token, fmt) in [
                ("{Y}", "%Y"),
                ("{m}", "%m"),
                ("{d}", "%d"),
                ("{H}", "%H"),
                ("{M}", "%M"),
                ("{S}", "%S"),
            ] {
                s = s.replace(token, &date.format(fmt).to_string())
            }
            Some(if mode == "append" {
                format!("{url}{s}")
            } else {
                s
            })
        }
        _ => None,
    }
}
#[wasm_bindgen]
pub fn finished(position: f64, duration: f64) -> bool {
    duration > 0. && duration - position <= (duration * 0.05).max(600f64.min(0.1 * duration))
}

/// Select resumable entries in last-watched order; finished episodes ask storage for their successor.
#[wasm_bindgen]
pub fn resume_plan(raw: &str, hidden: &str) -> Result<String, String> {
    use serde::Deserialize;
    use std::collections::{HashMap, HashSet};
    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Watch {
        key: String,
        kind: String,
        series_id: Option<String>,
        duration_sec: f64,
        position_sec: f64,
        updated_at: f64,
        completed: bool,
    }
    let rows: Vec<Watch> = serde_json::from_str(raw).map_err(|_| "Historique invalide")?;
    let hidden: HashMap<String, f64> =
        serde_json::from_str(hidden).map_err(|_| "Historique masqué invalide")?;
    let mut seen = HashSet::new();
    let mut out = vec![];
    for (i, w) in rows.iter().enumerate() {
        if w.kind == "live" {
            continue;
        }
        let series = w.series_id.as_deref().filter(|s| !s.is_empty());
        if hidden
            .get(series.unwrap_or(&w.key))
            .is_some_and(|v| *v != 0. && *v >= w.updated_at)
        {
            if let Some(id) = series {
                seen.insert(id);
            }
            continue;
        }
        let done = w.completed || finished(w.position_sec, w.duration_sec);
        match w.kind.as_str() {
            "movie" | "replay" if !done && w.position_sec >= 30. => out.push((i, false)),
            "episode"
                if series.is_some_and(|s| seen.insert(s)) && (done || w.position_sec >= 30.) =>
            {
                out.push((i, done))
            }
            _ => {}
        }
    }
    Ok(serde_json::to_string(&out).unwrap())
}
#[wasm_bindgen]
pub fn next_episode(raw: &str, current: &str) -> Result<Option<usize>, String> {
    let rows: Vec<(String, u32, u32)> =
        serde_json::from_str(raw).map_err(|_| "Épisodes invalides")?;
    let mut order: Vec<_> = (0..rows.len()).collect();
    order.sort_by_key(|i| (rows[*i].1, rows[*i].2));
    Ok(order
        .iter()
        .position(|i| rows[*i].0 == current)
        .and_then(|pos| order.get(pos + 1).copied()))
}
