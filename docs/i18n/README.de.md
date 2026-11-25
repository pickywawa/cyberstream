<p align="center">
  <a href="https://pickywawa.github.io/cyberstream/en/">
    <img src="../assets/banner-en.png" alt="Cyberstream — IPTV-Player mit Rust-Engine" width="100%" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/pickywawa/cyberstream/releases/latest"><img alt="Neueste Version" src="https://img.shields.io/github/v/release/pickywawa/cyberstream?style=for-the-badge&color=4fe3a8&labelColor=0b0b0d&label=version" /></a>
  <img alt="Rust + WebAssembly" src="https://img.shields.io/badge/engine-Rust%20%2B%20Wasm-4fe3a8?style=for-the-badge&labelColor=0b0b0d&logo=rust&logoColor=4fe3a8" />
  <a href="../../LICENSE"><img alt="MIT-Lizenz" src="https://img.shields.io/badge/lizenz-MIT-4fe3a8?style=for-the-badge&labelColor=0b0b0d" /></a>
  <img alt="Plattformen" src="https://img.shields.io/badge/Android%20%C2%B7%20TV%20%C2%B7%20iOS%20%C2%B7%20Desktop%20%C2%B7%20Web-2de2ff?style=for-the-badge&labelColor=0b0b0d" />
</p>

<p align="center">
  <b><a href="https://pickywawa.github.io/cyberstream/en/">Website</a></b> ·
  <b><a href="https://github.com/pickywawa/cyberstream/releases/latest">Download</a></b> ·
  <a href="#-funktionen">Funktionen</a> ·
  <a href="#-sprachen-und-l%C3%A4nder">Länder</a> ·
  <a href="#%EF%B8%8F-screenshots">Screenshots</a> ·
  <a href="#%EF%B8%8F-bauen-und-testen">Bauen</a>
  <br />
  <a href="../../README.md">English</a> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <b>Deutsch</b> · <a href="README.it.md">Italiano</a> · <a href="README.pt.md">Português</a> · <a href="README.ru.md">Русский</a> · <a href="README.zh.md">中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.hi.md">हिन्दी</a> · <a href="README.bn.md">বাংলা</a> · <a href="README.ur.md">اردو</a> · <a href="README.ar.md">العربية</a> · <a href="README.id.md">Bahasa Indonesia</a>
</p>

---

**Cyberstream** spielt deine **Xtream-Codes**- und **M3U**-Quellen ab: Live-Sender, TV-Guide, Filme, Serien und Mediathek. Es portiert den IPTV-Player CyberTV nach Rust: Dasselbe WebAssembly-Modul läuft im Browser, auf Android-Smartphones und -Fernsehern, auf iOS und in Electron. Android nutzt Media3 für die Videodekodierung und die Spurauswahl.

> [!NOTE]
> Cyberstream ist ein Player. Er stellt keine Inhalte bereit: Du nutzt deine eigenen Quellen.

<p align="center">
  <img src="../assets/demo.gif" alt="Demo: Profil, Startseite, Filmseite, Live-TV, Guide und Suche" width="100%" />
  <br />
  <sub>Aufgenommen mit der Demo-Quelle und TMDB-Metadaten. Die Oberfläche ist auf Französisch.</sub>
</p>

## ⚡ Funktionen

| | |
| --- | --- |
| 📡 **Xtream & M3U** | Kataloge werden blockweise gelesen, Ausweichserver, differenzielle Synchronisierung. |
| 🗓️ **XMLTV-Guide** | Virtualisiertes Raster, „Jetzt“-Linie, Wiedergabe vergangener Sendungen. |
| 🎬 **Filme & Serien** | Mit TMDB angereicherte Seiten: Besetzung, Sammlungen, Altersfreigabe, Staffeln, Fortsetzen, nächste Folge. |
| ⏸️ **Live-Pause** | Lokaler Puffer von 30 bis 60 Min., ±10 s, zurück zu live, automatischer Wechsel auf einen Ersatzstream. |
| 🎙️ **Sprachbefehle** | „Schalte auf Sender 5“, „suche Dune“, „30 Sekunden zurück“, in den 14 Sprachen der Oberfläche. |
| 📱 **Einrichtung per QR-Code** | Der Fernseher übernimmt Profil, Quellen und Einstellungen von deinem Smartphone. |
| 🔁 **Kostenlose Mediatheken** | ARTE, france.tv, Okoo, ARD Mediathek und über 600 YouTube-Kanäle von Medien, je nach deinen Ländern. |
| 💬 **Untertitel & Trakt** | SRT, WebVTT, OpenSubtitles-Hash-Abgleich, Trakt-Scrobbling und Merkliste. |
| 🌍 **14 Sprachen, 42 Länder** | Freie Sender, TV-Guide, Radios und Ergebnisse für jedes gefolgte Land, mehrere Länder pro Profil. |
| 👤 **Profile** | Avatar, Sprache und Altersgrenze pro Profil. Dienst-Tokens bleiben im sicheren Speicher des Geräts. |

