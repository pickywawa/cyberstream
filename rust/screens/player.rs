use super::*;
use crate::player::Tracks;
use std::collections::HashSet;
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Subtitle {
    file_id: i64,
    lang: String,
    flag: String,
    release: Option<String>,
    hash_match: Option<bool>,
}
#[derive(Deserialize)]
struct External {
    enabled: bool,
    status: String,
    active: Option<i64>,
    results: Vec<Subtitle>,
    offset: f64,
}
#[derive(Deserialize)]
struct Settings {
    tracks: Tracks,
    labels: Vec<String>,
    index: usize,
    fit: String,
    rate: f64,
    vod: bool,
    ext: External,
}
fn option(cmd: &str, label: &str, checked: bool, focus: bool) -> Markup {
    html! {button data-f data-cmd=(cmd) data-autofocus[checked&&focus]{span{(label)}@if checked{span.chk{(icon("check",""))}}}}
}
fn section(lang: &str, key: &str, glyph: &str, options: Markup) -> Markup {
    html! {h3{(icon(glyph,"player-menu-icon"))" "(lookup(lang,key))}div.menu{(options)}}
}
#[wasm_bindgen]
pub fn playback_settings(raw: &str, lang: &str) -> Result<String, String> {
    let mut s: Settings = serde_json::from_str(raw).map_err(|_| "Réglages de lecture invalides")?;
    let t = |k| lookup(lang, k);
    let ext = &s.ext;
    let mut seen = HashSet::new();
    s.tracks
        .video
        .sort_by_key(|v| std::cmp::Reverse(v.height.unwrap_or(0)));
    Ok(html!{
        @if s.tracks.audio.len()>1{(section(lang,"player.audio","audio",html!{@for a in &s.tracks.audio{(option(&format!("audio:{}",a.id),&a.label,a.selected,true))}}))}
        (section(lang,"player.subtitles","subtitles",html!{
            (option("text-off",t("player.off"),ext.active.is_none()&&!s.tracks.text.iter().any(|t|t.selected),true))
            @for a in &s.tracks.text{(option(&format!("text:{}",a.id),&a.label,a.selected&&ext.active.is_none(),true))}
            @for r in ext.results.iter().take(8){
                @let label=format!("{} {} · {}{}",r.flag,r.lang.to_uppercase(),r.release.as_deref().filter(|s|!s.is_empty()).unwrap_or("OpenSubtitles"),
                         if r.hash_match==Some(true){format!(" · ✓ {}",t("os.exact"))}else{String::new()});
                (option(&format!("external:{}",r.file_id),&label,ext.active==Some(r.file_id),true))
            }
        }))
        @if ext.enabled{div.ext-subs-tools{
            @if matches!(ext.status.as_str(),"idle"|"error"){button.btn.small data-f data-cmd="search"{(t("os.search"))}}
            @match ext.status.as_str(){
                "searching"=>span.small{span.spinner style="display:inline-block;vertical-align:-4px;margin-right:8px"{}(t("os.searching"))},
                "none"=>span.small.dim{(t("os.none"))}, "quota"=>span.small.msg-ko{(t("os.quota"))},
                "error"=>span.small.msg-ko{(t("os.error"))},_=>{}
            }
            @if ext.active.is_some(){div.offset-row data-row{span.small{(t("os.offset"))}
                button.btn.small data-f data-cmd="earlier"{"− 0,5 s"}span.offset-val{(format!("{}{:.1} s",if ext.offset>0.{"+"}else{""},ext.offset).replace('.',","))}
                button.btn.small data-f data-cmd="later"{"+ 0,5 s"}}
                p.xs style="opacity:.6;margin:6px 4px 0"{(t("os.offsetHelp"))}}
        }}
        @if s.tracks.video.len()>1||s.labels.len()>1{(section(lang,"player.quality","hd",html!{
            @if s.tracks.video.len()>1{(option("video-auto",t("player.auto"),!s.tracks.video.iter().any(|v|v.selected),true))
                @for v in &s.tracks.video{@if seen.insert(&v.label){(option(&format!("video:{}",v.id),&v.label,v.selected,true))}}}
            @if s.labels.len()>1{@for (i,label) in s.labels.iter().enumerate(){(option(&format!("candidate:{i}"),label,s.tracks.video.len()<=1&&i==s.index,true))}}
        }))}
        (section(lang,"player.format","aspect",html!{@for fit in ["fit","fill","zoom"]{
            (option(&format!("fit:{fit}"),lookup(lang,&format!("player.{fit}")),s.fit==fit,false))
        }}))
        @if s.vod{(section(lang,"player.speed","speed",html!{@for r in [0.75,1.,1.25,1.5,2.]{
            (option(&format!("rate:{r}"),&format!("{r}×"),s.rate==r,false))
        }}))}
        div style="height:12px"{}span.xs style="opacity:.5"{(icon("settings","player-menu-footer"))}
    }.into_string())
}
