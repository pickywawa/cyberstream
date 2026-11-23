use crate::replay::{arr, first, strv};
use serde::Deserialize;
use serde_json::{Value, json};
use std::cmp::Reverse;
use std::collections::BTreeMap;
use wasm_bindgen::prelude::*;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Query {
    kind: String,
    langs: Vec<String>,
    moviehash: Option<String>,
    tmdb_id: Option<u64>,
    parent_tmdb_id: Option<u64>,
    query: Option<String>,
    year: Option<u32>,
    season: Option<u32>,
    episode: Option<u32>,
}
fn encode(s: &str) -> String {
    use std::fmt::Write;
    let mut out = String::new();
    for b in s.to_lowercase().bytes() {
        if b.is_ascii_alphanumeric() || b"-_.!~*'(),".contains(&b) {
            out.push(b as char)
        } else {
            write!(out, "%{b:02X}").unwrap()
        }
    }
    out
}
#[wasm_bindgen]
pub fn subtitle_query(raw: &str) -> Result<String, String> {
    let q: Query = serde_json::from_str(raw).map_err(|_| "Recherche de sous-titres invalide")?;
    let mut params = BTreeMap::from([("languages", q.langs.join(",")), ("type", q.kind.clone())]);
    if let Some(hash) = q.moviehash.filter(|s| !s.is_empty()) {
        params.insert("moviehash", hash);
    }
    let movie = q.kind == "movie";
    if let Some(id) = if movie { q.tmdb_id } else { q.parent_tmdb_id }.filter(|&id| id != 0) {
        params.insert(
            if movie { "tmdb_id" } else { "parent_tmdb_id" },
            id.to_string(),
        );
    } else {
        if let Some(title) = q.query.filter(|s| !s.is_empty()) {
            params.insert("query", title);
        }
        if let Some(year) = q.year.filter(|&year| movie && year > 0) {
            params.insert("year", year.to_string());
        }
    }
    if !movie {
        if let Some(s) = q.season {
            params.insert("season_number", s.to_string());
        }
        if let Some(e) = q.episode {
            params.insert("episode_number", e.to_string());
        }
    }
    Ok(params
        .iter()
        .map(|(k, v)| format!("{k}={}", encode(v)))
        .collect::<Vec<_>>()
        .join("&"))
}
#[wasm_bindgen]
pub fn subtitle_results(raw: &str) -> Result<String, String> {
    let doc: Value = serde_json::from_str(raw).map_err(|_| "Sous-titres invalides")?;
    let out:Vec<_>=arr(&doc["data"]).iter().filter_map(|item|{
        let a=&item["attributes"];let f=&a["files"][0];let id=f["file_id"].as_u64()?;
        let mut row=json!({"fileId":id,"lang":strv(&a["language"]).chars().take(2).collect::<String>().to_lowercase(),
            "release":strv(first(&a["release"],&f["file_name"])),"downloads":a["download_count"].as_u64().unwrap_or(0),"hashMatch":a["moviehash_match"]==true,"hearingImpaired":a["hearing_impaired"]==true,"machine":a["ai_translated"]==true||a["machine_translated"]==true});
        if let Some(fps)=a["fps"].as_f64().filter(|n|*n>0.){row["fps"]=fps.into();}
        Some(row)
    }).collect();
    Ok(json!(out).to_string())
}
#[wasm_bindgen]
pub fn subtitle_rank(raw: &str, langs: Vec<String>, hint: &str) -> Result<Vec<u32>, String> {
    let rows: Vec<Value> = serde_json::from_str(raw).map_err(|_| "Sous-titres invalides")?;
    let hint = hint.to_lowercase();
    let words: Vec<_> = hint
        .split(|c: char| !c.is_ascii_alphanumeric())
        .filter(|s| s.len() > 2)
        .collect();
    let mut order: Vec<_> = (0..rows.len()).collect();
    order.sort_by_cached_key(|&i| {
        let s = &rows[i];
        let release = strv(&s["release"]).to_lowercase();
        (
            langs
                .iter()
                .position(|l| l == strv(&s["lang"]))
                .unwrap_or(usize::MAX),
            s["hashMatch"] != true,
            s["machine"] == true,
            s["hearingImpaired"] == true,
            Reverse(words.iter().filter(|w| release.contains(**w)).count()),
            Reverse(s["downloads"].as_u64().unwrap_or(0)),
        )
    });
    Ok(order.into_iter().map(|i| i as u32).collect())
}
