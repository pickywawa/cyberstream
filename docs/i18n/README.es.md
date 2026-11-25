<p align="center">
  <a href="https://pickywawa.github.io/cyberstream/en/">
    <img src="../assets/banner-en.png" alt="Cyberstream — reproductor IPTV con motor Rust" width="100%" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/pickywawa/cyberstream/releases/latest"><img alt="Última versión" src="https://img.shields.io/github/v/release/pickywawa/cyberstream?style=for-the-badge&color=4fe3a8&labelColor=0b0b0d&label=versión" /></a>
  <img alt="Rust + WebAssembly" src="https://img.shields.io/badge/motor-Rust%20%2B%20Wasm-4fe3a8?style=for-the-badge&labelColor=0b0b0d&logo=rust&logoColor=4fe3a8" />
  <a href="../../LICENSE"><img alt="Licencia MIT" src="https://img.shields.io/badge/licencia-MIT-4fe3a8?style=for-the-badge&labelColor=0b0b0d" /></a>
  <img alt="Plataformas" src="https://img.shields.io/badge/Android%20%C2%B7%20TV%20%C2%B7%20iOS%20%C2%B7%20Desktop%20%C2%B7%20Web-2de2ff?style=for-the-badge&labelColor=0b0b0d" />
</p>

<p align="center">
  <b><a href="https://pickywawa.github.io/cyberstream/en/">Sitio web</a></b> ·
  <b><a href="https://github.com/pickywawa/cyberstream/releases/latest">Descargar</a></b> ·
  <a href="#-funciones">Funciones</a> ·
  <a href="#-idiomas-y-pa%C3%ADses">Países</a> ·
  <a href="#%EF%B8%8F-capturas">Capturas</a> ·
  <a href="#%EF%B8%8F-compilar-y-probar">Compilar</a>
  <br />
  <a href="../../README.md">English</a> · <a href="README.fr.md">Français</a> · <b>Español</b> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a> · <a href="README.pt.md">Português</a> · <a href="README.ru.md">Русский</a> · <a href="README.zh.md">中文</a> · <a href="README.ja.md">日本語</a> · <a href="README.hi.md">हिन्दी</a> · <a href="README.bn.md">বাংলা</a> · <a href="README.ur.md">اردو</a> · <a href="README.ar.md">العربية</a> · <a href="README.id.md">Bahasa Indonesia</a>
</p>

---

**Cyberstream** reproduce tus fuentes **Xtream Codes** y **M3U**: canales en directo, guía de TV, películas, series y replay. Porta el reproductor IPTV CyberTV a Rust: el mismo módulo WebAssembly funciona en el navegador, en móviles y televisores Android, en iOS y en Electron. Android usa Media3 para la decodificación de vídeo y la selección de pistas.

> [!NOTE]
> Cyberstream es un reproductor. No proporciona ningún contenido: usas tus propias fuentes.

<p align="center">
  <img src="../assets/demo.gif" alt="Demo: perfil, inicio, ficha de película, TV en directo, guía y búsqueda" width="100%" />
  <br />
  <sub>Grabado con la fuente de demostración y los metadatos de TMDB. La interfaz se muestra en francés.</sub>
</p>

## ⚡ Funciones

