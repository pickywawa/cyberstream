<p align="center">
  <a href="https://pickywawa.github.io/cyberstream/en/">
    <img src="docs/assets/banner-en.png" alt="Cyberstream — Rust انجن والا IPTV پلیئر" width="100%" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/pickywawa/cyberstream/releases/latest"><img alt="تازہ ترین ورژن" src="https://img.shields.io/github/v/release/pickywawa/cyberstream?style=for-the-badge&color=4fe3a8&labelColor=0b0b0d&label=version" /></a>
  <img alt="Rust + WebAssembly" src="https://img.shields.io/badge/engine-Rust%20%2B%20Wasm-4fe3a8?style=for-the-badge&labelColor=0b0b0d&logo=rust&logoColor=4fe3a8" />
  <a href="LICENSE"><img alt="MIT لائسنس" src="https://img.shields.io/badge/license-MIT-4fe3a8?style=for-the-badge&labelColor=0b0b0d" /></a>
  <img alt="پلیٹ فارمز" src="https://img.shields.io/badge/Android%20%C2%B7%20TV%20%C2%B7%20iOS%20%C2%B7%20Desktop%20%C2%B7%20Web-2de2ff?style=for-the-badge&labelColor=0b0b0d" />
</p>

<p align="center">
  <b><a href="https://pickywawa.github.io/cyberstream/en/">ویب سائٹ</a></b> ·
  <b><a href="https://github.com/pickywawa/cyberstream/releases/latest">ڈاؤن لوڈ</a></b> ·
  <a href="#-%D8%AE%D8%B5%D9%88%D8%B5%DB%8C%D8%A7%D8%AA">خصوصیات</a> ·
  <a href="#-%D8%B2%D8%A8%D8%A7%D9%86%DB%8C%DA%BA-%D8%A7%D9%88%D8%B1-%D9%85%D9%85%D8%A7%D9%84%DA%A9">ممالک</a> ·
  <a href="#%EF%B8%8F-%D8%A7%D8%B3%DA%A9%D8%B1%DB%8C%D9%86-%D8%B4%D8%A7%D9%B9%D8%B3">اسکرین شاٹس</a> ·
  <a href="#%EF%B8%8F-%D8%A8%D9%84%DA%88-%D8%A7%D9%88%D8%B1-%D9%B9%DB%8C%D8%B3%D9%B9">بلڈ</a>
  <br />
  <a href="README.md">English</a> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a> · <a href="README.pt.md">Português</a> · <a href="README.ru.md">Русский</a> · <a href="README.zh.md">中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.hi.md">हिन्दी</a> · <a href="README.bn.md">বাংলা</a> · <b>اردو</b> · <a href="README.ar.md">العربية</a> · <a href="README.id.md">Bahasa Indonesia</a>
</p>

---

<div dir="rtl">

**Cyberstream** آپ کے **Xtream Codes** اور **M3U** ذرائع چلاتا ہے: لائیو چینل، ٹی وی گائیڈ، فلمیں، سیریز اور کیچ اپ۔ یہ IPTV پلیئر CyberTV کو Rust میں منتقل کرتا ہے: ایک ہی WebAssembly ماڈیول براؤزر، Android فونز اور ٹی وی، iOS اور Electron میں چلتا ہے۔ Android ویڈیو ڈی کوڈنگ اور ٹریک کے انتخاب کے لیے Media3 استعمال کرتا ہے۔

> [!NOTE]
> Cyberstream ایک پلیئر ہے۔ یہ کوئی مواد فراہم نہیں کرتا: آپ اپنے ذرائع استعمال کرتے ہیں۔

<p align="center">
  <img src="docs/assets/demo.gif" alt="ڈیمو: پروفائل، ہوم، فلم کا صفحہ، لائیو ٹی وی، گائیڈ اور تلاش" width="100%" />
  <br />
  <sub>ڈیمو ذریعے اور TMDB میٹا ڈیٹا کے ساتھ ریکارڈ کیا گیا۔ انٹرفیس فرانسیسی میں دکھایا گیا ہے۔</sub>
