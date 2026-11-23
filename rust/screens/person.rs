use super::*;
use crate::artwork::Image;
#[derive(Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
struct Person {
    name: String,
    photo: Option<String>,
    bio: Option<String>,
    birthday: Option<String>,
    deathday: Option<String>,
    place: Option<String>,
    known_for: Option<String>,
}
#[derive(Deserialize)]
struct Credit {
    kind: String,
    it: Media,
    role: Option<String>,
}
#[derive(Deserialize)]
struct Page {
    p: Option<Person>,
    items: Vec<Credit>,
}
#[wasm_bindgen]
pub fn person_html(raw: &str, title: &str, lang: &str, full: bool) -> Result<String, String> {
    let mut page: Option<Page> =
        serde_json::from_str(raw).map_err(|_| "Fiche personne invalide")?;
    if let Some(p) = &mut page {
        p.items
            .sort_by_key(|c| std::cmp::Reverse(c.it.year.unwrap_or(0)));
    }
    let p = page.as_ref().and_then(|x| x.p.as_ref());
    Ok(html!{
        (header(p.map(|p|p.name.as_str()).filter(|s|!s.is_empty()).unwrap_or(title),lang))
        @if let Some(page)=page {
            @if let Some(p)=page.p {
                @let info=[(p.known_for.as_deref()==Some("Directing")).then(||lookup(lang,"person.director").into()),
                    p.birthday.filter(|s|!s.is_empty()).map(|s|lookup(lang,"person.born").replace("{date}",&s)),p.place]
                    .into_iter().flatten().filter(|s|!s.is_empty()).collect::<Vec<_>>().join(" · ");
                div.person-head{div.person-photo{(Image{srcs:vec![p.photo],alt:p.name.clone(),label:p.name.clone(),..Default::default()}.markup())}
                    div.person-info{h1{(p.name)}div.small.muted{(info)@if let Some(date)=p.deathday.filter(|s|!s.is_empty()){div{(lookup(lang,"person.died").replace("{date}",&date))}}}
                    @if let Some(bio)=p.bio.filter(|s|!s.is_empty()){p.clamp5[!full] style="line-height:1.55"{(&bio)}
                        @if !full&&bio.encode_utf16().count()>400{button.btn.small data-f data-cmd="bio"{(lookup(lang,"person.moreBio"))}}}
                }}
            }
            h2 style="margin-top:26px"{(lookup(lang,"person.available"))}
            @if page.items.is_empty(){p.muted{(lookup(lang,"person.none"))}}@else{

                div.grid.posters style="margin-top:12px"{@for c in page.items{
                    (Card{sub:c.it.credited(c.role.as_ref()),..c.it.card(&c.kind)}.outer("poster"))
                }}
            }
        }@else{div.spinner.big style="margin:60px auto"{}}
    }.into_string())
}