| | |
| --- | --- |
| 📡 **Xtream y M3U** | Catálogos leídos por bloques, servidores de respaldo, sincronización diferencial. |
| 🗓️ **Guía XMLTV** | Cuadrícula virtualizada, línea de «ahora», replay de programas pasados. |
| 🎬 **Películas y series** | Fichas enriquecidas con TMDB: reparto, colecciones, clasificación por edad, temporadas, reanudación, siguiente episodio. |
| ⏸️ **Pausa en directo** | Búfer local de 30 a 60 min, ±10 s, vuelta al directo, cambio automático a un flujo de respaldo. |
| 🎙️ **Comandos de voz** | «Pon el canal 5», «busca Dune», «retrocede 30 segundos», en los 14 idiomas de la interfaz. |
| 📱 **Configuración por código QR** | El televisor recibe el perfil, las fuentes y los ajustes desde tu móvil. |
| 🔁 **Replay gratuito** | ARTE, france.tv, Okoo, ARD Mediathek y más de 600 canales de YouTube de medios, según tus países. |
| 💬 **Subtítulos y Trakt** | SRT, WebVTT, coincidencia por hash de OpenSubtitles, scrobbling y lista de seguimiento de Trakt. |
| 🌍 **14 idiomas, 42 países** | Canales gratuitos, guía de TV, radios y resultados para cada país seguido, varios países por perfil. |
| 👤 **Perfiles** | Avatar, idioma y límite de edad por perfil. Los tokens de servicios se quedan en el almacén seguro del dispositivo. |

## 🌍 Idiomas y países

**Interfaz** en 14 idiomas: francés, inglés, alemán, español, italiano, portugués, árabe, hindi, chino, bengalí, indonesio, urdu, ruso y japonés. El árabe y el urdu se muestran de derecha a izquierda. Los comandos de voz, las fechas, el idioma de las fichas de TMDB y el reconocimiento de voz siguen el idioma del perfil.

**Varios países por perfil.** En el perfil, elige uno o varios países (por ejemplo, Francia y Suiza). El primero es el país principal. Para cada país seguido, la aplicación añade:

