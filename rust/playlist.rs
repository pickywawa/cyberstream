use serde::Serialize;
use std::collections::BTreeMap;
use wasm_bindgen::prelude::*;

type Attributes = BTreeMap<String, String>;
fn attrs(text: &str) -> Attributes {
    re!(r#"([\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s,]+))"#)
        .captures_iter(text)
        .map(|c| {
            let value = c.get(2).or(c.get(3)).or(c.get(4)).unwrap().as_str().trim();
            (c[1].to_ascii_lowercase(), value.to_owned())
        })
        .collect()
}
#[derive(Default, Serialize)]
struct Entry {
    name: String,
    attrs: Attributes,
    duration: f64,
    url: String,
}
#[derive(Default, Serialize)]
#[serde(rename_all = "camelCase")]
struct Header {
    epg_urls: Vec<String>,
    attrs: Attributes,
}

#[wasm_bindgen]
#[derive(Default)]
pub struct Playlist {
    pending: Option<Entry>,
    header: Header,
    group: Option<String>,
    partial: String,
}
#[wasm_bindgen]
impl Playlist {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self::default()
    }
    pub fn header(&self) -> String {
        serde_json::to_string(&self.header).unwrap()
    }
    pub fn feed(&mut self, chunk: &str, end: bool) -> String {
        serde_json::to_string(&self.entries(chunk, end)).unwrap()
    }
}
impl Playlist {
    fn entries(&mut self, chunk: &str, end: bool) -> Vec<Entry> {
        self.partial.push_str(chunk);
        let stop = if end {
            self.partial.len()
        } else {
            self.partial.rfind('\n').map_or(0, |i| i + 1)
        };
        let mut buf = std::mem::take(&mut self.partial);
        self.partial = buf.split_off(stop);
        buf.lines().filter_map(|line| self.line(line)).collect()
    }
}
impl Playlist {
    fn line(&mut self, raw: &str) -> Option<Entry> {
        let line = raw.trim().trim_start_matches('\u{feff}');
        if let Some(header) = line.strip_prefix("#EXTM3U") {
            self.header.attrs = attrs(header);
            if let Some(urls) = ["url-tvg", "x-tvg-url", "tvg-url"]
                .iter()
                .find_map(|key| self.header.attrs.get(*key))
            {
                self.header.epg_urls.extend(
                    urls.split(',')
                        .map(str::trim)
                        .filter(|s| !s.is_empty())
                        .map(str::to_owned),
                );
            }
        } else if let Some(meta) = line.strip_prefix("#EXTINF:") {
            let mut quote = None;
            let comma = meta.char_indices().find(|&(_, c)| {
                if quote == Some(c) {
                    quote = None;
                    false
                } else if quote.is_none() && (c == '"' || c == '\'') {
                    quote = Some(c);
                    false
                } else {
                    quote.is_none() && c == ','
                }
            });
            let (head, title) =
                comma.map_or((meta, ""), |(i, _)| (&meta[..i], meta[i + 1..].trim()));
            let attrs = attrs(head);
            let name = if title.is_empty() {
                attrs.get("tvg-name").cloned().unwrap_or_default()
            } else {
                title.into()
            };
            let duration = head
                .split_whitespace()
                .next()
                .and_then(|s| s.parse::<f64>().ok())
                .filter(|n| n.is_finite())
                .unwrap_or(-1.);
            self.pending = Some(Entry {
                name,
                attrs,
                duration,
                ..Entry::default()
            });
            self.group = None;
        } else if let Some(group) = line.strip_prefix("#EXTGRP:") {
            self.group = Some(group.trim().into())
        } else if !line.is_empty() && !line.starts_with('#') {
            let mut entry = self.pending.take()?;
            entry.url = line.into();
            if let Some(group) = self.group.take() {
                entry.attrs.entry("group-title".into()).or_insert(group);
            }
            return Some(entry);
        }
        None
    }
}
#[wasm_bindgen]
pub fn media_kind(url: &str, name: &str) -> String {
    let u = url.to_ascii_lowercase();
    let path = u.split('?').next().unwrap_or(&u);
    if path.contains("/series/") {
        return "episode".into();
    }
    if path.contains("/movie/") || path.contains("/movies/") {
        return "movie".into();
    }
    match path.rsplit('.').next() {
        Some("mp4" | "mkv" | "avi" | "mov" | "m4v" | "wmv" | "webm")
            if re!(r"(?i)S\d{1,2}\s*E\d{1,3}").is_match(name) =>
        {
            "episode"
        }
        Some("mp4" | "mkv" | "avi" | "mov" | "m4v" | "wmv" | "webm") => "movie",
        _ => "live",
    }
    .into()
}

