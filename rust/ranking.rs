use crate::text::{clean_name, norm};
use wasm_bindgen::prelude::*;
#[wasm_bindgen]
pub fn channel_rank(name: &str, epg: &str, country: &str, key: &str) -> Option<u16> {
    let ranks = match country {
        "FR" => &[
            "tf1",
            "france2",
            "m6",
            "france3",
            "france5",
            "canal",
            "arte",
            "tmc",
            "bfmtv",
            "w9",
            "tfx",
            "cnews",
            "lci",
            "franceinfo",
            "6ter",
            "rmcstory",
            "rmcdecouverte",
            "tf1seriesfilms",
            "cherie25",
            "gulli",
            "lequipe",
            "lcp",
            "t18",
            "novo19",
            "canalsport",
            "canalfoot",
            "canalcinema",
            "canalcinemas",
            "canalseries",
            "beinsports1",
            "beinsports",
            "rmcsport1",
            "eurosport1",
            "dazn1",
            "ligue1",
            "ligue1",
            "parispremiere",
            "teva",
            "tv5monde",
            "france4",
            "franceo",
            "m6music",
            "bfmbusiness",
            "euronews",
            "planete",
            "ushuaiatv",
            "nationalgeographic",
            "discovery",
            "histoiretv",
            "disneychannel",
            "canalj",
            "tiji",
            "cartoonnetwork",
            "nickelodeon",
            "boomerang",
            "mangas",
            "ab1",
            "rtl9",
            "serieclub",
            "tcmcinema",
            "paramountnetwork",
            "ocs",
            "cineplus",
        ][..],
        "BE" => &[
            "latrois", "laune", "rtltvi", "tipik", "clubrtl", "plugrtl", "abxplore", "tf1",
            "france2", "ldc", "vtm", "een", "canvas",
        ][..],
        "CH" => &[
            "rts1", "rtsun", "rts2", "rtsdeux", "tf1", "france2", "m6", "srf1", "srfzwei", "rsila1",
        ][..],
        "CA" => &[
            "tva",
            "icitele",
            "noovo",
            "telequebec",
            "rds",
            "lcn",
            "rdi",
            "cbc",
            "ctv",
            "global",
            "tsn",
            "sportsnet",
        ][..],
        "GB" => &[
            "bbcone",
            "bbc1",
            "itv1",
            "itv",
            "channel4",
            "bbctwo",
            "bbc2",
            "channel5",
            "skynews",
            "bbcnews",
            "skysportsmainevent",
            "skysportspremierleague",
            "tntsports1",
            "itv2",
            "e4",
            "more4",
            "film4",
            "dave",
            "skyone",
            "skyshowcase",
            "skyatlantic",
            "skycinemapremiere",
        ][..],
        "US" => &[
            "cbs",
            "nbc",
            "abc",
            "fox",
            "foxnews",
            "espn",
            "cnn",
            "msnbc",
            "hgtv",
            "tnt",
            "tbs",
            "usanetwork",
            "amc",
            "fx",
            "discovery",
            "hbo",
            "pbs",
            "cw",
        ][..],
        "DE" => &[
            "zdf",
            "daserste",
            "ard",
            "rtl",
            "sat1",
            "vox",
            "prosieben",
            "kabeleins",
            "rtlzwei",
            "zdfneo",
            "ntv",
            "welt",
            "tagesschau24",
            "sport1",
            "skysportbundesliga",
        ][..],
        "ES" => &[
            "antena3",
            "la1",
            "telecinco",
            "lasexta",
            "cuatro",
            "la2",
            "fdf",
            "neox",
            "nova",
            "tv3",
            "movistarlaliga",
            "movistarplus",
            "teledeporte",
        ][..],
        "IT" => &[
            "rai1",
            "canale5",
            "rai3",
            "rai2",
            "italia1",
            "rete4",
            "la7",
            "tv8",
            "nove",
            "rainews24",
            "skysport24",
            "skytg24",
            "dazn",
        ][..],
        "PT" => &[
            "tvi",
            "sic",
            "rtp1",
            "cmtv",
            "rtp2",
            "sicnoticias",
            "sporttv1",
        ][..],
        "NL" => &[
            "npo1",
            "rtl4",
            "sbs6",
            "npo2",
            "rtl5",
            "net5",
            "veronica",
            "npo3",
            "rtl7",
            "ziggosport",
        ][..],
        "MA" => &[
            "almaghribia",
            "2m",
            "alaoula",
            "arryadia",
            "medi1tv",
            "tamazight",
            "bein",
            "aljazeera",
        ][..],
        "DZ" => &["entv", "canalalgerie", "echorouk", "ennahar", "eldjazairia"][..],
        "TN" => &["wataniya1", "elhiwar", "nessma", "attessia", "carthage"][..],
        "TR" => &["trt1", "atv", "showtv", "startv", "kanald", "foxtr", "tv8"][..],
        "PL" => &["tvp1", "polsat", "tvn", "tvp2", "tvn24", "tvpinfo"][..],
        _ => return None,
    };
    let name = if let Some(k) = key.strip_prefix("ch:") {
        k.to_owned()
    } else {
        norm(&clean_name(name)).replace(' ', "")
    };
    let n = re!(r"(hd|fhd|uhd|4k|sd)$").replace(&name, "");
    if let Some(i) = ranks.iter().position(|s| *s == n) {
        return Some(i as u16);
    }
    for base in ["france3", "bbcone", "itv1", "rai3"] {
        if n.starts_with(base)
            && let Some(i) = ranks.iter().position(|s| *s == base)
        {
            return Some(i as u16 + 12);
        }
    }
    let id = epg
        .split('.')
        .next()?
        .chars()
        .filter(char::is_ascii_alphanumeric)
        .collect::<String>();
    ranks.iter().position(|s| *s == id).map(|i| i as u16)
}
#[wasm_bindgen]
pub fn program_boost(title: &str, sub: &str, category: &str, remaining: f64, hour: u32) -> i32 {
    let sport_cat = re!(
        r"(?i)sport|football|soccer|rugby|tennis|basket|cyclisme|cycling|formula|f1|moto|handball|golf|boxe|boxing|mma|ufc|athle"
    );
    let live_event = re!(
        r"(?i)( - | vs\.? | v | contre |match|finale|final\b|ligue|liga|league|coupe|cup\b|grand prix|gp |champions|derby|direct|live|en direct|multiplex)"
    );
    let big_event = re!(
        r"(?i)(finale|final\b|coupe du monde|world cup|euro 20\d\d|jeux olympiques|olympic|ligue des champions|champions league|six nations|tour de france|roland|wimbledon|super bowl|clasico|classique|grand prix)"
    );
    let news = re!(
        r"(?i)^(le )?(jt|journal|20h|13h|19/20|le 20h|le 13h|news at|tagesschau|telediario|tg1)"
    );
    let movie_cat = re!(r"(?i)film|cin[ée]ma|movie|t[ée]l[ée]film");
    let text = format!("{title} {sub}");
    let mut score = 0;
    if (sport_cat.is_match(category) || sport_cat.is_match(title)) && live_event.is_match(&text) {
        score += 6
    }
    if big_event.is_match(&text) {
        score += 6
    }
    if news.is_match(title) {
        score += 2
    }
    if (20..=22).contains(&hour) && movie_cat.is_match(category) {
        score += 2
    }
    if remaining > 0. && remaining < 480_000. {
        score -= 2
    }
    score
}
#[wasm_bindgen]
#[allow(clippy::too_many_arguments)]
pub fn channel_score(
    rank: Option<u16>,
    a0: bool,
    a1: bool,
    untagged: bool,
    primary: bool,
    same_country: bool,
    epg: bool,
    boost: i32,
) -> f64 {
    let base = rank.map_or(0., |r| (100. - f64::from(r) * 2.2).max(10.));
    let lang = if a0 || (rank.is_some() && primary && untagged) {
        50.
    } else if a1 {
        35.
    } else if untagged {
        10.
    } else {
        -30.
    };
    base + lang
        + if same_country { 25. } else { 0. }
        + if !epg {
            -5.
        } else if rank.is_none_or(|r| r >= 12) {
            f64::from(boost)
        } else {
            0.
        }
}
