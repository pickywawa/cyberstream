<p align="center">
  <a href="https://pickywawa.github.io/cyberstream/en/">
    <img src="../assets/banner-en.png" alt="Cyberstream — 基于 Rust 引擎的 IPTV 播放器" width="100%" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/pickywawa/cyberstream/releases/latest"><img alt="最新版本" src="https://img.shields.io/github/v/release/pickywawa/cyberstream?style=for-the-badge&color=4fe3a8&labelColor=0b0b0d&label=version" /></a>
  <img alt="Rust + WebAssembly" src="https://img.shields.io/badge/engine-Rust%20%2B%20Wasm-4fe3a8?style=for-the-badge&labelColor=0b0b0d&logo=rust&logoColor=4fe3a8" />
  <a href="../../LICENSE"><img alt="MIT 许可证" src="https://img.shields.io/badge/license-MIT-4fe3a8?style=for-the-badge&labelColor=0b0b0d" /></a>
  <img alt="平台" src="https://img.shields.io/badge/Android%20%C2%B7%20TV%20%C2%B7%20iOS%20%C2%B7%20Desktop%20%C2%B7%20Web-2de2ff?style=for-the-badge&labelColor=0b0b0d" />
</p>

<p align="center">
  <b><a href="https://pickywawa.github.io/cyberstream/en/">网站</a></b> ·
  <b><a href="https://github.com/pickywawa/cyberstream/releases/latest">下载</a></b> ·
  <a href="#-%E5%8A%9F%E8%83%BD">功能</a> ·
  <a href="#-%E8%AF%AD%E8%A8%80%E4%B8%8E%E5%9B%BD%E5%AE%B6%E5%9C%B0%E5%8C%BA">国家/地区</a> ·
  <a href="#%EF%B8%8F-%E6%88%AA%E5%9B%BE">截图</a> ·
  <a href="#%EF%B8%8F-%E6%9E%84%E5%BB%BA%E4%B8%8E%E6%B5%8B%E8%AF%95">构建</a>
  <br />
  <a href="../../README.md">English</a> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a> · <a href="README.pt.md">Português</a> · <a href="README.ru.md">Русский</a> · <b>中文</b> · <a href="README.ja.md">日本語</a> · <a href="README.hi.md">हिन्दी</a> · <a href="README.bn.md">বাংলা</a> · <a href="README.ur.md">اردو</a> · <a href="README.ar.md">العربية</a> · <a href="README.id.md">Bahasa Indonesia</a>
</p>

---

**Cyberstream** 播放你的 **Xtream Codes** 和 **M3U** 源：直播频道、电视节目单、电影、剧集和回看。它将 IPTV 播放器 CyberTV 移植到 Rust：同一个 WebAssembly 模块运行在浏览器、Android 手机和电视、iOS 以及 Electron 中。Android 使用 Media3 进行视频解码和音轨选择。

> [!NOTE]
> Cyberstream 只是一个播放器，不提供任何内容：你需要使用自己的源。

<p align="center">
  <img src="../assets/demo.gif" alt="演示：个人资料、首页、电影页、直播、节目单和搜索" width="100%" />
  <br />
  <sub>使用演示源和 TMDB 元数据录制。界面显示为法语。</sub>
</p>

## ⚡ 功能

| | |
| --- | --- |
| 📡 **Xtream 与 M3U** | 分块读取片库，备用服务器，增量同步。 |
| 🗓️ **XMLTV 节目单** | 虚拟化网格，“当前”时间线，回看已播节目。 |
| 🎬 **电影与剧集** | 由 TMDB 丰富的详情页：演员、合集、年龄分级、季、继续观看、下一集。 |
| ⏸️ **直播暂停** | 30 至 60 分钟本地缓冲，±10 秒，回到直播，自动切换到备用流。 |
| 🎙️ **语音命令** | “切换到 5 频道”“搜索沙丘”“后退 30 秒”，支持界面的全部 14 种语言。 |
| 📱 **扫码配置** | 电视从你的手机获取个人资料、源和设置。 |
| 🔁 **免费回看** | ARTE、france.tv、Okoo、ARD Mediathek 以及 600 多个媒体 YouTube 频道，视你的国家而定。 |
| 💬 **字幕与 Trakt** | SRT、WebVTT、OpenSubtitles 哈希匹配、Trakt 记录与待看列表。 |
| 🌍 **14 种语言，42 个国家/地区** | 每个关注的国家都有免费频道、节目单、电台和比分，每个个人资料可关注多个国家。 |
| 👤 **个人资料** | 每个资料独立的头像、语言和年龄限制。服务令牌保存在设备的安全存储中。 |

