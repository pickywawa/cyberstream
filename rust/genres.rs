use regex::{RegexSet, RegexSetBuilder};
use std::sync::LazyLock;
use wasm_bindgen::prelude::*;
static GENRES: LazyLock<RegexSet> = LazyLock::new(|| {
    RegexSetBuilder::new([
        r"\b(action|actie|azione|acci[oó]n|aksiyon|akcja|actionfilm)",
        r"(com[eé]d|komedi|comedy|commedia|humou?r|komödie)",
        r"(drame|drama|dramma|dramat)",
        r"(thriller|crime|polic|polar|krimi|crimin|myst[eè]re|mystery|suspense)",
        r"(horr|griezel|terror|[eé]pouvante|grusel)",
        r"(science.?fiction|sci.?fi|\bsf\b|ciencia ficci)",
        r"(fantas)",
        r"(aventur|adventure|abenteuer|avventura)",
        r"(anim|cartoon|dessin|manga|crtani|bajki)",
        r"(famil|kids|enfant|jeunesse|kinder|ni[ñn]os|barn|b[øo]rn|lasten|krakka)",
        r"(romanc|romanti|liebe|amour)",
        r"(docu|dokument|dokus|dokumental)",
        r"(guerre|\bwar\b|histo|krieg|guerra)",
        r"western",
        r"(musi|concert)",
        r"(christmas|no[eë]l|weihnacht|navidad|natale|świąt)",
        // shows on stage (no TMDB genre: the providers' categories, e.g. "VOD | Spectacles")
        r"(spectacle|stand.?up|one.?(wo)?man.?show|th[eé][aâ]tre|theat(er|re)|sketch|humoriste|cabaret|comedy special)",
    ])
    .case_insensitive(true)
    .build()
    .expect("genre patterns")
});
#[wasm_bindgen]
pub fn genre_mask(labels: &str) -> u32 {
    GENRES
        .matches(labels)
        .iter()
        .fold(0, |bits, i| bits | (1 << i))
}
