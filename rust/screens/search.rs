use super::*;
#[derive(Deserialize)]
struct Channel {
    id: String,
    name: String,
    logo: Option<String>,
    #[serde(rename = "logoAlt")]
    logo_alt: Option<String>,
}
#[derive(Deserialize)]
struct Program {
    id: String,
    title: String,
    time: String,
    image: Option<String>,
    channel: Channel,
}
#[derive(Deserialize)]
struct Results {
    channels: Vec<Channel>,
    movies: Vec<Media>,
    series: Vec<Media>,
    programs: Vec<Program>,
}
#[wasm_bindgen]
pub fn search_results_html(
    raw: &str,
    recent: &str,
    query: &str,
    lang: &str,
) -> Result<String, String> {
    let data: Option<Results> = serde_json::from_str(raw).map_err(|_| "Résultats invalides")?;
    let recent: Vec<String> = serde_json::from_str(recent).map_err(|_| "Historique invalide")?;
    let t = |k| lookup(lang, k);
    Ok(html!{
        @if let Some(r)=data{
            @if r.channels.is_empty()&&r.movies.is_empty()&&r.series.is_empty()&&r.programs.is_empty(){div.empty{(t("search.noResult").replace("{q}",query))}}
            @if !r.series.is_empty()||!r.movies.is_empty(){section.rail{div.rail-head{h2.section-title{(t("search.movies"))" & "(t("search.series"))}}
                div.grid.posters{@for s in r.series.iter().take(18){(Card{sub:Some(t("search.series").into()),..s.card("series")}.outer("poster"))}
                @for m in r.movies.iter().take(60){(Card{sub:m.credited(None),..m.card("movie")}.outer("poster"))}}
            }}
            @if !r.channels.is_empty(){(rail("channels",t("search.channels"),None,html!{@for c in r.channels.into_iter().take(30){
                (Card{title:c.name,cmd:format!("channel:{}",c.id),logo:Some(vec![c.logo_alt,c.logo]),long_press:true,..Default::default()}.outer("logo"))
            }}))}
            @if !r.programs.is_empty(){(rail("programs",t("search.programs"),None,html!{@for p in r.programs{
                (Card{title:p.title,sub:Some(format!("{} · {}",p.channel.name,p.time)),image:p.image,
                   center_logo:Some(vec![p.channel.logo_alt,p.channel.logo]),cmd:format!("program:{}",p.id),..Default::default()}.outer("land"))
            }}))}
        }@else if !recent.is_empty(){div style="margin-top:14px"{
            div.container.muted.small style="margin-bottom:8px"{(t("search.recent"))}
            div.recent data-row{@for term in recent{button.chip.active data-f data-cmd=(format!("query:{term}")){(term)}}}
        }}
    }.into_string())
}