## 🌍 语言与国家/地区

**界面**支持 14 种语言：法语、英语、德语、西班牙语、意大利语、葡萄牙语、阿拉伯语、印地语、中文、孟加拉语、印度尼西亚语、乌尔都语、俄语和日语。阿拉伯语和乌尔都语从右向左显示。语音命令、日期、TMDB 页面语言和语音识别都跟随个人资料的语言。

**每个个人资料可选多个国家/地区。** 在个人资料中选择一个或多个国家/地区（例如中国大陆和香港）。第一个为主要国家/地区。对于每个关注的国家/地区，应用会添加：

- **免费频道**：[iptv-org](https://github.com/iptv-org/iptv) 收录的公开免费流，作为一个源加入。创建个人资料时会提供“我所在国家的免费频道”选项：无需 IPTV 订阅即可使用。
- **免费节目单**：法国使用 [xmltvfr.fr](https://xmltvfr.fr)，其他国家使用 [epgshare01](https://epgshare01.online)。
- **回看**：france.tv 和 Okoo（法国）、ARD Mediathek（德国、奥地利）、ARTE（六种语言，欧洲）。
- **YouTube**：按主题分类的本国媒体频道（新闻、体育、纪录片、喜剧、媒体、电台）。全部经过核实：每个频道都通过其公开 RSS 订阅发布。
- **电台**：来自 [Radio Browser](https://www.radio-browser.info) 的本国最受欢迎电台。覆盖所有国家。
- **实时比分**：本国的联赛。

**国家筛选。** “只要我所在国家的频道”选项会在下载源时排除其他国家的频道分类（“UK|”“DE:”“[BE]”……）。该选项在设置源时、首次下载前提供。

| 国家/地区 | 免费频道 | 电视节目单 | 回看 | YouTube | 比分 |
| --- | --- | --- | --- | --- | --- |
| 🇫🇷 法国 | ≈231 (TF1, France 2, M6, Arte) | 有 | france.tv, Okoo, ARTE | 21 (BFMTV, franceinfo…) | Ligue 1, Champions League, Premier League |
| 🇧🇪 比利时 | ≈60 (La Une, Tipik, RTL-TVI, BX1) | 有 | ARTE | 10 (RTBF, RTBF Info…) | Pro League, Ligue 1, Champions League |
| 🇨🇭 瑞士 | ≈137 (RTS, RSI, Couleur 3, 3sat) | 有 | ARTE | 9 (RTS Info, Schweizer Radio und Fernsehen…) | Super League, Ligue 1, Bundesliga |
| 🇱🇺 卢森堡 | ≈20 (RTL, Eldo) | 有 | ARTE | 2 (RTL Luxembourg, Wort…) | Ligue 1, Bundesliga, Champions League |
| 🇨🇦 加拿大 | ≈265 (CBC, CTV, Télé-Québec) | 有 | — | 14 (CBC News, CTV News…) | NHL, NBA, NFL |
| 🇲🇦 摩洛哥 | ≈13 (2M, Al Aoula, Medi1) | — | — | 10 (2MTV, Hespress…) | AFCON, Ligue 1, LaLiga |
| 🇩🇿 阿尔及利亚 | ≈9 (Canal Algérie, Ennahar) | — | — | 7 (Ennahar Tv Plus, EchoroukTV…) | AFCON, Ligue 1, Champions League |
| 🇹🇳 突尼斯 | ≈4 (Watania, Nessma) | — | — | 7 (Mosaique FM, Nessma TV…) | AFCON, Ligue 1, Champions League |
| 🇬🇧 英国 | ≈302 (BBC One, BBC News, Channel 4) | 有 | ARTE | 30 (BBC News, Sky News…) | Premier League, Champions League |
| 🇮🇪 爱尔兰 | ≈58 (RTÉ News, Virgin Media) | 有 | ARTE | 9 (RTÉ News, The Irish Times…) | Premier Division, Premier League, Champions League |
| 🇺🇸 美国 | ≈1538 (PBS, ABC News, CBS News) | 有 | — | 41 (CNN, NBC News…) | NFL, NBA, NHL |
| 🇦🇺 澳大利亚 | ≈78 (ABC, 7, 9) | 有 | — | 11 (9 News Australia, SBS News…) | AFL, A-League, Premier League |
| 🇳🇿 新西兰 | ≈36 (TVNZ, Whakaata Māori) | 有 | — | 6 (RNZ, 1News…) | A-League, Premier League |
| 🇩🇪 德国 | ≈303 (Das Erste, ZDF, 3sat, tagesschau24) | 有 | ARD Mediathek, ARTE | 28 (tagesschau, ZDFheute Nachrichten…) | Bundesliga, Champions League |
| 🇦🇹 奥地利 | ≈114 (ORF, ServusTV, PULS 24) | 有 | ARD Mediathek, ARTE | 9 (PULS 24, Kronen Zeitung…) | Bundesliga (AT), Bundesliga, Champions League |
| 🇪🇸 西班牙 | ≈305 (3Cat, À Punt, 24 Horas, Atreseries) | 有 | ARTE | 27 (Antena 3 Noticias, EL PAÍS…) | LaLiga, Champions League, NBA |
| 🇲🇽 墨西哥 | ≈179 (Canal 22, Canal Once, Azteca) | 有 | — | 12 (NMás, MILENIO…) | Liga MX, Concacaf, LaLiga |
| 🇦🇷 阿根廷 | ≈224 (Telefe, TN, A24) | 有 | — | 11 (C5N, LA NACION…) | Liga Profesional, Libertadores, LaLiga |
| 🇨🇴 哥伦比亚 | ≈171 (Canal Capital, Señal Colombia) | 有 | — | 7 (Noticias Caracol, Noticias RCN…) | Primera A, Libertadores, LaLiga |
| 🇨🇱 智利 | ≈220 (TVN, 24 Horas, T13) | 有 | — | 9 (Teletrece, CHV Noticias…) | Primera División, Libertadores, LaLiga |
| 🇮🇹 意大利 | ≈359 (Rai 1, Rai 2, Rai 3, Rai News 24) | 有 | ARTE | 21 (RaiNews, Sky tg24…) | Serie A, Champions League |
| 🇵🇹 葡萄牙 | ≈72 (RTP 1, RTP 2, RTP Notícias, SIC) | 有 | — | 10 (RTP Notícias, TVI…) | Liga Portugal, Champions League |
| 🇧🇷 巴西 | ≈401 (TV Cultura, Record News, SBT) | 有 | — | 23 (g1, CNN Brasil…) | Brasileirão, Libertadores, NBA |
| 🇳🇱 荷兰 | ≈175 (NPO, AT5) | 有 | — | 11 (NOS, RTL Nieuws…) | Eredivisie, Champions League |
| 🇹🇷 土耳其 | ≈180 (TRT 1, TRT Haber, NTV) | 有 | — | 8 (TRT Haber, CNN TÜRK…) | Süper Lig, Champions League |
| 🇵🇱 波兰 | ≈188 (TVP Info, TVP World) | 有 | ARTE | 12 (tvn24, Polsat…) | Champions League |
| 🇷🇺 俄罗斯 | ≈518 (2x2, 360°, RT) | — | — | 19 (Телеканал Дождь, BBC News - Русская служба…) | RPL |
| 🇸🇦 沙特阿拉伯 | ≈56 (Al Saudiya, Al Ekhbariya, Asharq News) | 有 | — | 17 (AlArabiya العربية, سكاي نيوز عربية…) | Saudi Pro League, AFC Champions League, Premier League |
| 🇦🇪 阿拉伯联合酋长国 | ≈23 (Dubai TV, Abu Dhabi TV) | 有 | — | 10 (سكاي نيوز عربية, AlArabiya العربية…) | AFC Champions League, Premier League, LaLiga |
| 🇶🇦 卡塔尔 | ≈10 (Al Jazeera, Al Rayyan) | — | — | 4 (Al Jazeera English, العربي - أخبار…) | AFC Champions League, Premier League, LaLiga |
| 🇪🇬 埃及 | ≈21 (Nile Drama, MBC Masr, Al Ghad) | — | — | 11 (CBC Egypt, Sada Elbalad - صدى البلد…) | AFCON, Premier League, LaLiga |
| 🇮🇳 印度 | ≈826 (DD National, DD News, Aaj Tak, NDTV) | 有 | — | 30 (Aaj Tak, NDTV…) | ISL, Premier League |
| 🇵🇰 巴基斯坦 | ≈105 (PTV, ARY News, Dunya News) | — | — | 19 (Geo News, ARY News…) | Premier League |
| 🇧🇩 孟加拉国 | ≈37 (ATN Bangla, NTV, T Sports, Ekhon) | — | — | 17 (SOMOY TV, Jamuna TV Plus…) | Premier League |
| 🇮🇩 印度尼西亚 | ≈177 (TVRI, Kompas TV, Metro TV) | 有 | — | 28 (CNN Indonesia, tvOneNews…) | Super League, Premier League |
| 🇲🇾 马来西亚 | ≈6 (TV1, TV2) | 有 | — | 6 (Astro AWANI, Berita Harian Online…) | Super League, Premier League |
| 🇸🇬 新加坡 | ≈9 (CNA) | 有 | — | 5 (CNA Insider, CNA…) | Premier League |
| 🇨🇳 中国 | ≈156 (CCTV-1, CCTV-4, CCTV-13) | — | — | 11 (CGTN, CCTV Video News Agency…) | CSL, NBA |
| 🇹🇼 台湾 | ≈34 (PTS, TTV) | — | — | 10 (TVBS NEWS, SETN News Network…) | NBA, MLB |
| 🇭🇰 香港 | ≈18 (RTHK, TVB) | 有 | — | 7 (TVB NEWS Official 無綫新聞, RTHK 香港電台…) | Premier League, NBA |
| 🇯🇵 日本 | ≈17 (NHK General, Nippon TV, TV Asahi, Fuji TV) | 有 | — | 22 (ANNnewsCH, TBS NEWS DIG Powered by JNN…) | J1 League, MLB |
| 🇰🇷 韩国 | ≈72 (KBS, MBC, Arirang) | — | — | 16 (YTN, SBS News…) | MLB, Premier League |

免费频道数量来自撰写时的 iptv-org 列表。部分流只能在其所属国家播放，或经常变动。部分 ARD 视频只能在德国、奥地利和瑞士观看。

**不包含的服务。** BBC iPlayer、ITVX 和 Channel 4 需要账号以及来自英国的网络连接，iPlayer 还需要电视许可证。PBS 需通过各电视台的应用和账号。RTVE Play 使用 DRM 保护视频。RaiPlay 的大部分片库仅限意大利，且常需登录。这些服务的直播频道在免费播出时会出现在免费频道中，它们的 YouTube 频道则在回看中。

## 🖼️ 截图

<table>
  <tr>
    <td width="50%"><img src="../assets/screens/home-rows.webp" alt="带电影和剧集行的首页" /><p align="center"><sub>首页</sub></p></td>
    <td width="50%"><img src="../assets/screens/live.webp" alt="直播" /><p align="center"><sub>直播</sub></p></td>
  </tr>
  <tr>
    <td><img src="../assets/screens/guide.webp" alt="电视节目单" /><p align="center"><sub>电视节目单</sub></p></td>
    <td><img src="../assets/screens/movie.webp" alt="电影页" /><p align="center"><sub>电影页</sub></p></td>
  </tr>
  <tr>
    <td><img src="../assets/screens/series-episodes.webp" alt="剧集的季和集" /><p align="center"><sub>剧集</sub></p></td>
    <td><img src="../assets/screens/player.webp" alt="播放器" /><p align="center"><sub>播放器 — 测试流 <i>Big Buck Bunny</i> © Blender Foundation, CC BY</sub></p></td>
  </tr>
</table>

<p align="center">
  <img src="../assets/screens/mobile-home.webp" alt="手机上的首页" width="30%" />
  &nbsp;
  <img src="../assets/screens/mobile-rows.webp" alt="手机上的内容行" width="30%" />
  &nbsp;
  <img src="../assets/screens/mobile-movie.webp" alt="手机上的电影页" width="30%" />
</p>

## 📦 安装

从[最新版本](https://github.com/pickywawa/cyberstream/releases/latest)下载 `Cyberstream-x.y.z.apk`，然后安装到手机或电视上：

```sh
adb -d install -r Cyberstream-1.0.1.apk
```

Android 包名为 `app.cyberstream.player`。同一个 APK 可安装在手机上，并会出现在 Android TV 启动器中。声明的最低版本为 Android 7（API 24）。界面需要支持 WebAssembly 和 JavaScript 模块的 WebView；仅凭系统版本无法保证这一点。

## 🦀 移植进度

预发布版本对应 CyberTV 0.16.0。移植仍是混合状态。

| 功能 | 本版本的实现 |
| --- | --- |
| Xtream 与 M3U 源 | Rust 分块读取片库、对条目排序，并构建播放和回看 URL。TypeScript worker 负责调度请求、备用服务器、后台下载和 IndexedDB 事务。 |
| XMLTV 节目单 | Rust 解压 gzip、读取节目、处理时区，并绘制网格的可见单元格。导入期间，IndexedDB 保持旧节目表可用。 |
| 搜索与排序 | Rust 为标题建立索引、为频道排序、检测语言，并从 LZ4 压缩的页面恢复片库索引。 |
| 电影与剧集 | Rust 读取 Xtream 剧集和 TMDB 元数据，包括年龄分级、演员和合集。Rust 绘制页头、季、集、片库和卡片。音轨选择和流内跳转决策也使用 Rust。 |
| 回看与字幕 | Rust 处理 ARTE 和 france.tv 的片库与流、YouTube RSS 订阅、SRT 和 WebVTT，以及 OpenSubtitles 哈希。 |
| 界面与遥控器 | 主菜单、个人资料卡片、翻译、方向导航、虚拟化和语音命令使用 Rust。Trakt 客户端、OpenSubtitles 排序和扫码交换校验同样如此。首页、网格、搜索结果和回看页面有 Rust 视图。React 和 TypeScript 负责挂载页面、处理事件以及若干服务集成。 |
| 设备功能 | Android 保留了用于 Media3、缓存、时移、安全存储和电视配对的 Java 桥接。iOS 宿主使用 Swift，桌面宿主使用 Electron。 |

CyberTV 的页面被保留下来，以便在迁移期间维持用户流程。Android TV、iOS 和桌面端的完整一致性仍有待测试。原始规格见 [docs/SPECIFICATIONS.md](../SPECIFICATIONS.md)（法语）。

## 🛠️ 构建与测试

Web 和本地测试的要求：带 WebAssembly 目标的稳定版 Rust、Node.js 22.12 或更高版本以及 npm。绑定生成器的版本必须与 crate 版本一致。

```sh
rustup target add wasm32-unknown-unknown
cargo install --locked wasm-bindgen-cli --version 0.2.108
npm ci
cargo test --locked
npm test
npm run build
```

在设置好 Android SDK 36、JDK 21、`JAVA_HOME` 和 `ANDROID_HOME` 后：

```sh
npm run android:apk
adb -d install -r android/app/build/outputs/apk/debug/app-debug.apk
```

个人资料和源在设备上配置。要用模拟数据试用 Web 版，运行 `npm run dev -- --host 127.0.0.1`，并在设置时选择演示源。可选的服务密钥填写在个人资料设置中。自 0.16.3 版起，播放器会检查 Cyberstream 的 GitHub 发布（包括预发布）。每个 Android 发布都必须附带其 `update.json` 清单及其引用的 APK。要测试其他渠道，请在构建时将 `CYBER_UPDATE_URL` 设为清单 URL。0.16.1 和 0.16.2 版的用户需要手动安装一次更新的 APK。

## 📺 Android TV 上的资源

片库网格保存已排序的 ID，并按可见行逐行加载海报。首次下载会选择个人资料音频语言下的分类，并提供保留所有语言的选项。

Xtream 条目的指纹可在两次同步之间保留未变化的行。节目单同样保持稳定的时段 ID，只重写有变化的节目。

启动器和界面图标都是矢量图。Android 保留收到的 SVG 和动画，并按用途缩放照片。最大边长：标志 224 像素，卡片 448 像素，主视觉图 1024 像素。最多可同时进行两次图片解码。磁盘缓存目标为 96 MiB，并定期清除最久未使用的文件。

Android 上默认开启性能模式。首页只读取有限数量的电影样本。在该模式下，搜索按需建立索引。在被标记为低内存的设备上，播放器的媒体缓冲目标为 24 MiB。这些限制只约束特定子系统。总内存、启动时间和流畅度需要在目标电视上实测。

## 🌐 网站

网站位于 [`docs/`](../)（纯 HTML、CSS 和 JS，无需构建），法语版在根目录，英语版在 `docs/en/`。它通过 GitHub Pages 从 `main` 分支的 `/docs` 目录发布。本地预览：

```sh
python3 -m http.server 8090 -d docs
```

## 📄 许可证

代码以 [MIT](../../LICENSE) 许可证发布。

---

<p align="center"><sub>海报、照片和元数据：<a href="https://www.themoviedb.org/">TMDB</a>。本产品使用 TMDB API，但未经 TMDB 认可或认证。频道标志和免费频道列表：<a href="https://github.com/iptv-org">iptv-org</a>；商标和图像归其所有者所有。电视节目单：xmltvfr.fr 和 epgshare01。电台：Radio Browser。播放器视频：测试流 <i>Big Buck Bunny</i> © Blender Foundation, CC BY 3.0。</sub></p>
