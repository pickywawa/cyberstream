use super::*;
fn extract<'a>(s: &'a str, tag: &str) -> Option<&'a str> {
    Some(
        s.split_once(&format!("<{tag}>"))?
            .1
            .split_once(&format!("</{tag}>"))?
            .0,
    )
}
fn decode(s: &str) -> String {
    quick_xml::escape::unescape(s).map_or_else(|_| s.into(), |v| v.into_owned())
}
#[wasm_bindgen]
pub fn youtube_feed(xml: &str, channel: &str) -> String {
    let mut out = Vec::new();
    for entry in xml.split("<entry>").skip(1) {
        let Some(id) =
            extract(entry, "yt:videoId").filter(|id| re!(r"^[a-zA-Z0-9_-]{6,20}$").is_match(id))
        else {
            continue;
        };
        if re!(r#"<link\s+rel="alternate"\s+href="[^"]*/shorts/"#).is_match(entry) {
            continue;
        }
        let title = decode(extract(entry, "title").unwrap_or(""));
        let desc: String = decode(extract(entry, "media:description").unwrap_or(""))
            .chars()
            .take(400)
            .collect();
        let views = re!(r#"<media:statistics views="(\d+)""#)
            .captures(entry)
            .and_then(|m| m[1].parse::<u64>().ok())
            .filter(|n| *n > 0);
        let date = extract(entry, "published").and_then(|d| DateTime::parse_from_rfc3339(d).ok());
        out.push(compact(json!({"id":format!("yt:{id}"),"provider":"youtube","kind":"video","title":title,"subtitle":channel,"channel":channel,
            "image":format!("https://i.ytimg.com/vi/{id}/mqdefault.jpg"),"views":views,"published":date.map(|d|d.timestamp_millis()),"desc":desc})));
    }
    serde_json::to_string(&out).unwrap()
}
