use std::{collections::BTreeMap, env, fmt::Write, fs, path::PathBuf};

/// Interface languages: rust/locales/<code>.json. French is the reference (every file holds its keys).
const LANGS: [&str; 14] = ["fr", "en", "de", "es", "it", "pt", "ar", "hi", "zh", "bn", "id", "ur", "ru", "ja"];

fn dict(lang: &str) -> BTreeMap<String, String> {
    let path = format!("rust/locales/{lang}.json");
    println!("cargo:rerun-if-changed={path}");
    serde_json::from_str(&fs::read_to_string(&path).unwrap()).unwrap_or_else(|e| panic!("{path}: {e}"))
}
fn main() {
    let dicts: Vec<_> = LANGS.iter().map(|l| (*l, dict(l))).collect();
    let fr = &dicts[0].1;
    for (lang, d) in &dicts[1..] {
        let missing: Vec<_> = fr.keys().filter(|k| !d.contains_key(*k)).collect();
        let extra: Vec<_> = d.keys().filter(|k| !fr.contains_key(*k)).collect();
        assert!(missing.is_empty() && extra.is_empty(), "{lang}.json: missing {missing:?}, unknown {extra:?}");
    }
    // a key resolves to the profile's language, else English (same text as English: left out)
    let mut code = String::from("pub(crate) fn lookup<'a>(lang:&str,key:&'a str)->&'a str { match key {\n");
    for (key, fr_text) in fr {
        let en = &dicts[1].1[key];
        write!(code, "{key:?} => match lang {{\"fr\" => {fr_text:?},").unwrap();
        for (lang, d) in &dicts[2..] {
            if &d[key] != en {
                write!(code, "{lang:?} => {:?},", d[key]).unwrap();
            }
        }
        writeln!(code, "_ => {en:?}}},").unwrap();
    }
    code.push_str("_=>key}}");
    fs::write(PathBuf::from(env::var_os("OUT_DIR").unwrap()).join("translations.rs"), code).unwrap();
}
