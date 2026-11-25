<p align="center">
  <a href="https://pickywawa.github.io/cyberstream/en/">
    <img src="../assets/banner-en.png" alt="Cyberstream — Rust इंजन वाला IPTV प्लेयर" width="100%" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/pickywawa/cyberstream/releases/latest"><img alt="नवीनतम संस्करण" src="https://img.shields.io/github/v/release/pickywawa/cyberstream?style=for-the-badge&color=4fe3a8&labelColor=0b0b0d&label=version" /></a>
  <img alt="Rust + WebAssembly" src="https://img.shields.io/badge/engine-Rust%20%2B%20Wasm-4fe3a8?style=for-the-badge&labelColor=0b0b0d&logo=rust&logoColor=4fe3a8" />
  <a href="../../LICENSE"><img alt="MIT लाइसेंस" src="https://img.shields.io/badge/license-MIT-4fe3a8?style=for-the-badge&labelColor=0b0b0d" /></a>
  <img alt="प्लेटफ़ॉर्म" src="https://img.shields.io/badge/Android%20%C2%B7%20TV%20%C2%B7%20iOS%20%C2%B7%20Desktop%20%C2%B7%20Web-2de2ff?style=for-the-badge&labelColor=0b0b0d" />
</p>

<p align="center">
  <b><a href="https://pickywawa.github.io/cyberstream/en/">वेबसाइट</a></b> ·
  <b><a href="https://github.com/pickywawa/cyberstream/releases/latest">डाउनलोड</a></b> ·
  <a href="#-%E0%A4%B8%E0%A5%81%E0%A4%B5%E0%A4%BF%E0%A4%A7%E0%A4%BE%E0%A4%8F%E0%A4%81">सुविधाएँ</a> ·
  <a href="#-%E0%A4%AD%E0%A4%BE%E0%A4%B7%E0%A4%BE%E0%A4%8F%E0%A4%81-%E0%A4%94%E0%A4%B0-%E0%A4%A6%E0%A5%87%E0%A4%B6">देश</a> ·
  <a href="#%EF%B8%8F-%E0%A4%B8%E0%A5%8D%E0%A4%95%E0%A5%8D%E0%A4%B0%E0%A5%80%E0%A4%A8%E0%A4%B6%E0%A5%89%E0%A4%9F">स्क्रीनशॉट</a> ·
  <a href="#%EF%B8%8F-%E0%A4%AC%E0%A4%BF%E0%A4%B2%E0%A5%8D%E0%A4%A1-%E0%A4%94%E0%A4%B0-%E0%A4%9F%E0%A5%87%E0%A4%B8%E0%A5%8D%E0%A4%9F">बिल्ड</a>
  <br />
  <a href="../../README.md">English</a> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a> · <a href="README.pt.md">Português</a> · <a href="README.ru.md">Русский</a> · <a href="README.zh.md">中文</a> · <a href="README.ja.md">日本語</a> · <b>हिन्दी</b> · <a href="README.bn.md">বাংলা</a> · <a href="README.ur.md">اردو</a> · <a href="README.ar.md">العربية</a> · <a href="README.id.md">Bahasa Indonesia</a>
</p>

---

**Cyberstream** आपके **Xtream Codes** और **M3U** स्रोत चलाता है: लाइव चैनल, टीवी गाइड, फ़िल्में, सीरीज़ और कैच-अप। यह IPTV प्लेयर CyberTV को Rust में पोर्ट करता है: वही WebAssembly मॉड्यूल ब्राउज़र, Android फ़ोन और टीवी, iOS और Electron में चलता है। Android वीडियो डिकोडिंग और ट्रैक चुनने के लिए Media3 का उपयोग करता है।

> [!NOTE]
> Cyberstream एक प्लेयर है। यह कोई सामग्री नहीं देता: आप अपने स्वयं के स्रोतों का उपयोग करते हैं।

<p align="center">
  <img src="../assets/demo.gif" alt="डेमो: प्रोफ़ाइल, होम, फ़िल्म पेज, लाइव टीवी, गाइड और खोज" width="100%" />
  <br />
  <sub>डेमो स्रोत और TMDB मेटाडेटा के साथ रिकॉर्ड किया गया। इंटरफ़ेस फ़्रेंच में दिखाया गया है।</sub>
</p>

## ⚡ सुविधाएँ

