use super::*;
const GENRES: [&str; 16] = ["genre.0", "genre.1", "genre.2", "genre.3", "genre.4", "genre.5", "genre.6", "genre.7", "genre.8", "genre.9", "genre.10", "genre.11", "genre.12", "genre.13", "genre.14", "genre.15"];
#[wasm_bindgen]
pub fn grid_toolbar(
    title: &str,
    lang: &str,
    total: i32,
    genres: &[u32],
    sub: u32,
    sort: &str,
    header: bool,
) -> String {
    html!{
        // a page of its own: back button and title; under Home's categories: the chips only
        @if header{div.page-header{
            button.icon-btn data-f data-cmd="back" aria-label=(lookup(lang,"common.back")){(icon("back",""))}
            h1.section-title style="flex:1"{(title)}@if total>=0{span.dim.small{(total)}}}}
        @if genres.iter().filter(|n|**n>=8).count()>1{
            div.chips.sub-chips data-tabs data-row data-scroll="genres"{button.chip.active[sub==0] data-f data-cmd="sub:0"{(lookup(lang,"replay.all"))}
            @for (i,(count,name)) in genres.iter().zip(GENRES).enumerate(){@if *count>=8{button.chip.active[sub==1<<i] data-f data-cmd=(format!("sub:{}",1u32<<i)){(lookup(lang,name))}}}}
        }
        div.chips data-tabs data-row data-scroll="sorts"{@for key in ["added","rating","year","title"]{
            button.chip.active[key==sort] data-f data-cmd=(format!("sort:{key}")){(lookup(lang,&format!("sort.{key}")))}
        }}
    }.into_string()
}
#[wasm_bindgen]
pub fn grid_row(raw: &str, kind: &str) -> Result<String, String> {
    let media: Vec<Option<Media>> = serde_json::from_str(raw).map_err(|_| "Rangée invalide")?;
    Ok(html!{@for item in media{div style="min-width:0"{@if let Some(m)=item{
        (Card{sub:m.credited(m.genres.as_ref().and_then(|g|g.first())),..m.card(kind)}.outer("poster"))
    }}}}.into_string())
}
