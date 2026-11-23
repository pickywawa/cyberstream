use super::*;
use crate::artwork::Image;

#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
struct Item {
    id: String,
    provider: String,
    kind: String,
    title: String,
    subtitle: Option<String>,
    channel: Option<String>,
    genre: Option<String>,
    image: Option<String>,
    desc: Option<String>,
    duration_sec: Option<f64>,
    expires: Option<f64>,
    published: Option<f64>,
    age: Option<u16>,
}
fn provider(id: &str) -> &str {
    match id {
        "arte" => "ARTE",
        "francetv" => "france.tv",
        "youtube" => "YouTube",
        _ => id,
    }
}
fn text(value: &Option<String>) -> Option<&String> {
    value.as_ref().filter(|s| !s.is_empty())
}
impl Item {
    fn tag(&self) -> Markup {
        html! {span class=(format!("rp-prov {}",self.provider)){(text(&self.channel).map(String::as_str).unwrap_or_else(||provider(&self.provider)))}}
    }
    fn facts(&self) -> Markup {
        html! {@for s in [text(&self.subtitle),text(&self.genre)].into_iter().flatten(){span{(s)}}
        @if let Some(d)=self.duration_sec.filter(|d|*d>0.){span{(duration(d as u64))}}}
    }
    fn picture(&self, fallback: bool) -> Markup {
        let mut srcs = vec![
            self.image
                .as_ref()
                .map(|s| s.replace("940x530", "1280x720")),
        ];
        if fallback {
            srcs.push(self.image.clone())
        }
        Image {
            srcs,
            label: self.title.clone(),
            eager: true,
            ..Default::default()
        }
        .markup()
    }
    fn card(&self, lang: &str, now: f64) -> Card {
        let mut c = Card {
            title: self.title.clone(),
            image: self.image.clone(),
            cmd: format!("item:{}", self.id),
            ..Default::default()
        };
        if self.provider == "youtube" {
            c.sub = self.channel.clone();
            if let Some(ts) = self.published {
                let m = ((now - ts) / 60000.).round().max(1.);
                let (k, n) = if m < 60. {
                    ("yt.ago.m", m)
                } else if m < 2880. {
                    ("yt.ago.h", (m / 60.).round())
                } else {
                    ("yt.ago.d", (m / 1440.).round())
                };
                c.sub2 = Some(lookup(lang, k).replace("{n}", &n.to_string()));
            }
        } else {
            c.sub = text(&self.subtitle).or(text(&self.channel)).cloned();
            c.sub2 = self
                .duration_sec
                .filter(|d| *d > 0.)
                .map(|d| duration(d as u64))
                .or_else(|| (self.kind == "show").then(|| lookup(lang, "replay.show").into()));
            if let Some(days) = self
                .expires
                .map(|x| ((x - now) / 86400000.).ceil() as i64)
                .filter(|d| (1..=3).contains(d))
            {
                c.badge = Some(lookup(lang, "replay.lastDays").replace("{n}", &days.to_string()));
            }
        }
        c
    }
}
#[derive(Default, Deserialize)]
#[serde(default)]
struct Shelf {
    id: String,
    title: String,
    provider: String,
    kids: bool,
    items: Vec<Item>,
}
#[derive(Default, Deserialize)]
#[serde(default)]
struct Catalog {
    rails: Vec<Shelf>,
    kids: Vec<Shelf>,
    youtube: Vec<Shelf>,
    failed: Vec<String>,
}
impl Catalog {
    fn ordered(&self, filter: &str) -> Vec<&Shelf> {
        if filter == "kids" {
            return self.kids.iter().collect();
        }
        if filter == "youtube" {
            return self.youtube.iter().collect();
        }
        if filter != "all" {
            return self.rails.iter().filter(|r| r.provider == filter).collect();
        }
        let mut out: Vec<_> = self.rails.iter().take(4).collect();
        let mut rest = self
            .rails
            .iter()
            .skip(4)
            .take(2)
            .chain(self.kids.first())
            .chain(self.rails.iter().skip(6));
        let mut videos = self.youtube.iter();
        loop {
            let n = out.len();
            out.extend(videos.next());
            out.extend(rest.by_ref().take(3));
            if n == out.len() {
                break;
            }
        }
        out
    }
}
#[wasm_bindgen]
pub fn replay_filters(filter: &str, lang: &str) -> String {
    html!{@for f in ["all","arte","francetv","youtube","kids"]{button.chip.active[f==filter] data-f data-cmd=(f){
       (match f{"all"=>lookup(lang,"replay.all"),"kids"=>lookup(lang,"replay.kids"),_=>provider(f)})
    }}}.into_string()
}
#[wasm_bindgen]
pub fn replay_shelves(
    raw: &str,
    continuing: &str,
    filter: &str,
    lang: &str,
    now: f64,
    status: &str,
) -> Result<String, String> {
    let cat: Option<Catalog> =
        serde_json::from_str(raw).map_err(|_| "Catalogue replay invalide")?;
    let cont: Vec<Watch> = serde_json::from_str(continuing).map_err(|_| "Historique invalide")?;
    let t = |k| lookup(lang, k);
    Ok(html!{
        @if !cont.is_empty(){(rail("continue",t("home.continue"),None,html!{@for w in &cont{(w.card(true,false).outer("land"))}}))}
        @if status=="loading"{div.spinner.big style="margin:80px auto"{}}
        @if status=="error"{div.empty{p{(t("replay.error"))}button.btn data-f data-cmd="retry"{(icon("restart",""))" "(t("replay.retry"))}}}
        @if let Some(c)=cat{
            @for p in &c.failed{@if filter=="all"||filter==p||(filter=="kids"&&p=="francetv"){p.container.muted.small{(t("replay.providerDown").replace("{name}",provider(p)))}}}
            @for r in c.ordered(filter){section.rail data-rail=(&r.id){div.rail-head{h2.section-title{
               span class=(format!("rp-prov {}",if r.kids{"okoo"}else{&r.provider})){(if r.kids{"Okoo"}else{provider(&r.provider)})}(&r.title)}}
               div.rail-track data-row{@for it in &r.items{(it.card(lang,now).outer("land"))}}
            }}
            p.container.dim.small style="margin:28px 0 40px"{(t("replay.footer"))}
        }
    }.into_string())
}
#[wasm_bindgen]
pub fn replay_banner(raw: &str, lang: &str, index: usize, count: usize) -> Result<String, String> {
    let it: Item = serde_json::from_str(raw).map_err(|_| "Bannière replay invalide")?;
    Ok(html!{div.bg{(it.picture(false))}div.content{(it.tag())h1{(&it.title)}div.facts{(it.facts())}
        @if let Some(d)=text(&it.desc){p.clamp3{(d)}}
        div.btn-row data-row{button.btn.primary data-f data-autofocus data-cmd="play"{(icon("play",""))" "(lookup(lang,"home.play"))}
            button.btn data-f data-cmd="info"{(icon("info",""))" "(lookup(lang,"home.info"))}}
    }(dots(index,count))}.into_string())
}
#[derive(Default, Deserialize)]
#[serde(default, rename_all = "camelCase")]
struct Page {
    item: Option<Item>,
    seasons: Vec<Shelf>,
    is_show: bool,
    has_show: bool,
    failed: bool,
    season: usize,
    expires: String,
    progress: Option<Watch>,
}
#[wasm_bindgen]
pub fn replay_page(raw: &str, lang: &str, now: f64) -> Result<String, String> {
    let page: Page = serde_json::from_str(raw).map_err(|_| "Fiche replay invalide")?;
    let it = page.item.as_ref();
    let t = |k| lookup(lang, k);
    let current = page
        .seasons
        .get(page.season)
        .or_else(|| page.seasons.last());
    let resume = page
        .progress
        .as_ref()
        .filter(|p| !p.completed && p.position_sec > 30.)
        .map_or(0., |p| p.position_sec);
    Ok(html!{button.icon-btn.back-btn data-f data-cmd="back" aria-label=(t("common.back")){(icon("back",""))}
        section.detail-hero style="min-height:min(62vh,44vw)"{div.bg{(it.map(|i|i.picture(true)).unwrap_or_else(||Image{eager:true,..Default::default()}.markup()))}
            div.content{
                @if let Some(i)=it{(i.tag())}
                h1 style="font-size:clamp(1.6rem,3vw,2.6rem);margin:6px 0"{(it.map_or("",|i|i.title.as_str()))}
                @if let Some(i)=it{div.facts{(i.facts())@if let Some(age)=i.age.filter(|a|*a>0){span.age-pill{(age)"+"}}
                    @if !page.expires.is_empty(){span{(t("replay.until").replace("{date}",&page.expires))}}}
                    @if let Some(desc)=text(&i.desc){p.clamp3.muted{(desc)}}}
                @if page.failed{p.muted{(t("replay.unavailable"))}}
                @if it.is_some()&&!page.is_show{div.btn-row data-row style="margin-top:18px"{
                    button.btn.primary data-f data-autofocus data-cmd=(format!("play:{resume}")){(icon("play",""))" "(t(if resume>0.{"detail.resume"}else{"detail.play"}))}
                    @if resume>0.{button.btn data-f data-cmd="play:0"{(icon("restart",""))" "(t("detail.restart"))}}
                }}
                @if page.is_show&&let Some(ep)=current.and_then(|s|s.items.first()){div.btn-row data-row style="margin-top:18px"{
                    button.btn.primary data-f data-autofocus data-cmd=(format!("episode:{}",ep.id)){(icon("play",""))" "(t("detail.play"))}}}
            }
        }
        @if page.is_show&&!page.has_show&&!page.failed{div.spinner.big style="margin:40px auto"{}}
        @if page.seasons.len()>1{div.chips data-tabs data-row{@for(i,s) in page.seasons.iter().enumerate(){
            button.chip.active[i==page.season] data-f data-cmd=(format!("season:{i}")){(&s.title)}
        }}}
        @if let Some(s)=current{section.rail data-rail="episodes"{
            @if page.seasons.len()<=1{div.rail-head{h2.section-title{(if s.title.is_empty(){t("detail.episodes")}else{&s.title})}}}
            div.rail-track data-row{@for ep in &s.items{
                @let same=text(&ep.subtitle).is_some()&&it.is_some_and(|i|ep.title==i.title);
                (Card{title:if same{ep.subtitle.clone().unwrap_or_default()}else{ep.title.clone()},sub:if same{None}else{ep.subtitle.clone()},cmd:format!("episode:{}",ep.id),..ep.card(lang,now)}.outer("land"))
            }}
        }}
        @if page.is_show&&page.has_show&&page.seasons.is_empty(){p.container.muted{(t("replay.noEpisodes"))}}
    }.into_string())
}
