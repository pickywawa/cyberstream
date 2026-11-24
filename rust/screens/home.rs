use super::*;
use crate::{
    artwork::Image,
    cards::{card_size, tmdb},
};
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
        fallback: item.backdrop.as_ref().map(|s| tmdb(s, card_size(false))),
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
/** Home's shelves, one block each `[key, html]` (keys unique): the page updates and adds them one by one */
fn blocks(raw: &str, lang: &str) -> Result<Vec<(String, String)>, String> {
    let h: Home = serde_json::from_str(raw).map_err(|_| "Accueil invalide")?;
    let t = |k| lookup(lang, k);
    let mut seen = HashSet::new();
    let mut out: Vec<(String, String)> = vec![];
    let mut keys = HashSet::new();
    let mut push = |key: &str, m: Markup| {
        let html = m.into_string();
        if html.is_empty() {
            return;
        }
        let mut k = key.to_string();
        let mut n = 1;
        while !keys.insert(k.clone()) {
            n += 1;
            k = format!("{key}#{n}");
        }
        out.push((k, html));
    };
    if !h.cont.is_empty() {
        push("continue", rail("continue", t("home.continue"), None, html! {@for w in &h.cont{(w.card(true,true).outer("land"))}}));
    }
    if !h.has_vod {
        push("empty", html! {div.empty{h3{(t("home.emptyTitle"))}p{(t("home.emptyText"))}button.btn.primary data-f data-cmd="tile:live"{(t("nav.tv"))}}});
    }
    let std_key = |title: &str, all: Option<&str>| all.unwrap_or(title).to_string();
    let standard_block = |push: &mut dyn FnMut(&str, Markup), title: &str, kind: &str, items: &mut dyn Iterator<Item = &Media>, all: Option<&str>| {
        push(&std_key(title, all), standard(lang, title, kind, items, all));
    };
    if let Some(tr) = &h.trakt {
        push("for-you", mixed("for-you", t("trakt.forYou"), &tr.for_you));
    }
    standard_block(&mut push, t("home.fresh"), "movie", &mut h.fresh.iter(), Some("all:fresh"));
    if h.top.len() >= 3 {
        push("top", rail("top", t("home.top10"), None, html! {@for (i,m) in h.top.iter().enumerate(){
            (Card{rank:i+1,score:m.rating,..m.card("movie")}.outer("top10"))
        }}));
    }
    standard_block(&mut push, t("home.nowPlaying"), "movie", &mut h.now_playing.iter(), None);
    standard_block(&mut push, t("home.newSeries"), "series", &mut h.new_series.iter(), Some("all:newSeries"));
    standard_block(&mut push, t("home.popularSeries"), "series", &mut h.trending_tv.iter().chain(&h.popular_tv).filter(|s| seen.insert(s.group_key.as_str())), None);
    standard_block(&mut push, t("home.mustSee"), "movie", &mut h.must_see.iter(), Some("all:mustSee"));
    if !h.fav_movies.is_empty() || !h.fav_series.is_empty() {
        push("favorites", rail("favorites", t("home.myList"), None, html! {
            @for m in &h.fav_movies{(Card{sub:m.credited(None),score:m.rating,..m.card("movie")}.outer("poster"))}
            @for s in &h.fav_series{(Card{score:s.rating,..s.card("series")}.outer("poster"))}
        }));
    }
    if let Some(tr) = &h.trakt {
        push("watchlist", mixed("watchlist", t("trakt.watchlist"), &tr.watchlist));
        for (i, l) in tr.lists.iter().enumerate() {
            let key = format!("trakt-{i}");
            push(&key, mixed(&key, &l.name, &l.items));
        }
    }
    standard_block(&mut push, t("home.kids"), "movie", &mut h.kids.iter(), Some("all:kids"));
    standard_block(&mut push, t("home.popularMovies"), "movie", &mut h.popular_movies.iter(), None);
    for (g, items) in &h.genres {
        standard_block(&mut push, g, "movie", &mut items.iter(), Some(&format!("genre:{g}")));
    }
    standard_block(&mut push, t("home.classics"), "movie", &mut h.classics.iter(), None);
    standard_block(&mut push, t("home.awardSeries"), "series", &mut h.award_series.iter(), None);
    standard_block(&mut push, t("home.awardMovies"), "movie", &mut h.award_movies.iter(), None);
    standard_block(&mut push, t("home.reality"), "series", &mut h.reality.iter(), None);
    standard_block(&mut push, t("home.buzz"), "series", &mut h.buzz.iter(), None);
    for (p, items) in &h.platforms {
        standard_block(&mut push, &t("home.onPlatform").replace("{p}", p), "movie", &mut items.iter(), None);
    }
    Ok(out)
}
/** Home's categories (shown with the Contenus filters' look, an icon each): "Tout" is Home's shelves,
 *  the others show their grid right under the bar (`cat:<id>`) */
pub(crate) const HOME_CATEGORIES: [(&str, &str); 8] = [
    ("all", "replay.all"),
    ("cinema", "universe.cinema"),
    ("series", "universe.series"),
    ("kids", "universe.kids"),
    ("docs", "home.docs"),
    ("ent", "universe.ent"),
    ("music", "universe.music"),
    ("shows", "home.shows"),
];
#[wasm_bindgen]
pub fn home_categories(selected: &str, lang: &str) -> String {
    html! {@for (id,key) in HOME_CATEGORIES{
        button.chip.cat-chip.active[id==selected] data-f data-cmd=(format!("cat:{id}")) {
            (icon(&format!("u-{id}"),""))span{(lookup(lang,key))}
        }
    }}
    .into_string()
}
/** Home's shelves as `[[key, html], …]` (see blocks) */
#[wasm_bindgen]
pub fn home_blocks(raw: &str, lang: &str) -> Result<String, String> {
    serde_json::to_string(&blocks(raw, lang)?).map_err(|e| e.to_string())
}
/** Home's shelves in one piece */
#[wasm_bindgen]
pub fn home_html(raw: &str, lang: &str) -> Result<String, String> {
    Ok(blocks(raw, lang)?.into_iter().map(|(_, h)| h).collect())
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
