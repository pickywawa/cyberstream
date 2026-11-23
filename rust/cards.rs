use crate::{artwork::Image, views::icon};
use maud::{Markup, html};
use serde::Deserialize;
use wasm_bindgen::prelude::*;

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
pub(crate) struct Card {
    pub title: String,
    pub cmd: String,
    pub sub: Option<String>,
    pub sub2: Option<String>,
    pub image: Option<String>,
    pub fallback: Option<String>,
    pub fallbacks: Vec<Option<String>>,
    pub logo: Option<Vec<Option<String>>>,
    pub center_logo: Option<Vec<Option<String>>>,
    pub badge: Option<String>,
    pub badge_live: bool,
    pub progress: Option<f64>,
    pub progress_light: bool,
    pub hide_meta: bool,
    pub imdb: Option<f64>,
    pub rank: usize,
    pub icon: String,
    pub menu: Option<String>,
    pub menu_title: String,
    pub remove: bool,
    pub long_press: bool,
    pub auto_focus: bool,
}
pub(crate) fn tmdb(url: &str, size: &str) -> String {
    re!(r"(image\.tmdb\.org/t/p/)[^/]+")
        .replace(url, |m: &regex::Captures| format!("{}{size}", &m[1]))
        .into_owned()
}
fn image(srcs: Vec<Option<String>>, label: &str, contain: bool) -> Markup {
    Image {
        srcs,
        label: label.into(),
        alt: label.into(),
        contain,
        ..Default::default()
    }
    .markup()
}
pub(crate) fn rating(value: f64) -> Markup {
    html! {span.imdb{b{"IMDb"}(format!("{value:.1}"))}}
}
impl Card {
    fn picture(&self, poster: bool) -> Markup {
        let mut srcs = vec![
            self.image
                .as_deref()
                .map(|s| tmdb(s, if poster { "w342" } else { "w780" })),
        ];
        if poster {
            srcs.push(self.fallback.clone())
        } else {
            srcs.extend(self.fallbacks.iter().cloned())
        }
        html! {div.thumb{
            @if !poster && self.center_logo.is_some() && self.image.as_deref().unwrap_or("").is_empty(){
                div.logo-center{(image(self.center_logo.clone().unwrap_or_default(),&self.title,true))}
            }@else{(image(srcs,&self.title,false))}
            @if !poster && let Some(logo)=&self.logo{span.ch-logo-badge{(image(logo.clone(),"",true))}}
            @if let Some(b)=&self.badge{span.badge.live[self.badge_live]{(b)}}
            @if poster && let Some(r)=self.imdb.filter(|v|*v!=0.){(rating(r))}
            @if let Some(p)=self.progress{
                div.progress.light[self.progress_light]{i style=(format!("width:{}%",(p*100.).clamp(if poster{2.}else{1.},100.))){}}
            }
        }}
    }
    pub(crate) fn outer(&self, kind: &str) -> Markup {
        let class = match kind {
            "land" => return html! { div.card.land style="padding:0" { (self.content(kind)) } },
            "poster" => "card poster",
            "top10" => "card top10",
            "tile" => "card cat-card",
            "logo" => "card logo-tile",
            _ => return html! {},
        };
        let label = if kind == "top10" {
            format!("{}. {}", self.rank, self.title)
        } else {
            self.title.clone()
        };
        html! {button class=(class) data-f data-cmd=(&self.cmd) data-lp[self.long_press]
        aria-label=(label) title=[(kind=="logo").then_some(&self.title)] {(self.content(kind))}}
    }
    pub(crate) fn content(&self, kind: &str) -> Markup {
        match kind {
            "poster" => {
                html! {(self.picture(true))@if !self.hide_meta{div.meta{div.title.ellipsis{(&self.title)}@if let Some(s)=&self.sub{div.sub.ellipsis{(s)}}}}}
            }
            "land" => html! {
                button.card.land data-f data-cmd=(if self.cmd.is_empty() {"play"} else {&self.cmd}) data-lp[self.long_press] data-autofocus[self.auto_focus] aria-label=(&self.title) style="width:100%" {(self.picture(false))}
                @if self.remove{button.remove-x data-f data-cmd=(if self.cmd.is_empty() {"remove".into()} else {format!("remove:{}", self.cmd)}) aria-label="remove"{(icon("close",""))}}
                div.meta{div.row{div.grow{div.title.clamp2{(&self.title)}@if let Some(s)=&self.sub{div.sub.ellipsis{(s)}}@if let Some(s)=&self.sub2{div.sub.dim.ellipsis{(s)}}}
                    @if let Some(icon_name)=&self.menu{button.mini-icon data-f data-cmd="menu" aria-label="menu" title=(&self.menu_title){(icon(icon_name,""))}}
                }}
            },
            "top10" => {
                html! {span.num{(self.rank)}div.thumb{(image(vec![self.image.as_deref().map(|s|tmdb(s,"w342"))],&self.title,false))}}
            }
            "tile" => {
                html! {span.ic{(icon(&self.icon,""))}span.txt{span.lb{(&self.title)}@if let Some(s)=&self.sub{span.sb{(s)}}}}
            }
            "logo" => image(self.logo.clone().unwrap_or_default(), &self.title, true),
            _ => html! {},
        }
    }
}
#[wasm_bindgen]
pub fn card_html(kind: &str, raw: &str) -> Result<String, String> {
    let card: Card = serde_json::from_str(raw).map_err(|_| "Carte invalide")?;
    Ok(card.content(kind).into_string())
}
