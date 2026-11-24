use maud::{Markup, PreEscaped, html};
use serde::Deserialize;
use wasm_bindgen::prelude::*;
include!(concat!(env!("OUT_DIR"), "/translations.rs"));
#[wasm_bindgen]
pub fn translation(lang: &str, key: &str) -> String {
    lookup(lang, key).into()
}
fn color(s: &str) -> &str {
    if s.starts_with('#')
        && (s.len() == 7 || s.len() == 4)
        && s[1..].bytes().all(|b| b.is_ascii_hexdigit())
    {
        s
    } else {
        "#4b5563"
    }
}
fn logo() -> Markup {
    html! {div.logo style="font-size:1.55rem" aria-label="Cyberstream" { (PreEscaped(include_str!("../public/icon.svg"))) span {span.w1{"Cyber"}span.w2{"stream"}}}}
}
pub(crate) fn icon(name: &str, class: &str) -> Markup {
    html! {svg class=(class) viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" {path d=(icon_path(name)) {}}}
}
const TABS: [(&str, &str); 5] = [
    ("home", "nav.home"),
    ("search", "nav.search"),
    ("tv", "nav.tv"),
    ("replay", "nav.replay"),
    ("myvideos", "nav.myvideos"),
];
#[wasm_bindgen]
pub fn navigation(
    kind: &str,
    tab: &str,
    lang: &str,
    emoji: &str,
    accent: &str,
    voice: bool,
) -> String {
    let t = |key| lookup(lang, key);
    let avatar = || html! {button data-f data-cmd="settings" class=(if kind=="mobile"{"mtop-btn avatar"}else if tab=="settings"{"avatar on"}else{"avatar"}) style=(format!("background:{}",color(accent))) aria-label=(t("nav.settings")) title=(t("nav.settings")) {(emoji)}};
    let mic = || html! {@if voice{button data-f data-cmd="voice" class=(if kind=="mobile"{"mtop-btn mtop-mic"}else{"icon-btn"}) title=(t("voice.button")) aria-label=(t("voice.button")) {(icon("mic",""))}}};
    let view = match kind {
        "bottom" => {
            html! {@for (id,key) in TABS{button data-cmd=(id) class=(if id==tab{"active"}else{""}) { (icon(id,"")) (t(if id=="tv"{"nav.tvShort"}else{key})) }}}
        }
        "mobile" => {
            html! {@if tab=="home"{span.mtop-brand {(logo())}}@else{h1{(t(TABS.iter().find(|(id,_)|*id==tab).map_or("nav.settings",|(_,k)|k)))}}
            (mic()) @if tab!="settings"{(avatar())}}
        }
        _ => {
            html! {button tabindex="-1" data-cmd="home" aria-label="home" style="border-radius:4px" {(logo())}
            nav data-row data-tabs {@for (id,key) in TABS {@if id!="search"{button.navlink.active[id==tab] data-f data-cmd=(id){(t(key))}}}}
            div.spacer {} (mic()) button.icon-btn data-f data-cmd="search" aria-label=(t("nav.search")) {(icon("search",""))} (avatar())}
        }
    };
    view.into_string()
}
#[wasm_bindgen]
pub fn settings_menu(lang: &str, name: &str, emoji: &str, accent: &str, install: bool) -> String {
    html!{h1.tab-h1{(lookup(lang,"settings.title"))}
        button.list-item data-cmd="profile-edit" data-f data-autofocus {span.avatar style=(format!("background:{}",color(accent))){(emoji)}
            span.grow {div style="font-weight:700"{(name)}div.small.muted{(lookup(lang,"settings.profile"))}} (icon("next","chev"))}
        div.list style="margin-top:8px" {@for sec in ["profiles","sources","tvinstall","services","appearance","player","parental","sync","categories","about"]{
            @if sec!="tvinstall" || install {button.list-item data-f data-cmd=(sec){span.grow{(lookup(lang,&format!("settings.{sec}")))}(icon("next","chev"))}}
        }}
    }.into_string()
}
#[derive(Deserialize)]
struct Profile {
    id: String,
    name: String,
    color: String,
    emoji: String,
    locked: bool,
}
#[wasm_bindgen]
pub fn profile_tiles(raw: &str, lang: &str, default_id: &str) -> Result<String, String> {
    let profiles: Vec<Profile> = serde_json::from_str(raw).map_err(|_| "Invalid profiles")?;
    Ok(html!{@for p in profiles {
        button.profile-tile data-f data-autofocus[p.id==default_id] data-cmd=(p.id) {
            span.avatar style=(format!("background:{}",color(&p.color))) {(p.emoji)}
            span.name {@if p.locked {(icon("lock","profile-lock"))} (p.name)}
        }
    }
    button.profile-tile data-f data-cmd="add" {span.avatar style="background:var(--surface-2)"{(icon("plus","profile-plus"))}span.name{(lookup(lang,"profiles.add"))}}
    }.into_string())
}
fn icon_path(name: &str) -> &'static str {
    match name {
        "home" => "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
        "search" => "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-4.6-4.6",
        "replay" => "M3.5 12a8.5 8.5 0 1 0 2.5-6M3 3v5h5M10 9v6l5-3z",
        "tv" => "M3 5h18v12H3zM8 21h8M12 17v4",
        "myvideos" => "M4 5h11v14H4zM18 5v14M21 7v10M8 9.5v5l4-2.5z",
        "mic" => "M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3",
        "back" => "M19 12H5m7-7-7 7 7 7",
        "play" => "m8 4 12 8-12 8z",
        "calendar" => "M3 5h18v16H3zM3 10h18M7 3v4M17 3v4",
        "check" => "M4 12l5 5L20 6",
        "audio" => "M3 9h4l5-4v14l-5-4H3zM16 9a4 4 0 0 1 0 6M18 6a8 8 0 0 1 0 12",
        "subtitles" => "M3 5h18v14H3zM6 11h3m2 0h6M6 15h7m2 0h3",
        "hd" => "M2 4h20v16H2zM6 8v8m0-4h4m0-4v8m4-8h2a4 4 0 0 1 0 8h-2z",
        "aspect" => "M3 5h18v14H3zM6 11V8h3m9 5v3h-3",
        "speed" => "M3 17a10 10 0 1 1 18 0M12 13l5-5",
        "settings" => "M5 6h14M5 12h14M5 18h14M8 3v6m8 0v6m-6 0v6",
        "star" => "m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z",
        "next" => "M9 6l6 6-6 6",
        "lock" => "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
        "plus" => "M12 5v14M5 12h14",
        "close" => "M6 6l12 12M18 6 6 18",
        "restart" => "M4 4v6h6M4.5 15a8 8 0 1 0 1.9-8.3L4 10",
        "info" => "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01",
        "cinema" => "M4 4h16v16H4zM8 4v16M16 4v16M4 8h4M4 12h4M4 16h4M16 8h4M16 12h4M16 16h4",
        "series" => "M4 8h16v12H4zM8 4l4 4 4-4M9 12.5v4l3.5-2z",
        "kids" => {
            "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8.5 14.5s1.2 2 3.5 2 3.5-2 3.5-2M9 9.5h.01M15 9.5h.01"
        }
        "docs" => {
            "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"
        }
        // Home universes (line icons, like the tab bar)
        "u-cinema" => "M4 10h16v10H4zM4 10l-.6-3.2 15.7-2.9.6 3.2M8.3 6.1l1.9 3.9M13.4 5.2l1.9 3.9",
        "u-series" => "M3 5h18v12H3zM8 21h8M12 17v4",
        "u-kids" => "M4 8h3.5a2.5 2.5 0 1 1 5 0H16v3.5a2.5 2.5 0 1 1 0 5V20h-3.5a2.5 2.5 0 1 0-5 0H4v-3.5a2.5 2.5 0 1 0 0-5z",
        "u-docs" => "M12 3 3 8l9 5 9-5zM3 12.5l9 5 9-5M3 17l9 5 9-5",
        "u-ent" => "M12 3c.6 4.6 3.4 7.4 8 8-4.6.6-7.4 3.4-8 8-.6-4.6-3.4-7.4-8-8 4.6-.6 7.4-3.4 8-8z",
        "u-sport" => "M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 17h6v4H9z",
        "u-news" => "M4 5h13v14H4zM17 9h3v8a2 2 0 0 1-2 2M7 9h7M7 12h7M7 15h4",
        "u-all" => "M3 11l9-8 9 8M5 9.5V21h14V9.5M10 21v-6h4v6",
        "u-shows" => "M4 4h16v4c0 5-3.6 9-8 9s-8-4-8-9zM9 9h.01M15 9h.01M9 12.5c1.6 1.4 4.4 1.4 6 0M12 17v4M8 21h8",
        "u-music" => "M9 18V6l11-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
        "ent" => "M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z",
        "sport" => "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5l4.3 3.1-1.6 5H9.3l-1.6-5zM12 3v4.5M3.4 9.3l4.3 1.3M20.6 9.3l-4.3 1.3M6.5 19l2.8-3.4M17.5 19l-2.8-3.4",
        "news" => "M4 5h13v14H4zM17 9h3v8a2 2 0 0 1-2 2M7 9h7M7 12h7M7 15h4",
        "music" => "M9 18V6l11-2v12M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
        "live" => {
            "M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM8.5 15.5a5 5 0 0 1 0-7M15.5 8.5a5 5 0 0 1 0 7M5.6 18.4a9 9 0 0 1 0-12.8M18.4 5.6a9 9 0 0 1 0 12.8"
        }
        _ => "",
    }
}
