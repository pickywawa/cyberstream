use super::*;
use crate::{artwork::Image, cards::tmdb};
use std::collections::HashSet;

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
struct Home {
    cont: Vec<Watch>,
    fresh: Vec<Media>,
    new_series: Vec<Media>,
    top: Vec<Media>,
    now_playing: Vec<Media>,
    popular_movies: Vec<Media>,
    must_see: Vec<Media>,
    trending_tv: Vec<Media>,
    popular_tv: Vec<Media>,
    genres: Vec<(String, Vec<Media>)>,
    kids: Vec<Media>,
    fav_movies: Vec<Media>,
    fav_series: Vec<Media>,
    has_vod: bool,
    trakt: Option<Trakt>,
}
#[derive(Deserialize)]
struct Mixed {
    kind: String,
    item: Media,
}
#[derive(Deserialize)]
struct List {
    name: String,
    items: Vec<Mixed>,
}
#[derive(Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
struct Trakt {
    for_you: Vec<Mixed>,
    watchlist: Vec<Mixed>,
    lists: Vec<List>,
}
fn poster(item: &Media, kind: &str, long_press: bool) -> Markup {
    Card {
        sub: item.credited(item.genres.as_ref().and_then(|g| g.first())),
        fallback: item.backdrop.as_ref().map(|s| tmdb(s, "w780")),
        long_press,
        ..item.card(kind)
    }
    .outer("poster")
}
fn standard<'a>(
    lang: &str,
    title: &str,
    kind: &str,
    items: impl Iterator<Item = &'a Media>,
    all: Option<&str>,
) -> Markup {
    let items: Vec<_> = items.take(30).collect();
    if items.len() < 3 {
        return html! {};
    }
    rail(
        all.unwrap_or(title),
        title,
        all.map(|cmd| (cmd, lookup(lang, "common.all"))),
        html! {@for m in items{(poster(m,kind,kind=="movie"))}},
    )
}
fn mixed(key: &str, title: &str, items: &[Mixed]) -> Markup {
    if items.len() < 2 {
        return html! {};
    }
    rail(
        key,
        title,
        None,
        html! {@for m in items.iter().take(40){(poster(&m.item,&m.kind,false))}},
    )
}
#[wasm_bindgen]
pub fn home_html(raw: &str, lang: &str) -> Result<String, String> {
    let h: Home = serde_json::from_str(raw).map_err(|_| "Accueil invalide")?;
    let t = |k| lookup(lang, k);
    let mut seen = HashSet::new();
    Ok(html!{
        section.rail.cat-rail data-rail="categories"{div.rail-track data-row{@for (id,key) in [("cinema","universe.cinema"),("series","universe.series"),("live","nav.tv"),("kids","universe.kids"),("docs","universe.docs")]{
            (Card{title:t(key).into(),cmd:format!("tile:{id}"),icon:id.into(),..Default::default()}.outer("tile"))
        }}}
        @if !h.cont.is_empty(){(rail("continue",t("home.continue"),None,html!{@for w in &h.cont{(w.card(true,true).outer("land"))}}))}
        @if !h.has_vod{div.empty{h3{(t("home.emptyTitle"))}p{(t("home.emptyText"))}button.btn.primary data-f data-cmd="tile:live"{(t("nav.tv"))}}}
        @if let Some(tr)=&h.trakt{(mixed("for-you",t("trakt.forYou"),&tr.for_you))}
        (standard(lang,t("home.fresh"),"movie",h.fresh.iter(),Some("all:fresh")))
        @if h.top.len()>=3{(rail("top",t("home.top10"),None,html!{@for (i,m) in h.top.iter().enumerate(){
            (Card{rank:i+1,..m.card("movie")}.outer("top10"))
        }}))}
        (standard(lang,t("home.nowPlaying"),"movie",h.now_playing.iter(),None))
        (standard(lang,t("home.newSeries"),"series",h.new_series.iter(),Some("all:newSeries")))
        (standard(lang,t("home.popularSeries"),"series",h.trending_tv.iter().chain(&h.popular_tv).filter(|s|seen.insert(s.group_key.as_str())),None))
        (standard(lang,t("home.mustSee"),"movie",h.must_see.iter(),Some("all:mustSee")))
        @if !h.fav_movies.is_empty()||!h.fav_series.is_empty(){(rail("favorites",t("home.myList"),None,html!{
            @for m in &h.fav_movies{(Card{sub:m.credited(None),..m.card("movie")}.outer("poster"))}
            @for s in &h.fav_series{(s.card("series").outer("poster"))}
        }))}
        @if let Some(tr)=&h.trakt{(mixed("watchlist",t("trakt.watchlist"),&tr.watchlist))
            @for (i,l) in tr.lists.iter().enumerate(){(mixed(&format!("trakt-{i}"),&l.name,&l.items))}
        }
        (standard(lang,t("home.kids"),"movie",h.kids.iter(),Some("all:kids")))
        (standard(lang,t("home.popularMovies"),"movie",h.popular_movies.iter(),None))
        @for (g,items) in &h.genres{(standard(lang,g,"movie",items.iter(),Some(&format!("genre:{g}"))))}
    }.into_string())
}
#[derive(Deserialize, Default)]
#[serde(default)]
struct Hero {
    #[serde(flatten)]
    item: Media,
    logo: Option<String>,
    rating: Option<f64>,
    plot: Option<String>,
}
#[wasm_bindgen]
pub fn hero_html(raw: &str, index: usize, count: usize, lang: &str) -> Result<String, String> {
    let h: Hero = serde_json::from_str(raw).map_err(|_| "Bannière invalide")?;
    let m = h.item;
    Ok(html!{
        div.bg{(Image{srcs:vec![m.backdrop.map(|s|tmdb(&s,"w1280"))],label:m.title.clone(),eager:true,..Default::default()}.markup())}
        div.content{
            @if let Some(logo)=h.logo.filter(|s|!s.is_empty()){
                (Image{srcs:vec![Some(tmdb(&logo,"w500"))],class:"title-logo".into(),label:m.title.clone(),alt:m.title.clone(),eager:true,..Default::default()}.markup())
            }@else{h1{(&m.title)}}
            div.facts{@if let Some(y)=m.year{span{(y)}}@for g in m.genres.iter().flatten().take(2){span{(g)}}
                @if let Some(r)=h.rating.filter(|v|*v!=0.){span.rating{(format!("★ {r:.1}"))}}}
            @if let Some(plot)=h.plot.filter(|s|!s.is_empty()){p.clamp3{(plot)}}
            div.btn-row data-row{button.btn.primary data-f data-autofocus data-cmd="play"{(icon("play",""))" "(lookup(lang,"home.play"))}
                button.btn data-f data-cmd="info"{(icon("info",""))" "(lookup(lang,"home.info"))}
                @if count>1{button.btn.ghost.small data-f data-cmd="next" aria-label="next"{"›"}}}
        }
        div.dots{@for i in 0..count{i.on[i==index]{}}}
    }.into_string())
}
