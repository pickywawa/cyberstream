use crate::text::norm;
use serde::{Deserialize, Serialize};
use std::collections::{BinaryHeap, HashSet};
use wasm_bindgen::prelude::*;

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct Document {
    kind: String,
    id: String,
    group_key: String,
    title: String,
    extra: Option<String>,
}
#[derive(Deserialize, Serialize)]
struct Entry {
    doc: Document,
    normalized: String,
    title_len: usize,
}

#[wasm_bindgen]
#[derive(Default)]
pub struct CatalogSearch {
    docs: Vec<Entry>,
    seen: HashSet<(String, String)>,
}

#[wasm_bindgen]
impl CatalogSearch {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self::default()
    }
    pub fn append(&mut self, json: &str) -> Result<(), String> {
        let batch: Vec<Document> =
            serde_json::from_str(json).map_err(|_| "Invalid search document")?;
        for doc in batch {
            if !self.seen.insert((doc.kind.clone(), doc.group_key.clone())) {
                continue;
            }
            let mut normalized = format!(" {}", norm(&doc.title));
            let title_len = normalized.len();
            normalized.push(' ');
            if let Some(extra) = &doc.extra {
                normalized.push_str(&norm(extra));
                normalized.push(' ')
            }
            self.docs.push(Entry {
                doc,
                normalized,
                title_len,
            });
        }
        Ok(())
    }
    pub fn finish(&mut self) {
        self.seen = HashSet::new();
    }
    pub fn size(&self) -> usize {
        self.docs.len()
    }
    /// Each snapshot page is decoded independently to bound temporary memory on a TV.
    pub fn snapshot(&self, start: usize, size: usize) -> Result<Vec<u8>, String> {
        let end = start.saturating_add(size).min(self.docs.len());
        let rows = self.docs.get(start..end).ok_or("Invalid page")?;
        let bytes = postcard::to_allocvec(rows).map_err(|_| "Invalid index")?;
        Ok(lz4_flex::compress_prepend_size(&bytes))
    }
    pub fn restore_page(&mut self, page: &[u8]) -> Result<(), String> {
        let len = page
            .get(..4)
            .and_then(|p| p.try_into().ok())
            .map(u32::from_le_bytes)
            .ok_or("Invalid index")?;
        if len > 16 * 1024 * 1024 {
            return Err("Oversized index page".into());
        }
        let bytes = lz4_flex::decompress_size_prepended(page).map_err(|_| "Invalid cache")?;
        let rows: Vec<Entry> = postcard::from_bytes(&bytes).map_err(|_| "Invalid index")?;
        if rows
            .iter()
            .any(|r| !r.normalized.is_char_boundary(r.title_len))
        {
            return Err("Invalid title boundary".into());
        }
        self.docs.extend(rows);
        Ok(())
    }
    pub fn query(&self, raw: &str, limit: usize) -> String {
        let q = norm(raw);
        if q.is_empty() || limit == 0 {
            return "[]".into();
        }
        let phrase = format!(" {q}");
        let terms: Vec<_> = q.split_whitespace().map(|t| (format!(" {t}"), t)).collect();
        // Worst retained match at the root. Later rows lose ties as in the catalogue.
        let mut top = BinaryHeap::new();
        'docs: for (i, row) in self.docs.iter().enumerate() {
            let mut score = 0i64;
            for (word, t) in &terms {
                score += match row.normalized.find(word) {
                    Some(0) => 600,
                    Some(_) => 200,
                    None if t.len() >= 3 && row.normalized.contains(t) => 60,
                    _ => continue 'docs,
                }
            }
            let title = &row.normalized[..row.title_len];
            score += if title == phrase {
                2000
            } else if title.starts_with(&phrase) {
                1000
            } else {
                0
            };
            score -= row.title_len as i64;
            let candidate = (-score, i);
            if top.len() < limit {
                top.push(candidate)
            } else if top.peek().is_some_and(|w| candidate < *w) {
                *top.peek_mut().unwrap() = candidate;
            }
        }
        let hits: Vec<_> = top
            .into_sorted_vec()
            .into_iter()
            .map(|(neg, i)| {
                let mut value = serde_json::to_value(&self.docs[i].doc).expect("document");
                value["score"] = serde_json::json!(-neg as f64 / 20.0);
                value
            })
            .collect();
        serde_json::to_string(&hits).expect("hits")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn ranked_prefix_and_middle_matches() {
        let mut index = CatalogSearch::new();
        index.append(r#"[{"id":"1","kind":"live","groupKey":"a","title":"Café"},{"id":"2","kind":"live","groupKey":"a","title":"Other"},{"id":"3","kind":"movie","groupKey":"b","title":"Le café"}]"#).unwrap();
        assert_eq!(index.size(), 2);
        let hits: serde_json::Value = serde_json::from_str(&index.query("CAFE", 1)).unwrap();
        assert_eq!(hits[0]["id"], "1");
    }
}

#[cfg(test)]
mod cache_tests {
    use super::*;
    #[test]
    fn partial_pages_roundtrip_and_reject_corrupt_data() {
        let mut idx = CatalogSearch::new();
        idx.append(r#"[{"kind":"movie","id":"1","groupKey":"film","title":"L’été"},{"kind":"live","id":"2","groupKey":"tv","title":"Les étoiles","extra":"chaîne"}]"#).unwrap();
        let mut restored = CatalogSearch::new();
        restored.restore_page(&idx.snapshot(0, 1).unwrap()).unwrap();
        restored.restore_page(&idx.snapshot(1, 1).unwrap()).unwrap();
        assert_eq!(restored.query("éto", 5), idx.query("éto", 5));
        assert!(restored.restore_page(&[0xff; 8]).is_err());
    }
}
