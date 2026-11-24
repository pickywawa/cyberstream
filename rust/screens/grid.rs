use super::*;
const GENRES: [(&str, &str); 16] = [
    ("Action", "Action"),
    ("Comédie", "Comedy"),
    ("Drame", "Drama"),
    ("Thriller & policier", "Thriller & crime"),
    ("Horreur", "Horror"),
    ("Science-fiction", "Sci-fi"),
    ("Fantastique", "Fantasy"),
    ("Aventure", "Adventure"),
    ("Animation", "Animation"),
    ("Famille & jeunesse", "Family & kids"),
    ("Romance", "Romance"),
    ("Documentaire", "Documentary"),
    ("Guerre & histoire", "War & history"),
    ("Western", "Western"),
    ("Musique", "Music"),
    ("Noël", "Christmas"),
];
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
    let label = |(fr, en)| if lang == "en" { en } else { fr };
    html!{
        // a page of its own: back button and title; under Home's categories: the chips only
        @if header{div.page-header style="display:flex;align-items:center;gap:12px;padding:calc(var(--nav-h) + 12px) var(--gutter) 8px"{
            button.icon-btn data-f data-cmd="back" aria-label=(lookup(lang,"common.back")){(icon("back",""))}
            h1.section-title style="flex:1"{(title)}@if total>=0{span.dim.small{(total)}}}}
        @if genres.iter().filter(|n|**n>=8).count()>1{
            div.chips.sub-chips data-tabs data-row data-scroll="genres"{button.chip.active[sub==0] data-f data-cmd="sub:0"{(lookup(lang,"replay.all"))}
            @for (i,(count,name)) in genres.iter().zip(GENRES).enumerate(){@if *count>=8{button.chip.active[sub==1<<i] data-f data-cmd=(format!("sub:{}",1u32<<i)){(label(name))}}}}
        }
        div.chips data-tabs data-row data-scroll="sorts"{@for (key,names) in [("added",("Ajouts récents","Recently added")),("rating",("Mieux notés","Top rated")),("year",("Année","Year")),("title",("A → Z","A → Z"))]{
            button.chip.active[key==sort] data-f data-cmd=(format!("sort:{key}")){(label(names))}
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
