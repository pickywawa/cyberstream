use super::*;
use crate::{
    artwork::Image,
    cards::tmdb,
    text::{episode_title, generic_episode},
};
use std::collections::HashMap;

#[derive(Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
struct Title {
    #[serde(flatten)]
    media: Media,
    logo: Option<String>,
    plot: Option<String>,
    cast: Vec<String>,
    director: Option<String>,
    cert_age: Option<u32>,
    cert: Option<String>,
    rating: Option<f64>,
    votes: Option<String>,
    duration_sec: Option<f64>,
    trailer: Option<String>,
}
#[derive(Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
struct Detail {
    item: Title,
    audio: Vec<(String, String)>,
    subs: Vec<(String, String)>,
    prefs: Vec<String>,
    sub_prefs: Vec<String>,
    has_langs: bool,
    progress: Option<Watch>,
    fav: bool,
    variants: usize,
    series: bool,
    resume_label: Option<String>,
    playable: bool,
}
fn flags(
    values: &mut [(String, String)],
    priority: &[String],
    preferred: &[String],
    heading: &str,
) -> Markup {
    values.sort_by_key(|(l, _)| priority.iter().position(|p| p == l).unwrap_or(usize::MAX));
    html! {@if !values.is_empty(){span.grp{b{(heading)}@for (l,flag) in values{span.flag.mine[preferred.contains(l)] title=(&l){span.e{(&flag)}(l.to_uppercase())}}}}}
}
#[wasm_bindgen]
pub fn detail_header(raw: &str, lang: &str) -> Result<String, String> {
    let mut d: Detail = serde_json::from_str(raw).map_err(|_| "Fiche invalide")?;
    let t = |k| lookup(lang, k);
    let it = d.item;
    let m = &it.media;
    let resume = d.progress.filter(|p| !p.completed && p.position_sec > 60.);
    Ok(html!{
        @if let Some(logo)=it.logo.filter(|l|!l.is_empty()){
            (Image{srcs:vec![Some(tmdb(&logo,"w500"))],label:m.title.clone(),alt:m.title.clone(),class:"title-logo".into(),eager:true,..Default::default()}.markup())
        }@else{h1 style="font-size:clamp(1.8rem,3.6vw,3rem);font-weight:900;line-height:1.05"{(&m.title)}}
        div.facts{
            @if let Some(y)=m.year{span{(y)}}
            @if let Some(sec)=it.duration_sec.filter(|s|*s>0.){@let h=sec as u64/3600; @let min=((sec%3600.)/60.).round() as u64;
                span{(if h>0{format!("{h} h {min:02}")}else{format!("{min} min")})}}
            @if let Some(age)=it.cert_age{span class=(format!("age-pill a{age}")) title=(if age==0{t("age.all").into()}else{t("age.min").replace("{n}",&age.to_string())}){
               (if age==0{t("age.allShort").into()}else{format!("-{age}")})}}
            @else if let Some(cert)=it.cert.filter(|c|!c.is_empty()){span.age-pill{(cert)}}
            @if let Some(r)=m.imdb_rating.filter(|v|*v!=0.){span.imdb.inline title=[it.votes]{b{"IMDb"}(format!("{r:.1}"))}}
            @if let Some(r)=it.rating.filter(|v|*v!=0.){span.rating title="TMDB"{(icon("star","detail-star"))" "(format!("{r:.1}"))}}
            @for g in m.genres.iter().flatten().take(3){span.pill{(g)}}
        }
        @if d.has_langs{div.langs{
           @if d.audio.is_empty()&&d.subs.is_empty(){span.dim{(t("detail.langUnknown"))}}
           (flags(&mut d.audio,&d.prefs,&d.prefs,t("detail.audio")))(flags(&mut d.subs,&d.prefs,&d.sub_prefs,t("detail.subs")))
        }}
        @if let Some(plot)=it.plot.filter(|s|!s.is_empty()){p.clamp3 style="line-height:1.55;max-width:680px"{(plot)}}
        @if let Some(p)=&resume{div style="max-width:360px;margin:12px 0"{div.progress style="position:relative;left:0;right:0;bottom:0"{
            i style=(format!("width:{}%",(p.position_sec/p.duration_sec.max(1.)*100.).min(100.))){}}
            div.small.muted style="margin-top:6px"{(t("player.resumeAt").replace("{time}",&duration(p.position_sec as u64)))}}}
        div.btn-row data-row style="margin-top:18px"{
            button.btn.primary data-f data-autofocus disabled[d.series&&!d.playable] data-cmd="play"{(icon("play",""))" "
                @if let Some(s)=d.resume_label{(t("detail.resume"))" "(s)}@else if resume.is_some(){(t("detail.resume"))}@else{(t("detail.play"))}}
            @if resume.is_some(){button.btn data-f data-cmd="restart"{(icon("restart",""))" "(t("detail.restart"))}}
            button.btn data-f data-cmd="favorite"{(icon(if d.fav{"check"}else{"plus"},""))" "(t(if d.fav{"detail.inList"}else{"detail.addList"}))}
            @if let Some(url)=it.trailer.filter(|u|u.starts_with("https://")||u.starts_with("http://")){a.btn data-f href=(url) target="_blank" rel="noreferrer"{(t("detail.trailer"))}}
        }
        div.small.muted style="margin-top:18px;line-height:1.6"{
          @if let Some(s)=it.director.filter(|s|!s.is_empty()){div{b{(t("detail.director"))" :"}" "(s)}}
          @if !it.cast.is_empty(){div.clamp2{b{(t("detail.cast"))" :"}" "(it.cast.iter().take(8).cloned().collect::<Vec<_>>().join(", "))}}
          @if d.variants>1{div{(t("detail.sources").replace("{n}",&d.variants.to_string()))}}
        }
    }.into_string())
}
#[derive(Deserialize)]
struct Cast {
    id: i64,
    name: String,
    photo: Option<String>,
    character: Option<String>,
}
#[wasm_bindgen]
pub fn cast_html(raw: &str, lang: &str) -> Result<String, String> {
    let people: Vec<Cast> = serde_json::from_str(raw).map_err(|_| "Distribution invalide")?;
    Ok(rail("cast",lookup(lang,"detail.cast"),None,html!{@for p in people{
        button.card.person-card data-f data-cmd=(p.id){span.ph-round{@if let Some(photo)=p.photo.filter(|s|!s.is_empty()){
            (Image{srcs:vec![Some(photo)],label:p.name.clone(),alt:p.name.clone(),..Default::default()}.markup())
        }@else{span.ini{(p.name.split(' ').take(2).filter_map(|s|s.chars().next()).collect::<String>())}}}
        span.nm.ellipsis{(p.name)}@if let Some(c)=p.character.filter(|s|!s.is_empty()){span.ch.ellipsis{(c)}}}
    }}).into_string())
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Ep {
    id: String,
    season: i32,
    episode: i32,
    title: String,
    still: Option<String>,
    duration_sec: Option<f64>,
    plot: Option<String>,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Episodes {
    title: String,
    backdrop: Option<String>,
    episodes: Vec<Ep>,
    watch: Vec<Watch>,
    similar: Vec<Media>,
    season: Option<i32>,
    tab: String,
    loading: bool,
}
#[wasm_bindgen]
pub fn series_panel(raw: &str, lang: &str) -> Result<String, String> {
    let data: Episodes = serde_json::from_str(raw).map_err(|_| "Saisons invalides")?;
    let eps = &data.episodes;
    let last = data
        .watch
        .iter()
        .max_by(|a, b| a.updated_at.total_cmp(&b.updated_at));
    let watched = last.and_then(|w| eps.iter().position(|ep| ep.id == w.item_id));
    let target = match (last, watched) {
        (Some(w), Some(i)) if !w.completed => Some((&eps[i], w.position_sec)),
        (_, Some(i)) if i + 1 < eps.len() => Some((&eps[i + 1], 0.)),
        _ => eps.first().map(|ep| (ep, 0.)),
    };
    let mut seasons: Vec<_> = eps.iter().map(|e| e.season).collect();
    seasons.sort_unstable();
    seasons.dedup();
    let season = data
        .season
        .or_else(|| watched.map(|i| eps[i].season))
        .or_else(|| seasons.first().copied());
    let list: Vec<_> = eps.iter().filter(|ep| Some(ep.season) == season).collect();
    let count = list.len();
    let state: HashMap<_, _> = data.watch.iter().map(|w| (w.item_id.as_str(), w)).collect();
    let t = |k| lookup(lang, k);
    let html=html!{
       div.tabs.detail-tabs.container data-tabs data-row style="margin-top:10px"{button.tab.active[data.tab=="episodes"] data-f data-cmd="episodes"{(t("detail.episodes"))}
         @if !data.similar.is_empty(){button.tab.active[data.tab=="similar"] data-f data-cmd="similar"{(t("detail.similar"))}}}
       @if data.tab=="episodes"{
           @if seasons.len()>1{div.season-btns data-tabs data-row{@for n in seasons{button.season-btn.active[Some(n)==season] data-f data-cmd=(format!("season:{n}")){"S"(n)}}}}
           @if count>0{
               div.container.muted.small style="margin:6px 0 12px"{(t("detail.seasonCount").replace("{n}",&count.to_string()))}
               div.ep-list data-row data-scroll="episodes"{@for e in list{
                  @let w=state.get(e.id.as_str());
                  button.ep data-f data-ep=(&e.id) data-cmd=(format!("episode:{}",e.id)){
                    div.thumb{(Image{srcs:vec![e.still.clone(),data.backdrop.clone()],label:format!("{} {}",data.title,e.episode),..Default::default()}.markup())
                    span.play-ov{(icon("play",""))}@if let Some(w)=w{div.progress{i style=(format!("width:{}%",if w.completed{100.}else{100.*w.position_sec/w.duration_sec.max(1.)})){} }}}
                    div{div style="font-weight:700;font-size:1.1rem"{(t("detail.episode").replace("{n}",&e.episode.to_string()))
                     @if !generic_episode(&e.title){" · "(episode_title(&e.title))}}
                     @if let Some(sec)=e.duration_sec.filter(|n|*n>0.){div.small.muted style="margin:4px 0 8px"{(t("common.min").replace("{n}",&(sec/60.).round().to_string()))}}
                     @if let Some(plot)=&e.plot{p.clamp2.muted.small style="margin:0;line-height:1.45"{(plot)}}}
                  }
               }}
           }@else if data.loading{div.spinner.big style="margin:40px auto"{}}@else{div.empty{(t("detail.noEpisodes"))}}
       }@else{div.grid.posters style="margin-top:16px"{@for s in &data.similar{(s.card("series").outer("poster"))}}}
    }.into_string();
    Ok(serde_json::json!({"html":html,"season":season,"count":count,"id":target.map(|(ep,_)|&ep.id),"at":target.map(|(_,at)|at).unwrap_or(0.),
       "label":target.filter(|_|last.is_some()).map(|(ep,_)|format!("S{} E{}",ep.season,ep.episode))}).to_string())
}
