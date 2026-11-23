use maud::{Markup, html};
use serde::{Deserialize, Serialize};
use std::{
    cell::RefCell,
    collections::{HashSet, VecDeque},
};
use wasm_bindgen::prelude::*;

#[derive(Default)]
struct Recent {
    seen: HashSet<String>,
    order: VecDeque<String>,
}
impl Recent {
    fn add(&mut self, url: &str) {
        if !self.seen.insert(url.into()) {
            return;
        }
        self.order.push_back(url.into());
        if self.order.len() > 2048
            && let Some(old) = self.order.pop_front()
        {
            self.seen.remove(&old);
        }
    }
}
#[derive(Default)]
struct Artwork {
    loaded: Recent,
    failed: Recent,
    proxy: String,
    logo_proxy: String,
    sized: bool,
}
thread_local! {static CACHE:RefCell<Artwork>=RefCell::new(Artwork::default());}
#[wasm_bindgen]
pub fn artwork_config(proxy: &str, logo_proxy: &str, sized: bool) {
    CACHE.with_borrow_mut(|c| {
        c.proxy = proxy.into();
        c.logo_proxy = logo_proxy.into();
        c.sized = sized;
    });
}
#[wasm_bindgen]
pub fn artwork_loaded(url: &str) {
    CACHE.with_borrow_mut(|c| c.loaded.add(url))
}
#[derive(Serialize, Deserialize, Default)]
#[serde(default)]
pub(crate) struct Image {
    pub srcs: Vec<Option<String>>,
    pub label: String,
    pub alt: String,
    pub class: String,
    pub contain: bool,
    pub eager: bool,
}
fn initials(s: &str) -> String {
    let clean = crate::text::clean_name(s);
    let mut words = clean.split_whitespace();
    let head = words.next().unwrap_or("?");
    if let Some(next) = words.next() {
        head.chars()
            .take(1)
            .chain(next.chars().take(1))
            .collect::<String>()
            .to_uppercase()
    } else {
        head.chars().take(2).collect::<String>().to_uppercase()
    }
}
fn hue(s: &str) -> u32 {
    s.encode_utf16()
        .fold(0i32, |n, c| n.wrapping_mul(31).wrapping_add(c as i32))
        .unsigned_abs()
        % 360
}

impl Image {
    pub(crate) fn markup(&self) -> Markup {
        CACHE.with_borrow(|c|{
            let candidate=self.srcs.iter().flatten().find(|s|!s.is_empty()&&!c.failed.seen.contains(s.as_str()));
            let Some(raw)=candidate else{
                let name=if !self.label.is_empty(){self.label.as_str()}else if !self.alt.is_empty(){&self.alt}else{"?"};
                return if self.contain{
                    let clean=crate::text::clean_name(name);
                    html!{div.name-tile style=(format!("--tile-hue:hsl({} 55% 42%)",hue(&clean))) title=(clean){span.mono{(initials(&clean))}span.nm{(clean)}}}
                }else{html!{div.ph style=(format!("background:hsl({} 45% 32%)",hue(name))){div{div.ini{(initials(name))}@if !self.label.is_empty(){div.lbl.clamp2{(&self.label)}}}}}}
            };
            let remote=raw.starts_with("https://")||raw.starts_with("http://");
            let cors=remote&&self.contain&&!c.logo_proxy.is_empty();
            let base=if cors{&c.logo_proxy}else{&c.proxy};
            let url=if remote&&!base.is_empty(){
                let encoded:String=js_sys::encode_uri_component(raw).into();
                let role=if self.contain{"logo"}else if self.eager{"hero"}else{"card"};
                if c.sized{format!("{base}{encoded}&size={role}")}else{format!("{base}{encoded}")}
            }else{raw.clone()};
            let loaded=c.loaded.seen.contains(raw);
            let alt=&self.alt;
            let mut style=if self.contain{"object-fit:contain;".to_owned()}else{String::new()};
            if !loaded{style.push_str("opacity:0;transition:opacity .2s")}
            html!{img data-art=(raw) data-fallback=(serde_json::to_string(self).unwrap())
                class=(&self.class) src=(url) alt=(alt) loading=(if loaded||self.eager{"eager"}else{"lazy"})
                decoding="async" draggable="false" crossorigin=[cors.then_some("anonymous")] style=(style);}
        })
    }
}
#[wasm_bindgen]
pub fn artwork_html(raw: &str) -> Result<String, String> {
    let image: Image = serde_json::from_str(raw).map_err(|_| "Image invalide")?;
    Ok(image.markup().into_string())
}
#[wasm_bindgen]
pub fn artwork_failed(url: &str, raw: &str) -> Result<String, String> {
    CACHE.with_borrow_mut(|c| c.failed.add(url));
    artwork_html(raw)
}
