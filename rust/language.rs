use crate::text::norm;
use serde::Serialize;
use wasm_bindgen::prelude::*;
fn aliases(s: &str) -> Option<&'static str> {
    match s {
        "fre" | "fra" | "french" | "francais" => Some("fr"),
        "eng" | "english" | "anglais" => Some("en"),
        "spa" | "spanish" | "espanol" | "castellano" => Some("es"),
        "ger" | "deu" | "german" | "deutsch" | "allemand" => Some("de"),
        "ita" | "italian" | "italiano" => Some("it"),
        "por" | "portuguese" | "portugues" => Some("pt"),
        "dut" | "nld" | "dutch" | "nederlands" => Some("nl"),
        "ara" | "arabic" | "arabe" => Some("ar"),
        "tur" | "turkish" | "turk" => Some("tr"),
        "pol" | "polish" => Some("pl"),
        "rus" | "russian" => Some("ru"),
        "jpn" | "japanese" => Some("ja"),
        "kor" | "korean" => Some("ko"),
        "chi" | "zho" | "chinese" => Some("zh"),
        "hin" | "hindi" => Some("hi"),
        _ => None,
    }
}
fn country_lang(s: &str) -> Option<&'static str> {
    match s {
        "fr" | "fra" | "be" | "ch" | "qc" | "lu" => Some("fr"),
        "uk" | "gb" | "us" | "usa" | "en" | "au" | "ie" | "nz" => Some("en"),
        "de" | "ger" | "at" => Some("de"),
        "es" | "esp" | "mx" | "lat" | "latino" => Some("es"),
        "ar" | "arb" | "ma" | "dz" | "tn" | "eg" | "sa" | "ae" => Some("ar"),
        "it" | "ita" => Some("it"),
        "pt" | "br" => Some("pt"),
        "nl" => Some("nl"),
        "tr" => Some("tr"),
        "pl" => Some("pl"),
        "ru" => Some("ru"),
        "in" => Some("hi"),
        "jp" => Some("ja"),
        "kr" => Some("ko"),
        "cn" => Some("zh"),
        _ => None,
    }
}
fn prefix_country(s: &str) -> Option<&'static str> {
    match s {
        "FR" | "FRA" => Some("FR"),
        "BE" => Some("BE"),
        "CH" => Some("CH"),
        "CA" | "QC" => Some("CA"),
        "LU" => Some("LU"),
        "UK" | "GB" => Some("GB"),
        "US" | "USA" => Some("US"),
        "DE" => Some("DE"),
        "ES" => Some("ES"),
        "IT" => Some("IT"),
        "PT" => Some("PT"),
        "NL" => Some("NL"),
        "TR" => Some("TR"),
        "PL" => Some("PL"),
        "MA" => Some("MA"),
        "DZ" => Some("DZ"),
        "TN" => Some("TN"),
        _ => None,
    }
}
fn countries(s: &str) -> Option<&'static str> {
    match s {
        "FR" | "BE" | "CH" | "CA" | "LU" => Some("fr"),
        "MA" | "DZ" | "TN" => Some("ar"),
        "GB" | "US" => Some("en"),
        "DE" => Some("de"),
        "ES" => Some("es"),
        "IT" => Some("it"),
        "PT" => Some("pt"),
        "NL" => Some("nl"),
        "TR" => Some("tr"),
        "PL" => Some("pl"),
        _ => None,
    }
}
fn word_lang(s: &str) -> Option<&'static str> {
    if re!(r"\b(france|french|francais|francaise|vff|vfq|truefrench|vf)\b").is_match(s) {
        return Some("fr");
    }
    if re!(r"\b(english|anglais|united kingdom|usa|american)\b").is_match(s) {
        return Some("en");
    }
    if re!(r"\b(espana|spain|spanish|espanol|latino|castellano)\b").is_match(s) {
        return Some("es");
    }
    if re!(r"\b(germany|deutschland|german|deutsch|allemand)\b").is_match(s) {
        return Some("de");
    }
    if re!(r"\b(italia|italy|italian|italiano)\b").is_match(s) {
        return Some("it");
    }
    if re!(r"\b(portugal|portuguese|brasil|brazil)\b").is_match(s) {
        return Some("pt");
    }
    if re!(r"\b(arabic|arabe|arab|maghreb|morocco|maroc|algerie|tunisie)\b").is_match(s) {
        return Some("ar");
    }
    if re!(r"\b(turkey|turkiye|turkish|turk)\b").is_match(s) {
        return Some("tr");
    }
    if re!(r"\b(nederland|netherlands|dutch)\b").is_match(s) {
        return Some("nl");
    }
    if re!(r"\b(poland|polska|polish)\b").is_match(s) {
        return Some("pl");
    }
    None
}
fn word_country(s: &str) -> Option<&'static str> {
    if re!(r"\b(france|francaise?s?|tnt)\b").is_match(s) {
        return Some("FR");
    }
    if re!(r"\b(belgique|belgium)\b").is_match(s) {
        return Some("BE");
    }
    if re!(r"\b(suisse|switzerland)\b").is_match(s) {
        return Some("CH");
    }
    if re!(r"\b(quebec|canada)\b").is_match(s) {
        return Some("CA");
    }
    if re!(r"\b(united kingdom|uk|britain)\b").is_match(s) {
        return Some("GB");
    }
    if re!(r"\b(usa|united states)\b").is_match(s) {
        return Some("US");
    }
    if re!(r"\b(germany|deutschland|allemagne)\b").is_match(s) {
        return Some("DE");
    }
    if re!(r"\b(espana|spain|espagne)\b").is_match(s) {
        return Some("ES");
    }
    if re!(r"\b(italia|italy|italie)\b").is_match(s) {
        return Some("IT");
    }
    if re!(r"\b(portugal)\b").is_match(s) {
        return Some("PT");
    }
    if re!(r"\b(maroc|morocco)\b").is_match(s) {
        return Some("MA");
    }
    if re!(r"\b(algerie|algeria)\b").is_match(s) {
        return Some("DZ");
    }
    if re!(r"\b(tunisie|tunisia)\b").is_match(s) {
        return Some("TN");
    }
    None
}
#[wasm_bindgen]
pub fn to_lang(tag: &str) -> Option<String> {
    let n = norm(tag);
    let t = n.split_whitespace().next()?;
    match t {
        "fr" | "en" | "es" | "de" | "it" | "pt" | "nl" | "ar" | "tr" | "pl" | "ru" | "ja"
        | "ko" | "zh" | "hi" => Some(t.into()),
        _ => aliases(t).map(str::to_owned),
    }
}

