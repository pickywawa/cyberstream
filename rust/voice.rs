use crate::text::norm;
use serde_json::{Value, json};
use wasm_bindgen::prelude::*;
fn digit(s: &str) -> Option<u16> {
    match s {
        "zero" => Some(0),
        "un" | "une" | "one" => Some(1),
        "deux" | "two" => Some(2),
        "trois" | "three" => Some(3),
        "quatre" | "four" => Some(4),
        "cinq" | "five" => Some(5),
        "six" => Some(6),
        "sept" | "seven" => Some(7),
        "huit" | "eight" => Some(8),
        "neuf" | "nine" => Some(9),
        "dix" | "ten" => Some(10),
        "onze" => Some(11),
        "douze" => Some(12),
        "treize" => Some(13),
        "quinze" | "fifteen" => Some(15),
        "vingt" | "twenty" => Some(20),
        "trente" | "thirty" => Some(30),
        "quarante" | "forty" => Some(40),
        "cinquante" | "fifty" => Some(50),
        "soixante" | "sixty" => Some(60),
        _ => None,
    }
}
#[wasm_bindgen]
pub fn words_to_digits(raw: &str) -> String {
    let words: Vec<_> = raw.split_whitespace().collect();
    let mut out = Vec::new();
    let mut i = 0;
    while i < words.len() {
        let word = words[i];
        i += 1;
        let Some(mut n) = digit(word) else {
            out.push(word.into());
            continue;
        };
        if n >= 20 && n % 10 == 0 {
            let unit = i + usize::from(words.get(i) == Some(&"et"));
            if let Some(v) = words
                .get(unit)
                .and_then(|w| digit(w))
                .filter(|n| (1..10).contains(n))
            {
                n += v;
                i = unit + 1
            }
        }
        out.push(n.to_string());
    }
    out.join(" ")
}
fn filler(s: &str) -> String {
    let s = re!(r"\b(s il te plait|s il vous plait|stp|svp|please)\b").replace_all(s, "");
    re!(r"^(le|la|les|l|un|une|du|de la|des|the|a|an)\s+")
        .replace(s.trim(), "")
        .trim()
        .into()
}
fn duration(s: &str) -> u32 {
    let Some(m) = re!(r"(\d+)\s*(secondes?|sec|seconds?|s|minutes?|min|mn)\b").captures(s) else {
        return 30;
    };
    m[1].parse::<u32>()
        .unwrap_or(30)
        .saturating_mul(if m[2].starts_with('m') { 60 } else { 1 })
}
fn intent(raw: &str, in_player: bool) -> Value {
    let words = words_to_digits(&re!(r"\bcanal plus\b").replace_all(&norm(raw), "canal"));
    let s = filler(
        &re!(r"^(ok |dis |hey )?(cyber ?iptv |cyber tv |cyber ?stream )?").replace(&words, ""),
    );
    if s.is_empty() {
        return json!({"type":"unknown","text":raw});
    }
    if in_player {
        for (action, rule) in [
            (
                "pause",
                re!(r"^(met |mets |fais |faire )?(pause|stop pause)$"),
            ),
            (
                "resume",
                re!(r"^(reprends?|reprendre|continue|continuer|lecture|play|resume|relance)$"),
            ),
            (
                "back",
                re!(
                    r"^(recule|reviens? en arriere|retour arriere|retourne en arriere|rewind|go back|back)\b"
                ),
            ),
            (
                "forward",
                re!(r"^(avance|avancer|va plus loin|fast forward|forward|skip)\b"),
            ),
            (
                "live",
                re!(
                    r"^(reviens? au direct|retour au direct|retourne au direct|au direct|en direct|direct|go live|live)$"
                ),
            ),
            (
                "next",
                re!(r"^(chaine suivante|suivante|suivant|next channel|next|channel up)$"),
            ),
            (
                "prev",
                re!(
                    r"^(chaine precedente|precedente|precedent|previous channel|previous|channel down)$"
                ),
            ),
            (
                "stop",
                re!(r"^(quitte|quitter|ferme|fermer|arrete|arreter|stop|sors|sortir|exit|close)$"),
            ),
        ] {
            if rule.is_match(&s) {
                return if matches!(action, "forward" | "back") {
                    json!({"type":"player","action":action,"seconds":duration(&s)})
                } else {
                    json!({"type":"player","action":action})
                };
            }
        }
    }
    let go=re!(r"^(va |aller |allez |ouvre |ouvrir |affiche |afficher |montre |retour |retourne |go to |go |open |show )?(sur l |a l |sur la |sur le |sur |aux |au |a |l |la |le |les |the )?").replace(&s,"");
    for (tab, rule) in [
        (
            "home",
            re!(r"^(accueil|page d accueil|home|home page|menu)$"),
        ),
        (
            "tv",
            re!(
                r"^(en direct|direct|tv en direct|television|tele|la tele|chaines|les chaines|live|live tv|tv)$"
            ),
        ),
        ("replay", re!(r"^(replay|replays|rattrapage)$")),
        (
            "myvideos",
            re!(r"^(mes videos|videos|ma liste|my videos|my list)$"),
        ),
        (
            "settings",
            re!(r"^(parametres|reglages|profil|settings|preferences)$"),
        ),
        ("search", re!(r"^(recherche|rechercher|search)$")),
    ] {
        if rule.is_match(go.trim()) {
            return json!({"type":"tab","tab":tab});
        }
    }
    if let Some(m)=re!(r"^(recherche|rechercher|cherche|chercher|trouve|trouver|search for|search|find|look for)\s+(.+)$").captures(&s){return json!({"type":"search","query":filler(&m[2])})}
    let verb = re!(
        r"^(mets|met|mettre|lance|lancer|joue|jouer|regarde|regarder|ouvre|ouvrir|passe sur|passe|zappe sur|zappe|va sur|je veux voir|je veux regarder|play|put on|watch|switch to|turn on|open|tune to)\s+"
    );
    let had_verb = verb.is_match(&s);
    let rest = if had_verb {
        filler(&verb.replace(&s, ""))
    } else {
        s
    };
    for (kind, rule) in [
        ("channel", re!(r"^(?:chaine|channel)\s+(.+)$")),
        ("movie", re!(r"^(?:film|movie)\s+(.+)$")),
        ("series", re!(r"^(?:serie|series|show|tv show)\s+(.+)$")),
    ] {
        if let Some(m) = rule.captures(&rest) {
            let query = if kind == "channel" {
                m[1].trim().to_owned()
            } else {
                filler(&m[1])
            };
            let mut result = json!({"type":kind,"query":query});
            if kind == "channel"
                && let Ok(num) = query.parse::<u32>()
            {
                result["num"] = num.into()
            }
            return result;
        }
    }
    if rest.is_empty() {
        json!({"type":"unknown","text":raw})
    } else {
        json!({"type":if had_verb||rest.split_whitespace().count()<=5{"play"}else{"search"},"query":rest})
    }
}
#[wasm_bindgen]
pub fn voice(raw: &str, in_player: bool) -> String {
    intent(raw, in_player).to_string()
}
