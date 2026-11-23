//! Playback decisions shared by the browser engine and Android's hardware player.
use crate::language::to_lang;
use serde::Deserialize;
use wasm_bindgen::prelude::*;
#[derive(Deserialize)]
pub(crate) struct Track {
    pub id: String,
    pub label: String,
    pub selected: bool,
    pub language: Option<String>,
    pub height: Option<i32>,
}
impl Track {
    fn lang(&self) -> Option<String> {
        to_lang(
            self.language
                .as_deref()
                .filter(|s| !s.is_empty())
                .unwrap_or(&self.label),
        )
    }
}
#[derive(Deserialize)]
pub(crate) struct Tracks {
    pub audio: Vec<Track>,
    pub text: Vec<Track>,
    pub video: Vec<Track>,
}
#[wasm_bindgen]
pub fn preferred_tracks(
    raw: &str,
    audio: Vec<String>,
    subs: Vec<String>,
    mode: &str,
) -> Result<String, String> {
    let t: Tracks = serde_json::from_str(raw).map_err(|_| "Pistes invalides")?;
    let preferred = |list: &[Track], langs: &[String]| {
        langs.iter().find_map(|lang| {
            list.iter()
                .find(|t| t.lang().as_ref() == Some(lang))
                .map(|t| t.id.clone())
        })
    };
    let current = t.audio.iter().find(|t| t.selected).and_then(Track::lang);
    let select_audio = if t.audio.len() > 1 && !current.as_ref().is_some_and(|l| audio.contains(l))
    {
        preferred(&t.audio, &audio)
    } else {
        None
    };
    let actual = select_audio
        .as_ref()
        .and_then(|id| t.audio.iter().find(|t| t.id == *id))
        .and_then(Track::lang)
        .or(current);
    let foreign = actual.is_some_and(|l| !audio.contains(&l));
    let select_text = if (mode == "always" || (mode == "auto" && foreign))
        && !t.text.iter().any(|t| t.selected)
    {
        preferred(&t.text, &subs)
    } else {
        None
    };
    let languages = |tracks: &[Track]| {
        let mut langs = vec![];
        for t in tracks {
            if let Some(l) = t.lang()
                && !langs.contains(&l)
            {
                langs.push(l)
            }
        }
        langs
    };
    Ok(serde_json::to_string(&(
        select_audio,
        select_text,
        languages(&t.audio),
        languages(&t.text),
    ))
    .unwrap())
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct State {
    position: f64,
    duration: Option<f64>,
    buffered: f64,
    seekable_start: f64,
    seekable_end: f64,
}
#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct Seek {
    mode: String,
    state: State,
    shift_start: f64,
    now: f64,
    lag: f64,
    catchup: bool,
    fallback: Option<f64>,
    start: Option<f64>,
    end: Option<f64>,
}
impl Seek {
    fn command(&self, ratio: bool, value: f64) -> (&'static str, f64) {
        let s = &self.state;
        let edge = s.seekable_end - self.lag;
        let dvr = self.mode == "live" && s.seekable_end - s.seekable_start > 60.;
        if self.mode == "vod" {
            if !ratio {
                return ("seek", s.position + value);
            }
            let dur = s
                .duration
                .filter(|n| *n > 0.)
                .or(self.fallback)
                .unwrap_or_default();
            return if dur > 0. {
                ("seek", value * dur)
            } else {
                ("none", 0.)
            };
        }
        if ratio {
            let (Some(start), Some(end)) = (self.start, self.end) else {
                return ("none", 0.);
            };
            let target = start + value * (end - start);
            let back = (self.now - target) / 1000.;
            if dvr && (back <= s.seekable_end - s.seekable_start || !self.catchup) {
                return ("seek", (edge - back).max(s.seekable_start).min(edge));
            }
            let sec = (target - self.shift_start) / 1000.;
            if self.mode == "shift"
                && sec >= 0.
                && sec <= s.duration.unwrap_or(f64::INFINITY).max(s.buffered)
            {
                return ("seek", sec);
            }
            return if self.catchup {
                ("shift", target)
            } else {
                ("none", 0.)
            };
        }
        let pos = s.position + value;
        if self.mode == "shift" {
            let target = self.shift_start + pos * 1000.;
            return if target > self.now - 20000. {
                ("live", 0.)
            } else if pos >= 0. {
                ("seek", pos)
            } else {
                ("shift", target)
            };
        }
        if dvr {
            return if pos < s.seekable_start && self.catchup {
                ("shift", self.now - (edge - pos) * 1000.)
            } else {
                ("seek", pos.max(s.seekable_start).min(edge))
            };
        }
        if value < 0. && self.catchup {
            return ("shift", self.now + value * 1000.);
        }
        if s.seekable_end > s.seekable_start {
            return ("seek", pos.clamp(s.seekable_start, s.seekable_end));
        }
        ("none", 0.)
    }
}
#[wasm_bindgen]
pub fn seek_command(raw: &str, ratio: bool, value: f64) -> Result<String, String> {
    let req: Seek = serde_json::from_str(raw).map_err(|_| "Position invalide")?;
    Ok(serde_json::to_string(&req.command(ratio, value)).unwrap())
}
#[wasm_bindgen]
pub fn player_watchdog(status: &str, error: &str, position: f64, tries: u32) -> String {
    match status {
        "error"
            if tries < 3
                && re!(r"(?i)\b(407|509|429)\b|PROXY_AUTH|too many|max.?conn").is_match(error) =>
        {
            "retry"
        }
        "error" => "next",
        "loading" if position == 0. => "first",
        "loading" | "buffering" => "stall",
        _ => "clear",
    }
    .into()
}
#[wasm_bindgen]
pub fn remote_command(
    key: &str,
    panel: bool,
    visible: bool,
    vod: bool,
    channel: bool,
    input: bool,
) -> String {
    match key {
        "MediaPlayPause" => "toggle",
        " " if !panel => "toggle",
        "MediaPlay" => "play",
        "MediaPause" => "pause",
        "MediaFastForward" | "MediaTrackNext" => "forward",
        "MediaRewind" | "MediaTrackPrevious" => "rewind",
        "ChannelUp" | "PageUp" => "up",
        "ChannelDown" | "PageDown" => "down",
        s if channel && !input && !panel && s.len() == 1 && s.as_bytes()[0].is_ascii_digit() => {
            "digit"
        }
        _ if panel => "pass",
        _ if visible => "wake-pass",
        "ArrowUp" => "wake",
        "ArrowDown" if !vod => "down",
        "ArrowLeft" => "left",
        "ArrowRight" => "right",
        "Enter" => "wake",
        _ => "pass",
    }
    .into()
}
