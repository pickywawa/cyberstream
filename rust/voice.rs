use crate::text::norm;
use serde_json::{Value, json};
use wasm_bindgen::prelude::*;
fn digit(s: &str) -> Option<u16> {
    match s {
        "zero" => Some(0),
        "un" | "une" | "one" => Some(1),
        "deux" | "two" => Some(2),
        "trois" | "three" => Some(3),
        "quatre" | "four" => Some(4),
        "cinq" | "five" => Some(5),
        "six" => Some(6),
        "sept" | "seven" => Some(7),
        "huit" | "eight" => Some(8),
        "neuf" | "nine" => Some(9),
        "dix" | "ten" => Some(10),
        "onze" => Some(11),
        "douze" => Some(12),
        "treize" => Some(13),
        "quinze" | "fifteen" => Some(15),
        "vingt" | "twenty" => Some(20),
        "trente" | "thirty" => Some(30),
        "quarante" | "forty" => Some(40),
        "cinquante" | "fifty" => Some(50),
        "soixante" | "sixty" => Some(60),
        _ => None,
    }
}
#[wasm_bindgen]
pub fn words_to_digits(raw: &str) -> String {
    let words: Vec<_> = raw.split_whitespace().collect();
    let mut out = Vec::new();
    let mut i = 0;
    while i < words.len() {
        let word = words[i];
        i += 1;
        let Some(mut n) = digit(word) else {
            out.push(word.into());
            continue;
        };
        if n >= 20 && n % 10 == 0 {
            let unit = i + usize::from(words.get(i) == Some(&"et"));
            if let Some(v) = words
                .get(unit)
                .and_then(|w| digit(w))
                .filter(|n| (1..10).contains(n))
            {
                n += v;
                i = unit + 1
            }
        }
        out.push(n.to_string());
    }
    out.join(" ")
}
fn filler(s: &str) -> String {
    let s = re!(r"\b(s il te plait|s il vous plait|stp|svp|please|bitte|por favor|per favore|tolong|пожалуйста|برائے مہربانی|من فضلك|請|请|ください)\b").replace_all(s, "");
    re!(r"^(le|la|les|l|un|une|du|de la|des|the|a|an|der|die|das|den|el|los|las|il|lo|gli|o|os|as)\s+")
        .replace(s.trim(), "")
        .trim()
        .into()
}
fn duration(s: &str) -> u32 {
    let Some(m) = re!(r"(\d+)\s*(secondes?|sec|seconds?|sekunden?|segundos?|secondi|detik|секунд[уы]?|सेकंड|ثوان[يٍ]?|ثانية|سیکنڈ|সেকেন্ড|秒|s|minutes?|minuten?|minutos?|minuti|menit|минут[уы]?|मिनट|دقيقة|دقائق|منٹ|মিনিট|分|min|mn)").captures(s) else {
        return 30;
    };
    let minutes = re!(r"^(m|минут|मिनट|دقيق|دقائق|منٹ|মিনিট|分)").is_match(&m[2]);
    m[1].parse::<u32>().unwrap_or(30).saturating_mul(if minutes { 60 } else { 1 })
}
fn intent(raw: &str, in_player: bool) -> Value {
    // Chinese and Japanese digits ("五频道", "5チャンネル" come as digits from most recognisers)
    let words = words_to_digits(&re!(r"\bcanal plus\b").replace_all(&norm(raw), "canal"));
    let s = filler(
        &re!(r"^(ok |dis |hey )?(cyber ?iptv |cyber tv |cyber ?stream )?").replace(&words, ""),
    );
    if s.is_empty() {
        return json!({"type":"unknown","text":raw});
    }
    if in_player {
        for (action, rule) in [
            (
                "pause",
                re!(r"^(met |mets |fais |faire )?(pause|stop pause|pausa|pausar|pausieren|anhalten|jeda|пауза|पॉज़|पॉज|रोको|ایقاف|توقف مؤقت|إيقاف مؤقت|روکو|বিরতি|暂停|一時停止|ポーズ)$"),
            ),
            (
                "resume",
                re!(r"^(reprends?|reprendre|continue|continuer|lecture|play|resume|relance|weiter|fortsetzen|abspielen|reanudar|continuar|seguir|riprendi|continua|retomar|lanjut|lanjutkan|putar|продолжить|продолжай|играть|जारी रखो|चलाओ|استئناف|تشغيل|چلاؤ|চালাও|继续|播放|再生|続ける)$"),
            ),
            (
                "back",
                re!(
                    r"^(recule|reviens? en arriere|retour arriere|retourne en arriere|rewind|go back|back|zuruck|zurückspulen|zuruckspulen|retrocede|retroceder|atras|indietro|torna indietro|voltar|volta|retroceda|mundur|назад|перемотай назад|पीछे|ارجع|رجوع|پیچھے|পিছনে|后退|倒退|戻る|巻き戻し)"
                ),
            ),
            (
                "forward",
                re!(r"^(avance|avancer|va plus loin|fast forward|forward|skip|vorspulen|vor|adelanta|avanza|adelante|avanti|vai avanti|avancar|avanca|maju|percepat|вперед|вперёд|перемотай вперед|आगे|تقدم|قدم|آگے|সামনে|快进|前进|早送り|進む)"),
            ),
            (
                "live",
                re!(
                    r"^(reviens? au direct|retour au direct|retourne au direct|au direct|en direct|direct|go live|live|zum live|en vivo|en directo|directo|in diretta|diretta|ao vivo|siaran langsung|langsung|прямой эфир|लाइव|مباشر|البث المباشر|لائیو|براہ راست|লাইভ|সরাসরি|直播|ライブ|生放送)$"
                ),
            ),
            (
                "next",
                re!(r"^(chaine suivante|suivante|suivant|next channel|next|channel up|nachster kanal|nachster sender|nachster|siguiente canal|siguiente|canale successivo|successivo|proximo canal|proximo|saluran berikutnya|berikutnya|следующий канал|следующий|अगला चैनल|अगला|القناة التالية|التالي|اگلا چینل|اگلا|পরের চ্যানেল|পরের|下一个频道|下一台|下一个|次のチャンネル|次)$"),
            ),
            (
                "prev",
                re!(
                    r"^(chaine precedente|precedente|precedent|previous channel|previous|channel down|vorheriger kanal|vorheriger sender|vorheriger|canal anterior|anterior|canale precedente|saluran sebelumnya|sebelumnya|предыдущий канал|предыдущий|पिछला चैनल|पिछला|القناة السابقة|السابق|پچھلا چینل|پچھلا|আগের চ্যানেল|আগের|上一个频道|上一台|上一个|前のチャンネル|前)$"
                ),
            ),
            (
                "stop",
                re!(r"^(quitte|quitter|ferme|fermer|arrete|arreter|stop|sors|sortir|exit|close|stopp|beenden|schliessen|schlieen|salir|detener|parar|cerrar|esci|ferma|chiudi|sair|fechar|berhenti|keluar|tutup|стоп|выход|выйти|закрыть|बंद करो|बंद|أغلق|خروج|بند کرو|بند|বন্ধ|停止|退出|关闭|終了|閉じる)$"),
            ),
        ] {
            if rule.is_match(&s) {
                return if matches!(action, "forward" | "back") {
                    json!({"type":"player","action":action,"seconds":duration(&s)})
                } else {
                    json!({"type":"player","action":action})
                };
            }
        }
    }
    let go=re!(r"^(va |aller |allez |ouvre |ouvrir |affiche |afficher |montre |retour |retourne |go to |go |open |show |geh zu |offne |zeige |ve a |abre |vai a |apri |vai para |abrir |buka |открой |перейди в |افتح |打开|開いて)?(sur l |a l |sur la |sur le |sur |aux |au |a |l |la |le |les |the |zu |zur |zum |al |a la |alla |ao |para |на )?(el |los |las |il |lo |gli |i |o |os |as |die |den |das |der )?").replace(&s,"");
    let go=re!(r"\s*(खोलो|کھولو|খোলো|を開いて|を開く|に移動)$").replace(go.trim(),"");
    for (tab, rule) in [
        (
            "home",
            re!(r"^(accueil|page d accueil|home|home page|menu|startseite|start|inicio|pagina iniziale|beranda|главная|होम|الرئيسية|ہوم|হোম|首页|主页|ホーム)$"),
        ),
        (
            "tv",
            re!(
                r"^(en direct|direct|tv en direct|television|tele|la tele|chaines|les chaines|live|live tv|tv|fernsehen|sender|television|tele|televisione|televisao|televisi|тв|телевизор|каналы|टीवी|التلفزيون|القنوات|ٹی وی|টিভি|电视|テレビ)$"
            ),
        ),
        ("replay", re!(r"^(replay|replays|rattrapage|mediathek|a la carta|catch up|tayangan ulang|повтор|रीप्ले|إعادة|ری پلے|রিপ্লে|回放|見逃し)$")),
        (
            "myvideos",
            re!(r"^(mes videos|videos|ma liste|my videos|my list)$"),
        ),
        (
            "settings",
            re!(r"^(parametres|reglages|profil|settings|preferences|einstellungen|ajustes|configuracion|impostazioni|definicoes|configuracoes|pengaturan|настройки|सेटिंग्स|الإعدادات|الاعدادات|سیٹنگز|সেটিংস|设置|設定)$"),
        ),
        ("search", re!(r"^(recherche|rechercher|search|suche|buscar|busqueda|cerca|pesquisar|pesquisa|cari|pencarian|поиск|खोज|بحث|تلاش|খোঁজ|搜索|検索)$")),
    ] {
        if rule.is_match(go.trim()) {
            return json!({"type":"tab","tab":tab});
        }
    }
    if let Some(m)=re!(r"^(recherche|rechercher|cherche|chercher|trouve|trouver|search for|search|find|look for|suche nach|suche|finde|busca|buscar|cerca|trova|procura|procurar|pesquisa|pesquisar|cari|carikan|найди|найти|ищи|поиск|ابحث عن|ابحث)\s+(.+)$").captures(&s){return json!({"type":"search","query":filler(&m[2])})}
    if let Some(m)=re!(r"^(搜索|查找|找)\s*(.+)$").captures(&s){return json!({"type":"search","query":m[2].trim()})}
    // verb last (Hindi, Urdu, Bengali, Japanese): "… खोजो", "… تلاش کرو", "…を検索"
    if let Some(m)=re!(r"^(.+?)\s*(को खोजो|खोजो|ढूंढो|تلاش کرو|খুঁজুন|খোঁজো|を検索して|を検索|を探して)$").captures(&s){return json!({"type":"search","query":m[1].trim()})}
    let verb = re!(
        r"^(mets|met|mettre|lance|lancer|joue|jouer|regarde|regarder|ouvre|ouvrir|passe sur|passe|zappe sur|zappe|va sur|je veux voir|je veux regarder|play|put on|watch|switch to|turn on|open|tune to|spiel|spiele|zeig mir|zeige|zeig|offne|schalte um auf|schalte auf|schau|pon|poner|reproduce|reproducir|abre|abrir|quiero ver|cambia a|metti|riproduci|apri|guarda|passa a|vai su|coloca|colocar|poe|toca|tocar|quero ver|muda para|putar|putarkan|buka|tonton|ganti ke|pindah ke|включи|открой|поставь|покажи|переключи на|شغل|افتح|اعرض)\s+|^(播放|打开|切换到|我想看|看)\s*"
    );
    // verb last: "स्टार प्लस चलाओ", "جیو نیوز لگاؤ", "NHKをつけて"
    let verb_last = re!(r"\s*(चलाओ|लगाओ|दिखाओ|चालू करो|چلاؤ|لگاؤ|دکھاؤ|চালাও|দেখাও|をつけて|を再生して|を再生|を見せて|にして|つけて)$");
    let had_verb = verb.is_match(&s) || verb_last.is_match(&s);
    let rest = if verb.is_match(&s) {
        filler(&verb.replace(&s, ""))
    } else if had_verb {
        verb_last.replace(&s, "").trim().to_owned()
    } else {
        s
    };
    for (kind, rule) in [
        ("channel", re!(r"^(?:chaine|channel|kanal|sender|canal|canale|saluran|канал|चैनल|قناة|القناة|چینل|চ্যানেল)\s+(.+)$|^(?:频道|チャンネル)\s*(.+)$|^(.+?)\s*(?:频道|台|チャンネル|चैनल|چینل|চ্যানেল)$")),
        ("movie", re!(r"^(?:film|movie|pelicula|peli|filme|фильм|फिल्म|फ़िल्म|فيلم|فلم|সিনেমা)\s+(.+)$|^(?:电影|映画)\s*(.+)$")),
        ("series", re!(r"^(?:serie|series|show|tv show|serial|сериал|सीरियल|सीरीज|مسلسل|ڈرامہ|সিরিজ|নাটক)\s+(.+)$|^(?:电视剧|ドラマ)\s*(.+)$")),
    ] {
        if let Some(m) = rule.captures(&rest) {
            let Some(found) = m.iter().skip(1).flatten().next() else { continue };
            let query = if kind == "channel" {
                found.as_str().trim().to_owned()
            } else {
                filler(found.as_str())
            };
            let mut result = json!({"type":kind,"query":query});
            if kind == "channel"
                && let Ok(num) = query.parse::<u32>()
            {
                result["num"] = num.into()
            }
            return result;
        }
    }
    if rest.is_empty() {
        json!({"type":"unknown","text":raw})
    } else {
        json!({"type":if had_verb||rest.split_whitespace().count()<=5{"play"}else{"search"},"query":rest})
    }
}
#[wasm_bindgen]
pub fn voice(raw: &str, in_player: bool) -> String {
    intent(raw, in_player).to_string()
}
