use super::*;
const API: &str = "https://api-mobile.yatta.francetv.fr";
const CHANNELS: [(&str, &str); 6] = [
    ("france-2", "France 2"),
    ("france-3", "France 3"),
    ("france-5", "France 5"),
    ("france-4", "France 4"),
    ("lcp", "LCP"),
    ("public-senat", "Public Sénat"),
];
fn pic(images: &Value) -> Option<&str> {
    for kind in ["vignette_16x9", "background_16x9", "carre"] {
        if let Some(img) = arr(images).iter().find(|i| i["type"] == kind) {
            let urls = &img["urls"];
            if let Some(url) = urls["w:800"]
                .as_str()
                .or_else(|| urls["w:1024"].as_str())
                .or_else(|| urls.as_object()?.values().find_map(Value::as_str))
            {
                return Some(url);
            }
        }
    }
    None
}
fn plain(v: &Value) -> Option<String> {
    Some(
        re!(r"<[^>]+>")
            .replace_all(v.as_str()?, " ")
            .replace("&nbsp;", " ")
            .replace("&amp;", "&")
            .split_whitespace()
            .collect::<Vec<_>>()
            .join(" "),
    )
}
pub(super) fn item(v: &Value, now: f64) -> Option<Value> {
    if v["type"] == "program" {
        let path = v["program_path"].as_str()?;
        return Some(compact(
            json!({"id":format!("ftvp:{path}"),"provider":"francetv","kind":"show","title":v["label"],
            "desc":plain(&v["description"]).filter(|s|!s.is_empty()).or_else(||plain(&v["synopsis"])),"image":pic(&v["images"]),"channel":v["channel"]["label"]}),
        ));
    }
    if !matches!(v["type"].as_str(), Some("integrale" | "unitaire")) || v["is_live"] == true {
        return None;
    }
    let id = v["si_id"].as_str().filter(|s| !s.is_empty())?;
    let end = v["end_date"].as_f64().map(|n| n * 1000.);
    if end.is_some_and(|t| t != 0. && t < now) {
        return None;
    }
    let ep = first(&v["episode_title"], &v["title"]);
    let show = strv(&v["program"]["label"]);
    let (title, sub) = if !show.is_empty() && show != strv(ep) {
        let mut parts = Vec::new();
        let episode = label(&v["episode"]);
        let season = label(&v["season"]);
        if !episode.is_empty() {
            parts.push(if season.is_empty() {
                format!("E{episode}")
            } else {
                format!("S{season} E{episode}")
            })
        }
        if let Some(s) = ep.as_str() {
            parts.push(s.into())
        }
        (show, parts.join(" · "))
    } else {
        (strv(&v["title"]), strv(&v["headline_title"]).into())
    };
    let age = match label(&v["rating_csa_code"]).to_uppercase().as_str() {
        "TP" => Some(0),
        "10" => Some(10),
        "12" => Some(12),
        "16" => Some(16),
        "18" => Some(18),
        _ => None,
    };
    Some(compact(
        json!({"id":format!("ftv:{id}"),"provider":"francetv","kind":"video","title":title,"subtitle":sub,"desc":plain(&v["description"]),
        "image":pic(&v["images"]).or_else(||pic(&v["program"]["images"])),"durationSec":v["duration"],"expires":end,"channel":v["channel"]["label"],
        "genre":v["category"]["label"],"age":age,"season":v["season"],"episode":v["episode"]}),
    ))
}
fn items(coll: &Value, now: f64) -> Vec<Value> {
    unique(arr(&coll["items"]).iter().filter_map(|v| item(v, now)))
}
fn rails(
    page: &Value,
    path: &str,
    name: &str,
    kids: bool,
    now: f64,
    rails: &mut Vec<Value>,
    hero: &mut Vec<Value>,
) {
    for c in arr(&page["collections"]) {
        if !kids && c["type"] == "live" {
            continue;
        }
        let mut list = items(c, now);
        for v in &mut list {
            if v["channel"].is_null() {
                v["channel"] = name.into()
            }
            if kids {
                v["kids"] = true.into()
            }
        }
        if c["type"] == "mise_en_avant" {
            hero.extend(
                list.into_iter()
                    .filter(|v| v["image"].is_string())
                    .take(if kids { 4 } else { 2 }),
            );
            continue;
        }
        if list.len() < 4 || (kids && rails.len() >= 16) {
            continue;
        }
        let mut r = json!({"id":format!("{path}:{}",label(first(&c["id"],&c["label"]))),"provider":"francetv","title":format!("{name} · {}",strv(&c["label"]).trim()),"items":list});
        if kids {
            r["kids"] = true.into()
        }
        rails.push(r)
    }
}
fn show(page: &Value, id: &str, now: f64) -> Value {
    let mut head = page["item"].as_object().cloned().unwrap_or_default();
    head.insert("type".into(), "program".into());
    head.insert("program_path".into(), id.into());
    let mut head = item(&Value::Object(head), now).unwrap_or_default();
    if head["title"].is_null() {
        head["title"] = page["label"].as_str().unwrap_or(id).into()
    }
    let mut seasons = Vec::new();
    for all in [false, true] {
        for c in arr(&page["collections"]) {
            if !all && c["type"] != "playlist_video" {
                continue;
            }
            let mut list = items(c, now);
            list.retain(|v| v["kind"] == "video");
            if list.is_empty() {
                continue;
            }
            if list.iter().all(|v| !v["episode"].is_null()) {
                list.sort_by_key(|v| {
                    (
                        label(&v["season"]).parse::<u32>().unwrap_or(0),
                        label(&v["episode"]).parse::<u32>().unwrap_or(0),
                    )
                })
            }
            if head["image"].is_null() {
                head["image"] = list[0]["image"].clone()
            }
            seasons.push(json!({"title":strv(&c["label"]),"items":list}));
        }
        if !seasons.is_empty() {
            break;
        }
    }
    json!({"item":head,"seasons":seasons})
}
pub(super) async fn request(
    action: &str,
    id: &str,
    now: f64,
    fetch: &Function,
) -> Result<Value, JsValue> {
    if matches!(action, "catalog" | "kids") {
        let (mut rr, mut hero) = (Vec::new(), Vec::new());
        if action == "kids" {
            rails(
                &get(
                    fetch,
                    &format!("{API}/apps/categories/enfants?platform=apps"),
                    25000,
                )
                .await?,
                "okoo",
                "Okoo",
                true,
                now,
                &mut rr,
                &mut hero,
            )
        } else {
            let pages =
                futures_util::future::join_all(CHANNELS.iter().map(|(path, _)| async move {
                    get(
                        fetch,
                        &format!("{API}/apps/channels/{path}?platform=apps"),
                        20000,
                    )
                    .await
                }))
                .await;
            if pages.iter().all(Result::is_err) {
                return Err(JsError::new("france.tv indisponible").into());
            }
            for ((path, name), page) in CHANNELS.iter().zip(pages) {
                if let Ok(page) = page {
                    rails(
                        &page,
                        &format!("ftv:{path}"),
                        name,
                        false,
                        now,
                        &mut rr,
                        &mut hero,
                    )
                }
            }
        }
        return Ok(json!({"rails":rr,"hero":hero}));
    }
    let encoded = js_sys::encode_uri_component(id)
        .as_string()
        .unwrap_or_default();
    if action == "show" {
        return Ok(show(
            &get(
                fetch,
                &format!("{API}/apps/program/{encoded}?platform=apps"),
                25000,
            )
            .await?,
            id,
            now,
        ));
    }
    let response=get(fetch,&format!("https://k7.ftven.fr/videos/{encoded}?country_code=FR&device_type=mobile&browser=safari&os=ios&domain=www.france.tv"),15000).await?;
    let v = &response["video"];
    if action == "stream" {
        if v["drm"] == true
            || v["drm"].is_object()
            || v["drm"].as_str().is_some_and(|s| !s.is_empty())
        {
            return Err(JsError::new("drm").into());
        }
        let url = v["url"]
            .as_str()
            .filter(|s| !s.is_empty())
            .ok_or_else(|| JsError::new("unavailable"))?;
        let token = v["token"]["akamai"]
            .as_str()
            .unwrap_or("https://hdfauth.ftven.fr/esi/TA?format=json");
        let escaped = js_sys::encode_uri_component(url)
            .as_string()
            .unwrap_or_default();
        let signed = get(
            fetch,
            &format!(
                "{token}{}url={escaped}",
                if token.contains('?') { "&" } else { "?" }
            ),
            15000,
        )
        .await
        .unwrap_or(Value::Null);
        return Ok(json!({"url":signed["url"].as_str().unwrap_or(url),"label":"france.tv"}));
    }
    let m = &response["meta"];
    Ok(compact(
        json!({"id":format!("ftv:{id}"),"provider":"francetv","kind":"video","title":m["title"].as_str().unwrap_or(id),
        "subtitle":m["additional_title"],"desc":plain(&m["description"]),"image":m["image_url"],"durationSec":v["duration"]}),
    ))
}
