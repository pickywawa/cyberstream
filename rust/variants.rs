use serde::Deserialize;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

#[derive(Deserialize)]
struct Row(String, Vec<String>, Vec<String>, String);

pub(crate) fn score(
    audio: &[String],
    subs: &[String],
    original: &str,
    preferred: &[String],
    subtitles: &[String],
) -> usize {
    for (i, lang) in preferred.iter().take(2).enumerate() {
        if audio.contains(lang) {
            return 2 * i;
        }
    }
    if subs.iter().any(|s| subtitles.contains(s)) {
        return 4;
    }
    if audio.is_empty() {
        if let Some(i) = preferred.iter().take(2).position(|s| s == original) {
            return 2 * i + 1;
        }
        return 6;
    }
    8
}
#[wasm_bindgen]
pub struct VariantGroups {
    audio: Vec<String>,
    subs: Vec<String>,
    seen: HashMap<String, usize>,
    groups: Vec<Group>,
    cursor: usize,
}
struct Group {
    representative: usize,
    score: usize,
    original: String,
    audio: Vec<String>,
    subs: Vec<String>,
}
fn merge(target: &mut Vec<String>, incoming: Vec<String>) {
    for value in incoming {
        if !target.contains(&value) {
            target.push(value)
        }
    }
}

#[wasm_bindgen]
impl VariantGroups {
    #[wasm_bindgen(constructor)]
    pub fn new(audio: Vec<String>, subs: Vec<String>) -> Self {
        Self {
            audio,
            subs,
            seen: HashMap::new(),
            groups: Vec::new(),
            cursor: 0,
        }
    }
    pub fn append(&mut self, raw: &str) -> Result<(), String> {
        let rows: Vec<Row> =
            serde_json::from_str(raw).map_err(|_| "Versions de catalogue invalides")?;
        for Row(key, audio, subs, original) in rows {
            let rank = score(&audio, &subs, &original, &self.audio, &self.subs);
            let next = self.groups.len();
            let index = *self.seen.entry(key).or_insert(next);
            if index == next {
                self.groups.push(Group {
                    representative: self.cursor,
                    score: rank,
                    original,
                    audio,
                    subs,
                });
            } else {
                let group = &mut self.groups[index];
                if rank < group.score {
                    group.score = rank;
                    group.representative = self.cursor;
                    group.original = original;
                }
                merge(&mut group.audio, audio);
                merge(&mut group.subs, subs);
            }
            self.cursor += 1;
        }
        Ok(())
    }
    pub fn finish(&mut self) {
        self.seen = HashMap::new();
        self.groups
            .sort_by_cached_key(|g| score(&g.audio, &g.subs, &g.original, &self.audio, &self.subs));
    }
    pub fn len(&self) -> usize {
        self.groups.len()
    }
    pub fn is_empty(&self) -> bool {
        self.groups.is_empty()
    }
    pub fn page(&self, start: usize, size: usize) -> String {
        let rows: Vec<_> = self
            .groups
            .iter()
            .skip(start)
            .take(size)
            .map(|g| (g.representative, &g.audio, &g.subs))
            .collect();
        serde_json::to_string(&rows).unwrap()
    }
}