use crate::{language, text};
use serde_json::{Value, json};
use std::collections::{HashMap, HashSet};

/// Keep primary keys identical to the original JavaScript FNV-1a over UTF-16 code units.
fn stable_key(input: &str) -> String {
    let mut hash = input.encode_utf16().fold(0x811c9dc5u32, |hash, unit| {
        (hash ^ u32::from(unit)).wrapping_mul(16777619)
    });
    let mut digits = Vec::new();
    loop {
        digits.push(char::from_digit(hash % 36, 36).unwrap());
        hash /= 36;
        if hash == 0 {
            break;
        }
    }
    digits.into_iter().rev().collect()
}

#[derive(Default, Serialize)]
struct Rows {
    categories: Vec<Value>,
    channels: Vec<Value>,
    movies: Vec<Value>,
    series: Vec<Value>,
    episodes: Vec<Value>,
}

#[wasm_bindgen]
pub struct PlaylistCatalog {
    prefs: Vec<String>,
    permitted: HashMap<String, bool>,
    excluded: HashSet<String>,
    parser: Playlist,
    source: String,
    profile: String,
    categories: HashMap<String, String>,
    shows: HashSet<String>,
    live: usize,
    episodes: usize,
    at: f64,
}
#[wasm_bindgen]
impl PlaylistCatalog {
    #[wasm_bindgen(constructor)]
    pub fn new(source: &str, profile: &str, at: f64) -> Self {
        Self {
            parser: Playlist::new(),
            prefs: vec![],
            permitted: HashMap::new(),
            excluded: HashSet::new(),
            source: source.into(),
            profile: profile.into(),
            categories: HashMap::new(),
            shows: HashSet::new(),
            live: 0,
            episodes: 0,
            at,
        }
    }
    pub fn languages(&mut self, langs: Vec<String>) {
        self.prefs = langs;
    }
    pub fn rejected_categories(&self) -> Vec<String> {
        self.excluded.iter().cloned().collect()
    }
    pub fn header(&self) -> String {
        self.parser.header()
    }
    pub fn feed(&mut self, chunk: &str, end: bool) -> Result<String, String> {
        let mut rows = Rows::default();
        let entries = self.parser.entries(chunk, end);
        if self.parser.partial.len() > 8 * 1024 * 1024 {
            return Err("Ligne M3U trop longue".into());
        }
        for entry in entries {
            self.push(entry, &mut rows);
        }
        serde_json::to_string(&rows).map_err(|_| "Playlist non sérialisable".into())
    }
}
impl PlaylistCatalog {
    fn push(&mut self, e: Entry, rows: &mut Rows) {
        let attr = |k: &str| e.attrs.get(k).map_or("", String::as_str);
        let group = attr("group-title");
        let logo = e.attrs.get("tvg-logo").filter(|s| !s.is_empty());
        let kind = media_kind(&e.url, &e.name);
        let cat_kind = match kind.as_str() {
            "episode" => "series",
            "movie" => "vod",
            _ => "live",
        };
        let source = &self.source;
        let profile = &self.profile;
        let cat = format!("{source}:{}c:{}", &cat_kind[..1], stable_key(group));
        if !self.prefs.is_empty()
            && !*self
                .permitted
                .entry(group.to_owned())
                .or_insert_with(|| crate::language::keep_category(group, &self.prefs))
        {
            self.excluded.insert(cat);
            return;
        }
        let order = self.categories.len();
        let universe = self.categories.entry(cat.clone()).or_insert_with(||{
            let universe = text::universe(group);
            rows.categories.push(json!({"id":cat,"sourceId":source,"profileId":profile,"kind":cat_kind,"name":text::clean_name(if group.is_empty(){"Autres"}else{group}),"universe":universe,"order":order}));
            universe
        }).as_str();
        let hash = stable_key(&e.url);
        let ext = e
            .url
            .split('?')
            .next()
            .unwrap_or("")
            .rsplit('.')
            .next()
            .filter(|s| !s.is_empty())
            .unwrap_or("mp4");
        if kind == "live" {
            self.live += 1;
            let days = ["catchup-days", "timeshift", "tvg-rec"]
                .iter()
                .find_map(|k| {
                    attr(k)
                        .parse::<f64>()
                        .ok()
                        .filter(|n| n.is_finite() && *n != 0.)
                })
                .unwrap_or(0.);
            let mode = match [attr("catchup"), attr("catchup-type")]
                .into_iter()
                .find(|s| !s.is_empty())
                .unwrap_or("")
                .to_ascii_lowercase()
                .as_str()
            {
                "xc" => Some("xc"),
                "default" => Some("default"),
                "append" => Some("append"),
                "shift" => Some("shift"),
                "fs" | "flussonic-hls" | "flussonic-ts" | "flussonic" => Some("flussonic"),
                _ if days > 0. && re!(r"/\d+\.(ts|m3u8)$").is_match(&e.url) => Some("xc"),
                _ => None,
            };
            let epg = attr("tvg-id").to_lowercase();
            let country = language::channel_country(&e.name, group, &epg, attr("tvg-country"));
            let langs = language::channel_languages(
                &e.name,
                group,
                &epg,
                attr("tvg-language"),
                country.as_deref().unwrap_or(""),
            );
            let name = text::clean_name(&e.name);
            let ext_id = re!(r"/(\d+)(?:\.\w+)?$")
                .captures(&e.url)
                .map(|m| m[1].to_owned())
                .unwrap_or_else(|| hash.clone());
            let mut row = json!({"id":format!("{source}:l:{hash}"),"sourceId":source,"profileId":profile,"extId":ext_id,"rawName":e.name,"name":name,"logo":logo,"categoryId":cat,"universe":if universe=="other"{text::universe(&e.name)}else{universe.into()},"epgId":(!epg.is_empty()).then_some(&epg),"country":country,"langs":langs,"catchupDays":if mode.is_some(){if days==0.{7.}else{days}}else{0.},"catchupMode":mode,"catchupSource":e.attrs.get("catchup-source"),"quality":text::quality(&e.name),"groupKey":format!("ch:{}",text::norm(&name).replace(' ',"")),"num":attr("tvg-chno").parse::<f64>().ok().filter(|n|n.is_finite()).unwrap_or(self.live as f64),"url":e.url});
            remove_nulls(&mut row);
            row["catchupMode"] = json!(mode);
            row["quality"] = json!(text::quality(&e.name));
            rows.channels.push(row);
            return;
        }
        let lang = language::detect(&[&e.name, group, attr("tvg-language")]);
        if kind == "movie" {
            let (title, year) = text::title_year(&e.name);
            let key = format!(
                "mv:{}:{}",
                text::norm(&title).replace(' ', ""),
                year.map(|y| y.to_string()).unwrap_or_default()
            );
            let mut row = json!({"id":format!("{source}:m:{hash}"),"sourceId":source,"profileId":profile,"extId":hash,"rawName":e.name,"title":title,"year":year,"poster":logo,"addedAt":0,"ext":ext,"categoryId":cat,"universe":if universe=="other"{"cinema"}else{universe},"groupKey":key,"enrichedAt":0,"url":e.url,"langs":lang.audio,"subs":lang.subs});
            remove_nulls(&mut row);
            rows.movies.push(row);
        } else {
            self.episodes += 1;
            let parsed = text::episode(&e.name)
                .and_then(|s| serde_json::from_str::<Value>(&s).ok())
                .unwrap_or_else(
                    || json!({"show":text::clean_name(&e.name),"season":1,"episode":self.episodes}),
                );
            let (title, year) = text::title_year(parsed["show"].as_str().unwrap_or(""));
            let normal = text::norm(&title);
            let id = stable_key(&normal);
            let sid = format!("{source}:s:{id}");
            if self.shows.insert(sid.clone()) {
                let mut row = json!({"id":sid,"sourceId":source,"profileId":profile,"extId":id,"rawName":parsed["show"],"title":title,"year":year,"poster":logo,"addedAt":0,"categoryId":cat,"universe":if universe=="other"{"series"}else{universe},"groupKey":format!("sr:{}",normal.replace(' ',"")),"enrichedAt":0,"episodesLoadedAt":self.at,"langs":lang.audio,"subs":lang.subs});
                remove_nulls(&mut row);
                rows.series.push(row);
            }
            let mut row = json!({"id":format!("{source}:e:{hash}"),"seriesId":sid,"sourceId":source,"extId":hash,"season":parsed["season"],"episode":parsed["episode"],"title":format!("Épisode {}",parsed["episode"]),"still":logo,"ext":ext,"url":e.url});
            remove_nulls(&mut row);
            rows.episodes.push(row);
        }
    }
}
fn remove_nulls(row: &mut Value) {
    if let Some(obj) = row.as_object_mut() {
        obj.retain(|_, v| !v.is_null())
    }
}