| | |
| --- | --- |
| 📡 **Xtream और M3U** | कैटलॉग हिस्सों में पढ़े जाते हैं, बैकअप सर्वर, डिफ़रेंशियल सिंक। |
| 🗓️ **XMLTV गाइड** | वर्चुअलाइज़्ड ग्रिड, “अभी” की रेखा, पिछले कार्यक्रमों का कैच-अप। |
| 🎬 **फ़िल्में और सीरीज़** | TMDB से समृद्ध पेज: कलाकार, कलेक्शन, आयु रेटिंग, सीज़न, आगे देखना, अगला एपिसोड। |
| ⏸️ **लाइव पॉज़** | 30 से 60 मिनट का स्थानीय बफ़र, ±10 सेकंड, लाइव पर वापसी, बैकअप स्ट्रीम पर अपने-आप स्विच। |
| 🎙️ **वॉइस कमांड** | “चैनल 5 लगाओ”, “Dune खोजो”, “30 सेकंड पीछे जाओ”, इंटरफ़ेस की सभी 14 भाषाओं में। |
| 📱 **QR कोड से सेटअप** | टीवी आपके फ़ोन से प्रोफ़ाइल, स्रोत और सेटिंग्स ले लेता है। |
| 🔁 **मुफ़्त कैच-अप** | ARTE, france.tv, Okoo, ARD Mediathek और मीडिया संस्थानों के 600 से अधिक YouTube चैनल, आपके देशों के अनुसार। |
| 💬 **सबटाइटल और Trakt** | SRT, WebVTT, OpenSubtitles हैश मिलान, Trakt स्क्रॉबलिंग और वॉचलिस्ट। |
| 🌍 **14 भाषाएँ, 42 देश** | हर चुने गए देश के लिए मुफ़्त चैनल, टीवी गाइड, रेडियो और स्कोर, एक प्रोफ़ाइल में कई देश। |
| 👤 **प्रोफ़ाइल** | हर प्रोफ़ाइल का अपना अवतार, भाषा और आयु सीमा। सेवाओं के टोकन डिवाइस के सुरक्षित भंडार में रहते हैं। |

## 🌍 भाषाएँ और देश

**इंटरफ़ेस** 14 भाषाओं में: फ़्रेंच, अंग्रेज़ी, जर्मन, स्पैनिश, इतालवी, पुर्तगाली, अरबी, हिन्दी, चीनी, बांग्ला, इंडोनेशियाई, उर्दू, रूसी और जापानी। अरबी और उर्दू दाएँ से बाएँ दिखाई जाती हैं। वॉइस कमांड, तारीख़ें, TMDB पेजों की भाषा और वाणी पहचान प्रोफ़ाइल की भाषा का पालन करते हैं।

**एक प्रोफ़ाइल में कई देश।** प्रोफ़ाइल में एक या अधिक देश चुनें (जैसे भारत और यूनाइटेड किंगडम)। पहला देश मुख्य देश होता है। हर चुने गए देश के लिए ऐप जोड़ता है:

