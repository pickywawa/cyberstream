//! A grid keeps one display representative per title. Full provider records remain in IndexedDB.
use crate::{genres::genre_mask, variants::score};
use serde::Deserialize;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
struct Filter {
    universe: String,
    genre: String,
    category_id: String,
    /** genre bits (see genres.rs, from TMDB's genres and the provider's category): with a universe,
     *  a title matching either one is kept */
    mask: u32,
}
#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
struct Row {
    id: String,
    title: String,
    group_key: String,
    category_id: Option<String>,
    universe: String,
    genres: Option<Vec<String>>,
    langs: Option<Vec<String>>,
    subs: Option<Vec<String>>,
    orig_lang: Option<String>,
    year: Option<u32>,
    added_at: f64,
    rating: Option<f64>,
    imdb_rating: Option<f64>,
}
struct Entry {
    id: String,
    title: String,
    mask: u32,
    year: u32,
    added: f64,
    rating: f64,
    rank: usize,
    language: usize,
    has_audio: bool,
    original: String,
    alphabet: usize,
}
#[wasm_bindgen]
pub struct GridCatalog {
    entries: Vec<Entry>,
    seen: HashMap<String, usize>,
    audio: Vec<String>,
    subs: Vec<String>,
    filter: Filter,
    hide_adult: bool,
    categories: HashMap<String, u32>,
    genre_cache: HashMap<String, u32>,
}
#[wasm_bindgen]
impl GridCatalog {
    #[wasm_bindgen(constructor)]
    pub fn new(
        raw: &str,
        hide_adult: bool,
        audio: Vec<String>,
        subs: Vec<String>,
        categories: &str,
    ) -> Result<GridCatalog, String> {
        let names: Vec<(String, String)> =
            serde_json::from_str(categories).map_err(|_| "Catégories invalides")?;
        Ok(Self {
            entries: vec![],
            seen: HashMap::new(),
            audio,
            subs,
            filter: serde_json::from_str(raw).map_err(|_| "Filtre invalide")?,
            hide_adult,
            categories: names
                .into_iter()
                .map(|(id, name)| (id, genre_mask(&name)))
                .collect(),
            genre_cache: HashMap::new(),
        })
    }
    pub fn append(&mut self, raw: &str) -> Result<(), String> {
        let rows: Vec<Row> = serde_json::from_str(raw).map_err(|_| "Grille invalide")?;
        for row in rows {
            let genres = row.genres.unwrap_or_default();
            let cat = row.category_id.as_deref().unwrap_or("");
            if (self.hide_adult && row.universe == "adult")
                || (!self.filter.category_id.is_empty() && self.filter.category_id != cat)
                || (!self.filter.genre.is_empty() && !genres.contains(&self.filter.genre))
            {
                continue;
            }
            let mask = genres
                .iter()
                .fold(*self.categories.get(cat).unwrap_or(&0), |mask, g| {
                    let bits = if let Some(v) = self.genre_cache.get(g) {
                        *v
                    } else {
                        if self.genre_cache.len() >= 1024 {
                            self.genre_cache.clear();
                        }
                        let v = genre_mask(g);
                        self.genre_cache.insert(g.clone(), v);
                        v
                    };
                    mask | bits
                });
            let by_universe = !self.filter.universe.is_empty()
                && (row.universe == self.filter.universe
                    || (self.filter.universe == "kids"
                        && genres
                            .iter()
                            .any(|g| re!(r"(?i)anim|famil|kids").is_match(g))));
            let by_mask = self.filter.mask != 0 && mask & self.filter.mask != 0;
            let wanted = match (self.filter.universe.is_empty(), self.filter.mask == 0) {
                (true, true) => true,
                (false, true) => by_universe,
                (true, false) => by_mask,
                (false, false) => by_universe || by_mask,
            };
            if !wanted {
                continue;
            }
            let audio = row.langs.unwrap_or_default();
            let original = row.orig_lang.unwrap_or_default();
            let subs = row.subs.unwrap_or_default();
            let rank = score(&audio, &subs, &original, &self.audio, &self.subs);
            // Explicit subtitle/audio matches can come from any member. Original language only
            // influences a group if every member has untagged audio, using its chosen representative.
            let explicit = if rank == 0 || rank == 2 || rank == 4 {
                rank
            } else {
                8
            };
            let new = Entry {
                id: row.id,
                title: row.title,
                mask,
                year: row.year.unwrap_or(0),
                added: row.added_at,
                // the IMDb rating shown on the cards, TMDB's when there is none
                rating: row.imdb_rating.filter(|r| *r > 0.).or(row.rating).unwrap_or(0.),
                rank,
                language: explicit,
                has_audio: !audio.is_empty(),
                original,
                alphabet: 0,
            };
            let next = self.entries.len();
            let idx = *self.seen.entry(row.group_key).or_insert(next);
            if idx == next {
                self.entries.push(new);
                continue;
            }
            let old = &mut self.entries[idx];
            let language = old.language.min(new.language);
            let has_audio = old.has_audio || new.has_audio;
            if new.rank < old.rank {
                *old = new;
            }
            old.language = language;
            old.has_audio = has_audio;
        }
        Ok(())
    }
    pub fn finish(&mut self) {
        self.seen = HashMap::new();
        self.genre_cache = HashMap::new();
        self.categories = HashMap::new();
        for e in &mut self.entries {
            if e.language == 8 && !e.has_audio {
                e.language = score(&[], &[], &e.original, &self.audio, &self.subs);
            }
            e.original.clear();
        }
    }
    pub fn titles(&self) -> Vec<String> {
        self.entries.iter().map(|e| e.title.clone()).collect()
    }
    pub fn alphabet(&mut self, indices: &[u32]) {
        for (rank, i) in indices.iter().enumerate() {
            if let Some(e) = self.entries.get_mut(*i as usize) {
                e.alphabet = rank
            }
        }
    }
    pub fn select(&self, sort: &str, sub: u32) -> String {
        let mut counts = [0u32; 17];
        let mut entries = Vec::new();
        for e in &self.entries {
            let mut bits = e.mask;
            while bits != 0 {
                counts[bits.trailing_zeros() as usize] += 1;
                bits &= bits - 1;
            }
            if sub == 0 || e.mask & sub != 0 {
                entries.push(e)
            }
        }
        // "added" (the default) lists the titles in the user's first language first; a sort the user
        // chose (rating, year, A → Z) is followed across all of their languages, only titles in
        // foreign languages alone (8, see variants::score) coming after
        let tier = |e: &Entry| if sort == "added" { e.language } else { (e.language >= 8) as usize };
        entries.sort_by(|a, b| {
            tier(a).cmp(&tier(b)).then_with(|| match sort {
                "title" => a.alphabet.cmp(&b.alphabet),
                "rating" => b.rating.total_cmp(&a.rating),
                "year" => b.year.cmp(&a.year),
                _ => b.added.total_cmp(&a.added),
            })
        });
        serde_json::to_string(&(
            entries.iter().map(|e| e.id.as_str()).collect::<Vec<_>>(),
            counts,
        ))
        .unwrap()
    }
}
