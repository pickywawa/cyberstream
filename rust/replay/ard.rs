//! ARD Mediathek (Germany's public broadcasters): free catch-up read from its public page gateway.
//! Ids: `ard:<item id>` (video), `ardp:<grouping id>` (show). Part of the films are limited to
//! Germany, Austria and Switzerland (their stream answers 403 elsewhere).
use super::*;
const API: &str = "https://api.ardmediathek.de/page-gateway/pages/ard";

fn image(v: &Value) -> Option<String> {
    let src = v["aspect16x9"]["src"].as_str().or_else(|| v["src"].as_str())?;
    Some(src.replace("{width}", "960"))
}
fn age(v: &Value) -> Option<u64> {
    strv(v).trim_start_matches("FSK").parse().ok()
}
/// a teaser of a page: a show (grouping) or a playable video
pub(super) fn item(t: &Value) -> Option<Value> {
    let target = &t["links"]["target"];
    let id = target["id"].as_str().filter(|s| !s.is_empty())?;
    let href = strv(&target["href"]);
    let show = href.contains("/grouping/") || t["type"] == "show";
    if !show && !href.contains("/item/") {
        return None;
    }
    let title = first(&t["mediumTitle"], &t["shortTitle"]).as_str().filter(|s| !s.is_empty())?;
    // the same video with audio description, sign language or clearer speech: the standard one is kept
    if re!(r"(?i)\((audiodeskription|mit gebärdensprache|gebärdensprache|klare sprache)\)").is_match(title) {
        return None;
    }
    let (title, subtitle) = match title.split_once(" | ") {
        Some((a, b)) => (a.trim(), Some(b.trim())),
        None => (title.trim(), None),
    };
    Some(compact(json!({
        "id": format!("{}:{id}", if show { "ardp" } else { "ard" }), "provider": "ard", "kind": if show { "show" } else { "video" },
        "title": title, "subtitle": subtitle, "image": image(&t["images"]), "durationSec": t["duration"].as_f64().filter(|d| *d > 0.),
        "expires": date(&t["availableTo"]), "channel": t["publicationService"]["name"], "age": age(&t["maturityContentRating"]),
    })))
}
async fn catalog(fetch: &Function) -> Result<Value, JsValue> {
    let page = get(fetch, &format!("{API}/home?embedded=true"), 20000)
        .await
        .map_err(|_| JsError::new("ARD indisponible"))?;
    let mut rails = Vec::new();
    let mut hero = Vec::new();
    let mut seen = HashSet::new();
    for w in arr(&page["widgets"]) {
        let items = unique(arr(&w["teasers"]).iter().filter_map(item));
        if w["type"] == "stage" {
            hero.extend(items.into_iter().filter(|v| v["image"].is_string()).take(6));
            continue;
        }
        let title = strv(&w["title"]).trim();
        if items.len() < 4 || title.is_empty() || !strv(&w["type"]).contains("gridlist") || !seen.insert(title.to_lowercase()) {
            continue;
        }
        rails.push(json!({"id": format!("ard:{}", super::label(&w["id"])), "provider": "ard", "title": title, "items": items}));
        if rails.len() >= 14 {
            break;
        }
    }
    Ok(json!({"rails": rails, "hero": hero}))
}
fn show(v: &Value, id: &str) -> Value {
    let mut seasons = Vec::new();
    for w in arr(&v["widgets"]) {
        let items: Vec<_> = arr(&w["teasers"]).iter().filter_map(item).filter(|v| v["kind"] == "video").collect();
        if !items.is_empty() {
            seasons.push(json!({"title": strv(first(&w["title"], &v["title"])), "items": items}));
        }
    }
    json!({"item": compact(json!({"id": format!("ardp:{id}"), "provider": "ard", "kind": "show", "title": v["title"].as_str().unwrap_or(id),
        "desc": v["synopsis"], "image": image(&v["images"]).or_else(|| image(&v["image"])), "channel": v["publicationService"]["name"]})),
        "seasons": seasons})
}
pub(super) async fn request(action: &str, id: &str, fetch: &Function) -> Result<Value, JsValue> {
    if action == "catalog" {
        return catalog(fetch).await;
    }
    if action == "show" {
        return Ok(show(&get(fetch, &format!("{API}/grouping/{id}?embedded=true"), 20000).await?, id));
    }
    let page = get(fetch, &format!("{API}/item/{id}?devicetype=pc&embedded=true"), 15000).await?;
    let w = arr(&page["widgets"]).first().unwrap_or(&Value::Null);
    if action == "stream" {
        let media = arr(&w["mediaCollection"]["embedded"]["streams"])
            .iter()
            .flat_map(|s| arr(&s["media"]))
            .collect::<Vec<_>>();
        // the standard soundtrack (not audio description or clearer speech), adaptive stream first,
        // else the largest MP4
        let standard = |m: &&&Value| matches!(strv(&m["audios"][0]["kind"]), "" | "standard");
        let pool: Vec<_> = if media.iter().any(|m| standard(&m)) { media.iter().filter(standard).copied().collect() } else { media.clone() };
        let media = pool;
        let hls = media.iter().find(|m| strv(&m["mimeType"]).contains("mpegurl"));
        let mp4 = media
            .iter()
            .filter(|m| strv(&m["mimeType"]) == "video/mp4")
            .max_by_key(|m| m["maxHResolutionPx"].as_u64().unwrap_or(0));
        let Some(m) = hls.or(mp4).filter(|m| !strv(&m["url"]).is_empty()) else {
            return Err(JsError::new(if w["geoblocked"] == true { "geo" } else { "unavailable" }).into());
        };
        let channel = strv(&w["publicationService"]["name"]);
        let label = if channel.is_empty() { "ARD".to_owned() } else { format!("ARD Mediathek · {channel}") };
        return Ok(json!({"url": m["url"], "label": label}));
    }
    let title = w["title"].as_str().unwrap_or(id);
    let show = w["show"]["title"].as_str().filter(|s| !title.contains(*s));
    Ok(compact(json!({
        "id": format!("ard:{id}"), "provider": "ard", "kind": "video", "title": title, "subtitle": show, "desc": w["synopsis"],
        "image": image(&w["image"]), "durationSec": w["mediaCollection"]["embedded"]["meta"]["durationSeconds"],
        "expires": date(&w["availableTo"]), "channel": w["publicationService"]["name"], "age": age(&w["maturityContentRating"]),
    })))
}