</p>

## ⚡ خصوصیات

| | |
| --- | --- |
| 📡 **Xtream اور M3U** | کیٹلاگ حصوں میں پڑھے جاتے ہیں، بیک اپ سرور، ڈیفرینشل سنک۔ |
| 🗓️ **XMLTV گائیڈ** | ورچوئلائزڈ گرڈ، “ابھی” کی لکیر، گزرے پروگراموں کا کیچ اپ۔ |
| 🎬 **فلمیں اور سیریز** | TMDB سے بھرپور صفحات: اداکار، کلیکشنز، عمر کی درجہ بندی، سیزن، وہیں سے جاری، اگلی قسط۔ |
| ⏸️ **لائیو پاز** | 30 سے 60 منٹ کا مقامی بفر، ±10 سیکنڈ، لائیو پر واپسی، بیک اپ اسٹریم پر خودکار منتقلی۔ |
| 🎙️ **صوتی احکامات** | “چینل 5 لگاؤ”، “Dune تلاش کرو”، “30 سیکنڈ پیچھے جاؤ”، انٹرفیس کی تمام 14 زبانوں میں۔ |
| 📱 **QR کوڈ سے سیٹ اپ** | ٹی وی آپ کے فون سے پروفائل، ذرائع اور سیٹنگز لے لیتا ہے۔ |
| 🔁 **مفت کیچ اپ** | ARTE، france.tv، Okoo، ARD Mediathek اور میڈیا اداروں کے 600 سے زیادہ YouTube چینل، آپ کے ممالک کے مطابق۔ |
| 💬 **سب ٹائٹلز اور Trakt** | SRT، WebVTT، OpenSubtitles ہیش میچنگ، Trakt اسکروبلنگ اور واچ لسٹ۔ |
| 🌍 **14 زبانیں، 42 ممالک** | ہر منتخب ملک کے لیے مفت چینل، ٹی وی گائیڈ، ریڈیو اور اسکور، ایک پروفائل میں کئی ممالک۔ |
| 👤 **پروفائلز** | ہر پروفائل کا اپنا اوتار، زبان اور عمر کی حد۔ سروسز کے ٹوکن ڈیوائس کے محفوظ اسٹور میں رہتے ہیں۔ |

## 🌍 زبانیں اور ممالک

**انٹرفیس** 14 زبانوں میں: فرانسیسی، انگریزی، جرمن، ہسپانوی، اطالوی، پرتگالی، عربی، ہندی، چینی، بنگالی، انڈونیشیائی، اردو، روسی اور جاپانی۔ عربی اور اردو دائیں سے بائیں دکھائی جاتی ہیں۔ صوتی احکامات، تاریخیں، TMDB صفحات کی زبان اور اسپیچ ریکگنیشن پروفائل کی زبان کی پیروی کرتے ہیں۔

**ایک پروفائل میں کئی ممالک۔** پروفائل میں ایک یا زیادہ ممالک منتخب کریں (مثلاً پاکستان اور برطانیہ)۔ پہلا ملک مرکزی ملک ہوتا ہے۔ ہر منتخب ملک کے لیے ایپ شامل کرتی ہے:

