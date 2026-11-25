use super::*;
const API: &str = "https://api.arte.tv/api";

fn image(v: &Value) -> Option<String> {
    Some(v.as_str()?.replace("__SIZE__", "940x530"))
}
pub(super) fn item(v: &Value) -> Option<Value> {
    let id = v["programId"].as_str().filter(|s| !s.is_empty())?;
    let title = v["title"].as_str().filter(|s| !s.is_empty())?;
    let show = v["kind"]["isCollection"] == true || id.starts_with("RC-");
    if !show && v["player"]["config"].is_null() && v["availability"]["hasVideoStreams"] == false {
        return None;
    }
    Some(compact(
        json!({"id":format!("arte:{id}"),"provider":"arte","kind":if show{"show"}else{"video"},"title":title,
        "subtitle":v["subtitle"],"desc":first(&v["shortDescription"],&v["teaserText"]),"image":image(&v["mainImage"]["url"]),
        "durationSec":v["duration"].as_f64().filter(|d|*d>0.),"expires":date(&v["availability"]["end"]),"channel":"ARTE",
        "genre":first(&v["genre"]["label"],&v["kind"]["label"]),"age":v["ageRating"].as_f64()}),
    ))
}
/// pages read, with the section name (translation key) put before their rails' titles
const PAGES: [(&str, &str, usize); 4] = [
    ("HOME", "", 14),
    ("CIN", "universe.cinema", 5),
    ("SER", "universe.series", 5),
    ("DOR", "home.docs", 4),
];
async fn catalog(lang: &str, fetch: &Function) -> Result<Value, JsValue> {
    let pages = futures_util::future::join_all(PAGES.iter().map(|(code, ..)| async move {
        get(
            fetch,
            &format!("{API}/emac/v4/{lang}/web/pages/{code}/"),
            20000,
        )
        .await
    }))
    .await;
    if pages[0].is_err() {
        return Err(JsError::new("ARTE indisponible").into());
    }
    let mut rails = Vec::new();
    let mut hero = Vec::new();
    let mut seen = HashSet::new();
    for ((code, key, max), page) in PAGES.into_iter().zip(pages) {
        let Ok(page) = page else { continue };
        let label = if key.is_empty() { "" } else { crate::views::lookup(lang, key) };
        let start = rails.len();
        for z in arr(&page["zones"]) {
            let tpl = strv(&z["displayOptions"]["template"]);
            let items = unique(arr(&z["content"]["data"]).iter().filter_map(item));
            if re!(r"slider|single|event-").is_match(tpl) {
                if code == "HOME" {
                    hero.extend(items.into_iter().filter(|v| v["image"].is_string()))
                }
                continue;
            }
            if items.len() < 4
                || !tpl.starts_with("horizontal")
                || re!(r"^(favorites|resume-watching|genres_|playlists_)")
                    .is_match(strv(&z["code"]))
            {
                continue;
            }
            let title = strv(&z["title"]).trim();
            let full = if title.is_empty() {
                label.to_owned()
            } else if !label.is_empty() && title.to_lowercase() != label.to_lowercase() {
                format!("{label} · {title}")
            } else {
                title.to_owned()
            };
            if !seen.insert(full.to_lowercase()) {
                continue;
            }
            rails.push(json!({"id":format!("arte:{}",super::label(first(&z["id"],&z["code"]))),"provider":"arte","title":full,"items":items}));
            if rails.len() - start >= max {
                break;
            }
        }
    }
    Ok(json!({"rails":rails,"hero":hero}))
}
fn show(v: &Value, id: &str) -> Value {
    let zones = arr(&v["zones"]);
    let meta = &v["metadata"];
    let head = zones
        .iter()
        .find(|z| strv(&z["displayOptions"]["template"]).contains("single-collection"))
        .map(|z| &z["content"]["data"][0])
        .unwrap_or(&Value::Null);
    let title = first(&meta["title"], &head["title"]);
    let mut seasons = Vec::new();
    for z in zones {
        if strv(&z["displayOptions"]["template"]).contains("single") {
            continue;
        }
        let items: Vec<_> = arr(&z["content"]["data"])
            .iter()
            .filter_map(item)
            .filter(|v| v["kind"] == "video")
            .collect();
        if !items.is_empty() {
            seasons.push(json!({"title":strv(first(&z["title"],&meta["title"])),"items":items}))
        }
    }
    json!({"item":compact(json!({"id":format!("arte:{id}"),"provider":"arte","kind":"show","title":title.as_str().unwrap_or(id),
        "desc":first(&meta["description"],&head["shortDescription"]),"image":image(first(&head["mainImage"]["url"],&meta["images"][0]["url"])),"channel":"ARTE"})),"seasons":seasons})
}
pub(super) async fn request(
    action: &str,
    id: &str,
    lang: &str,
    fetch: &Function,
) -> Result<Value, JsValue> {
    let lang = match lang {
        "fr" | "de" | "en" | "es" | "it" | "pl" => lang,
        _ => "en",
    };
    if action == "catalog" {
        return catalog(lang, fetch).await;
    }
    if action == "show" {
        return Ok(show(
            &get(
                fetch,
                &format!("{API}/emac/v4/{lang}/web/collections/{id}/"),
                20000,
            )
            .await?,
            id,
        ));
    }
    let config = get(fetch, &format!("{API}/player/v2/config/{lang}/{id}"), 15000).await?;
    let a = &config["data"]["attributes"];
    if action == "stream" {
        let streams = arr(&a["streams"]);
        let wanted = if lang == "de" {
            re!(r"(?i)allemand|deutsch")
        } else {
            re!(r"(?i)fran[cç]ais")
        };
        let s = streams
            .iter()
            .find(|s| wanted.is_match(strv(&s["versions"][0]["label"])))
            .or(streams.first());
        let Some(s) = s.filter(|s| !strv(&s["url"]).is_empty()) else {
            return Err(JsError::new(
                if !a["restriction"]["geoblocking"]["restrictedArea"].is_null() {
                    "geo"
                } else {
                    "unavailable"
                },
            )
            .into());
        };
        let label = s["versions"][0]["label"]
            .as_str()
            .filter(|s| !s.is_empty())
            .map_or_else(|| "ARTE".into(), |s| format!("ARTE · {s}"));
        return Ok(json!({"url":s["url"],"label":label}));
    }
    let m = &a["metadata"];
    Ok(compact(
        json!({"id":format!("arte:{id}"),"provider":"arte","kind":"video","title":m["title"].as_str().unwrap_or(id),
        "subtitle":m["subtitle"],"desc":m["description"],"image":m["images"][0]["url"],"durationSec":m["duration"]["seconds"],
        "expires":date(&a["rights"]["end"]),"channel":"ARTE"}),
    ))
}
