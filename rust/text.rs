use unicode_normalization::UnicodeNormalization;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn norm(raw: &str) -> String {
    let mut result = String::with_capacity(raw.len());
    let mut space = false;
    for c in raw.nfd().flat_map(char::to_lowercase) {
        if ('\u{300}'..='\u{36f}').contains(&c) {
            continue;
        }
        if c.is_ascii_alphanumeric() || c == '&' {
            if (space || c == '&') && !result.is_empty() {
                result.push(' ');
            }
            if c == '&' {
                result.push_str("and");
                space = true;
            } else {
                result.push(c);
                space = false;
            }
        } else {
            space = true;
        }
    }
    result
}

#[wasm_bindgen]
pub fn clean_name(raw: &str) -> String {
    let s =
        re!(r"(?i)^\s*(\|[a-z]{2,3}\||\[[a-z]{2,3}\]|[a-z]{2,3}\s*[:|–-]\s+|[a-z]{2,3}\s*\|\s*)")
            .replace(raw, "");
    let s = re!(r"(?i)^\s*(FR|EN|UK|US|DE|ES|IT|BE|CH|CA|AR|MULTI|VF|VOSTFR)\s*[:|–-]\s*")
        .replace(&s, "");
    let s = re!(r"(?i)\[(geo-?blocked|not 24/7|offline)\]|\(\d{3,4}[pi]\)").replace_all(&s, "");
    let s = re!(r"(?i)\b(UHD|4K|2160P?|FHD|1080P?|FULL ?HD|HD|720P?|SD|576P?|480P?|HEVC|H265|H\.265|MULTI|VFF|VFQ|VF|VOSTFR|VOST|TRUEFRENCH|FRENCH|HDR10?\+?|HDR|DV|DOLBY VISION|BACKUP|RAW|\+1)\b").replace_all(&s, "");
    let s = re!(r"[\[(]\s*[)\]]").replace_all(&s, "");
    let s = s
        .trim_end_matches(|c: char| c.is_whitespace() || "|•·/\\-–".contains(c))
        .trim_start_matches(|c: char| c.is_whitespace() || "|•·:/\\-–".contains(c));
    if s.is_empty() {
        raw.trim().into()
    } else {
        s.split_whitespace().collect::<Vec<_>>().join(" ")
    }
}

pub fn title_year(raw: &str) -> (String, Option<u16>) {
    let s = clean_name(raw);
    let year =
        re!(r"[\[(]\s*((?:19|20)\d{2})\s*[)\]]|\s(?:-\s*)?((?:19|20)\d{2})\s*$").captures(&s);
    if let Some(c) = year {
        let token = c.get(0).unwrap();
        let year = c.get(1).or(c.get(2)).and_then(|m| m.as_str().parse().ok());
        let name = format!("{} {}", &s[..token.start()], &s[token.end()..]);
        let name = name
            .trim_end_matches(|c: char| c.is_whitespace() || "-–:".contains(c))
            .split_whitespace()
            .collect::<Vec<_>>()
            .join(" ");
        (
            if name.is_empty() {
                raw.trim().into()
            } else {
                name
            },
            year,
        )
    } else {
        (s, None)
    }
}

#[wasm_bindgen]
pub fn parse_title(raw: &str) -> String {
    let (title, year) = title_year(raw);
    serde_json::json!({"title":title,"year":year}).to_string()
}

#[wasm_bindgen]
pub fn quality(raw: &str) -> Option<String> {
    let u = raw.to_ascii_uppercase();
    for (name, re) in [
        ("HEVC", re!(r"\b(HEVC|H265|H\.265)\b")),
        ("4K", re!(r"\b(UHD|4K|2160P?)\b")),
        ("FHD", re!(r"\b(FHD|1080P?|FULL ?HD)\b")),
        ("HD", re!(r"\b(HD|720P?)\b")),
        ("SD", re!(r"\b(SD|576P?|480P?)\b")),
    ] {
        if re.is_match(&u) {
            return Some(name.into());
        }
    }
    None
}

#[wasm_bindgen]
pub fn episode(raw: &str) -> Option<String> {
    let m = re!(r"(?i)^(.*?)[\s._–|-]*S(\d{1,2})\s*[._-]?\s*E(\d{1,4})\b")
        .captures(raw)
        .or_else(|| re!(r"(?i)^(.*?)[\s._–|-]*(\d{1,2})x(\d{1,3})\b").captures(raw))?;
    Some(serde_json::json!({"show":clean_name(&m[1]).trim_end_matches(|c:char| c.is_whitespace() || "-–:".contains(c)),
        "season":m[2].parse::<u16>().ok()?, "episode":m[3].parse::<u16>().ok()?}).to_string())
}

#[wasm_bindgen]
pub fn episode_title(raw: &str) -> String {
    let title = re!(r"(?i)^.*?\bS\d{1,2}\s*[._-]?\s*E\d{1,4}\b\s*[-–:|·.]*\s*(.*)$").captures(raw);
    title
        .as_ref()
        .map(|c| c[1].trim())
        .filter(|t| !t.is_empty())
        .unwrap_or(raw.trim())
        .into()
}

#[wasm_bindgen]
pub fn generic_episode(raw: &str) -> bool {
    raw.trim().is_empty()
        || re!(r"(?i)^(É|E)pisode\s*\d+$").is_match(raw.trim())
        || re!(r"(?i)\bS\d{1,2}\s*[._-]?\s*E\d{1,4}\b[\s–:|·.\-]*$").is_match(raw)
}

#[wasm_bindgen]
pub fn universe(raw: &str) -> String {
    let n = norm(raw);
    for (name, re) in [
        (
            "adult",
            re!(r"\b(adult|adulte|xxx|18\+|\+18|porn|hot|erotic)\b"),
        ),
        (
            "sport",
            re!(
                r"\b(sport|sports|foot|football|golf|rugby|tennis|f1|formula|moto ?gp|nba|nfl|bein|eurosport|equi|equidia|dazn|arena|ufc|boxe|cyclisme|ligue 1|premier league)\b"
            ),
        ),
        (
            "kids",
            re!(
                r"\b(jeunesse|kids|kid|enfant|enfants|junior|cartoon|toon|toons|disney|gulli|nickelodeon|nick|boomerang|tiji|piwi|teletoon|animation|anime)\b"
            ),
        ),
        (
            "news",
            re!(
                r"\b(info|infos|news|actu|actualite|bfm|cnews|lci|franceinfo|euronews|cnn|bbc news|world news|24)\b"
            ),
        ),
        (
            "cinema",
            re!(
                r"\b(cine|cinema|film|films|movie|movies|cinemax|tcm|paramount channel|action|frisson|classic)\b"
            ),
        ),
        ("series", re!(r"\b(serie|series|polar|sitcom|drama)\b")),
        (
            "docs",
            re!(
                r"\b(decouverte|documentaire|documentaires|docu|doc|docs|nature|histoire|history|planete|voyage|national geographic|nat geo|discovery|science|ushuaia|animaux|animal)\b"
            ),
        ),
        (
            "music",
            re!(r"\b(music|musique|mtv|hits|jazz|radio|clip|clips|mezzo|trace)\b"),
        ),
        (
            "ent",
            re!(
                r"\b(divertissement|entertainment|variete|varietes|jeux|humour|comedy|telerealite)\b"
            ),
        ),
        (
            "general",
            re!(r"\b(generaliste|generalistes|tnt|nationale|nationales|general)\b"),
        ),
    ] {
        if re.is_match(&n) {
            return name.into();
        }
    }
    "other".into()
}
