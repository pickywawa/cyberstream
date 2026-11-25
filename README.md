<p align="center">
  <a href="https://pickywawa.github.io/cyberstream/en/">
    <img src="docs/assets/banner-en.png" alt="Cyberstream — IPTV player with a Rust engine" width="100%" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/pickywawa/cyberstream/releases/latest"><img alt="Latest release" src="https://img.shields.io/github/v/release/pickywawa/cyberstream?style=for-the-badge&color=4fe3a8&labelColor=0b0b0d&label=version" /></a>
  <img alt="Rust + WebAssembly" src="https://img.shields.io/badge/engine-Rust%20%2B%20Wasm-4fe3a8?style=for-the-badge&labelColor=0b0b0d&logo=rust&logoColor=4fe3a8" />
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-4fe3a8?style=for-the-badge&labelColor=0b0b0d" /></a>
  <img alt="Platforms" src="https://img.shields.io/badge/Android%20%C2%B7%20TV%20%C2%B7%20iOS%20%C2%B7%20Desktop%20%C2%B7%20Web-2de2ff?style=for-the-badge&labelColor=0b0b0d" />
</p>

<p align="center">
  <b><a href="https://pickywawa.github.io/cyberstream/en/">Website</a></b> ·
  <b><a href="https://github.com/pickywawa/cyberstream/releases/latest">Download</a></b> ·
  <a href="#-features">Features</a> ·
  <a href="#-languages-and-countries">Countries</a> ·
  <a href="#%EF%B8%8F-screenshots">Screenshots</a> ·
  <a href="#%EF%B8%8F-build-and-test">Build</a>
  <br />
  <b>English</b> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a> · <a href="README.pt.md">Português</a> · <a href="README.ru.md">Русский</a> · <a href="README.zh.md">中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.hi.md">हिन्दी</a> · <a href="README.bn.md">বাংলা</a> · <a href="README.ur.md">اردو</a> · <a href="README.ar.md">العربية</a> · <a href="README.id.md">Bahasa Indonesia</a>
</p>

---

**Cyberstream** plays your **Xtream Codes** and **M3U** sources: live channels, TV guide, movies, series and catch-up. It ports the CyberTV IPTV player to Rust: the same WebAssembly module runs in the browser, on Android phones and TVs, on iOS and in Electron. Android uses Media3 for video decoding and track selection.

> [!NOTE]
> Cyberstream is a player. It does not provide any content: you use your own sources.

<p align="center">
  <img src="docs/assets/demo.gif" alt="Demo: profile, home, movie page, live TV, guide and search" width="100%" />
  <br />
  <sub>Recorded with the demo source and TMDB metadata. The interface is shown in French.</sub>
</p>

## ⚡ Features

| | |
| --- | --- |
| 📡 **Xtream & M3U** | Catalogues read in chunks, backup servers, differential sync. |
| 🗓️ **XMLTV guide** | Virtualised grid, “now” line, catch-up of past programmes. |
| 🎬 **Movies & series** | Pages enriched by TMDB: cast, collections, age rating, seasons, resume, next episode. |
| ⏸️ **Live pause** | Local 30 to 60 min buffer, ±10 s, back to live, automatic switch to a backup stream. |
| 🎙️ **Voice commands** | “Put on channel 5”, “search Dune”, “go back 30 seconds”, in the 14 interface languages. |
| 📱 **QR code setup** | The TV gets the profile, sources and settings from your phone. |
| 🔁 **Free catch-up** | ARTE, france.tv, Okoo, ARD Mediathek and over 600 YouTube channels of media outlets, depending on your countries. |
| 💬 **Subtitles & Trakt** | SRT, WebVTT, OpenSubtitles hash matching, Trakt scrobbling and watchlist. |
| 🌍 **14 languages, 42 countries** | Free channels, TV guide, radios and scores for each followed country, several countries per profile. |
| 👤 **Profiles** | Avatar, language and age limit per profile. Service tokens stay in the device's secret store. |

## 🌍 Languages and countries

**Interface** in 14 languages: French, English, German, Spanish, Italian, Portuguese, Arabic, Hindi, Chinese, Bengali, Indonesian, Urdu, Russian and Japanese. Arabic and Urdu are shown right to left. Voice commands, dates, the language of TMDB pages and speech recognition follow the profile’s language.

