use chrono::DateTime;
use js_sys::{Function, Promise};
use serde_json::{Value, json};
use std::collections::HashSet;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;
mod ard;
mod arte;
mod france;
mod youtube;

pub(super) fn arr(v: &Value) -> &[Value] {
    v.as_array().map(Vec::as_slice).unwrap_or_default()
}
pub(super) fn strv(v: &Value) -> &str {
    v.as_str().unwrap_or_default()
}
fn label(v: &Value) -> String {
    match v {
        Value::Number(n) => n.to_string(),
        Value::String(s) => s.clone(),
        _ => String::new(),
    }
}
fn date(v: &Value) -> Option<i64> {
    DateTime::parse_from_rfc3339(v.as_str()?)
        .ok()
        .map(|d| d.timestamp_millis())
}
pub(crate) fn first<'a>(a: &'a Value, b: &'a Value) -> &'a Value {
    if a.is_null() || a.as_str() == Some("") {
        b
    } else {
        a
    }
}
pub(crate) fn compact(mut value: Value) -> Value {
    if let Some(obj) = value.as_object_mut() {
        obj.retain(|_, v| !v.is_null() && v.as_str() != Some(""))
    }
    value
}
fn unique(items: impl Iterator<Item = Value>) -> Vec<Value> {
    let mut ids = HashSet::new();
    items.filter(|i| ids.insert(i["id"].clone())).collect()
}
async fn get(fetch: &Function, url: &str, timeout: u32) -> Result<Value, JsValue> {
    let pending = fetch.call2(&JsValue::NULL, &url.into(), &timeout.into())?;
    let result = JsFuture::from(Promise::resolve(&pending)).await?;
    serde_json::from_str(
        &result
            .as_string()
            .ok_or_else(|| JsError::new("Réponse vide"))?,
    )
    .map_err(|_| JsError::new("Réponse JSON invalide").into())
}
#[wasm_bindgen]
pub fn replay_item(provider: &str, raw: &str, now: f64) -> String {
    let v = serde_json::from_str(raw).unwrap_or_default();
    let item = if provider == "arte" {
        arte::item(&v)
    } else if provider == "ard" {
        ard::item(&v)
    } else {
        france::item(&v, now)
    };
    serde_json::to_string(&item).unwrap()
}
#[wasm_bindgen]
pub async fn replay_request(
    provider: String,
    action: String,
    id: String,
    lang: String,
    now: f64,
    fetch: Function,
) -> Result<String, JsValue> {
    let v = match provider.as_str() {
        "arte" => arte::request(&action, &id, &lang, &fetch).await?,
        "francetv" => france::request(&action, &id, now, &fetch).await?,
        "ard" => ard::request(&action, &id, &fetch).await?,
        _ => return Err(JsError::new("Service inconnu").into()),
    };
    Ok(v.to_string())
}