## 🌍 Sprachen und Länder

**Oberfläche** in 14 Sprachen: Französisch, Englisch, Deutsch, Spanisch, Italienisch, Portugiesisch, Arabisch, Hindi, Chinesisch, Bengalisch, Indonesisch, Urdu, Russisch und Japanisch. Arabisch und Urdu werden von rechts nach links angezeigt. Sprachbefehle, Datumsangaben, die Sprache der TMDB-Seiten und die Spracherkennung folgen der Sprache des Profils.

**Mehrere Länder pro Profil.** Wähle im Profil ein oder mehrere Länder (zum Beispiel Deutschland und Österreich). Das erste ist das Hauptland. Für jedes gefolgte Land fügt die App hinzu:

- **Freie Sender**: die öffentlichen, kostenlosen Streams aus [iptv-org](https://github.com/iptv-org/iptv), als Quelle hinzugefügt. Die Option „Freie Sender meiner Länder“ wird beim Anlegen des Profils angeboten: Die App funktioniert ohne IPTV-Abo.
- **Kostenloser TV-Guide**: [xmltvfr.fr](https://xmltvfr.fr) für Frankreich, [epgshare01](https://epgshare01.online) für die anderen Länder.
- **Mediatheken**: france.tv und Okoo (Frankreich), ARD Mediathek (Deutschland, Österreich), ARTE (in sechs Sprachen, in Europa).
- **YouTube**: die Medienkanäle des Landes nach Thema (Nachrichten, Sport, Dokus, Comedy, Medien, Radio). Alle wurden geprüft: Jeder veröffentlicht über seinen öffentlichen RSS-Feed.
- **Radios**: die meistgehörten Sender des Landes, von [Radio Browser](https://www.radio-browser.info). Alle Länder sind abgedeckt.
- **Live-Ergebnisse**: die Ligen des Landes.

**Länderfilter.** Die Option „Nur Sender meiner Länder“ lässt beim Herunterladen deiner Quelle die Senderkategorien anderer Länder weg („UK|“, „DE:“, „[BE]“…). Sie wird beim Einrichten der Quelle vor dem ersten Download angeboten.

| Land | Freie Sender | TV-Guide | Mediathek | YouTube | Ergebnisse |
| --- | --- | --- | --- | --- | --- |
| 🇫🇷 Frankreich | ≈231 (TF1, France 2, M6, Arte) | ja | france.tv, Okoo, ARTE | 21 (BFMTV, franceinfo…) | Ligue 1, Champions League, Premier League |
| 🇧🇪 Belgien | ≈60 (La Une, Tipik, RTL-TVI, BX1) | ja | ARTE | 10 (RTBF, RTBF Info…) | Pro League, Ligue 1, Champions League |
| 🇨🇭 Schweiz | ≈137 (RTS, RSI, Couleur 3, 3sat) | ja | ARTE | 9 (RTS Info, Schweizer Radio und Fernsehen…) | Super League, Ligue 1, Bundesliga |
| 🇱🇺 Luxemburg | ≈20 (RTL, Eldo) | ja | ARTE | 2 (RTL Luxembourg, Wort…) | Ligue 1, Bundesliga, Champions League |
| 🇨🇦 Kanada | ≈265 (CBC, CTV, Télé-Québec) | ja | — | 14 (CBC News, CTV News…) | NHL, NBA, NFL |
| 🇲🇦 Marokko | ≈13 (2M, Al Aoula, Medi1) | — | — | 10 (2MTV, Hespress…) | AFCON, Ligue 1, LaLiga |
| 🇩🇿 Algerien | ≈9 (Canal Algérie, Ennahar) | — | — | 7 (Ennahar Tv Plus, EchoroukTV…) | AFCON, Ligue 1, Champions League |
| 🇹🇳 Tunesien | ≈4 (Watania, Nessma) | — | — | 7 (Mosaique FM, Nessma TV…) | AFCON, Ligue 1, Champions League |
| 🇬🇧 Vereinigtes Königreich | ≈302 (BBC One, BBC News, Channel 4) | ja | ARTE | 30 (BBC News, Sky News…) | Premier League, Champions League |
| 🇮🇪 Irland | ≈58 (RTÉ News, Virgin Media) | ja | ARTE | 9 (RTÉ News, The Irish Times…) | Premier Division, Premier League, Champions League |
| 🇺🇸 Vereinigte Staaten | ≈1538 (PBS, ABC News, CBS News) | ja | — | 41 (CNN, NBC News…) | NFL, NBA, NHL |
| 🇦🇺 Australien | ≈78 (ABC, 7, 9) | ja | — | 11 (9 News Australia, SBS News…) | AFL, A-League, Premier League |
| 🇳🇿 Neuseeland | ≈36 (TVNZ, Whakaata Māori) | ja | — | 6 (RNZ, 1News…) | A-League, Premier League |
| 🇩🇪 Deutschland | ≈303 (Das Erste, ZDF, 3sat, tagesschau24) | ja | ARD Mediathek, ARTE | 28 (tagesschau, ZDFheute Nachrichten…) | Bundesliga, Champions League |
| 🇦🇹 Österreich | ≈114 (ORF, ServusTV, PULS 24) | ja | ARD Mediathek, ARTE | 9 (PULS 24, Kronen Zeitung…) | Bundesliga (AT), Bundesliga, Champions League |
| 🇪🇸 Spanien | ≈305 (3Cat, À Punt, 24 Horas, Atreseries) | ja | ARTE | 27 (Antena 3 Noticias, EL PAÍS…) | LaLiga, Champions League, NBA |
| 🇲🇽 Mexiko | ≈179 (Canal 22, Canal Once, Azteca) | ja | — | 12 (NMás, MILENIO…) | Liga MX, Concacaf, LaLiga |
| 🇦🇷 Argentinien | ≈224 (Telefe, TN, A24) | ja | — | 11 (C5N, LA NACION…) | Liga Profesional, Libertadores, LaLiga |
| 🇨🇴 Kolumbien | ≈171 (Canal Capital, Señal Colombia) | ja | — | 7 (Noticias Caracol, Noticias RCN…) | Primera A, Libertadores, LaLiga |
| 🇨🇱 Chile | ≈220 (TVN, 24 Horas, T13) | ja | — | 9 (Teletrece, CHV Noticias…) | Primera División, Libertadores, LaLiga |
| 🇮🇹 Italien | ≈359 (Rai 1, Rai 2, Rai 3, Rai News 24) | ja | ARTE | 21 (RaiNews, Sky tg24…) | Serie A, Champions League |
| 🇵🇹 Portugal | ≈72 (RTP 1, RTP 2, RTP Notícias, SIC) | ja | — | 10 (RTP Notícias, TVI…) | Liga Portugal, Champions League |
| 🇧🇷 Brasilien | ≈401 (TV Cultura, Record News, SBT) | ja | — | 23 (g1, CNN Brasil…) | Brasileirão, Libertadores, NBA |
| 🇳🇱 Niederlande | ≈175 (NPO, AT5) | ja | — | 11 (NOS, RTL Nieuws…) | Eredivisie, Champions League |
| 🇹🇷 Türkei | ≈180 (TRT 1, TRT Haber, NTV) | ja | — | 8 (TRT Haber, CNN TÜRK…) | Süper Lig, Champions League |
| 🇵🇱 Polen | ≈188 (TVP Info, TVP World) | ja | ARTE | 12 (tvn24, Polsat…) | Champions League |
| 🇷🇺 Russland | ≈518 (2x2, 360°, RT) | — | — | 19 (Телеканал Дождь, BBC News - Русская служба…) | RPL |
| 🇸🇦 Saudi-Arabien | ≈56 (Al Saudiya, Al Ekhbariya, Asharq News) | ja | — | 17 (AlArabiya العربية, سكاي نيوز عربية…) | Saudi Pro League, AFC Champions League, Premier League |
| 🇦🇪 Vereinigte Arabische Emirate | ≈23 (Dubai TV, Abu Dhabi TV) | ja | — | 10 (سكاي نيوز عربية, AlArabiya العربية…) | AFC Champions League, Premier League, LaLiga |
| 🇶🇦 Katar | ≈10 (Al Jazeera, Al Rayyan) | — | — | 4 (Al Jazeera English, العربي - أخبار…) | AFC Champions League, Premier League, LaLiga |
| 🇪🇬 Ägypten | ≈21 (Nile Drama, MBC Masr, Al Ghad) | — | — | 11 (CBC Egypt, Sada Elbalad - صدى البلد…) | AFCON, Premier League, LaLiga |
| 🇮🇳 Indien | ≈826 (DD National, DD News, Aaj Tak, NDTV) | ja | — | 30 (Aaj Tak, NDTV…) | ISL, Premier League |
| 🇵🇰 Pakistan | ≈105 (PTV, ARY News, Dunya News) | — | — | 19 (Geo News, ARY News…) | Premier League |
| 🇧🇩 Bangladesch | ≈37 (ATN Bangla, NTV, T Sports, Ekhon) | — | — | 17 (SOMOY TV, Jamuna TV Plus…) | Premier League |
| 🇮🇩 Indonesien | ≈177 (TVRI, Kompas TV, Metro TV) | ja | — | 28 (CNN Indonesia, tvOneNews…) | Super League, Premier League |
| 🇲🇾 Malaysia | ≈6 (TV1, TV2) | ja | — | 6 (Astro AWANI, Berita Harian Online…) | Super League, Premier League |
| 🇸🇬 Singapur | ≈9 (CNA) | ja | — | 5 (CNA Insider, CNA…) | Premier League |
| 🇨🇳 China | ≈156 (CCTV-1, CCTV-4, CCTV-13) | — | — | 11 (CGTN, CCTV Video News Agency…) | CSL, NBA |
| 🇹🇼 Taiwan | ≈34 (PTS, TTV) | — | — | 10 (TVBS NEWS, SETN News Network…) | NBA, MLB |
| 🇭🇰 Hongkong | ≈18 (RTHK, TVB) | ja | — | 7 (TVB NEWS Official 無綫新聞, RTHK 香港電台…) | Premier League, NBA |
| 🇯🇵 Japan | ≈17 (NHK General, Nippon TV, TV Asahi, Fuji TV) | ja | — | 22 (ANNnewsCH, TBS NEWS DIG Powered by JNN…) | J1 League, MLB |
| 🇰🇷 Südkorea | ≈72 (KBS, MBC, Arirang) | — | — | 16 (YTN, SBS News…) | MLB, Premier League |

Die Anzahl der freien Sender stammt aus den iptv-org-Listen zum Zeitpunkt des Schreibens. Manche dieser Streams funktionieren nur im eigenen Land oder ändern sich häufig. Manche ARD-Videos sind nur in Deutschland, Österreich und der Schweiz abrufbar.

**Nicht enthaltene Dienste.** BBC iPlayer, ITVX und Channel 4 benötigen ein Konto und eine Verbindung aus dem Vereinigten Königreich, für iPlayer zusätzlich eine TV-Lizenz. PBS läuft über die App und das Konto des jeweiligen Senders. RTVE Play schützt seine Videos mit DRM. RaiPlay beschränkt einen Großteil seines Katalogs auf Italien, oft mit Anmeldung. Ihre Live-Sender erscheinen unter den freien Sendern, wenn sie frei empfangbar sind, und ihre YouTube-Kanäle sind in den Mediatheken.

## 🖼️ Screenshots

<table>
  <tr>
    <td width="50%"><img src="../assets/screens/home-rows.webp" alt="Startseite mit Film- und Serienreihen" /><p align="center"><sub>Startseite</sub></p></td>
    <td width="50%"><img src="../assets/screens/live.webp" alt="Live-TV" /><p align="center"><sub>Live-TV</sub></p></td>
  </tr>
  <tr>
    <td><img src="../assets/screens/guide.webp" alt="TV-Guide" /><p align="center"><sub>TV-Guide</sub></p></td>
    <td><img src="../assets/screens/movie.webp" alt="Filmseite" /><p align="center"><sub>Filmseite</sub></p></td>
  </tr>
  <tr>
    <td><img src="../assets/screens/series-episodes.webp" alt="Staffeln und Folgen einer Serie" /><p align="center"><sub>Serien</sub></p></td>
    <td><img src="../assets/screens/player.webp" alt="Player" /><p align="center"><sub>Player — Teststream <i>Big Buck Bunny</i> © Blender Foundation, CC BY</sub></p></td>
  </tr>
</table>

<p align="center">
  <img src="../assets/screens/mobile-home.webp" alt="Startseite auf einem Smartphone" width="30%" />
  &nbsp;
  <img src="../assets/screens/mobile-rows.webp" alt="Reihen auf einem Smartphone" width="30%" />
  &nbsp;
  <img src="../assets/screens/mobile-movie.webp" alt="Filmseite auf einem Smartphone" width="30%" />
</p>

## 📦 Installation

Lade `Cyberstream-x.y.z.apk` aus dem [neuesten Release](https://github.com/pickywawa/cyberstream/releases/latest) herunter und installiere es auf deinem Smartphone oder Fernseher:

```sh
adb -d install -r Cyberstream-1.0.1.apk
```

Das Android-Paket heißt `app.cyberstream.player`. Dasselbe APK lässt sich auf Smartphones installieren und erscheint im Android-TV-Launcher. Das angegebene Minimum ist Android 7 (API 24). Die Oberfläche braucht ein WebView, das WebAssembly und JavaScript-Module unterstützt; die Systemversion allein garantiert das nicht.

## 🦀 Stand der Portierung

Die Vorabversion folgt CyberTV 0.16.0. Die Portierung ist noch hybrid.

| Funktion | Umsetzung in dieser Version |
| --- | --- |
| Xtream- und M3U-Quellen | Rust liest Kataloge blockweise, sortiert Einträge und baut die Wiedergabe- und Mediathek-URLs. Der TypeScript-Worker steuert Anfragen, Ausweichserver, Hintergrund-Downloads und IndexedDB-Transaktionen. |
| XMLTV-Guide | Rust entpackt gzip, liest Sendungen, behandelt Zeitzonen und zeichnet die sichtbaren Zellen des Rasters. IndexedDB hält das vorherige Programm während eines Imports verfügbar. |
| Suche und Sortierung | Rust indexiert Titel, sortiert Sender, erkennt Sprachen und stellt den Katalogindex aus LZ4-komprimierten Seiten wieder her. |
| Filme und Serien | Rust liest Xtream-Folgen und TMDB-Metadaten, einschließlich Altersfreigaben, Besetzung und Sammlungen. Rust zeichnet Seitenköpfe, Staffeln, Folgen, die Bibliothek und Karten. Spurauswahl und Sprungentscheidungen im Stream nutzen ebenfalls Rust. |
| Mediatheken und Untertitel | Rust verarbeitet die Kataloge und Streams von ARTE und france.tv, YouTube-RSS-Feeds, SRT und WebVTT sowie den OpenSubtitles-Hash. |
| Oberfläche und Fernbedienung | Hauptmenüs, Profilkacheln, Übersetzungen, Richtungsnavigation, Virtualisierung und Sprachbefehle nutzen Rust. Der Trakt-Client, die OpenSubtitles-Sortierung und die Prüfung des QR-Code-Austauschs ebenfalls. Startseite, Raster, Suchergebnisse und Replay-Seiten haben Rust-Ansichten. React und TypeScript binden Bildschirme ein und verarbeiten Ereignisse und mehrere Dienstintegrationen. |
| Gerätefunktionen | Android behält Java-Brücken für Media3, Cache, Timeshift, den sicheren Speicher und das TV-Pairing. Der iOS-Host nutzt Swift, der Desktop-Host Electron. |

Die Bildschirme von CyberTV wurden übernommen, um die Abläufe während der Migration beizubehalten. Die volle Parität auf Android TV, iOS und Desktop muss noch getestet werden. Die ursprünglichen Spezifikationen stehen in [docs/SPECIFICATIONS.md](../SPECIFICATIONS.md) (auf Französisch).

## 🛠️ Bauen und testen

Voraussetzungen für Web und lokale Tests: stabiles Rust mit dem WebAssembly-Target, Node.js 22.12 oder neuer und npm. Der Bindings-Generator muss zur Crate-Version passen.

```sh
rustup target add wasm32-unknown-unknown
cargo install --locked wasm-bindgen-cli --version 0.2.108
npm ci
cargo test --locked
npm test
npm run build
```

Mit Android SDK 36, JDK 21 sowie gesetztem `JAVA_HOME` und `ANDROID_HOME`:

```sh
npm run android:apk
adb -d install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Profil und Quellen werden auf dem Gerät eingerichtet. Um die Webversion mit Testdaten auszuprobieren, führe `npm run dev -- --host 127.0.0.1` aus und wähle bei der Einrichtung die Demo-Quelle. Optionale Dienstschlüssel gehören in die Profileinstellungen. Seit Version 0.16.3 prüft der Player die GitHub-Releases von Cyberstream, Vorabversionen eingeschlossen. Jedes Android-Release muss sein `update.json`-Manifest und das darin referenzierte APK anhängen. Um einen anderen Kanal zu testen, setze beim Bauen `CYBER_UPDATE_URL` auf eine Manifest-URL. Nutzer der Versionen 0.16.1 und 0.16.2 müssen einmalig ein neueres APK manuell installieren.

## 📺 Ressourcen auf Android TV

Das Katalograster hält sortierte IDs und lädt Poster Reihe für Reihe nach sichtbaren Reihen. Der erste Download wählt Kategorien in den Audiosprachen des Profils aus, mit einer Option, alle Sprachen zu behalten.

Ein Fingerabdruck der Xtream-Einträge behält unveränderte Zeilen zwischen zwei Synchronisierungen. Auch der Guide behält stabile Slot-IDs und schreibt geänderte Sendungen neu.

Launcher- und Oberflächensymbole sind Vektorgrafiken. Android behält empfangene SVGs und Animationen und skaliert Fotos passend zu ihrer Verwendung. Die maximale Kantenlänge beträgt 224 Pixel für ein Logo, 448 für eine Karte und 1.024 für ein Titelbild. Zwei Bilddekodierungen können gleichzeitig laufen. Der Festplatten-Cache zielt auf 96 MiB mit regelmäßiger Entfernung der am längsten nicht genutzten Dateien.

Der Leistungsmodus ist auf Android standardmäßig aktiv. Die Startseite liest eine begrenzte Auswahl an Filmen. Die Suche baut ihren Index in diesem Modus bei Bedarf auf. Auf einem als speicherarm markierten Gerät zielt der Player auf einen Medienpuffer von 24 MiB. Diese Grenzen betreffen bestimmte Teilsysteme. Gesamtspeicher, Startzeit und Flüssigkeit müssen auf dem Zielfernseher gemessen werden.

## 🌐 Website

Die Website liegt in [`docs/`](../) (reines HTML, CSS und JS, ohne Build-Schritt), auf Französisch im Stammverzeichnis und auf Englisch unter `docs/en/`. Sie wird mit GitHub Pages aus dem Branch `main`, Ordner `/docs`, veröffentlicht. Lokale Vorschau:

```sh
python3 -m http.server 8090 -d docs
```

## 📄 Lizenz

Code unter der [MIT](../../LICENSE)-Lizenz veröffentlicht.

---

<p align="center"><sub>Poster, Fotos und Metadaten: <a href="https://www.themoviedb.org/">TMDB</a>. Dieses Produkt nutzt die TMDB-API, wird aber nicht von TMDB unterstützt oder zertifiziert. Senderlogos und Listen freier Sender: <a href="https://github.com/iptv-org">iptv-org</a>; Marken und Grafiken gehören ihren Inhabern. TV-Guides: xmltvfr.fr und epgshare01. Radios: Radio Browser. Video im Player: Teststream <i>Big Buck Bunny</i> © Blender Foundation, CC BY 3.0.</sub></p>
