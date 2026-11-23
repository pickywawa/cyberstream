use serde::Serialize;
use wasm_bindgen::prelude::*;

fn time(s: &str) -> Option<f64> {
    let m = re!(r"(?:(\d+):)?(\d{1,2}):(\d{2})[,.](\d{1,3})").captures(s)?;
    let hours = m
        .get(1)
        .and_then(|v| v.as_str().parse::<f64>().ok())
        .unwrap_or(0.);
    Some(
        hours * 3600.
            + m[2].parse::<f64>().ok()? * 60.
            + m[3].parse::<f64>().ok()?
            + m[4].parse::<f64>().ok()? / 10f64.powi(m[4].len() as i32),
    )
}

#[wasm_bindgen]
pub fn sanitize(raw: &str) -> String {
    let s = raw
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;");
    let s = re!(r"(?i)&lt;(/?)(i|b|u)&gt;").replace_all(&s, "<$1$2>");
    let s = re!(r"\{\\an?\d+\}").replace_all(&s, "");
    re!(r"(?i)&lt;/?font[^&]*&gt;")
        .replace_all(&s, "")
        .into_owned()
}
#[derive(Serialize)]
struct Cue {
    start: f64,
    end: f64,
    text: String,
}
#[wasm_bindgen]
pub fn parse_subtitles(raw: &str) -> String {
    let src = raw
        .trim_start_matches('\u{feff}')
        .replace("\r\n", "\n")
        .replace('\r', "\n");
    let mut cues: Vec<_> = re!(r"\n[ \t]*\n")
        .split(&src)
        .filter_map(|block| {
            let mut lines = block.lines();
            let (a, b) = lines.find_map(|l| l.split_once("-->"))?;
            let (start, end) = (time(a)?, time(b)?);
            let text = lines.collect::<Vec<_>>().join("\n");
            (start.is_finite() && end.is_finite() && end > start && !text.trim().is_empty()).then(
                || Cue {
                    start,
                    end,
                    text: sanitize(text.trim()),
                },
            )
        })
        .collect();
    cues.sort_by(|a, b| a.start.total_cmp(&b.start));
    serde_json::to_string(&cues).unwrap()
}
#[wasm_bindgen]
pub fn movie_hash(size: f64, head: &[u8], tail: &[u8]) -> String {
    let mut hash = size as u64;
    for chunk in head
        .as_chunks::<8>()
        .0
        .iter()
        .chain(tail.as_chunks::<8>().0)
    {
        hash = hash.wrapping_add(u64::from_le_bytes(*chunk));
    }
    format!("{hash:016x}")
}

/// Overlapping captions may outlive many shorter cues. Prefix maxima bound the reverse scan.
#[wasm_bindgen]
pub struct CueTrack {
    start: Vec<f64>,
    end: Vec<f64>,
    latest: Vec<f64>,
}
#[wasm_bindgen]
impl CueTrack {
    #[wasm_bindgen(constructor)]
    pub fn new(times: &[f64]) -> Self {
        let mut track = Self {
            start: Vec::new(),
            end: Vec::new(),
            latest: Vec::new(),
        };
        let mut max = f64::NEG_INFINITY;
        for &[start, end] in times.as_chunks::<2>().0 {
            max = max.max(end);
            track.start.push(start);
            track.end.push(end);
            track.latest.push(max);
        }
        track
    }
    pub fn active(&self, t: f64) -> Vec<u32> {
        let stop = self.start.partition_point(|start| *start <= t);
        let from = self.latest[..stop].partition_point(|end| *end <= t);
        (from..stop)
            .filter(|&i| self.end[i] > t)
            .map(|i| i as u32)
            .collect()
    }
    pub fn next_change(&self, t: f64, active: &[u32]) -> f64 {
        let next = self.start.partition_point(|start| *start <= t);
        let upcoming = self.start.get(next).copied().unwrap_or(f64::INFINITY);
        active
            .iter()
            .filter_map(|i| self.end.get(*i as usize))
            .copied()
            .fold(upcoming, f64::min)
    }
}
