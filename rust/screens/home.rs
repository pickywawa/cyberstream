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
    classics: Vec<Media>,
    award_series: Vec<Media>,
    award_movies: Vec<Media>,
    reality: Vec<Media>,
    buzz: Vec<Media>,
    /** films on each streaming platform: (name, films in the catalogue) */
    platforms: Vec<(String, Vec<Media>)>,
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
fn poster(item: &Media, kind: &str) -> Markup {
    Card {
        sub: item.credited(item.genres.as_ref().and_then(|g| g.first())),
        fallback: item.backdrop.as_ref().map(|s| tmdb(s, "w780")),
        score: item.rating,
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
        html! {@for m in items{(poster(m,kind))}},
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
        html! {@for m in items.iter().take(40){(poster(&m.item,&m.kind))}},
    )
}
#[wasm_bindgen]
pub fn home_html(raw: &str, lang: &str) -> Result<String, String> {
    let h: Home = serde_json::from_str(raw).map_err(|_| "Accueil invalide")?;
    let t = |k| lookup(lang, k);
    let mut seen = HashSet::new();
    Ok(html!{
        // universes: films / series grids, Sport / Info / Musique open the TV tab on that category;
        // (--cat: a colour per tile, unused while they share the main colour, see app.css)
        section.rail.cat-rail data-rail="categories"{div.rail-track data-row{@for (i,(id,key)) in [("cinema","universe.cinema"),("series","universe.series"),("kids","universe.kids"),("docs","home.docs"),("ent","universe.ent"),("sport","universe.sport"),("news","universe.news"),("music","universe.music")].into_iter().enumerate(){
            div.cat-wrap style=(format!("--cat:var(--cat-{})",i%7+1)){button.card.cat-card data-f data-cmd=(format!("tile:{id}")) aria-label=(t(key)){
                span.ic{(icon(id,""))}span.txt{span.lb{(t(key))}}
            }}
        }}}
        @if !h.cont.is_empty(){(rail("continue",t("home.continue"),None,html!{@for w in &h.cont{(w.card(true,true).outer("land"))}}))}
        @if !h.has_vod{div.empty{h3{(t("home.emptyTitle"))}p{(t("home.emptyText"))}button.btn.primary data-f data-cmd="tile:live"{(t("nav.tv"))}}}
        @if let Some(tr)=&h.trakt{(mixed("for-you",t("trakt.forYou"),&tr.for_you))}
        (standard(lang,t("home.fresh"),"movie",h.fresh.iter(),Some("all:fresh")))
        @if h.top.len()>=3{(rail("top",t("home.top10"),None,html!{@for (i,m) in h.top.iter().enumerate(){
            (Card{rank:i+1,score:m.rating,..m.card("movie")}.outer("top10"))
        }}))}
        (standard(lang,t("home.nowPlaying"),"movie",h.now_playing.iter(),None))
        (standard(lang,t("home.newSeries"),"series",h.new_series.iter(),Some("all:newSeries")))
        (standard(lang,t("home.popularSeries"),"series",h.trending_tv.iter().chain(&h.popular_tv).filter(|s|seen.insert(s.group_key.as_str())),None))
        (standard(lang,t("home.mustSee"),"movie",h.must_see.iter(),Some("all:mustSee")))
        @if !h.fav_movies.is_empty()||!h.fav_series.is_empty(){(rail("favorites",t("home.myList"),None,html!{
            @for m in &h.fav_movies{(Card{sub:m.credited(None),score:m.rating,..m.card("movie")}.outer("poster"))}
            @for s in &h.fav_series{(Card{score:s.rating,..s.card("series")}.outer("poster"))}
        }))}
        @if let Some(tr)=&h.trakt{(mixed("watchlist",t("trakt.watchlist"),&tr.watchlist))
            @for (i,l) in tr.lists.iter().enumerate(){(mixed(&format!("trakt-{i}"),&l.name,&l.items))}
        }
        (standard(lang,t("home.kids"),"movie",h.kids.iter(),Some("all:kids")))
        (standard(lang,t("home.popularMovies"),"movie",h.popular_movies.iter(),None))
        @for (g,items) in &h.genres{(standard(lang,g,"movie",items.iter(),Some(&format!("genre:{g}"))))}
        (standard(lang,t("home.classics"),"movie",h.classics.iter(),None))
        (standard(lang,t("home.awardSeries"),"series",h.award_series.iter(),None))
        (standard(lang,t("home.awardMovies"),"movie",h.award_movies.iter(),None))
        (standard(lang,t("home.reality"),"series",h.reality.iter(),None))
        (standard(lang,t("home.buzz"),"series",h.buzz.iter(),None))
        @for (p,items) in &h.platforms{(standard(lang,&t("home.onPlatform").replace("{p}",p),"movie",items.iter(),None))}
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
pub fn hero_html(raw: &str, index: usize, count: usize, _lang: &str) -> Result<String, String> {
    let h: Hero = serde_json::from_str(raw).map_err(|_| "Bannière invalide")?;
    let m = h.item;
    // the whole banner is one control: it opens the title's page (its trailer plays behind, see Home.tsx)
    Ok(html!{
        button.hero-select data-f data-autofocus data-slide data-cmd="info" aria-label=(&m.title){
        div.bg.poster-only[m.backdrop.as_deref().unwrap_or("").is_empty()]{
            @if m.backdrop.is_some() || m.poster.is_some() {
                (Image{srcs:vec![m.backdrop.map(|s|tmdb(&s,"w1280")), m.poster.map(|s|tmdb(&s,"w780"))],label:m.title.clone(),eager:true,..Default::default()}.markup())
            }
        }
        div.content{
            @if let Some(logo)=h.logo.filter(|s|!s.is_empty()){
                (Image{srcs:vec![Some(tmdb(&logo,"w500"))],class:"title-logo".into(),label:m.title.clone(),alt:m.title.clone(),eager:true,..Default::default()}.markup())
            }@else{h1{(&m.title)}}
            div.facts{@if let Some(y)=m.year{span{(y)}}@for g in m.genres.iter().flatten().take(2){span{(g)}}
                @if let Some(r)=h.rating.filter(|v|*v!=0.){span.rating{(format!("★ {r:.1}"))}}}
        }
        }
        (dots(index,count))
    }.into_string())
}