#[derive(Default, Serialize)]
pub struct Languages {
    pub audio: Vec<String>,
    pub subs: Vec<String>,
    multi: bool,
}
fn add(list: &mut Vec<String>, s: &str) {
    if !list.iter().any(|x| x == s) {
        list.push(s.into())
    }
}
pub fn detect(texts: &[&str]) -> Languages {
    for text in texts {
        if text.is_empty() {
            continue;
        }
        let mut info = Languages::default();
        let up = text.to_ascii_uppercase();
        if re!(r"\bVOST(FR)?\b|\bSUBFR\b|\bST ?FR\b").is_match(&up) {
            add(&mut info.subs, "fr")
        } else if re!(r"\bVOSTEN\b|\bENG ?SUBS?\b").is_match(&up) {
            add(&mut info.subs, "en")
        }
        info.multi = re!(r"\bMULTI\b").is_match(&up);
        if info.multi || re!(r"\b(VFF|VFQ|VFI|VF2?|TRUEFRENCH|FRENCH)\b").is_match(&up) {
            add(&mut info.audio, "fr")
        }
        if info.subs.is_empty() {
            for re in [
                re!(r"^\s*[\[(|]?\s*([A-Z]{2,3}|LATINO)\s*[\])|:–-]"),
                re!(r"[\[(|–-]\s*(FR|EN|ES|DE|IT|PT|AR|NL|TR|PL)\s*[\])|]?\s*$"),
            ] {
                if let Some(lang) = re
                    .captures(text)
                    .and_then(|m| country_lang(&m[1].to_ascii_lowercase()))
                {
                    add(&mut info.audio, lang)
                }
            }
            if info.audio.is_empty()
                && let Some(lang) = word_lang(&norm(text))
            {
                add(&mut info.audio, lang)
            }
        }
        if !info.audio.is_empty() || !info.subs.is_empty() {
            return info;
        }
    }
    Languages::default()
}
#[wasm_bindgen]
pub fn detect_languages(raw: &str) -> String {
    serde_json::to_string(&detect(&raw.split('\0').collect::<Vec<_>>())).unwrap()
}
#[wasm_bindgen]
pub fn epg_lang(epg: &str) -> Option<String> {
    re!(r"\.([a-z]{2,3})(?:@[\w-]+)?$")
        .captures(&epg.to_ascii_lowercase())
        .and_then(|m| country_lang(&m[1]))
        .map(str::to_owned)
}
fn country_code(s: &str) -> String {
    if s.eq_ignore_ascii_case("uk") {
        "GB".into()
    } else {
        s.to_ascii_uppercase()
    }
}
#[wasm_bindgen]
pub fn epg_country(epg: &str) -> Option<String> {
    re!(r"(?i)\.([a-z]{2})(?:@[\w-]+)?$")
        .captures(epg)
        .map(|m| country_code(&m[1]))
}
#[wasm_bindgen]
pub fn channel_country(name: &str, cat: &str, epg: &str, attr: &str) -> Option<String> {
    let tag = attr.split([',', ';']).next()?.trim();
    if tag.len() == 2 && tag.bytes().all(|b| b.is_ascii_alphabetic()) {
        return Some(country_code(tag));
    }
    for text in [name, cat] {
        if let Some(c) = re!(r"^\s*[\[(|]?\s*([A-Z]{2,3})\s*[\])|:–-]")
            .captures(text)
            .and_then(|m| prefix_country(&m[1]))
        {
            return Some(c.into());
        }
    }
    epg_country(epg).or_else(|| word_country(&norm(cat)).map(str::to_owned))
}
pub fn channel_languages(
    name: &str,
    cat: &str,
    epg: &str,
    attr: &str,
    country: &str,
) -> Vec<String> {
    let mut audio: Vec<String> = Vec::new();
    for lang in attr.split([',', ';']).filter_map(to_lang) {
        add(&mut audio, &lang)
    }
    if audio.is_empty() {
        audio = detect(&[name, cat]).audio
    }
    if audio.is_empty() {
        audio.extend(epg_lang(epg).or_else(|| countries(country).map(str::to_owned)))
    }
    audio
}
#[wasm_bindgen]
pub fn channel_langs(name: &str, cat: &str, epg: &str, attr: &str, country: &str) -> String {
    serde_json::to_string(&channel_languages(name, cat, epg, attr, country)).unwrap()
}