**Several countries per profile.** In the profile, pick one or several countries (for example France and Switzerland). The first one is the main country. For each followed country, the app adds:

- **Free channels**: the public free streams listed by [iptv-org](https://github.com/iptv-org/iptv), added as a source. The “Free channels of my countries” option is offered when the profile is created: the app works without an IPTV subscription.
- **Free TV guide**: [xmltvfr.fr](https://xmltvfr.fr) for France, [epgshare01](https://epgshare01.online) for the other countries.
- **Catch-up**: france.tv and Okoo (France), ARD Mediathek (Germany, Austria), ARTE (in six languages, in Europe).
- **YouTube**: the country’s media channels by theme (news, sport, docs, comedy, media, radio). All of them were checked: each publishes through its public RSS feed.
- **Radios**: the country’s most listened stations, from [Radio Browser](https://www.radio-browser.info). Every country is covered.
- **Live scores**: the country’s leagues.

**Country filter.** The “Only my countries’ channels” option leaves out, when your source is downloaded, the channel categories of other countries (“UK|”, “DE:”, “[BE]”…). It is offered while setting up the source, before the first download.

| Country | Free channels | TV guide | Catch-up | YouTube | Scores |
| --- | --- | --- | --- | --- | --- |
| 🇫🇷 France | ≈231 (TF1, France 2, M6, Arte) | yes | france.tv, Okoo, ARTE | 21 (BFMTV, franceinfo…) | Ligue 1, Champions League, Premier League |
| 🇧🇪 Belgium | ≈60 (La Une, Tipik, RTL-TVI, BX1) | yes | ARTE | 10 (RTBF, RTBF Info…) | Pro League, Ligue 1, Champions League |
| 🇨🇭 Switzerland | ≈137 (RTS, RSI, Couleur 3, 3sat) | yes | ARTE | 9 (RTS Info, Schweizer Radio und Fernsehen…) | Super League, Ligue 1, Bundesliga |
| 🇱🇺 Luxembourg | ≈20 (RTL, Eldo) | yes | ARTE | 2 (RTL Luxembourg, Wort…) | Ligue 1, Bundesliga, Champions League |
| 🇨🇦 Canada | ≈265 (CBC, CTV, Télé-Québec) | yes | — | 14 (CBC News, CTV News…) | NHL, NBA, NFL |
| 🇲🇦 Morocco | ≈13 (2M, Al Aoula, Medi1) | — | — | 10 (2MTV, Hespress…) | AFCON, Ligue 1, LaLiga |
| 🇩🇿 Algeria | ≈9 (Canal Algérie, Ennahar) | — | — | 7 (Ennahar Tv Plus, EchoroukTV…) | AFCON, Ligue 1, Champions League |
| 🇹🇳 Tunisia | ≈4 (Watania, Nessma) | — | — | 7 (Mosaique FM, Nessma TV…) | AFCON, Ligue 1, Champions League |
| 🇬🇧 United Kingdom | ≈302 (BBC One, BBC News, Channel 4) | yes | ARTE | 30 (BBC News, Sky News…) | Premier League, Champions League |
| 🇮🇪 Ireland | ≈58 (RTÉ News, Virgin Media) | yes | ARTE | 9 (RTÉ News, The Irish Times…) | Premier Division, Premier League, Champions League |
| 🇺🇸 United States | ≈1538 (PBS, ABC News, CBS News) | yes | — | 41 (CNN, NBC News…) | NFL, NBA, NHL |
| 🇦🇺 Australia | ≈78 (ABC, 7, 9) | yes | — | 11 (9 News Australia, SBS News…) | AFL, A-League, Premier League |
| 🇳🇿 New Zealand | ≈36 (TVNZ, Whakaata Māori) | yes | — | 6 (RNZ, 1News…) | A-League, Premier League |
| 🇩🇪 Germany | ≈303 (Das Erste, ZDF, 3sat, tagesschau24) | yes | ARD Mediathek, ARTE | 28 (tagesschau, ZDFheute Nachrichten…) | Bundesliga, Champions League |
| 🇦🇹 Austria | ≈114 (ORF, ServusTV, PULS 24) | yes | ARD Mediathek, ARTE | 9 (PULS 24, Kronen Zeitung…) | Bundesliga (AT), Bundesliga, Champions League |
| 🇪🇸 Spain | ≈305 (3Cat, À Punt, 24 Horas, Atreseries) | yes | ARTE | 27 (Antena 3 Noticias, EL PAÍS…) | LaLiga, Champions League, NBA |
| 🇲🇽 Mexico | ≈179 (Canal 22, Canal Once, Azteca) | yes | — | 12 (NMás, MILENIO…) | Liga MX, Concacaf, LaLiga |
| 🇦🇷 Argentina | ≈224 (Telefe, TN, A24) | yes | — | 11 (C5N, LA NACION…) | Liga Profesional, Libertadores, LaLiga |
| 🇨🇴 Colombia | ≈171 (Canal Capital, Señal Colombia) | yes | — | 7 (Noticias Caracol, Noticias RCN…) | Primera A, Libertadores, LaLiga |
| 🇨🇱 Chile | ≈220 (TVN, 24 Horas, T13) | yes | — | 9 (Teletrece, CHV Noticias…) | Primera División, Libertadores, LaLiga |
| 🇮🇹 Italy | ≈359 (Rai 1, Rai 2, Rai 3, Rai News 24) | yes | ARTE | 21 (RaiNews, Sky tg24…) | Serie A, Champions League |
| 🇵🇹 Portugal | ≈72 (RTP 1, RTP 2, RTP Notícias, SIC) | yes | — | 10 (RTP Notícias, TVI…) | Liga Portugal, Champions League |
| 🇧🇷 Brazil | ≈401 (TV Cultura, Record News, SBT) | yes | — | 23 (g1, CNN Brasil…) | Brasileirão, Libertadores, NBA |
| 🇳🇱 Netherlands | ≈175 (NPO, AT5) | yes | — | 11 (NOS, RTL Nieuws…) | Eredivisie, Champions League |
| 🇹🇷 Türkiye | ≈180 (TRT 1, TRT Haber, NTV) | yes | — | 8 (TRT Haber, CNN TÜRK…) | Süper Lig, Champions League |
| 🇵🇱 Poland | ≈188 (TVP Info, TVP World) | yes | ARTE | 12 (tvn24, Polsat…) | Champions League |
| 🇷🇺 Russia | ≈518 (2x2, 360°, RT) | — | — | 19 (Телеканал Дождь, BBC News - Русская служба…) | RPL |
| 🇸🇦 Saudi Arabia | ≈56 (Al Saudiya, Al Ekhbariya, Asharq News) | yes | — | 17 (AlArabiya العربية, سكاي نيوز عربية…) | Saudi Pro League, AFC Champions League, Premier League |
| 🇦🇪 United Arab Emirates | ≈23 (Dubai TV, Abu Dhabi TV) | yes | — | 10 (سكاي نيوز عربية, AlArabiya العربية…) | AFC Champions League, Premier League, LaLiga |
| 🇶🇦 Qatar | ≈10 (Al Jazeera, Al Rayyan) | — | — | 4 (Al Jazeera English, العربي - أخبار…) | AFC Champions League, Premier League, LaLiga |
| 🇪🇬 Egypt | ≈21 (Nile Drama, MBC Masr, Al Ghad) | — | — | 11 (CBC Egypt, Sada Elbalad - صدى البلد…) | AFCON, Premier League, LaLiga |
| 🇮🇳 India | ≈826 (DD National, DD News, Aaj Tak, NDTV) | yes | — | 30 (Aaj Tak, NDTV…) | ISL, Premier League |
| 🇵🇰 Pakistan | ≈105 (PTV, ARY News, Dunya News) | — | — | 19 (Geo News, ARY News…) | Premier League |
| 🇧🇩 Bangladesh | ≈37 (ATN Bangla, NTV, T Sports, Ekhon) | — | — | 17 (SOMOY TV, Jamuna TV Plus…) | Premier League |
| 🇮🇩 Indonesia | ≈177 (TVRI, Kompas TV, Metro TV) | yes | — | 28 (CNN Indonesia, tvOneNews…) | Super League, Premier League |
| 🇲🇾 Malaysia | ≈6 (TV1, TV2) | yes | — | 6 (Astro AWANI, Berita Harian Online…) | Super League, Premier League |
| 🇸🇬 Singapore | ≈9 (CNA) | yes | — | 5 (CNA Insider, CNA…) | Premier League |
| 🇨🇳 China | ≈156 (CCTV-1, CCTV-4, CCTV-13) | — | — | 11 (CGTN, CCTV Video News Agency…) | CSL, NBA |
| 🇹🇼 Taiwan | ≈34 (PTS, TTV) | — | — | 10 (TVBS NEWS, SETN News Network…) | NBA, MLB |
| 🇭🇰 Hong Kong | ≈18 (RTHK, TVB) | yes | — | 7 (TVB NEWS Official 無綫新聞, RTHK 香港電台…) | Premier League, NBA |
| 🇯🇵 Japan | ≈17 (NHK General, Nippon TV, TV Asahi, Fuji TV) | yes | — | 22 (ANNnewsCH, TBS NEWS DIG Powered by JNN…) | J1 League, MLB |
| 🇰🇷 South Korea | ≈72 (KBS, MBC, Arirang) | — | — | 16 (YTN, SBS News…) | MLB, Premier League |

Free channel counts come from the iptv-org lists at the time of writing. Some of these streams only work in their own country or change often. Some ARD videos can only be watched in Germany, Austria and Switzerland.

**Services not included.** BBC iPlayer, ITVX and Channel 4 need an account and a connection from the United Kingdom, plus a TV licence for iPlayer. PBS goes through each station’s app and account. RTVE Play protects its videos with DRM. RaiPlay keeps much of its catalogue to Italy, often behind a sign-in. Their live channels show up among the free channels when they are broadcast free-to-air, and their YouTube channels are in catch-up.

## 🖼️ Screenshots

<table>
  <tr>
    <td width="50%"><img src="docs/assets/screens/home-rows.webp" alt="Home with movie and series rows" /><p align="center"><sub>Home</sub></p></td>
    <td width="50%"><img src="docs/assets/screens/live.webp" alt="Live TV" /><p align="center"><sub>Live TV</sub></p></td>
  </tr>
  <tr>
    <td><img src="docs/assets/screens/guide.webp" alt="TV guide" /><p align="center"><sub>TV guide</sub></p></td>
    <td><img src="docs/assets/screens/movie.webp" alt="Movie page" /><p align="center"><sub>Movie page</sub></p></td>
  </tr>
  <tr>
    <td><img src="docs/assets/screens/series-episodes.webp" alt="Seasons and episodes of a series" /><p align="center"><sub>Series</sub></p></td>
    <td><img src="docs/assets/screens/player.webp" alt="Player" /><p align="center"><sub>Player — test stream <i>Big Buck Bunny</i> © Blender Foundation, CC BY</sub></p></td>
  </tr>
</table>

<p align="center">
  <img src="docs/assets/screens/mobile-home.webp" alt="Home on a phone" width="30%" />
  &nbsp;
  <img src="docs/assets/screens/mobile-rows.webp" alt="Rows on a phone" width="30%" />
  &nbsp;
  <img src="docs/assets/screens/mobile-movie.webp" alt="Movie page on a phone" width="30%" />
</p>

## 📦 Install

Download `Cyberstream-x.y.z.apk` from the [latest release](https://github.com/pickywawa/cyberstream/releases/latest), then install it on your phone or TV:

```sh
adb -d install -r Cyberstream-1.0.1.apk
```

The Android package is `app.cyberstream.player`. The same APK installs on phones and shows up in the Android TV launcher. The declared minimum is Android 7 (API 24). The interface needs a WebView that supports WebAssembly and JavaScript modules; the system version alone does not guarantee it.

## 🦀 Porting status

The pre-release follows CyberTV 0.16.0. The port is still hybrid.

| Feature | Implementation in this version |
| --- | --- |
| Xtream and M3U sources | Rust reads catalogues in chunks, ranks entries and builds the playback and catch-up URLs. The TypeScript worker orchestrates requests, backup servers, background downloads and IndexedDB transactions. |
| XMLTV guide | Rust decompresses gzip, reads programmes, handles time zones and renders the visible cells of the grid. IndexedDB keeps the previous schedule available during an import. |
| Search and ranking | Rust indexes titles, ranks channels, detects languages and restores the catalogue index from LZ4-compressed pages. |
| Movies and series | Rust reads Xtream episodes and TMDB metadata, including age ratings, cast and collections. Rust renders page headers, seasons, episodes, the library and cards. Track selection and in-stream seek decisions also use Rust. |
| Catch-up and subtitles | Rust handles the ARTE and france.tv catalogues and streams, YouTube RSS feeds, SRT and WebVTT, and the OpenSubtitles hash. |
| Interface and remote | Main menus, profile tiles, translations, directional navigation, virtualisation and voice commands use Rust. The Trakt client, OpenSubtitles ranking and QR code exchange validation use Rust too. Home, grids, search results and Replay pages have Rust views. React and TypeScript mount screens, handle events and several service integrations. |
| Device features | Android keeps Java bridges for Media3, cache, timeshift, the secret store and TV pairing. The iOS host uses Swift and the desktop host uses Electron. |

CyberTV's screens were carried over to keep the user flows during the migration. Full parity on Android TV, iOS and desktop is still to be tested. The original specifications are in [docs/SPECIFICATIONS.md](docs/SPECIFICATIONS.md) (French).

## 🛠️ Build and test

Requirements for web and local tests: stable Rust with the WebAssembly target, Node.js 22.12 or later and npm. The bindings generator must match the crate version.

```sh
rustup target add wasm32-unknown-unknown
cargo install --locked wasm-bindgen-cli --version 0.2.108
npm ci
cargo test --locked
npm test
npm run build
```

With Android SDK 36, JDK 21, `JAVA_HOME` and `ANDROID_HOME` set:

```sh
npm run android:apk
adb -d install -r android/app/build/outputs/apk/debug/app-debug.apk
```

The profile and sources are set up on the device. To try the web version with mock data, run `npm run dev -- --host 127.0.0.1` and pick the demo source during setup. Optional service keys go in the profile settings. Since version 0.16.3, the player checks Cyberstream's GitHub releases, pre-releases included. Each Android release must attach its `update.json` manifest and the APK it references. To test another channel, set `CYBER_UPDATE_URL` to a manifest URL at build time. Users of versions 0.16.1 and 0.16.2 must install a newer APK manually once.

## 📺 Resources on Android TV

The catalogue grid keeps sorted IDs and loads posters row by visible row. The first download selects categories in the profile's audio languages, with an option to keep every language.

A fingerprint of Xtream entries keeps unchanged rows between two syncs. The guide also keeps stable slot IDs and rewrites changed programmes.

Launchers and interface icons are vector drawings. Android keeps received SVGs and animations and resizes photos for their use. The maximum edge is 224 pixels for a logo, 448 for a card and 1,024 for a hero image. Two image decodes can run at the same time. The disk cache targets 96 MiB with periodic eviction of the least recently used files.

Performance mode is on by default on Android. Home reads a bounded sample of movies. Search builds its index on demand in this mode. On a device flagged as low on memory, the player targets a 24 MiB media buffer. These limits bound specific subsystems. Total memory, start-up time and smoothness must be measured on the target TV.

## 🌐 Website

The website lives in [`docs/`](docs/) (plain HTML, CSS and JS, no build step), in French at the root and in English under `docs/en/`. It is published with GitHub Pages from the `main` branch, `/docs` folder. Local preview:

```sh
python3 -m http.server 8090 -d docs
```

## 📄 License

Code released under the [MIT](LICENSE) license.

---

<p align="center"><sub>Posters, photos and metadata: <a href="https://www.themoviedb.org/">TMDB</a>. This product uses the TMDB API but is not endorsed or certified by TMDB. Channel logos and free channel lists: <a href="https://github.com/iptv-org">iptv-org</a>; trademarks and artwork belong to their owners. TV guides: xmltvfr.fr and epgshare01. Radios: Radio Browser. Player video: <i>Big Buck Bunny</i> test stream © Blender Foundation, CC BY 3.0.</sub></p>
