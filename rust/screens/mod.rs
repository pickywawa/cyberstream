use crate::{
    cards::Card,
    views::{icon, lookup},
};
use maud::{Markup, html};
use serde::Deserialize;
use wasm_bindgen::prelude::*;

mod channel;
mod detail;
mod grid;
mod home;
mod person;
mod player;
mod replay;
mod search;

fn rail(key: &str, title: &str, all: Option<(&str, &str)>, content: Markup) -> Markup {
    html! {section.rail data-rail=(key){
        div.rail-head{h2.section-title{(title)} @if let Some((cmd,label))=all {button data-f data-cmd=(cmd){(label)}}}
        div.rail-track data-row {(content)}
    }}
}
/** banner position; a tap on a dot shows that slide (not focusable: the remote uses ‹ ›) */
fn dots(index: usize, count: usize) -> Markup {
    html! {div.dots{@for i in 0..count{i.on[i==index] data-cmd=(format!("go:{i}")){}}}}
}
fn header(title: &str, lang: &str) -> Markup {
    html! {div.page-header style="display:flex;align-items:center;gap:12px;padding:calc(var(--nav-h) + 12px) var(--gutter) 8px"{
        button.icon-btn data-f data-cmd="back" aria-label=(lookup(lang,"common.back")){(icon("back",""))}
        h1.section-title style="flex:1"{(title)}
    }}
}
#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
struct Media {
    group_key: String,
    id: String,
    title: String,
    poster: Option<String>,
    backdrop: Option<String>,
    year: Option<i32>,
    genres: Option<Vec<String>>,
    imdb_rating: Option<f64>,
}
impl Media {
    fn card(&self, kind: &str) -> Card {
        Card {
            title: self.title.clone(),
            image: self.poster.clone(),
            imdb: self.imdb_rating,
            cmd: format!("{kind}:{}", self.id),
            ..Card::default()
        }
    }
    fn credited(&self, role: Option<&String>) -> Option<String> {
        let parts: Vec<_> = self
            .year
            .filter(|y| *y != 0)
            .map(|y| y.to_string())
            .into_iter()
            .chain(role.filter(|s| !s.is_empty()).cloned())
            .collect();
        (!parts.is_empty()).then(|| parts.join(" · "))
    }
}
#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
struct Watch {
    updated_at: f64,
    key: String,
    kind: String,
    title: String,
    subtitle: Option<String>,
    image: Option<String>,
    item_id: String,
    series_id: Option<String>,
    duration_sec: f64,
    position_sec: f64,
    completed: bool,
}
impl Watch {
    fn card(&self, continuing: bool, home: bool) -> Card {
        let mut card = Card {
            title: self.title.clone(),
            sub: self.subtitle.clone(),
            image: self.image.clone(),
            cmd: format!("resume:{}", self.key),
            ..Card::default()
        };
        if continuing {
            card.progress = Some(if home && self.duration_sec <= 0. {
                0.
            } else {
                self.position_sec / self.duration_sec.max(1.)
            });
            card.progress_light = true;
            card.remove = home;
            if self.duration_sec > 0. || !home {
                card.sub2 = Some(duration(
                    (self.duration_sec - self.position_sec).max(0.) as u64
                ));
            }
        } else if self.kind == "movie" {
            card.cmd = format!("movie:{}", self.item_id)
        } else if self.kind != "replay" {
            card.cmd = self
                .series_id
                .as_ref()
                .map(|s| format!("series:{s}"))
                .unwrap_or_default();
        }
        card
    }
}
fn duration(sec: u64) -> String {
    let (hours, mins, secs) = (sec / 3600, sec / 60 % 60, sec % 60);
    if hours > 0 {
        format!("{hours}:{mins:02}:{secs:02}")
    } else {
        format!("{mins}:{secs:02}")
    }
}
#[derive(Deserialize)]
struct Library {
    cont: Vec<Watch>,
    movies: Vec<Media>,
    series: Vec<Media>,
    hist: Vec<Watch>,
}
#[wasm_bindgen]
pub fn library_html(raw: &str, lang: &str) -> Result<String, String> {
    let data: Library = serde_json::from_str(raw).map_err(|_| "Bibliothèque invalide")?;
    let history: Vec<_> = data
        .hist
        .iter()
        .filter(|w| w.kind != "live" && w.completed)
        .collect();
    let favorites = !data.movies.is_empty() || !data.series.is_empty();
    Ok(html!{
        div.container.tab-h1{h1 style="font-size:2rem;font-weight:700"{(lookup(lang,"nav.myvideos"))}}
        @if data.cont.is_empty()&&!favorites&&history.is_empty(){div.empty{(lookup(lang,"myvideos.empty"))}}
        @if !data.cont.is_empty(){(rail("continue",lookup(lang,"home.continue"),None,html!{@for w in &data.cont{(w.card(true,false).outer("land"))}}))}
        @if favorites{(rail("favorites",lookup(lang,"home.myList"),None,html!{@for (kind,list) in [("movie",&data.movies),("series",&data.series)]{@for m in list{(m.card(kind).outer("poster"))}}}))}
        @if !history.is_empty(){(rail("history",lookup(lang,"myvideos.history"),None,html!{@for w in history{(w.card(false,false).outer("land"))}}))}
    }.into_string())
}
#[wasm_bindgen]
pub fn youtube_html(id: &str, title: &str, lang: &str, tv: bool) -> String {
    let id: String = js_sys::encode_uri_component(id).into();
    let src = format!(
        "https://www.youtube-nocookie.com/embed/{id}?autoplay=1&playsinline=1&rel=0&modestbranding=1&hl={}",
        if lang == "en" { "en" } else { "fr" }
    );
    html!{iframe.yt-frame src=(src) title=(if title.is_empty(){"YouTube"}else{title}) allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"{}
        div.yt-bar data-row{button.icon-btn.yt-close data-f data-cmd="back" aria-label=(lookup(lang,"common.close")){(icon("close",""))}
          div.yt-title.ellipsis{(title)}button.btn.small data-f data-autofocus[tv] data-cmd="open"{(lookup(lang,"yt.open"))}}
    }.into_string()
}