- **Canales gratuitos**: los flujos públicos gratuitos listados por [iptv-org](https://github.com/iptv-org/iptv), añadidos como fuente. La opción «Canales gratuitos de mis países» se ofrece al crear el perfil: la aplicación funciona sin suscripción IPTV.
- **Guía de TV gratuita**: [xmltvfr.fr](https://xmltvfr.fr) para Francia, [epgshare01](https://epgshare01.online) para los demás países.
- **Replay**: france.tv y Okoo (Francia), ARD Mediathek (Alemania, Austria), ARTE (en seis idiomas, en Europa).
- **YouTube**: los canales de medios del país por tema (noticias, deporte, documentales, humor, medios, radio). Todos han sido verificados: cada uno publica a través de su feed RSS público.
- **Radios**: las emisoras más escuchadas del país, de [Radio Browser](https://www.radio-browser.info). Todos los países están cubiertos.
- **Resultados en directo**: las ligas del país.

**Filtro por país.** La opción «Solo los canales de mis países» descarta, al descargar tu fuente, las categorías de canales de otros países («UK|», «DE:», «[BE]»…). Se ofrece al configurar la fuente, antes de la primera descarga.

| País | Canales gratuitos | Guía TV | Replay | YouTube | Resultados |
| --- | --- | --- | --- | --- | --- |
| 🇫🇷 Francia | ≈231 (TF1, France 2, M6, Arte) | sí | france.tv, Okoo, ARTE | 21 (BFMTV, franceinfo…) | Ligue 1, Champions League, Premier League |
| 🇧🇪 Bélgica | ≈60 (La Une, Tipik, RTL-TVI, BX1) | sí | ARTE | 10 (RTBF, RTBF Info…) | Pro League, Ligue 1, Champions League |
| 🇨🇭 Suiza | ≈137 (RTS, RSI, Couleur 3, 3sat) | sí | ARTE | 9 (RTS Info, Schweizer Radio und Fernsehen…) | Super League, Ligue 1, Bundesliga |
| 🇱🇺 Luxemburgo | ≈20 (RTL, Eldo) | sí | ARTE | 2 (RTL Luxembourg, Wort…) | Ligue 1, Bundesliga, Champions League |
| 🇨🇦 Canadá | ≈265 (CBC, CTV, Télé-Québec) | sí | — | 14 (CBC News, CTV News…) | NHL, NBA, NFL |
| 🇲🇦 Marruecos | ≈13 (2M, Al Aoula, Medi1) | — | — | 10 (2MTV, Hespress…) | AFCON, Ligue 1, LaLiga |
| 🇩🇿 Argelia | ≈9 (Canal Algérie, Ennahar) | — | — | 7 (Ennahar Tv Plus, EchoroukTV…) | AFCON, Ligue 1, Champions League |
| 🇹🇳 Túnez | ≈4 (Watania, Nessma) | — | — | 7 (Mosaique FM, Nessma TV…) | AFCON, Ligue 1, Champions League |
| 🇬🇧 Reino Unido | ≈302 (BBC One, BBC News, Channel 4) | sí | ARTE | 30 (BBC News, Sky News…) | Premier League, Champions League |
| 🇮🇪 Irlanda | ≈58 (RTÉ News, Virgin Media) | sí | ARTE | 9 (RTÉ News, The Irish Times…) | Premier Division, Premier League, Champions League |
| 🇺🇸 Estados Unidos | ≈1538 (PBS, ABC News, CBS News) | sí | — | 41 (CNN, NBC News…) | NFL, NBA, NHL |
| 🇦🇺 Australia | ≈78 (ABC, 7, 9) | sí | — | 11 (9 News Australia, SBS News…) | AFL, A-League, Premier League |
| 🇳🇿 Nueva Zelanda | ≈36 (TVNZ, Whakaata Māori) | sí | — | 6 (RNZ, 1News…) | A-League, Premier League |
| 🇩🇪 Alemania | ≈303 (Das Erste, ZDF, 3sat, tagesschau24) | sí | ARD Mediathek, ARTE | 28 (tagesschau, ZDFheute Nachrichten…) | Bundesliga, Champions League |
| 🇦🇹 Austria | ≈114 (ORF, ServusTV, PULS 24) | sí | ARD Mediathek, ARTE | 9 (PULS 24, Kronen Zeitung…) | Bundesliga (AT), Bundesliga, Champions League |
| 🇪🇸 España | ≈305 (3Cat, À Punt, 24 Horas, Atreseries) | sí | ARTE | 27 (Antena 3 Noticias, EL PAÍS…) | LaLiga, Champions League, NBA |
| 🇲🇽 México | ≈179 (Canal 22, Canal Once, Azteca) | sí | — | 12 (NMás, MILENIO…) | Liga MX, Concacaf, LaLiga |
| 🇦🇷 Argentina | ≈224 (Telefe, TN, A24) | sí | — | 11 (C5N, LA NACION…) | Liga Profesional, Libertadores, LaLiga |
| 🇨🇴 Colombia | ≈171 (Canal Capital, Señal Colombia) | sí | — | 7 (Noticias Caracol, Noticias RCN…) | Primera A, Libertadores, LaLiga |
| 🇨🇱 Chile | ≈220 (TVN, 24 Horas, T13) | sí | — | 9 (Teletrece, CHV Noticias…) | Primera División, Libertadores, LaLiga |
| 🇮🇹 Italia | ≈359 (Rai 1, Rai 2, Rai 3, Rai News 24) | sí | ARTE | 21 (RaiNews, Sky tg24…) | Serie A, Champions League |
| 🇵🇹 Portugal | ≈72 (RTP 1, RTP 2, RTP Notícias, SIC) | sí | — | 10 (RTP Notícias, TVI…) | Liga Portugal, Champions League |
| 🇧🇷 Brasil | ≈401 (TV Cultura, Record News, SBT) | sí | — | 23 (g1, CNN Brasil…) | Brasileirão, Libertadores, NBA |
| 🇳🇱 Países Bajos | ≈175 (NPO, AT5) | sí | — | 11 (NOS, RTL Nieuws…) | Eredivisie, Champions League |
| 🇹🇷 Turquía | ≈180 (TRT 1, TRT Haber, NTV) | sí | — | 8 (TRT Haber, CNN TÜRK…) | Süper Lig, Champions League |
| 🇵🇱 Polonia | ≈188 (TVP Info, TVP World) | sí | ARTE | 12 (tvn24, Polsat…) | Champions League |
| 🇷🇺 Rusia | ≈518 (2x2, 360°, RT) | — | — | 19 (Телеканал Дождь, BBC News - Русская служба…) | RPL |
| 🇸🇦 Arabia Saudí | ≈56 (Al Saudiya, Al Ekhbariya, Asharq News) | sí | — | 17 (AlArabiya العربية, سكاي نيوز عربية…) | Saudi Pro League, AFC Champions League, Premier League |
| 🇦🇪 Emiratos Árabes Unidos | ≈23 (Dubai TV, Abu Dhabi TV) | sí | — | 10 (سكاي نيوز عربية, AlArabiya العربية…) | AFC Champions League, Premier League, LaLiga |
| 🇶🇦 Catar | ≈10 (Al Jazeera, Al Rayyan) | — | — | 4 (Al Jazeera English, العربي - أخبار…) | AFC Champions League, Premier League, LaLiga |
| 🇪🇬 Egipto | ≈21 (Nile Drama, MBC Masr, Al Ghad) | — | — | 11 (CBC Egypt, Sada Elbalad - صدى البلد…) | AFCON, Premier League, LaLiga |
| 🇮🇳 India | ≈826 (DD National, DD News, Aaj Tak, NDTV) | sí | — | 30 (Aaj Tak, NDTV…) | ISL, Premier League |
| 🇵🇰 Pakistán | ≈105 (PTV, ARY News, Dunya News) | — | — | 19 (Geo News, ARY News…) | Premier League |
| 🇧🇩 Bangladés | ≈37 (ATN Bangla, NTV, T Sports, Ekhon) | — | — | 17 (SOMOY TV, Jamuna TV Plus…) | Premier League |
| 🇮🇩 Indonesia | ≈177 (TVRI, Kompas TV, Metro TV) | sí | — | 28 (CNN Indonesia, tvOneNews…) | Super League, Premier League |
| 🇲🇾 Malasia | ≈6 (TV1, TV2) | sí | — | 6 (Astro AWANI, Berita Harian Online…) | Super League, Premier League |
| 🇸🇬 Singapur | ≈9 (CNA) | sí | — | 5 (CNA Insider, CNA…) | Premier League |
| 🇨🇳 China | ≈156 (CCTV-1, CCTV-4, CCTV-13) | — | — | 11 (CGTN, CCTV Video News Agency…) | CSL, NBA |
| 🇹🇼 Taiwán | ≈34 (PTS, TTV) | — | — | 10 (TVBS NEWS, SETN News Network…) | NBA, MLB |
| 🇭🇰 Hong Kong | ≈18 (RTHK, TVB) | sí | — | 7 (TVB NEWS Official 無綫新聞, RTHK 香港電台…) | Premier League, NBA |
| 🇯🇵 Japón | ≈17 (NHK General, Nippon TV, TV Asahi, Fuji TV) | sí | — | 22 (ANNnewsCH, TBS NEWS DIG Powered by JNN…) | J1 League, MLB |
| 🇰🇷 Corea del Sur | ≈72 (KBS, MBC, Arirang) | — | — | 16 (YTN, SBS News…) | MLB, Premier League |

El número de canales gratuitos procede de las listas de iptv-org en el momento de redactar este texto. Algunos de estos flujos solo funcionan en su propio país o cambian a menudo. Algunos vídeos de ARD solo se pueden ver en Alemania, Austria y Suiza.

**Servicios no incluidos.** BBC iPlayer, ITVX y Channel 4 requieren una cuenta y una conexión desde el Reino Unido, además de una licencia de TV para iPlayer. PBS pasa por la aplicación y la cuenta de cada emisora. RTVE Play protege sus vídeos con DRM. RaiPlay reserva gran parte de su catálogo a Italia, a menudo con inicio de sesión. Sus canales en directo aparecen entre los canales gratuitos cuando se emiten en abierto, y sus canales de YouTube están en el replay.

## 🖼️ Capturas

<table>
  <tr>
    <td width="50%"><img src="../assets/screens/home-rows.webp" alt="Inicio con filas de películas y series" /><p align="center"><sub>Inicio</sub></p></td>
    <td width="50%"><img src="../assets/screens/live.webp" alt="TV en directo" /><p align="center"><sub>TV en directo</sub></p></td>
  </tr>
  <tr>
    <td><img src="../assets/screens/guide.webp" alt="Guía de TV" /><p align="center"><sub>Guía de TV</sub></p></td>
    <td><img src="../assets/screens/movie.webp" alt="Ficha de película" /><p align="center"><sub>Ficha de película</sub></p></td>
  </tr>
  <tr>
    <td><img src="../assets/screens/series-episodes.webp" alt="Temporadas y episodios de una serie" /><p align="center"><sub>Series</sub></p></td>
    <td><img src="../assets/screens/player.webp" alt="Reproductor" /><p align="center"><sub>Reproductor — flujo de prueba <i>Big Buck Bunny</i> © Blender Foundation, CC BY</sub></p></td>
  </tr>
</table>

<p align="center">
  <img src="../assets/screens/mobile-home.webp" alt="Inicio en un móvil" width="30%" />
  &nbsp;
  <img src="../assets/screens/mobile-rows.webp" alt="Filas en un móvil" width="30%" />
  &nbsp;
  <img src="../assets/screens/mobile-movie.webp" alt="Ficha de película en un móvil" width="30%" />
</p>

## 📦 Instalación

Descarga `Cyberstream-x.y.z.apk` desde la [última versión](https://github.com/pickywawa/cyberstream/releases/latest) e instálalo en tu móvil o televisor:

```sh
adb -d install -r Cyberstream-1.0.1.apk
```

El paquete Android es `app.cyberstream.player`. El mismo APK se instala en móviles y aparece en el lanzador de Android TV. El mínimo declarado es Android 7 (API 24). La interfaz necesita un WebView compatible con WebAssembly y módulos JavaScript; la versión del sistema por sí sola no lo garantiza.

## 🦀 Estado del port

La pre-versión sigue a CyberTV 0.16.0. El port sigue siendo híbrido.

| Función | Implementación en esta versión |
| --- | --- |
| Fuentes Xtream y M3U | Rust lee los catálogos por bloques, ordena las entradas y construye las URL de reproducción y replay. El worker TypeScript orquesta las peticiones, los servidores de respaldo, las descargas en segundo plano y las transacciones IndexedDB. |
| Guía XMLTV | Rust descomprime gzip, lee los programas, gestiona las zonas horarias y dibuja las celdas visibles de la cuadrícula. IndexedDB mantiene disponible la programación anterior durante una importación. |
| Búsqueda y ordenación | Rust indexa los títulos, ordena los canales, detecta los idiomas y restaura el índice del catálogo a partir de páginas comprimidas con LZ4. |
| Películas y series | Rust lee los episodios Xtream y los metadatos de TMDB, incluidas clasificaciones por edad, reparto y colecciones. Rust dibuja las cabeceras de las fichas, temporadas, episodios, la biblioteca y las tarjetas. La selección de pistas y las decisiones de búsqueda dentro del flujo también usan Rust. |
| Replay y subtítulos | Rust gestiona los catálogos y flujos de ARTE y france.tv, los feeds RSS de YouTube, SRT y WebVTT, y el hash de OpenSubtitles. |
| Interfaz y mando | Los menús principales, los perfiles, las traducciones, la navegación direccional, la virtualización y los comandos de voz usan Rust. El cliente Trakt, la ordenación de OpenSubtitles y la validación del intercambio por código QR también. Inicio, cuadrículas, resultados de búsqueda y páginas de Replay tienen vistas Rust. React y TypeScript montan las pantallas y gestionan los eventos y varias integraciones de servicios. |
| Funciones del dispositivo | Android mantiene puentes Java para Media3, la caché, el timeshift, el almacén seguro y el emparejamiento con la TV. El host iOS usa Swift y el de escritorio usa Electron. |

Las pantallas de CyberTV se han conservado para mantener los flujos de uso durante la migración. La paridad completa en Android TV, iOS y escritorio aún está por probar. Las especificaciones originales están en [docs/SPECIFICATIONS.md](../SPECIFICATIONS.md) (en francés).

## 🛠️ Compilar y probar

Requisitos para la web y las pruebas locales: Rust estable con el target WebAssembly, Node.js 22.12 o posterior y npm. El generador de bindings debe coincidir con la versión del crate.

```sh
rustup target add wasm32-unknown-unknown
cargo install --locked wasm-bindgen-cli --version 0.2.108
npm ci
cargo test --locked
npm test
npm run build
```

Con Android SDK 36, JDK 21, `JAVA_HOME` y `ANDROID_HOME` definidos:

```sh
npm run android:apk
adb -d install -r android/app/build/outputs/apk/debug/app-debug.apk
```

El perfil y las fuentes se configuran en el dispositivo. Para probar la versión web con datos simulados, ejecuta `npm run dev -- --host 127.0.0.1` y elige la fuente de demostración durante la configuración. Las claves de servicios opcionales van en los ajustes del perfil. Desde la versión 0.16.3, el reproductor consulta las versiones de Cyberstream en GitHub, pre-versiones incluidas. Cada versión Android debe adjuntar su manifiesto `update.json` y el APK al que hace referencia. Para probar otro canal, define `CYBER_UPDATE_URL` con la URL de un manifiesto al compilar. Los usuarios de las versiones 0.16.1 y 0.16.2 deben instalar manualmente un APK más reciente una vez.

## 📺 Recursos en Android TV

La cuadrícula del catálogo guarda identificadores ordenados y carga los pósteres fila a fila según las filas visibles. La primera descarga selecciona las categorías en los idiomas de audio del perfil, con una opción para conservar todos los idiomas.

Una huella de las entradas Xtream conserva las filas sin cambios entre dos sincronizaciones. La guía también mantiene identificadores de franja estables y reescribe los programas modificados.

Los lanzadores y los iconos de la interfaz son dibujos vectoriales. Android conserva los SVG y las animaciones recibidos y redimensiona las fotos según su uso. El lado máximo es de 224 píxeles para un logotipo, 448 para una tarjeta y 1024 para una imagen destacada. Pueden ejecutarse dos decodificaciones de imagen a la vez. La caché de disco apunta a 96 MiB con desalojo periódico de los archivos menos usados recientemente.

El modo rendimiento está activado por defecto en Android. El inicio lee una muestra limitada de películas. En este modo, la búsqueda construye su índice bajo demanda. En un dispositivo marcado como de poca memoria, el reproductor apunta a un búfer multimedia de 24 MiB. Estos límites acotan subsistemas concretos. La memoria total, el tiempo de arranque y la fluidez deben medirse en el televisor de destino.

## 🌐 Sitio web

El sitio web está en [`docs/`](../) (HTML, CSS y JS simples, sin paso de compilación), en francés en la raíz y en inglés en `docs/en/`. Se publica con GitHub Pages desde la rama `main`, carpeta `/docs`. Vista previa local:

```sh
python3 -m http.server 8090 -d docs
```

## 📄 Licencia

Código publicado bajo la licencia [MIT](../../LICENSE).

---

<p align="center"><sub>Pósteres, fotos y metadatos: <a href="https://www.themoviedb.org/">TMDB</a>. Este producto usa la API de TMDB pero no está avalado ni certificado por TMDB. Logotipos de canales y listas de canales gratuitos: <a href="https://github.com/iptv-org">iptv-org</a>; las marcas y los gráficos pertenecen a sus propietarios. Guías de TV: xmltvfr.fr y epgshare01. Radios: Radio Browser. Vídeo del reproductor: flujo de prueba <i>Big Buck Bunny</i> © Blender Foundation, CC BY 3.0.</sub></p>
