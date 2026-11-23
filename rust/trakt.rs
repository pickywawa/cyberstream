use crate::replay::{arr, compact, first};
use js_sys::{Function, Promise};
use serde_json::{Value, json};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::JsFuture;

const API: &str = "https://api.trakt.tv";
async fn request(
    send: &Function,
    id: &str,
    access: &str,
    path: &str,
    body: Option<Value>,
) -> Result<Value, JsValue> {
    let mut headers =
        json!({"Content-Type":"application/json","trakt-api-version":"2","trakt-api-key":id});
    if !access.is_empty() {
        headers["Authorization"] = format!("Bearer {access}").into();
    }
    let spec = compact(
        json!({"method":if body.is_some(){"POST"}else{"GET"},"url":format!("{API}{path}"),"headers":headers,"body":body,"timeoutMs":20000}),
    );
    let pending = send.call1(&JsValue::NULL, &spec.to_string().into())?;
    let text = JsFuture::from(Promise::resolve(&pending))
        .await?
        .as_string()
        .ok_or_else(|| JsError::new("Réponse Trakt absente"))?;
    serde_json::from_str(&text).map_err(|_| JsError::new("Réponse Trakt invalide").into())
}
fn tmdb_items(rows: &Value, kind: Option<&str>) -> Vec<Value> {
    arr(rows)
        .iter()
        .filter_map(|r| {
            let m = kind.map_or(r, |k| &r[k]);
            let id = m["ids"]["tmdb"].as_u64().filter(|&v| v > 0)?;
            let title = m["title"].as_str().filter(|x| !x.is_empty())?;
            Some(compact(json!({"tmdbId":id,"title":title,"year":m["year"]})))
        })
        .collect()
}
#[wasm_bindgen]
pub async fn trakt_lists(
    id: String,
    access: String,
    now: f64,
    send: Function,
) -> Result<String, JsValue> {
    let get = |path: &'static str| request(&send, &id, &access, path, None);
    let responses = futures_util::future::try_join_all(
        [
            "/users/settings",
            "/recommendations/movies?limit=60&ignore_collected=true",
            "/recommendations/shows?limit=60&ignore_collected=true",
            "/sync/watchlist/movies",
            "/sync/watchlist/shows",
            "/users/me/lists",
        ]
        .into_iter()
        .map(get),
    )
    .await?;
    let data = |i: usize| {
        if responses[i]["status"] == 200 {
            &responses[i]["data"]
        } else {
            &Value::Null
        }
    };
    let mut lists = vec![];
    for list in arr(data(5)).iter().take(6) {
        let Some(n) = list["ids"]["trakt"].as_u64() else {
            continue;
        };
        let response = request(
            &send,
            &id,
            &access,
            &format!("/users/me/lists/{n}/items/movie,show"),
            None,
        )
        .await?;
        let rows = if response["status"] == 200 {
            &response["data"]
        } else {
            &Value::Null
        };
        lists.push(json!({"name":list["name"],"movies":tmdb_items(rows,Some("movie")),"shows":tmdb_items(rows,Some("show"))}));
    }
    Ok(compact(json!({"at":now,"user":first(&data(0)["user"]["username"],&data(0)["username"]),"forYouMovies":tmdb_items(data(1),None),"forYouShows":tmdb_items(data(2),None),"watchlistMovies":tmdb_items(data(3),Some("movie")),"watchlistShows":tmdb_items(data(4),Some("show")),"lists":lists})).to_string())
}
#[wasm_bindgen]
pub async fn trakt_action(
    action: String,
    raw: String,
    now: f64,
    send: Function,
) -> Result<String, JsValue> {
    let args: Value =
        serde_json::from_str(&raw).map_err(|_| JsError::new("Paramètres Trakt invalides"))?;
    let id = args["id"].as_str().unwrap_or("");
    let secret = &args["secret"];
    let token = |d: &Value| json!({"access":d["access_token"],"refresh":d["refresh_token"],"exp":1000.*(d["created_at"].as_f64().unwrap_or(now/1000.)+d["expires_in"].as_f64().unwrap_or(0.))});
    let result = match action.as_str() {
        "code" => {
            if id.is_empty() {
                return Err(JsError::new("app").into());
            }
            let r = request(
                &send,
                id,
                "",
                "/oauth/device/code",
                Some(json!({"client_id":id})),
            )
            .await?;
            if r["status"] != 200 || r["data"]["user_code"].as_str().is_none() {
                return Err(JsError::new(&if r["status"] == 401 || r["status"] == 403 {
                    "app".into()
                } else {
                    format!("HTTP {}", r["status"])
                })
                .into());
            }
            r["data"].clone()
        }
        "poll" => {
            let r = request(
                &send,
                id,
                "",
                "/oauth/device/token",
                Some(json!({"code":args["code"],"client_id":id,"client_secret":secret})),
            )
            .await?;
            let status = match r["status"].as_u64() {
                Some(200) if r["data"]["access_token"].is_string() => "ok",
                Some(400) => "wait",
                Some(429) => "slow",
                Some(418) => "denied",
                Some(404 | 410) => "expired",
                _ => "app",
            };
            compact(json!({"status":status,"token":(status=="ok").then(||token(&r["data"]))}))
        }
        "session" => {
            let old = &args["token"];
            let exp = old["exp"].as_f64().unwrap_or(0.);
            if exp - now > 86400000. {
                json!({"access":old["access"]})
            } else {
                let r=request(&send,id,"","/oauth/token",Some(json!({"refresh_token":old["refresh"],"client_id":id,"client_secret":secret,"redirect_uri":"urn:ietf:wg:oauth:2.0:oob","grant_type":"refresh_token"}))).await?;
                if r["status"] == 200 && r["data"]["access_token"].is_string() {
                    json!({"access":r["data"]["access_token"],"token":token(&r["data"])})
                } else if exp > now {
                    json!({"access":old["access"]})
                } else {
                    Value::Null
                }
            }
        }
        "scrobble" => {
            let media = &args["target"];
            let p = (args["progress"].as_f64().unwrap_or(0.).clamp(0., 100.) * 100.).round() / 100.;
            let body = if !media["movie"].is_null() {
                json!({"movie":{"ids":{"tmdb":media["movie"]["tmdb"]}},"progress":p})
            } else {
                let ep = &media["episode"];
                json!({"show":{"ids":{"tmdb":ep["showTmdb"]}},"episode":{"season":ep["season"],"number":ep["number"]},"progress":p})
            };
            let event = args["event"]
                .as_str()
                .filter(|e| matches!(*e, "start" | "pause" | "stop"))
                .ok_or_else(|| JsError::new("Événement Trakt invalide"))?;
            request(
                &send,
                id,
                args["access"].as_str().unwrap_or(""),
                &format!("/scrobble/{event}"),
                Some(body),
            )
            .await?;
            Value::Null
        }
        _ => return Err(JsError::new("Action Trakt inconnue").into()),
    };
    Ok(result.to_string())
}
