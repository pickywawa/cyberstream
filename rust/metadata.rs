use crate::replay::{arr, compact, first, strv};
use serde_json::{Value, json};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn cert_age(country: &str, cert: &str) -> Option<u32> {
    let normalized = cert.trim().to_uppercase();
    match (country, normalized.as_str()) {
        ("FR", "U" | "TP") | ("US", "G" | "NR" | "TV-Y" | "TV-G") | ("GB", "U") => Some(0),
        ("US", "TV-Y7") => Some(7),
        ("GB", "PG") => Some(8),
        ("US", "PG" | "TV-PG") => Some(10),
        ("US", "PG-13") => Some(13),
        ("US", "TV-14") => Some(14),
        ("US", "R" | "TV-MA") => Some(17),
        ("US", "NC-17") | ("GB", "R18") => Some(18),
        _ => normalized
            .trim_start_matches('-')
            .split(|c: char| !c.is_ascii_digit())
            .next()?
            .parse::<u32>()
            .ok()
            .filter(|&n| n <= 21),
    }
}
fn image(path: &Value, size: &str) -> Option<String> {
    Some(format!(
        "https://image.tmdb.org/t/p/{size}{}",
        path.as_str().filter(|p| !p.is_empty())?
    ))
}
fn year(row: &Value) -> Option<u16> {
    first(&row["release_date"], &row["first_air_date"])
        .as_str()?
        .get(..4)?
        .parse()
        .ok()
}
fn item(r: &Value) -> Value {
    compact(
        json!({"tmdbId":r["id"],"title":first(&r["title"],&r["name"]),"year":year(r),"poster":image(&r["poster_path"],"w342"),"backdrop":image(&r["backdrop_path"],"w1280")}),
    )
}
fn certification<'a>(r: &'a Value, kind: &str, country: &str) -> Option<(&'a str, Option<u32>)> {
    let movie = kind == "movie";
    let ratings = if movie {
        &r["release_dates"]
    } else {
        &r["content_ratings"]
    };
    for region in [country, "FR", "US", "GB", "DE"] {
        for rating in arr(&ratings["results"])
            .iter()
            .rev()
            .filter(|e| e["iso_3166_1"] == region)
        {
            let label = if movie {
                arr(&rating["release_dates"]).iter().find_map(|d| {
                    d["certification"]
                        .as_str()
                        .map(str::trim)
                        .filter(|s| !s.is_empty())
                })
            } else {
                rating["rating"]
                    .as_str()
                    .map(str::trim)
                    .filter(|s| !s.is_empty())
            };
            if let Some(s) = label {
                return Some((s, cert_age(region, s)));
            }
        }
    }
    None
}
fn details(r: &Value, kind: &str, lang: &str) -> Value {
    let locale = lang.split('-').next().unwrap_or("fr");
    let logos = arr(&r["images"]["logos"]);
    let logo = [locale, "en", ""]
        .into_iter()
        .find_map(|l| logos.iter().find(|x| strv(&x["iso_639_1"]) == l));
    let videos = arr(&r["videos"]["results"]);
    let trailer = videos
        .iter()
        .find(|v| v["site"] == "YouTube" && v["type"] == "Trailer")
        .or_else(|| videos.iter().find(|v| v["site"] == "YouTube"));
    let cast = arr(&r["credits"]["cast"]);
    let creator = arr(&r["credits"]["crew"])
        .iter()
        .find(|v| v["job"] == "Director")
        .or_else(|| arr(&r["created_by"]).first());
    let people:Vec<_>=cast.iter().take(15).map(|v|compact(json!({"id":v["id"],"name":v["name"],"character":v["character"],"photo":image(&v["profile_path"],"w185")}))).collect();
    let cert = certification(r, kind, lang.split('-').nth(1).unwrap_or("FR"));
    let collection = r["belongs_to_collection"]
        .as_object()
        .map(|c| json!({"id":c.get("id"),"name":c.get("name")}));
    let mut out = item(r);
    let more = compact(
        json!({"logo":logo.and_then(|l|image(&l["file_path"],"w500")),"plot":r["overview"],"rating":r["vote_average"].as_f64().filter(|n|*n!=0.).map(|n|(n*10.).round()/10.),"genres":arr(&r["genres"]).iter().map(|g|&g["name"]).collect::<Vec<_>>(),"cast":cast.iter().take(10).map(|c|&c["name"]).collect::<Vec<_>>(),"director":creator.map(|c|&c["name"]),"trailer":trailer.and_then(|t|t["key"].as_str()).map(|key|format!("https://www.youtube.com/watch?v={key}")),"durationSec":r["runtime"].as_u64().filter(|n|*n>0).or_else(||r["episode_run_time"][0].as_u64()).map(|m|60*m),"origLang":r["original_language"],"imdbId":first(&r["external_ids"]["imdb_id"],&r["imdb_id"]),"cert":cert.map(|c|c.0),"certAge":cert.and_then(|c|c.1),"recos":arr(&r["recommendations"]["results"]).iter().take(20).map(|v|&v["id"]).collect::<Vec<_>>(),"people":people,"collection":collection}),
    );
    out.as_object_mut()
        .unwrap()
        .extend(more.as_object().unwrap().clone());
    out
}
fn person(r: &Value) -> Value {
    let credits:Vec<_>=arr(&r["combined_credits"]["cast"]).iter().chain(arr(&r["combined_credits"]["crew"]).iter().filter(|x|x["job"]=="Director")).filter(|v|v["media_type"]=="movie"||v["media_type"]=="tv").map(|v|compact(json!({"kind":v["media_type"],"tmdbId":v["id"],"title":first(&v["title"],&v["name"]),"year":year(v),"character":v["character"],"job":v["job"],"popularity":v["popularity"].as_f64().unwrap_or(0.)}))).collect();
    compact(
        json!({"id":r["id"],"name":r["name"],"bio":r["biography"],"birthday":r["birthday"],"deathday":r["deathday"],"place":r["place_of_birth"],"photo":image(&r["profile_path"],"w500"),"knownFor":r["known_for_department"],"credits":credits}),
    )
}
#[wasm_bindgen]
pub fn tmdb_result(action: &str, kind: &str, lang: &str, raw: &str) -> Result<String, String> {
    let r: Value = serde_json::from_str(raw).map_err(|_| "Réponse TMDB invalide")?;
    let out = match action {
        "list" => Value::Array(arr(&r["results"]).iter().map(item).collect()),
        "details" => details(&r, kind, lang),
        "collection" => compact(
            json!({"id":r["id"],"name":r["name"],"overview":r["overview"],"backdrop":image(&r["backdrop_path"],"w1280"),"parts":arr(&r["parts"]).iter().map(item).collect::<Vec<_>>()}),
        ),
        "person" => person(&r),
        "season" => {
            let mut map = serde_json::Map::new();
            for ep in arr(&r["episodes"]) {
                if let Some(n) = ep["episode_number"].as_u64() {
                    map.insert(n.to_string(),compact(json!({"still":image(&ep["still_path"],"w300"),"plot":ep["overview"],"title":ep["name"]})));
                }
            }
            Value::Object(map)
        }
        _ => return Err("Action TMDB inconnue".into()),
    };
    Ok(out.to_string())
}
