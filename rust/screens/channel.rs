use super::*;
use crate::artwork::Image;
#[derive(Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
struct Channel {
    name: String,
    logo: Option<String>,
    logo_alt: Option<String>,
    catchup_days: f64,
    catchup_mode: Option<String>,
}
impl Channel {
    fn catchup(&self) -> bool {
        self.catchup_days > 0. && self.catchup_mode.as_ref().is_some_and(|s| !s.is_empty())
    }
}
#[derive(Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
struct Program {
    start: f64,
    stop: f64,
    title: String,
    category: Option<String>,
    icon: Option<String>,
    desc: Option<String>,
    sub_title: Option<String>,
    day: String,
    from: String,
    to: String,
}
impl Program {
    fn now(&self, now: f64) -> bool {
        self.start <= now && self.stop > now
    }
}
fn action(cmd: &str, label: &str, glyph: &str, primary: bool, focus: bool) -> Markup {
    html! {button.btn.primary[primary] data-f data-autofocus[focus] data-cmd=(cmd){(icon(glyph,""))" "(label)}}
}
#[wasm_bindgen]
pub fn program_html(channel: &str, program: &str, lang: &str, now: f64) -> Result<String, String> {
    let ch: Channel = serde_json::from_str(channel).map_err(|_| "Chaîne invalide")?;
    let p: Program = serde_json::from_str(program).map_err(|_| "Programme invalide")?;
    let live = p.now(now);
    let replay =
        ch.catchup() && (live || p.stop <= now) && p.start > now - ch.catchup_days * 86400000.;
    Ok(html!{
        @if p.icon.as_ref().is_some_and(|i|!i.is_empty()){div style="border-radius:10px;overflow:hidden;aspect-ratio:16/9;position:relative;margin-bottom:12px;background:var(--surface)"{
            (Image{srcs:vec![p.icon],label:p.title,..Default::default()}.markup())}}
        div.muted.small style="margin-bottom:8px"{(ch.name)" · "(p.day)" · "(p.from)" – "(p.to)@if let Some(cat)=p.category.filter(|s|!s.is_empty()){" · "(cat)}}
        @if let Some(sub)=p.sub_title.filter(|s|!s.is_empty()){div style="font-weight:600;margin-bottom:6px"{(sub)}}
        p style="line-height:1.5"{(p.desc.as_deref().filter(|s|!s.is_empty()).unwrap_or(lookup(lang,"tv.noProgram")))}
        div.btn-row style="margin-top:14px"{
            @if live{(action("play",lookup(lang,"tv.live"),"play",true,true))}
            @if replay{(action("restart",lookup(lang,if live{"tv.startOver"}else{"tv.replay"}),"restart",false,!live))}
            button.btn.ghost data-f data-cmd="close"{(lookup(lang,"common.close"))}
        }
    }.into_string())
}
#[wasm_bindgen]
pub fn channel_html(channel: &str, programs: &str, lang: &str, now: f64) -> Result<String, String> {
    let ch: Channel = serde_json::from_str(channel).map_err(|_| "Chaîne invalide")?;
    let all: Vec<Program> = serde_json::from_str(programs).map_err(|_| "Programmes invalides")?;
    let cur = all.iter().enumerate().find(|(_, p)| p.now(now));
    let upcoming: Vec<_> = all
        .iter()
        .enumerate()
        .filter(|(_, p)| p.start > now)
        .take(12)
        .collect();
    let mut days: Vec<(&str, Vec<(usize, &Program)>)> = Vec::new();
    if ch.catchup() {
        for (i, p) in all.iter().enumerate().rev().filter(|(_, p)| p.stop <= now) {
            if let Some((_, items)) = days.iter_mut().find(|(d, _)| *d == p.day) {
                items.push((i, p))
            } else if days.len() < 7 {
                days.push((&p.day, vec![(i, p)]))
            }
        }
    }
    let logos = vec![ch.logo_alt.clone(), ch.logo.clone()];
    let t = |k| lookup(lang, k);
    Ok(html!{
        button.icon-btn.back-btn data-f data-cmd="back" aria-label=(t("common.back")){(icon("back",""))}
        section.detail-hero style="min-height:min(56vh,40vw)"{
            div.bg{(Image{srcs:vec![cur.and_then(|(_,p)|p.icon.clone())],label:ch.name.clone(),..Default::default()}.markup())}
            div.content{div style="height:70px;margin-bottom:16px;max-width:220px;position:relative"{
                (Image{srcs:logos.clone(),contain:true,eager:true,label:ch.name.clone(),alt:ch.name.clone(),..Default::default()}.markup())}
                div.muted.small{(t("channels.liveNow"))}
                h1 style="font-size:clamp(1.6rem,3vw,2.6rem);margin:6px 0"{(cur.map(|(_,p)|p.title.as_str()).filter(|s|!s.is_empty()).unwrap_or(&ch.name))}
                @if let Some((_,p))=cur{div.facts{span{(&p.from)" – "(&p.to)}@if let Some(cat)=&p.category{span{(cat)}}
                    span{(t("tv.remaining").replace("{n}",&((p.stop-now)/60000.).round().max(1.).to_string()))}}
                    @if let Some(desc)=&p.desc{p.clamp3.muted{(desc)}}
                }
                div.btn-row data-row style="margin-top:18px"{
                    (action(&format!("watch:{}",cur.map_or(String::new(),|(i,_)|i.to_string())),t("channels.watch"),"play",true,true))
                    @if ch.catchup()&&let Some((i,_))=cur{(action(&format!("restart:{i}"),t("tv.startOver"),"restart",false,false))}
                    (action("guide",t("tv.guide"),"calendar",false,false))
                }
            }
        }
        @if !upcoming.is_empty(){(rail("upcoming",t("channels.upNext"),None,html!{@for (i,p) in upcoming{
            (Card{title:p.title.clone(),cmd:format!("sheet:{i}"),sub:Some(format!("{} · {}",p.from,p.category.as_deref().unwrap_or(""))),badge:Some(p.from.clone()),
                image:p.icon.clone(),center_logo:Some(logos.clone()),..Default::default()}.outer("land"))
        }}))}
        @if ch.catchup(){@for (day,items) in days{(rail(day,&format!("{} · {day}",t("tv.replay")),None,html!{@for (i,p) in items{
            (Card{title:p.title.clone(),cmd:format!("restart:{i}"),long_press:true,sub:Some(format!("{} – {}",p.from,p.to)),image:p.icon.clone(),center_logo:Some(logos.clone()),..Default::default()}.outer("land"))
        }}))}}@else{p.container.muted style="margin-top:30px"{(t("channels.noReplay"))}}
    }.into_string())
}
