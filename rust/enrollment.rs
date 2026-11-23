use crate::replay::{arr, compact};
use serde_json::{Value, json};
use wasm_bindgen::prelude::*;
use web_sys::Url;

fn text(value: &Value, max: usize) -> Option<&str> {
    value
        .as_str()
        .filter(|s| s.encode_utf16().count() <= max)
        .map(str::trim)
        .filter(|s| !s.is_empty())
}
fn endpoint(value: &Value, xtream: bool) -> Option<String> {
    let input = text(value, 2048)?;
    let raw =
        if xtream && !input.contains("://") && re!(r"(?i)^[a-z0-9.-]+(:\d+)?(/|$)").is_match(input)
        {
            format!("http://{input}")
        } else {
            input.to_owned()
        };
    if raw.chars().any(char::is_whitespace) || !re!(r"(?i)^https?://").is_match(&raw) {
        return None;
    }
    let parsed = Url::new(&raw).ok()?;
    (!parsed.hostname().is_empty()).then_some(raw)
}
fn source(row: &Value) -> Option<Value> {
    let kind = row["type"].as_str()?;
    if !matches!(kind, "xtream" | "m3u") {
        return None;
    }
    let xtream = kind == "xtream";
    let url = endpoint(&row["url"], xtream)?;
    let username = text(&row["username"], 256);
    let pass = row["password"].as_str().filter(|s| !s.is_empty());
    if xtream && (username.is_none() || pass.is_none()) {
        return None;
    }
    let mut s = json!({"type":kind,"label":text(&row["label"],80).unwrap_or(""),"url":url,
        "backups":arr(&row["backups"]).iter().filter_map(|b|endpoint(b,xtream)).take(10).collect::<Vec<_>>(),
        "epgUrls":arr(&row["epgUrls"]).iter().filter_map(|u|endpoint(u,false)).take(5).collect::<Vec<_>>()});
    if xtream {
        s["username"] = json!(username);
        s["password"] = json!(pass.unwrap().chars().take(256).collect::<String>());
    }
    Some(s)
}
fn langs(v: &Value) -> Option<Vec<&str>> {
    Some(
        v.as_array()?
            .iter()
            .filter_map(Value::as_str)
            .filter(|s| s.len() == 2 && s.bytes().all(|b| b.is_ascii_lowercase()))
            .take(2)
            .collect(),
    )
}
#[wasm_bindgen]
pub fn enrollment_payload(raw: &str) -> Option<String> {
    let j: Value = serde_json::from_str(raw).ok()?;
    if j["v"] != 1 {
        return None;
    }
    let sources: Vec<_> = j["sources"]
        .as_array()?
        .iter()
        .take(10)
        .filter_map(source)
        .collect();
    if sources.is_empty() {
        return None;
    }
    let p = &j["prefs"];
    let prefs=(!p.is_null()).then(||compact(json!({"lang":p["lang"].as_str().filter(|s|matches!(*s,"en"|"fr")),"country":p["country"].as_str().filter(|s|s.len()==2 && s.bytes().all(|b|b.is_ascii_uppercase())),"audioLangs":langs(&p["audioLangs"]),"subLangs":langs(&p["subLangs"]),"subMode":p["subMode"].as_str().filter(|s|matches!(*s,"off"|"auto"|"always")),"subsOnline":p["subsOnline"].as_bool()})));
    let pr = &j["profile"];
    let profile=text(&pr["name"],24).map(|name|json!({"name":name,"emoji":text(&pr["emoji"],8).unwrap_or("🍿"),
       "color":pr["color"].as_str().filter(|s|re!(r"(?i)^#[0-9a-f]{6}$").is_match(s)).unwrap_or("#e50914")}));
    Some(compact(json!({"v":1,"profile":profile,"from":if j["from"]=="app"{"app"}else{"form"},"sources":sources,"tmdb":text(&j["tmdb"],512),"prefs":prefs})).to_string())
}
#[wasm_bindgen]
pub fn enrollment_target(link: &str) -> Option<String> {
    let outer = Url::new(link).ok()?;
    if outer.protocol() != "cyberiptv:" || outer.hostname() != "enroll" {
        return None;
    }
    let dest = Url::new(&outer.search_params().get("target")?).ok()?;
    let host = dest.hostname();
    let local = host == "localhost"
        || host
            .parse::<std::net::Ipv4Addr>()
            .is_ok_and(|a| a.is_private() || a.is_loopback());
    if !local
        || dest.protocol() != "http:"
        || !re!(r"^/(e|enroll)/[a-f0-9]{36}$").is_match(&dest.pathname())
    {
        return None;
    }
    Some(format!("{}{}", dest.origin(), dest.pathname()))
}