fn category_tag(tag: &str) -> Option<&'static str> {
    let code = tag.to_lowercase();
    match code.as_str() {
        "al" | "alb" => Some("sq"),
        "bg" => Some("bg"),
        "hu" => Some("hu"),
        "ro" => Some("ro"),
        "dk" | "da" => Some("da"),
        "no" => Some("no"),
        "fi" => Some("fi"),
        "is" => Some("is"),
        "se" | "sw" => Some("sv"),
        "gr" => Some("el"),
        "cz" => Some("cs"),
        "sk" => Some("sk"),
        "ua" => Some("uk"),
        "il" => Some("he"),
        "ir" => Some("fa"),
        "pk" => Some("ur"),
        "exyu" | "yu" | "rs" => Some("sr"),
        "hr" => Some("hr"),
        "ba" => Some("bs"),
        "mk" => Some("mk"),
        "si" => Some("sl"),
        "lt" => Some("lt"),
        "lv" => Some("lv"),
        "ee" => Some("et"),
        "th" => Some("th"),
        "vn" => Some("vi"),
        "ph" => Some("tl"),
        "id" => Some("id"),
        "my" => Some("ms"),
        "ku" | "kurd" => Some("ku"),
        "am" => Some("hy"),
        "ge" => Some("ka"),
        "az" => Some("az"),
        "rus" => Some("ru"),
        _ => country_lang(&code),
    }
}
#[wasm_bindgen]
pub fn category_languages(name: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut add = |s: &str| {
        if !out.iter().any(|v| v == s) {
            out.push(s.to_string())
        }
    };
    if re!(r"(?i)\bMULTI(SUB|LANG|AUDIO)?\b").is_match(name) {
        add("multi")
    }
    for m in re!(r"[\[(|]\s*([a-zA-Z]{2,5})\s*[\])|]").captures_iter(name) {
        if let Some(l) = category_tag(&m[1]) {
            add(l)
        }
    }
    if let Some(m) = re!(r"^\s*([A-Za-z]{2,5})\s*[:|\-–]\s").captures(name)
        && let Some(l) = category_tag(&m[1])
    {
        add(l)
    }
    for (min, max, lang) in [
        ('؀', 'ۿ', "ar"),
        ('Ѐ', 'ӿ', "ru"),
        ('Ͱ', 'Ͽ', "el"),
        ('֐', '׿', "he"),
        ('ऀ', 'ॿ', "hi"),
        ('฀', '๿', "th"),
        ('぀', 'ヿ', "ja"),
        ('가', '힯', "ko"),
        ('一', '鿿', "zh"),
    ] {
        if name.chars().any(|c| (min..=max).contains(&c)) {
            add(lang)
        }
    }
    if out.is_empty() {
        let n = crate::text::norm(name);
        if let Some(l)=word_lang(&n){out.push(l.into())}
        else if let Some(m)=re!(r"\b(albania|bulgaria|hungaria|hungary|romania|danmark|dansk|denmark|norway|norge|finland|suomi|iceland|sweden|sverige|greece|czech|slovak|ukraine|israel|iran|persian|pakistan|punjabi|india|hindi|bollywood|tamil|telugu|kurdish|armenia|georgia|russia|russian|somalia|afghan)\b").find(&n){out.push(format!("x-{}",m.as_str()))}
    }
    out
}
pub(crate) fn keep_category(name: &str, prefs: &[String]) -> bool {
    if prefs.is_empty() {
        return true;
    }
    let langs = category_languages(name);
    langs.is_empty() || langs.iter().any(|s| s == "multi" || prefs.contains(s))
}