- **मुफ़्त चैनल**: [iptv-org](https://github.com/iptv-org/iptv) में सूचीबद्ध सार्वजनिक मुफ़्त स्ट्रीम, एक स्रोत के रूप में। प्रोफ़ाइल बनाते समय “मेरे देशों के मुफ़्त चैनल” विकल्प दिया जाता है: ऐप बिना IPTV सब्सक्रिप्शन के भी काम करता है।
- **मुफ़्त टीवी गाइड**: फ़्रांस के लिए [xmltvfr.fr](https://xmltvfr.fr), अन्य देशों के लिए [epgshare01](https://epgshare01.online)।
- **कैच-अप**: france.tv और Okoo (फ़्रांस), ARD Mediathek (जर्मनी, ऑस्ट्रिया), ARTE (यूरोप में, छह भाषाओं में)।
- **YouTube**: विषय के अनुसार देश के मीडिया चैनल (समाचार, खेल, डॉक्यूमेंट्री, कॉमेडी, मीडिया, रेडियो)। सभी जाँचे गए हैं: हर चैनल अपनी सार्वजनिक RSS फ़ीड से प्रकाशित करता है।
- **रेडियो**: [Radio Browser](https://www.radio-browser.info) से देश के सबसे ज़्यादा सुने जाने वाले स्टेशन। सभी देश शामिल हैं।
- **लाइव स्कोर**: देश की लीग।

**देश फ़िल्टर।** “सिर्फ़ मेरे देशों के चैनल” विकल्प स्रोत डाउनलोड करते समय दूसरे देशों की चैनल श्रेणियाँ (“UK|”, “DE:”, “[BE]”…) हटा देता है। यह स्रोत सेट करते समय, पहले डाउनलोड से पहले दिया जाता है।

| देश | मुफ़्त चैनल | टीवी गाइड | कैच-अप | YouTube | स्कोर |
| --- | --- | --- | --- | --- | --- |
| 🇫🇷 फ़्रांस | ≈231 (TF1, France 2, M6, Arte) | हाँ | france.tv, Okoo, ARTE | 21 (BFMTV, franceinfo…) | Ligue 1, Champions League, Premier League |
| 🇧🇪 बेल्जियम | ≈60 (La Une, Tipik, RTL-TVI, BX1) | हाँ | ARTE | 10 (RTBF, RTBF Info…) | Pro League, Ligue 1, Champions League |
| 🇨🇭 स्विट्ज़रलैंड | ≈137 (RTS, RSI, Couleur 3, 3sat) | हाँ | ARTE | 9 (RTS Info, Schweizer Radio und Fernsehen…) | Super League, Ligue 1, Bundesliga |
| 🇱🇺 लग्ज़मबर्ग | ≈20 (RTL, Eldo) | हाँ | ARTE | 2 (RTL Luxembourg, Wort…) | Ligue 1, Bundesliga, Champions League |
| 🇨🇦 कनाडा | ≈265 (CBC, CTV, Télé-Québec) | हाँ | — | 14 (CBC News, CTV News…) | NHL, NBA, NFL |
| 🇲🇦 मोरक्को | ≈13 (2M, Al Aoula, Medi1) | — | — | 10 (2MTV, Hespress…) | AFCON, Ligue 1, LaLiga |
| 🇩🇿 अल्जीरिया | ≈9 (Canal Algérie, Ennahar) | — | — | 7 (Ennahar Tv Plus, EchoroukTV…) | AFCON, Ligue 1, Champions League |
| 🇹🇳 ट्यूनीशिया | ≈4 (Watania, Nessma) | — | — | 7 (Mosaique FM, Nessma TV…) | AFCON, Ligue 1, Champions League |
| 🇬🇧 यूनाइटेड किंगडम | ≈302 (BBC One, BBC News, Channel 4) | हाँ | ARTE | 30 (BBC News, Sky News…) | Premier League, Champions League |
| 🇮🇪 आयरलैंड | ≈58 (RTÉ News, Virgin Media) | हाँ | ARTE | 9 (RTÉ News, The Irish Times…) | Premier Division, Premier League, Champions League |
| 🇺🇸 संयुक्त राज्य | ≈1538 (PBS, ABC News, CBS News) | हाँ | — | 41 (CNN, NBC News…) | NFL, NBA, NHL |
| 🇦🇺 ऑस्ट्रेलिया | ≈78 (ABC, 7, 9) | हाँ | — | 11 (9 News Australia, SBS News…) | AFL, A-League, Premier League |
| 🇳🇿 न्यूज़ीलैंड | ≈36 (TVNZ, Whakaata Māori) | हाँ | — | 6 (RNZ, 1News…) | A-League, Premier League |
| 🇩🇪 जर्मनी | ≈303 (Das Erste, ZDF, 3sat, tagesschau24) | हाँ | ARD Mediathek, ARTE | 28 (tagesschau, ZDFheute Nachrichten…) | Bundesliga, Champions League |
| 🇦🇹 ऑस्ट्रिया | ≈114 (ORF, ServusTV, PULS 24) | हाँ | ARD Mediathek, ARTE | 9 (PULS 24, Kronen Zeitung…) | Bundesliga (AT), Bundesliga, Champions League |
| 🇪🇸 स्पेन | ≈305 (3Cat, À Punt, 24 Horas, Atreseries) | हाँ | ARTE | 27 (Antena 3 Noticias, EL PAÍS…) | LaLiga, Champions League, NBA |
| 🇲🇽 मैक्सिको | ≈179 (Canal 22, Canal Once, Azteca) | हाँ | — | 12 (NMás, MILENIO…) | Liga MX, Concacaf, LaLiga |
| 🇦🇷 अर्जेंटीना | ≈224 (Telefe, TN, A24) | हाँ | — | 11 (C5N, LA NACION…) | Liga Profesional, Libertadores, LaLiga |
| 🇨🇴 कोलंबिया | ≈171 (Canal Capital, Señal Colombia) | हाँ | — | 7 (Noticias Caracol, Noticias RCN…) | Primera A, Libertadores, LaLiga |
| 🇨🇱 चिली | ≈220 (TVN, 24 Horas, T13) | हाँ | — | 9 (Teletrece, CHV Noticias…) | Primera División, Libertadores, LaLiga |
| 🇮🇹 इटली | ≈359 (Rai 1, Rai 2, Rai 3, Rai News 24) | हाँ | ARTE | 21 (RaiNews, Sky tg24…) | Serie A, Champions League |
| 🇵🇹 पुर्तगाल | ≈72 (RTP 1, RTP 2, RTP Notícias, SIC) | हाँ | — | 10 (RTP Notícias, TVI…) | Liga Portugal, Champions League |
| 🇧🇷 ब्राज़ील | ≈401 (TV Cultura, Record News, SBT) | हाँ | — | 23 (g1, CNN Brasil…) | Brasileirão, Libertadores, NBA |
| 🇳🇱 नीदरलैंड | ≈175 (NPO, AT5) | हाँ | — | 11 (NOS, RTL Nieuws…) | Eredivisie, Champions League |
| 🇹🇷 तुर्किये | ≈180 (TRT 1, TRT Haber, NTV) | हाँ | — | 8 (TRT Haber, CNN TÜRK…) | Süper Lig, Champions League |
| 🇵🇱 पोलैंड | ≈188 (TVP Info, TVP World) | हाँ | ARTE | 12 (tvn24, Polsat…) | Champions League |
| 🇷🇺 रूस | ≈518 (2x2, 360°, RT) | — | — | 19 (Телеканал Дождь, BBC News - Русская служба…) | RPL |
| 🇸🇦 सऊदी अरब | ≈56 (Al Saudiya, Al Ekhbariya, Asharq News) | हाँ | — | 17 (AlArabiya العربية, سكاي نيوز عربية…) | Saudi Pro League, AFC Champions League, Premier League |
| 🇦🇪 संयुक्त अरब अमीरात | ≈23 (Dubai TV, Abu Dhabi TV) | हाँ | — | 10 (سكاي نيوز عربية, AlArabiya العربية…) | AFC Champions League, Premier League, LaLiga |
| 🇶🇦 क़तर | ≈10 (Al Jazeera, Al Rayyan) | — | — | 4 (Al Jazeera English, العربي - أخبار…) | AFC Champions League, Premier League, LaLiga |
| 🇪🇬 मिस्र | ≈21 (Nile Drama, MBC Masr, Al Ghad) | — | — | 11 (CBC Egypt, Sada Elbalad - صدى البلد…) | AFCON, Premier League, LaLiga |
| 🇮🇳 भारत | ≈826 (DD National, DD News, Aaj Tak, NDTV) | हाँ | — | 30 (Aaj Tak, NDTV…) | ISL, Premier League |
| 🇵🇰 पाकिस्तान | ≈105 (PTV, ARY News, Dunya News) | — | — | 19 (Geo News, ARY News…) | Premier League |
| 🇧🇩 बांग्लादेश | ≈37 (ATN Bangla, NTV, T Sports, Ekhon) | — | — | 17 (SOMOY TV, Jamuna TV Plus…) | Premier League |
| 🇮🇩 इंडोनेशिया | ≈177 (TVRI, Kompas TV, Metro TV) | हाँ | — | 28 (CNN Indonesia, tvOneNews…) | Super League, Premier League |
| 🇲🇾 मलेशिया | ≈6 (TV1, TV2) | हाँ | — | 6 (Astro AWANI, Berita Harian Online…) | Super League, Premier League |
| 🇸🇬 सिंगापुर | ≈9 (CNA) | हाँ | — | 5 (CNA Insider, CNA…) | Premier League |
| 🇨🇳 चीन | ≈156 (CCTV-1, CCTV-4, CCTV-13) | — | — | 11 (CGTN, CCTV Video News Agency…) | CSL, NBA |
| 🇹🇼 ताइवान | ≈34 (PTS, TTV) | — | — | 10 (TVBS NEWS, SETN News Network…) | NBA, MLB |
| 🇭🇰 हाँग काँग | ≈18 (RTHK, TVB) | हाँ | — | 7 (TVB NEWS Official 無綫新聞, RTHK 香港電台…) | Premier League, NBA |
| 🇯🇵 जापान | ≈17 (NHK General, Nippon TV, TV Asahi, Fuji TV) | हाँ | — | 22 (ANNnewsCH, TBS NEWS DIG Powered by JNN…) | J1 League, MLB |
| 🇰🇷 दक्षिण कोरिया | ≈72 (KBS, MBC, Arirang) | — | — | 16 (YTN, SBS News…) | MLB, Premier League |

मुफ़्त चैनलों की संख्या लिखते समय की iptv-org सूचियों से ली गई है। इनमें से कुछ स्ट्रीम सिर्फ़ अपने देश में चलती हैं या अक्सर बदलती रहती हैं। ARD के कुछ वीडियो सिर्फ़ जर्मनी, ऑस्ट्रिया और स्विट्ज़रलैंड में देखे जा सकते हैं।

**शामिल नहीं की गई सेवाएँ।** BBC iPlayer, ITVX और Channel 4 के लिए खाता और यूनाइटेड किंगडम से कनेक्शन चाहिए, और iPlayer के लिए टीवी लाइसेंस भी। PBS हर स्टेशन के ऐप और खाते से चलता है। RTVE Play अपने वीडियो DRM से सुरक्षित करता है। RaiPlay अपने कैटलॉग का बड़ा हिस्सा इटली तक सीमित रखता है, अक्सर साइन-इन के साथ। जब इनके लाइव चैनल फ़्री-टू-एयर प्रसारित होते हैं तो वे मुफ़्त चैनलों में दिखते हैं, और इनके YouTube चैनल कैच-अप में हैं।

## 🖼️ स्क्रीनशॉट

<table>
  <tr>
    <td width="50%"><img src="../assets/screens/home-rows.webp" alt="फ़िल्मों और सीरीज़ की पंक्तियों वाला होम" /><p align="center"><sub>होम</sub></p></td>
    <td width="50%"><img src="../assets/screens/live.webp" alt="लाइव टीवी" /><p align="center"><sub>लाइव टीवी</sub></p></td>
  </tr>
  <tr>
    <td><img src="../assets/screens/guide.webp" alt="टीवी गाइड" /><p align="center"><sub>टीवी गाइड</sub></p></td>
    <td><img src="../assets/screens/movie.webp" alt="फ़िल्म पेज" /><p align="center"><sub>फ़िल्म पेज</sub></p></td>
  </tr>
  <tr>
    <td><img src="../assets/screens/series-episodes.webp" alt="सीरीज़ के सीज़न और एपिसोड" /><p align="center"><sub>सीरीज़</sub></p></td>
    <td><img src="../assets/screens/player.webp" alt="प्लेयर" /><p align="center"><sub>प्लेयर — टेस्ट स्ट्रीम <i>Big Buck Bunny</i> © Blender Foundation, CC BY</sub></p></td>
  </tr>
</table>

<p align="center">
  <img src="../assets/screens/mobile-home.webp" alt="फ़ोन पर होम" width="30%" />
  &nbsp;
  <img src="../assets/screens/mobile-rows.webp" alt="फ़ोन पर पंक्तियाँ" width="30%" />
  &nbsp;
  <img src="../assets/screens/mobile-movie.webp" alt="फ़ोन पर फ़िल्म पेज" width="30%" />
</p>

## 📦 इंस्टॉल करें

[नवीनतम रिलीज़](https://github.com/pickywawa/cyberstream/releases/latest) से `Cyberstream-x.y.z.apk` डाउनलोड करें, फिर इसे अपने फ़ोन या टीवी पर इंस्टॉल करें:

```sh
adb -d install -r Cyberstream-1.0.1.apk
```

Android पैकेज `app.cyberstream.player` है। वही APK फ़ोन पर इंस्टॉल होता है और Android TV लॉन्चर में भी दिखता है। घोषित न्यूनतम संस्करण Android 7 (API 24) है। इंटरफ़ेस को WebAssembly और JavaScript मॉड्यूल सपोर्ट करने वाला WebView चाहिए; सिर्फ़ सिस्टम संस्करण इसकी गारंटी नहीं देता।

## 🦀 पोर्टिंग की स्थिति

प्री-रिलीज़ CyberTV 0.16.0 के अनुरूप है। पोर्ट अभी हाइब्रिड है।

| सुविधा | इस संस्करण में कार्यान्वयन |
| --- | --- |
| Xtream और M3U स्रोत | Rust कैटलॉग हिस्सों में पढ़ता है, प्रविष्टियों को क्रम देता है और प्लेबैक व कैच-अप URL बनाता है। TypeScript वर्कर अनुरोधों, बैकअप सर्वरों, बैकग्राउंड डाउनलोड और IndexedDB ट्रांज़ैक्शन का समन्वय करता है। |
| XMLTV गाइड | Rust gzip खोलता है, कार्यक्रम पढ़ता है, टाइम ज़ोन संभालता है और ग्रिड की दिखने वाली सेल बनाता है। इम्पोर्ट के दौरान IndexedDB पिछला शेड्यूल उपलब्ध रखता है। |
| खोज और रैंकिंग | Rust शीर्षकों का इंडेक्स बनाता है, चैनलों को रैंक करता है, भाषाएँ पहचानता है और LZ4 से संपीड़ित पेजों से कैटलॉग इंडेक्स बहाल करता है। |
| फ़िल्में और सीरीज़ | Rust Xtream एपिसोड और TMDB मेटाडेटा पढ़ता है, जिसमें आयु रेटिंग, कलाकार और कलेक्शन शामिल हैं। Rust पेज हेडर, सीज़न, एपिसोड, लाइब्रेरी और कार्ड बनाता है। ट्रैक चयन और स्ट्रीम के भीतर सीक के निर्णय भी Rust से होते हैं। |
| कैच-अप और सबटाइटल | Rust ARTE और france.tv के कैटलॉग व स्ट्रीम, YouTube RSS फ़ीड, SRT और WebVTT, और OpenSubtitles हैश संभालता है। |
| इंटरफ़ेस और रिमोट | मुख्य मेन्यू, प्रोफ़ाइल टाइल, अनुवाद, दिशात्मक नेविगेशन, वर्चुअलाइज़ेशन और वॉइस कमांड Rust में हैं। Trakt क्लाइंट, OpenSubtitles रैंकिंग और QR कोड आदान-प्रदान की जाँच भी। होम, ग्रिड, खोज परिणाम और Replay पेजों के Rust व्यू हैं। React और TypeScript स्क्रीन माउंट करते हैं, इवेंट और कई सेवा एकीकरण संभालते हैं। |
| डिवाइस सुविधाएँ | Android, Media3, कैश, टाइमशिफ़्ट, सुरक्षित भंडार और टीवी पेयरिंग के लिए Java ब्रिज रखता है। iOS होस्ट Swift और डेस्कटॉप होस्ट Electron का उपयोग करता है। |

माइग्रेशन के दौरान उपयोग के प्रवाह बनाए रखने के लिए CyberTV की स्क्रीन ली गई हैं। Android TV, iOS और डेस्कटॉप पर पूर्ण समानता का परीक्षण अभी बाकी है। मूल विनिर्देश [docs/SPECIFICATIONS.md](../SPECIFICATIONS.md) (फ़्रेंच में) में हैं।

## 🛠️ बिल्ड और टेस्ट

वेब और स्थानीय टेस्ट के लिए आवश्यकताएँ: WebAssembly टार्गेट के साथ स्थिर Rust, Node.js 22.12 या बाद का, और npm। बाइंडिंग जनरेटर का संस्करण crate के संस्करण से मेल खाना चाहिए।

```sh
rustup target add wasm32-unknown-unknown
cargo install --locked wasm-bindgen-cli --version 0.2.108
npm ci
cargo test --locked
npm test
npm run build
```

Android SDK 36, JDK 21 और सेट किए गए `JAVA_HOME` व `ANDROID_HOME` के साथ:

```sh
npm run android:apk
adb -d install -r android/app/build/outputs/apk/debug/app-debug.apk
```

प्रोफ़ाइल और स्रोत डिवाइस पर सेट किए जाते हैं। नकली डेटा के साथ वेब संस्करण आज़माने के लिए `npm run dev -- --host 127.0.0.1` चलाएँ और सेटअप के दौरान डेमो स्रोत चुनें। वैकल्पिक सेवा कुंजियाँ प्रोफ़ाइल सेटिंग्स में डाली जाती हैं। संस्करण 0.16.3 से, प्लेयर Cyberstream की GitHub रिलीज़ (प्री-रिलीज़ सहित) जाँचता है। हर Android रिलीज़ के साथ उसका `update.json` मैनिफ़ेस्ट और उसमें संदर्भित APK संलग्न होना चाहिए। कोई दूसरा चैनल टेस्ट करने के लिए, बिल्ड के समय `CYBER_UPDATE_URL` को मैनिफ़ेस्ट URL पर सेट करें। संस्करण 0.16.1 और 0.16.2 के उपयोगकर्ताओं को एक बार नया APK मैन्युअल रूप से इंस्टॉल करना होगा।

## 📺 Android TV पर संसाधन

कैटलॉग ग्रिड क्रमबद्ध ID रखता है और दिखने वाली पंक्तियों के अनुसार पंक्ति-दर-पंक्ति पोस्टर लोड करता है। पहला डाउनलोड प्रोफ़ाइल की ऑडियो भाषाओं वाली श्रेणियाँ चुनता है, सभी भाषाएँ रखने के विकल्प के साथ।

Xtream प्रविष्टियों का फ़िंगरप्रिंट दो सिंक के बीच अपरिवर्तित पंक्तियों को बनाए रखता है। गाइड भी स्थिर स्लॉट ID रखता है और बदले हुए कार्यक्रम फिर से लिखता है।

लॉन्चर और इंटरफ़ेस के आइकन वेक्टर चित्र हैं। Android प्राप्त SVG और एनिमेशन रखता है और फ़ोटो को उनके उपयोग के अनुसार रीसाइज़ करता है। अधिकतम किनारा लोगो के लिए 224 पिक्सेल, कार्ड के लिए 448 और हीरो इमेज के लिए 1,024 है। एक साथ दो इमेज डिकोड चल सकते हैं। डिस्क कैश का लक्ष्य 96 MiB है, और सबसे कम हाल में उपयोग की गई फ़ाइलें समय-समय पर हटाई जाती हैं।

Android पर परफ़ॉर्मेंस मोड डिफ़ॉल्ट रूप से चालू है। होम फ़िल्मों का एक सीमित नमूना पढ़ता है। इस मोड में खोज ज़रूरत पड़ने पर अपना इंडेक्स बनाती है। कम मेमोरी वाले चिह्नित डिवाइस पर प्लेयर 24 MiB मीडिया बफ़र का लक्ष्य रखता है। ये सीमाएँ विशिष्ट उप-प्रणालियों पर लागू होती हैं। कुल मेमोरी, स्टार्ट-अप समय और सुगमता को लक्ष्य टीवी पर मापना ज़रूरी है।

## 🌐 वेबसाइट

वेबसाइट [`docs/`](../) में है (सादा HTML, CSS और JS, बिना बिल्ड चरण), रूट में फ़्रेंच और `docs/en/` में अंग्रेज़ी। इसे GitHub Pages से `main` ब्रांच के `/docs` फ़ोल्डर से प्रकाशित किया जाता है। स्थानीय प्रीव्यू:

```sh
python3 -m http.server 8090 -d docs
```

## 📄 लाइसेंस

कोड [MIT](../../LICENSE) लाइसेंस के तहत जारी किया गया है।

---

<p align="center"><sub>पोस्टर, फ़ोटो और मेटाडेटा: <a href="https://www.themoviedb.org/">TMDB</a>। यह उत्पाद TMDB API का उपयोग करता है, लेकिन TMDB द्वारा समर्थित या प्रमाणित नहीं है। चैनल लोगो और मुफ़्त चैनल सूचियाँ: <a href="https://github.com/iptv-org">iptv-org</a>; ट्रेडमार्क और चित्र उनके मालिकों के हैं। टीवी गाइड: xmltvfr.fr और epgshare01। रेडियो: Radio Browser। प्लेयर वीडियो: टेस्ट स्ट्रीम <i>Big Buck Bunny</i> © Blender Foundation, CC BY 3.0।</sub></p>
