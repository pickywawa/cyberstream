use std::{collections::BTreeMap, env, fmt::Write, fs, path::PathBuf};

fn dict(lang: &str) -> BTreeMap<String, String> {
    let path = format!("rust/locales/{lang}.json");
    println!("cargo:rerun-if-changed={path}");
    serde_json::from_str(&fs::read_to_string(path).unwrap()).unwrap()
}
fn main() {
    let (fr, en) = (dict("fr"), dict("en"));
    assert!(fr.keys().eq(en.keys()), "Missing translation");
    let mut code =
        String::from("pub(crate) fn lookup<'a>(lang:&str,key:&'a str)->&'a str { match key {\n");
    for (key, fr_text) in fr {
        if en[&key] == fr_text {
            writeln!(code, "{key:?} => {fr_text:?},").unwrap();
            continue;
        }
        writeln!(
            code,
            "{key:?} => if lang==\"en\" {{{:?}}} else {{{fr_text:?}}},",
            en[&key]
        )
        .unwrap()
    }
    code.push_str("_=>key}}");
    fs::write(
        PathBuf::from(env::var_os("OUT_DIR").unwrap()).join("translations.rs"),
        code,
    )
    .unwrap();
}