- **مفت چینل**: [iptv-org](https://github.com/iptv-org/iptv) میں درج عوامی مفت اسٹریمز، ایک ذریعے کے طور پر۔ پروفائل بناتے وقت “میرے ممالک کے مفت چینل” کا آپشن دیا جاتا ہے: ایپ IPTV سبسکرپشن کے بغیر بھی چلتی ہے۔
- **مفت ٹی وی گائیڈ**: فرانس کے لیے [xmltvfr.fr](https://xmltvfr.fr)، دوسرے ممالک کے لیے [epgshare01](https://epgshare01.online)۔
- **کیچ اپ**: france.tv اور Okoo (فرانس)، ARD Mediathek (جرمنی، آسٹریا)، ARTE (یورپ میں، چھ زبانوں میں)۔
- **YouTube**: موضوع کے لحاظ سے ملک کے میڈیا چینل (خبریں، کھیل، دستاویزی، مزاح، میڈیا، ریڈیو)۔ سب کی جانچ کی گئی ہے: ہر چینل اپنی عوامی RSS فیڈ کے ذریعے شائع کرتا ہے۔
- **ریڈیو**: [Radio Browser](https://www.radio-browser.info) سے ملک کے سب سے زیادہ سنے جانے والے اسٹیشن۔ تمام ممالک شامل ہیں۔
- **لائیو اسکور**: ملک کی لیگز۔

**ملک کا فلٹر۔** “صرف میرے ممالک کے چینل” کا آپشن ذریعہ ڈاؤن لوڈ کرتے وقت دوسرے ممالک کے چینل زمرے (“UK|”، “DE:”، “[BE]”…) نکال دیتا ہے۔ یہ ذریعہ سیٹ کرتے وقت، پہلے ڈاؤن لوڈ سے پہلے پیش کیا جاتا ہے۔

| ملک | مفت چینل | ٹی وی گائیڈ | کیچ اپ | YouTube | اسکور |
| --- | --- | --- | --- | --- | --- |
| 🇫🇷 فرانس | ≈231 (TF1, France 2, M6, Arte) | ہاں | france.tv, Okoo, ARTE | 21 (BFMTV, franceinfo…) | Ligue 1, Champions League, Premier League |
| 🇧🇪 بیلجیم | ≈60 (La Une, Tipik, RTL-TVI, BX1) | ہاں | ARTE | 10 (RTBF, RTBF Info…) | Pro League, Ligue 1, Champions League |
| 🇨🇭 سوئٹزر لینڈ | ≈137 (RTS, RSI, Couleur 3, 3sat) | ہاں | ARTE | 9 (RTS Info, Schweizer Radio und Fernsehen…) | Super League, Ligue 1, Bundesliga |
| 🇱🇺 لکسمبرگ | ≈20 (RTL, Eldo) | ہاں | ARTE | 2 (RTL Luxembourg, Wort…) | Ligue 1, Bundesliga, Champions League |
| 🇨🇦 کینیڈا | ≈265 (CBC, CTV, Télé-Québec) | ہاں | — | 14 (CBC News, CTV News…) | NHL, NBA, NFL |
| 🇲🇦 مراکش | ≈13 (2M, Al Aoula, Medi1) | — | — | 10 (2MTV, Hespress…) | AFCON, Ligue 1, LaLiga |
| 🇩🇿 الجیریا | ≈9 (Canal Algérie, Ennahar) | — | — | 7 (Ennahar Tv Plus, EchoroukTV…) | AFCON, Ligue 1, Champions League |
| 🇹🇳 تونس | ≈4 (Watania, Nessma) | — | — | 7 (Mosaique FM, Nessma TV…) | AFCON, Ligue 1, Champions League |
| 🇬🇧 سلطنت متحدہ | ≈302 (BBC One, BBC News, Channel 4) | ہاں | ARTE | 30 (BBC News, Sky News…) | Premier League, Champions League |
| 🇮🇪 آئرلینڈ | ≈58 (RTÉ News, Virgin Media) | ہاں | ARTE | 9 (RTÉ News, The Irish Times…) | Premier Division, Premier League, Champions League |
| 🇺🇸 ریاست ہائے متحدہ امریکہ | ≈1538 (PBS, ABC News, CBS News) | ہاں | — | 41 (CNN, NBC News…) | NFL, NBA, NHL |
| 🇦🇺 آسٹریلیا | ≈78 (ABC, 7, 9) | ہاں | — | 11 (9 News Australia, SBS News…) | AFL, A-League, Premier League |
| 🇳🇿 نیوزی لینڈ | ≈36 (TVNZ, Whakaata Māori) | ہاں | — | 6 (RNZ, 1News…) | A-League, Premier League |
| 🇩🇪 جرمنی | ≈303 (Das Erste, ZDF, 3sat, tagesschau24) | ہاں | ARD Mediathek, ARTE | 28 (tagesschau, ZDFheute Nachrichten…) | Bundesliga, Champions League |
| 🇦🇹 آسٹریا | ≈114 (ORF, ServusTV, PULS 24) | ہاں | ARD Mediathek, ARTE | 9 (PULS 24, Kronen Zeitung…) | Bundesliga (AT), Bundesliga, Champions League |
| 🇪🇸 ہسپانیہ | ≈305 (3Cat, À Punt, 24 Horas, Atreseries) | ہاں | ARTE | 27 (Antena 3 Noticias, EL PAÍS…) | LaLiga, Champions League, NBA |
| 🇲🇽 میکسیکو | ≈179 (Canal 22, Canal Once, Azteca) | ہاں | — | 12 (NMás, MILENIO…) | Liga MX, Concacaf, LaLiga |
| 🇦🇷 ارجنٹینا | ≈224 (Telefe, TN, A24) | ہاں | — | 11 (C5N, LA NACION…) | Liga Profesional, Libertadores, LaLiga |
| 🇨🇴 کولمبیا | ≈171 (Canal Capital, Señal Colombia) | ہاں | — | 7 (Noticias Caracol, Noticias RCN…) | Primera A, Libertadores, LaLiga |
| 🇨🇱 چلی | ≈220 (TVN, 24 Horas, T13) | ہاں | — | 9 (Teletrece, CHV Noticias…) | Primera División, Libertadores, LaLiga |
| 🇮🇹 اٹلی | ≈359 (Rai 1, Rai 2, Rai 3, Rai News 24) | ہاں | ARTE | 21 (RaiNews, Sky tg24…) | Serie A, Champions League |
| 🇵🇹 پرتگال | ≈72 (RTP 1, RTP 2, RTP Notícias, SIC) | ہاں | — | 10 (RTP Notícias, TVI…) | Liga Portugal, Champions League |
| 🇧🇷 برازیل | ≈401 (TV Cultura, Record News, SBT) | ہاں | — | 23 (g1, CNN Brasil…) | Brasileirão, Libertadores, NBA |
| 🇳🇱 نیدر لینڈز | ≈175 (NPO, AT5) | ہاں | — | 11 (NOS, RTL Nieuws…) | Eredivisie, Champions League |
| 🇹🇷 ترکیہ | ≈180 (TRT 1, TRT Haber, NTV) | ہاں | — | 8 (TRT Haber, CNN TÜRK…) | Süper Lig, Champions League |
| 🇵🇱 پولینڈ | ≈188 (TVP Info, TVP World) | ہاں | ARTE | 12 (tvn24, Polsat…) | Champions League |
| 🇷🇺 روس | ≈518 (2x2, 360°, RT) | — | — | 19 (Телеканал Дождь, BBC News - Русская служба…) | RPL |
| 🇸🇦 سعودی عرب | ≈56 (Al Saudiya, Al Ekhbariya, Asharq News) | ہاں | — | 17 (AlArabiya العربية, سكاي نيوز عربية…) | Saudi Pro League, AFC Champions League, Premier League |
| 🇦🇪 متحدہ عرب امارات | ≈23 (Dubai TV, Abu Dhabi TV) | ہاں | — | 10 (سكاي نيوز عربية, AlArabiya العربية…) | AFC Champions League, Premier League, LaLiga |
| 🇶🇦 قطر | ≈10 (Al Jazeera, Al Rayyan) | — | — | 4 (Al Jazeera English, العربي - أخبار…) | AFC Champions League, Premier League, LaLiga |
| 🇪🇬 مصر | ≈21 (Nile Drama, MBC Masr, Al Ghad) | — | — | 11 (CBC Egypt, Sada Elbalad - صدى البلد…) | AFCON, Premier League, LaLiga |
| 🇮🇳 بھارت | ≈826 (DD National, DD News, Aaj Tak, NDTV) | ہاں | — | 30 (Aaj Tak, NDTV…) | ISL, Premier League |
| 🇵🇰 پاکستان | ≈105 (PTV, ARY News, Dunya News) | — | — | 19 (Geo News, ARY News…) | Premier League |
| 🇧🇩 بنگلہ دیش | ≈37 (ATN Bangla, NTV, T Sports, Ekhon) | — | — | 17 (SOMOY TV, Jamuna TV Plus…) | Premier League |
| 🇮🇩 انڈونیشیا | ≈177 (TVRI, Kompas TV, Metro TV) | ہاں | — | 28 (CNN Indonesia, tvOneNews…) | Super League, Premier League |
| 🇲🇾 ملائشیا | ≈6 (TV1, TV2) | ہاں | — | 6 (Astro AWANI, Berita Harian Online…) | Super League, Premier League |
| 🇸🇬 سنگاپور | ≈9 (CNA) | ہاں | — | 5 (CNA Insider, CNA…) | Premier League |
| 🇨🇳 چین | ≈156 (CCTV-1, CCTV-4, CCTV-13) | — | — | 11 (CGTN, CCTV Video News Agency…) | CSL, NBA |
| 🇹🇼 تائیوان | ≈34 (PTS, TTV) | — | — | 10 (TVBS NEWS, SETN News Network…) | NBA, MLB |
| 🇭🇰 ہانگ کانگ | ≈18 (RTHK, TVB) | ہاں | — | 7 (TVB NEWS Official 無綫新聞, RTHK 香港電台…) | Premier League, NBA |
| 🇯🇵 جاپان | ≈17 (NHK General, Nippon TV, TV Asahi, Fuji TV) | ہاں | — | 22 (ANNnewsCH, TBS NEWS DIG Powered by JNN…) | J1 League, MLB |
| 🇰🇷 جنوبی کوریا | ≈72 (KBS, MBC, Arirang) | — | — | 16 (YTN, SBS News…) | MLB, Premier League |

مفت چینلز کی تعداد تحریر کے وقت کی iptv-org فہرستوں سے لی گئی ہے۔ ان میں سے کچھ اسٹریمز صرف اپنے ملک میں چلتی ہیں یا اکثر بدلتی رہتی ہیں۔ ARD کی کچھ ویڈیوز صرف جرمنی، آسٹریا اور سوئٹزرلینڈ میں دیکھی جا سکتی ہیں۔

**شامل نہ کی گئی سروسز۔** BBC iPlayer، ITVX اور Channel 4 کے لیے اکاؤنٹ اور برطانیہ سے کنکشن درکار ہے، اور iPlayer کے لیے ٹی وی لائسنس بھی۔ PBS ہر اسٹیشن کی ایپ اور اکاؤنٹ کے ذریعے چلتا ہے۔ RTVE Play اپنی ویڈیوز کو DRM سے محفوظ رکھتا ہے۔ RaiPlay اپنے کیٹلاگ کا بڑا حصہ اٹلی تک محدود رکھتا ہے، اکثر سائن اِن کے ساتھ۔ جب ان کے لائیو چینل مفت نشر ہوتے ہیں تو وہ مفت چینلز میں نظر آتے ہیں، اور ان کے YouTube چینل کیچ اپ میں ہیں۔

## 🖼️ اسکرین شاٹس

<table>
  <tr>
    <td width="50%"><img src="docs/assets/screens/home-rows.webp" alt="فلموں اور سیریز کی قطاروں والا ہوم" /><p align="center"><sub>ہوم</sub></p></td>
    <td width="50%"><img src="docs/assets/screens/live.webp" alt="لائیو ٹی وی" /><p align="center"><sub>لائیو ٹی وی</sub></p></td>
  </tr>
  <tr>
    <td><img src="docs/assets/screens/guide.webp" alt="ٹی وی گائیڈ" /><p align="center"><sub>ٹی وی گائیڈ</sub></p></td>
    <td><img src="docs/assets/screens/movie.webp" alt="فلم کا صفحہ" /><p align="center"><sub>فلم کا صفحہ</sub></p></td>
  </tr>
  <tr>
    <td><img src="docs/assets/screens/series-episodes.webp" alt="سیریز کے سیزن اور اقساط" /><p align="center"><sub>سیریز</sub></p></td>
    <td><img src="docs/assets/screens/player.webp" alt="پلیئر" /><p align="center"><sub>پلیئر — ٹیسٹ اسٹریم <i>Big Buck Bunny</i> © Blender Foundation, CC BY</sub></p></td>
  </tr>
</table>

<p align="center">
  <img src="docs/assets/screens/mobile-home.webp" alt="فون پر ہوم" width="30%" />
  &nbsp;
  <img src="docs/assets/screens/mobile-rows.webp" alt="فون پر قطاریں" width="30%" />
  &nbsp;
  <img src="docs/assets/screens/mobile-movie.webp" alt="فون پر فلم کا صفحہ" width="30%" />
</p>

## 📦 انسٹال کریں

[تازہ ترین ریلیز](https://github.com/pickywawa/cyberstream/releases/latest) سے `Cyberstream-x.y.z.apk` ڈاؤن لوڈ کریں، پھر اسے اپنے فون یا ٹی وی پر انسٹال کریں:

```sh
adb -d install -r Cyberstream-1.0.1.apk
```

Android پیکیج `app.cyberstream.player` ہے۔ وہی APK فونز پر انسٹال ہوتا ہے اور Android TV لانچر میں بھی نظر آتا ہے۔ اعلان کردہ کم از کم ورژن Android 7 (API 24) ہے۔ انٹرفیس کو ایسا WebView درکار ہے جو WebAssembly اور JavaScript ماڈیولز کو سپورٹ کرے؛ صرف سسٹم ورژن اس کی ضمانت نہیں دیتا۔

## 🦀 پورٹنگ کی صورتحال

پری ریلیز CyberTV 0.16.0 کے مطابق ہے۔ پورٹ ابھی ہائبرڈ ہے۔

| خصوصیت | اس ورژن میں عمل درآمد |
| --- | --- |
| Xtream اور M3U ذرائع | Rust کیٹلاگ حصوں میں پڑھتا ہے، اندراجات کی درجہ بندی کرتا ہے اور پلے بیک اور کیچ اپ URL بناتا ہے۔ TypeScript ورکر درخواستوں، بیک اپ سرورز، بیک گراؤنڈ ڈاؤن لوڈز اور IndexedDB ٹرانزیکشنز کو مربوط کرتا ہے۔ |
| XMLTV گائیڈ | Rust gzip کھولتا ہے، پروگرام پڑھتا ہے، ٹائم زونز سنبھالتا ہے اور گرڈ کے نظر آنے والے خانے بناتا ہے۔ امپورٹ کے دوران IndexedDB پچھلا شیڈول دستیاب رکھتا ہے۔ |
| تلاش اور درجہ بندی | Rust عنوانات کا انڈیکس بناتا ہے، چینلز کی درجہ بندی کرتا ہے، زبانیں پہچانتا ہے اور LZ4 سے کمپریس شدہ صفحات سے کیٹلاگ انڈیکس بحال کرتا ہے۔ |
| فلمیں اور سیریز | Rust، Xtream اقساط اور TMDB میٹا ڈیٹا پڑھتا ہے، جن میں عمر کی درجہ بندی، اداکار اور کلیکشنز شامل ہیں۔ Rust صفحات کے ہیڈر، سیزن، اقساط، لائبریری اور کارڈ بناتا ہے۔ ٹریک کا انتخاب اور اسٹریم کے اندر سیک کے فیصلے بھی Rust کرتا ہے۔ |
| کیچ اپ اور سب ٹائٹلز | Rust، ARTE اور france.tv کے کیٹلاگ اور اسٹریمز، YouTube RSS فیڈز، SRT اور WebVTT، اور OpenSubtitles ہیش سنبھالتا ہے۔ |
| انٹرفیس اور ریموٹ | مرکزی مینو، پروفائل ٹائلز، تراجم، سمتی نیویگیشن، ورچوئلائزیشن اور صوتی احکامات Rust میں ہیں۔ Trakt کلائنٹ، OpenSubtitles کی درجہ بندی اور QR کوڈ تبادلے کی تصدیق بھی۔ ہوم، گرڈز، تلاش کے نتائج اور Replay صفحات کے Rust ویوز ہیں۔ React اور TypeScript اسکرینز ماؤنٹ کرتے ہیں، ایونٹس اور کئی سروس انٹیگریشنز سنبھالتے ہیں۔ |
| ڈیوائس کی خصوصیات | Android، Media3، کیش، ٹائم شفٹ، محفوظ اسٹور اور ٹی وی پیئرنگ کے لیے Java برجز رکھتا ہے۔ iOS ہوسٹ Swift اور ڈیسک ٹاپ ہوسٹ Electron استعمال کرتا ہے۔ |

منتقلی کے دوران استعمال کے بہاؤ برقرار رکھنے کے لیے CyberTV کی اسکرینیں لی گئی ہیں۔ Android TV، iOS اور ڈیسک ٹاپ پر مکمل مطابقت کی جانچ ابھی باقی ہے۔ اصل تفصیلات [docs/SPECIFICATIONS.md](docs/SPECIFICATIONS.md) میں ہیں (فرانسیسی میں)۔

## 🛠️ بلڈ اور ٹیسٹ

ویب اور مقامی ٹیسٹس کے تقاضے: WebAssembly ٹارگٹ کے ساتھ مستحکم Rust، Node.js 22.12 یا بعد کا، اور npm۔ بائنڈنگز جنریٹر کا ورژن crate کے ورژن سے مماثل ہونا چاہیے۔

```sh
rustup target add wasm32-unknown-unknown
cargo install --locked wasm-bindgen-cli --version 0.2.108
npm ci
cargo test --locked
npm test
npm run build
```

Android SDK 36، JDK 21 اور سیٹ کیے گئے `JAVA_HOME` اور `ANDROID_HOME` کے ساتھ:

```sh
npm run android:apk
adb -d install -r android/app/build/outputs/apk/debug/app-debug.apk
```

پروفائل اور ذرائع ڈیوائس پر سیٹ کیے جاتے ہیں۔ فرضی ڈیٹا کے ساتھ ویب ورژن آزمانے کے لیے `npm run dev -- --host 127.0.0.1` چلائیں اور سیٹ اپ کے دوران ڈیمو ذریعہ منتخب کریں۔ اختیاری سروس کیز پروفائل سیٹنگز میں ڈالی جاتی ہیں۔ ورژن 0.16.3 سے، پلیئر Cyberstream کی GitHub ریلیزز (بشمول پری ریلیزز) چیک کرتا ہے۔ ہر Android ریلیز کے ساتھ اس کا `update.json` مینی فیسٹ اور اس میں حوالہ دیا گیا APK منسلک ہونا چاہیے۔ کوئی دوسرا چینل ٹیسٹ کرنے کے لیے بلڈ کے وقت `CYBER_UPDATE_URL` کو مینی فیسٹ URL پر سیٹ کریں۔ ورژن 0.16.1 اور 0.16.2 کے صارفین کو ایک بار نیا APK دستی طور پر انسٹال کرنا ہوگا۔

## 📺 Android TV پر وسائل

کیٹلاگ گرڈ ترتیب شدہ ID رکھتا ہے اور نظر آنے والی قطاروں کے مطابق قطار در قطار پوسٹر لوڈ کرتا ہے۔ پہلا ڈاؤن لوڈ پروفائل کی آڈیو زبانوں والے زمرے منتخب کرتا ہے، تمام زبانیں رکھنے کے آپشن کے ساتھ۔

Xtream اندراجات کا فنگر پرنٹ دو سنک کے درمیان غیر تبدیل شدہ قطاریں برقرار رکھتا ہے۔ گائیڈ بھی مستحکم سلاٹ ID رکھتا ہے اور تبدیل شدہ پروگرام دوبارہ لکھتا ہے۔

لانچر اور انٹرفیس کے آئیکن ویکٹر تصاویر ہیں۔ Android موصول شدہ SVG اور اینیمیشنز رکھتا ہے اور تصاویر کو ان کے استعمال کے مطابق چھوٹا بڑا کرتا ہے۔ زیادہ سے زیادہ کنارہ لوگو کے لیے 224 پکسل، کارڈ کے لیے 448 اور ہیرو تصویر کے لیے 1,024 ہے۔ ایک وقت میں دو تصاویر ڈی کوڈ ہو سکتی ہیں۔ ڈسک کیش کا ہدف 96 MiB ہے، اور سب سے کم حال میں استعمال شدہ فائلیں وقتاً فوقتاً ہٹائی جاتی ہیں۔

Android پر پرفارمنس موڈ بطور ڈیفالٹ آن ہے۔ ہوم فلموں کا ایک محدود نمونہ پڑھتا ہے۔ اس موڈ میں تلاش ضرورت پڑنے پر اپنا انڈیکس بناتی ہے۔ کم میموری والے نشان زدہ ڈیوائس پر پلیئر 24 MiB میڈیا بفر کا ہدف رکھتا ہے۔ یہ حدود مخصوص ذیلی نظاموں پر لاگو ہوتی ہیں۔ کل میموری، اسٹارٹ اپ وقت اور روانی کو ہدف ٹی وی پر ناپنا ضروری ہے۔

## 🌐 ویب سائٹ

ویب سائٹ [`docs/`](docs/) میں ہے (سادہ HTML، CSS اور JS، بغیر بلڈ مرحلے کے)، روٹ میں فرانسیسی اور `docs/en/` میں انگریزی۔ یہ GitHub Pages کے ذریعے `main` برانچ کے `/docs` فولڈر سے شائع ہوتی ہے۔ مقامی پیش نظارہ:

```sh
python3 -m http.server 8090 -d docs
```

## 📄 لائسنس

کوڈ [MIT](LICENSE) لائسنس کے تحت جاری کیا گیا ہے۔

</div>

---

<p align="center"><sub>پوسٹر، تصاویر اور میٹا ڈیٹا: <a href="https://www.themoviedb.org/">TMDB</a>۔ یہ پروڈکٹ TMDB API استعمال کرتی ہے لیکن TMDB کی طرف سے توثیق شدہ یا تصدیق شدہ نہیں ہے۔ چینل لوگو اور مفت چینلز کی فہرستیں: <a href="https://github.com/iptv-org">iptv-org</a>؛ ٹریڈ مارکس اور فن پارے ان کے مالکان کی ملکیت ہیں۔ ٹی وی گائیڈز: xmltvfr.fr اور epgshare01۔ ریڈیو: Radio Browser۔ پلیئر ویڈیو: ٹیسٹ اسٹریم <i>Big Buck Bunny</i> © Blender Foundation, CC BY 3.0۔</sub></p>
