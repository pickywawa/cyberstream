<p align="center">
  <a href="https://pickywawa.github.io/cyberstream/en/">
    <img src="docs/assets/banner-en.png" alt="Cyberstream — Rust エンジンの IPTV プレーヤー" width="100%" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/pickywawa/cyberstream/releases/latest"><img alt="最新バージョン" src="https://img.shields.io/github/v/release/pickywawa/cyberstream?style=for-the-badge&color=4fe3a8&labelColor=0b0b0d&label=version" /></a>
  <img alt="Rust + WebAssembly" src="https://img.shields.io/badge/engine-Rust%20%2B%20Wasm-4fe3a8?style=for-the-badge&labelColor=0b0b0d&logo=rust&logoColor=4fe3a8" />
  <a href="LICENSE"><img alt="MIT ライセンス" src="https://img.shields.io/badge/license-MIT-4fe3a8?style=for-the-badge&labelColor=0b0b0d" /></a>
  <img alt="プラットフォーム" src="https://img.shields.io/badge/Android%20%C2%B7%20TV%20%C2%B7%20iOS%20%C2%B7%20Desktop%20%C2%B7%20Web-2de2ff?style=for-the-badge&labelColor=0b0b0d" />
</p>

<p align="center">
  <b><a href="https://pickywawa.github.io/cyberstream/en/">ウェブサイト</a></b> ·
  <b><a href="https://github.com/pickywawa/cyberstream/releases/latest">ダウンロード</a></b> ·
  <a href="#-%E6%A9%9F%E8%83%BD">機能</a> ·
  <a href="#-%E8%A8%80%E8%AA%9E%E3%81%A8%E5%9B%BD%E5%9C%B0%E5%9F%9F">国・地域</a> ·
  <a href="#%EF%B8%8F-%E3%82%B9%E3%82%AF%E3%83%AA%E3%83%BC%E3%83%B3%E3%82%B7%E3%83%A7%E3%83%83%E3%83%88">スクリーンショット</a> ·
  <a href="#%EF%B8%8F-%E3%83%93%E3%83%AB%E3%83%89%E3%81%A8%E3%83%86%E3%82%B9%E3%83%88">ビルド</a>
  <br />
  <a href="README.md">English</a> · <a href="README.fr.md">Français</a> · <a href="README.es.md">Español</a> · <a href="README.de.md">Deutsch</a> · <a href="README.it.md">Italiano</a> · <a href="README.pt.md">Português</a> · <a href="README.ru.md">Русский</a> · <a href="README.zh.md">中文</a> · <b>日本語</b> · <a href="README.hi.md">हिन्दी</a> · <a href="README.bn.md">বাংলা</a> · <a href="README.ur.md">اردو</a> · <a href="README.ar.md">العربية</a> · <a href="README.id.md">Bahasa Indonesia</a>
</p>

---

**Cyberstream** は、あなたの **Xtream Codes** と **M3U** ソースを再生します。ライブチャンネル、番組表、映画、シリーズ、見逃し配信に対応。IPTV プレーヤー CyberTV を Rust に移植したもので、同じ WebAssembly モジュールがブラウザ、Android のスマートフォンとテレビ、iOS、Electron で動作します。Android では動画のデコードとトラック選択に Media3 を使用します。

> [!NOTE]
> Cyberstream はプレーヤーです。コンテンツは一切提供しません。ご自身のソースをお使いください。

<p align="center">
  <img src="docs/assets/demo.gif" alt="デモ：プロフィール、ホーム、映画ページ、ライブ TV、番組表、検索" width="100%" />
  <br />
  <sub>デモソースと TMDB のメタデータで録画。インターフェースはフランス語で表示されています。</sub>
</p>

## ⚡ 機能

| | |
| --- | --- |
| 📡 **Xtream と M3U** | カタログの分割読み込み、バックアップサーバー、差分同期。 |
| 🗓️ **XMLTV 番組表** | 仮想化されたグリッド、「現在」ライン、過去番組の見逃し視聴。 |
| 🎬 **映画とシリーズ** | TMDB で充実したページ：キャスト、コレクション、年齢区分、シーズン、続きから再生、次のエピソード。 |
| ⏸️ **ライブ一時停止** | 30〜60 分のローカルバッファ、±10 秒、ライブに戻る、バックアップストリームへの自動切り替え。 |
| 🎙️ **音声コマンド** | 「5 チャンネルにして」「デューンを検索」「30 秒戻して」。インターフェースの 14 言語に対応。 |
| 📱 **QR コードで設定** | テレビがスマートフォンからプロフィール、ソース、設定を受け取ります。 |
| 🔁 **無料の見逃し配信** | ARTE、france.tv、Okoo、ARD Mediathek、そして 600 以上の報道機関の YouTube チャンネル（国によって異なります）。 |
| 💬 **字幕と Trakt** | SRT、WebVTT、OpenSubtitles のハッシュ照合、Trakt のスクロブルとウォッチリスト。 |
| 🌍 **14 言語、42 の国・地域** | フォローする国ごとに無料チャンネル、番組表、ラジオ、スコア。1 つのプロフィールで複数の国を選択可能。 |
| 👤 **プロフィール** | プロフィールごとのアバター、言語、年齢制限。サービスのトークンは端末の安全な保管領域に保存されます。 |

## 🌍 言語と国・地域

**インターフェース**は 14 言語：フランス語、英語、ドイツ語、スペイン語、イタリア語、ポルトガル語、アラビア語、ヒンディー語、中国語、ベンガル語、インドネシア語、ウルドゥー語、ロシア語、日本語。アラビア語とウルドゥー語は右から左に表示されます。音声コマンド、日付、TMDB ページの言語、音声認識はプロフィールの言語に従います。

**1 つのプロフィールで複数の国。** プロフィールで 1 つまたは複数の国を選びます（例：日本とアメリカ）。最初の国がメインの国になります。フォローする国ごとに、アプリは次を追加します：

- **無料チャンネル**：[iptv-org](https://github.com/iptv-org/iptv) に掲載されている公開の無料ストリームをソースとして追加。プロフィール作成時に「自分の国の無料チャンネル」オプションが表示されます。IPTV の契約なしでも使えます。
- **無料番組表**：フランスは [xmltvfr.fr](https://xmltvfr.fr)、その他の国は [epgshare01](https://epgshare01.online)。
- **見逃し配信**：france.tv と Okoo（フランス）、ARD Mediathek（ドイツ、オーストリア）、ARTE（ヨーロッパで 6 言語）。
- **YouTube**：その国の報道機関のチャンネルをテーマ別に（ニュース、スポーツ、ドキュメンタリー、お笑い、メディア、ラジオ）。すべて確認済みで、各チャンネルは公開 RSS フィードで配信しています。
- **ラジオ**：[Radio Browser](https://www.radio-browser.info) によるその国で最も聴かれている局。すべての国に対応。
- **ライブスコア**：その国のリーグ。

**国フィルター。** 「自分の国のチャンネルのみ」オプションを使うと、ソースのダウンロード時に他国のチャンネルカテゴリ（「UK|」「DE:」「[BE]」など）が除外されます。ソースの設定中、最初のダウンロードの前に表示されます。

| 国・地域 | 無料チャンネル | 番組表 | 見逃し配信 | YouTube | スコア |
| --- | --- | --- | --- | --- | --- |
| 🇫🇷 フランス | ≈231 (TF1, France 2, M6, Arte) | あり | france.tv, Okoo, ARTE | 21 (BFMTV, franceinfo…) | Ligue 1, Champions League, Premier League |
| 🇧🇪 ベルギー | ≈60 (La Une, Tipik, RTL-TVI, BX1) | あり | ARTE | 10 (RTBF, RTBF Info…) | Pro League, Ligue 1, Champions League |
| 🇨🇭 スイス | ≈137 (RTS, RSI, Couleur 3, 3sat) | あり | ARTE | 9 (RTS Info, Schweizer Radio und Fernsehen…) | Super League, Ligue 1, Bundesliga |
| 🇱🇺 ルクセンブルク | ≈20 (RTL, Eldo) | あり | ARTE | 2 (RTL Luxembourg, Wort…) | Ligue 1, Bundesliga, Champions League |
| 🇨🇦 カナダ | ≈265 (CBC, CTV, Télé-Québec) | あり | — | 14 (CBC News, CTV News…) | NHL, NBA, NFL |
| 🇲🇦 モロッコ | ≈13 (2M, Al Aoula, Medi1) | — | — | 10 (2MTV, Hespress…) | AFCON, Ligue 1, LaLiga |
| 🇩🇿 アルジェリア | ≈9 (Canal Algérie, Ennahar) | — | — | 7 (Ennahar Tv Plus, EchoroukTV…) | AFCON, Ligue 1, Champions League |
| 🇹🇳 チュニジア | ≈4 (Watania, Nessma) | — | — | 7 (Mosaique FM, Nessma TV…) | AFCON, Ligue 1, Champions League |
| 🇬🇧 イギリス | ≈302 (BBC One, BBC News, Channel 4) | あり | ARTE | 30 (BBC News, Sky News…) | Premier League, Champions League |
| 🇮🇪 アイルランド | ≈58 (RTÉ News, Virgin Media) | あり | ARTE | 9 (RTÉ News, The Irish Times…) | Premier Division, Premier League, Champions League |
| 🇺🇸 アメリカ合衆国 | ≈1538 (PBS, ABC News, CBS News) | あり | — | 41 (CNN, NBC News…) | NFL, NBA, NHL |
| 🇦🇺 オーストラリア | ≈78 (ABC, 7, 9) | あり | — | 11 (9 News Australia, SBS News…) | AFL, A-League, Premier League |
| 🇳🇿 ニュージーランド | ≈36 (TVNZ, Whakaata Māori) | あり | — | 6 (RNZ, 1News…) | A-League, Premier League |
| 🇩🇪 ドイツ | ≈303 (Das Erste, ZDF, 3sat, tagesschau24) | あり | ARD Mediathek, ARTE | 28 (tagesschau, ZDFheute Nachrichten…) | Bundesliga, Champions League |
| 🇦🇹 オーストリア | ≈114 (ORF, ServusTV, PULS 24) | あり | ARD Mediathek, ARTE | 9 (PULS 24, Kronen Zeitung…) | Bundesliga (AT), Bundesliga, Champions League |
| 🇪🇸 スペイン | ≈305 (3Cat, À Punt, 24 Horas, Atreseries) | あり | ARTE | 27 (Antena 3 Noticias, EL PAÍS…) | LaLiga, Champions League, NBA |
| 🇲🇽 メキシコ | ≈179 (Canal 22, Canal Once, Azteca) | あり | — | 12 (NMás, MILENIO…) | Liga MX, Concacaf, LaLiga |
| 🇦🇷 アルゼンチン | ≈224 (Telefe, TN, A24) | あり | — | 11 (C5N, LA NACION…) | Liga Profesional, Libertadores, LaLiga |
| 🇨🇴 コロンビア | ≈171 (Canal Capital, Señal Colombia) | あり | — | 7 (Noticias Caracol, Noticias RCN…) | Primera A, Libertadores, LaLiga |
| 🇨🇱 チリ | ≈220 (TVN, 24 Horas, T13) | あり | — | 9 (Teletrece, CHV Noticias…) | Primera División, Libertadores, LaLiga |
| 🇮🇹 イタリア | ≈359 (Rai 1, Rai 2, Rai 3, Rai News 24) | あり | ARTE | 21 (RaiNews, Sky tg24…) | Serie A, Champions League |
| 🇵🇹 ポルトガル | ≈72 (RTP 1, RTP 2, RTP Notícias, SIC) | あり | — | 10 (RTP Notícias, TVI…) | Liga Portugal, Champions League |
| 🇧🇷 ブラジル | ≈401 (TV Cultura, Record News, SBT) | あり | — | 23 (g1, CNN Brasil…) | Brasileirão, Libertadores, NBA |
| 🇳🇱 オランダ | ≈175 (NPO, AT5) | あり | — | 11 (NOS, RTL Nieuws…) | Eredivisie, Champions League |
| 🇹🇷 トルコ | ≈180 (TRT 1, TRT Haber, NTV) | あり | — | 8 (TRT Haber, CNN TÜRK…) | Süper Lig, Champions League |
| 🇵🇱 ポーランド | ≈188 (TVP Info, TVP World) | あり | ARTE | 12 (tvn24, Polsat…) | Champions League |
| 🇷🇺 ロシア | ≈518 (2x2, 360°, RT) | — | — | 19 (Телеканал Дождь, BBC News - Русская служба…) | RPL |
| 🇸🇦 サウジアラビア | ≈56 (Al Saudiya, Al Ekhbariya, Asharq News) | あり | — | 17 (AlArabiya العربية, سكاي نيوز عربية…) | Saudi Pro League, AFC Champions League, Premier League |
| 🇦🇪 アラブ首長国連邦 | ≈23 (Dubai TV, Abu Dhabi TV) | あり | — | 10 (سكاي نيوز عربية, AlArabiya العربية…) | AFC Champions League, Premier League, LaLiga |
| 🇶🇦 カタール | ≈10 (Al Jazeera, Al Rayyan) | — | — | 4 (Al Jazeera English, العربي - أخبار…) | AFC Champions League, Premier League, LaLiga |
| 🇪🇬 エジプト | ≈21 (Nile Drama, MBC Masr, Al Ghad) | — | — | 11 (CBC Egypt, Sada Elbalad - صدى البلد…) | AFCON, Premier League, LaLiga |
| 🇮🇳 インド | ≈826 (DD National, DD News, Aaj Tak, NDTV) | あり | — | 30 (Aaj Tak, NDTV…) | ISL, Premier League |
| 🇵🇰 パキスタン | ≈105 (PTV, ARY News, Dunya News) | — | — | 19 (Geo News, ARY News…) | Premier League |
| 🇧🇩 バングラデシュ | ≈37 (ATN Bangla, NTV, T Sports, Ekhon) | — | — | 17 (SOMOY TV, Jamuna TV Plus…) | Premier League |
| 🇮🇩 インドネシア | ≈177 (TVRI, Kompas TV, Metro TV) | あり | — | 28 (CNN Indonesia, tvOneNews…) | Super League, Premier League |
| 🇲🇾 マレーシア | ≈6 (TV1, TV2) | あり | — | 6 (Astro AWANI, Berita Harian Online…) | Super League, Premier League |
| 🇸🇬 シンガポール | ≈9 (CNA) | あり | — | 5 (CNA Insider, CNA…) | Premier League |
| 🇨🇳 中国 | ≈156 (CCTV-1, CCTV-4, CCTV-13) | — | — | 11 (CGTN, CCTV Video News Agency…) | CSL, NBA |
| 🇹🇼 台湾 | ≈34 (PTS, TTV) | — | — | 10 (TVBS NEWS, SETN News Network…) | NBA, MLB |
| 🇭🇰 香港 | ≈18 (RTHK, TVB) | あり | — | 7 (TVB NEWS Official 無綫新聞, RTHK 香港電台…) | Premier League, NBA |
| 🇯🇵 日本 | ≈17 (NHK General, Nippon TV, TV Asahi, Fuji TV) | あり | — | 22 (ANNnewsCH, TBS NEWS DIG Powered by JNN…) | J1 League, MLB |
| 🇰🇷 韓国 | ≈72 (KBS, MBC, Arirang) | — | — | 16 (YTN, SBS News…) | MLB, Premier League |

無料チャンネル数は執筆時点の iptv-org のリストによるものです。一部のストリームは自国でしか視聴できなかったり、頻繁に変わったりします。ARD の一部の動画はドイツ、オーストリア、スイスでのみ視聴できます。

**含まれないサービス。** BBC iPlayer、ITVX、Channel 4 はアカウントとイギリスからの接続が必要で、iPlayer にはさらに TV ライセンスが必要です。PBS は各局のアプリとアカウントを経由します。RTVE Play は動画を DRM で保護しています。RaiPlay はカタログの多くをイタリア限定にしており、ログインが必要なことも多いです。これらのライブチャンネルは無料放送されている場合は無料チャンネルに、YouTube チャンネルは見逃し配信に表示されます。

## 🖼️ スクリーンショット

<table>
  <tr>
    <td width="50%"><img src="docs/assets/screens/home-rows.webp" alt="映画とシリーズの列があるホーム" /><p align="center"><sub>ホーム</sub></p></td>
    <td width="50%"><img src="docs/assets/screens/live.webp" alt="ライブ TV" /><p align="center"><sub>ライブ TV</sub></p></td>
  </tr>
  <tr>
    <td><img src="docs/assets/screens/guide.webp" alt="番組表" /><p align="center"><sub>番組表</sub></p></td>
    <td><img src="docs/assets/screens/movie.webp" alt="映画ページ" /><p align="center"><sub>映画ページ</sub></p></td>
  </tr>
  <tr>
    <td><img src="docs/assets/screens/series-episodes.webp" alt="シリーズのシーズンとエピソード" /><p align="center"><sub>シリーズ</sub></p></td>
    <td><img src="docs/assets/screens/player.webp" alt="プレーヤー" /><p align="center"><sub>プレーヤー — テストストリーム <i>Big Buck Bunny</i> © Blender Foundation, CC BY</sub></p></td>
  </tr>
</table>

<p align="center">
  <img src="docs/assets/screens/mobile-home.webp" alt="スマートフォンのホーム" width="30%" />
  &nbsp;
  <img src="docs/assets/screens/mobile-rows.webp" alt="スマートフォンの列表示" width="30%" />
  &nbsp;
  <img src="docs/assets/screens/mobile-movie.webp" alt="スマートフォンの映画ページ" width="30%" />
</p>

## 📦 インストール

[最新リリース](https://github.com/pickywawa/cyberstream/releases/latest)から `Cyberstream-x.y.z.apk` をダウンロードし、スマートフォンまたはテレビにインストールします：

```sh
adb -d install -r Cyberstream-1.0.1.apk
```

Android パッケージ名は `app.cyberstream.player` です。同じ APK がスマートフォンにインストールでき、Android TV のランチャーにも表示されます。公称の最小要件は Android 7（API 24）です。インターフェースには WebAssembly と JavaScript モジュールに対応した WebView が必要で、システムのバージョンだけではそれは保証されません。

## 🦀 移植の状況

プレリリースは CyberTV 0.16.0 に準拠しています。移植はまだハイブリッドです。

| 機能 | このバージョンでの実装 |
| --- | --- |
| Xtream と M3U のソース | Rust がカタログを分割して読み込み、項目を並べ替え、再生用と見逃し配信用の URL を組み立てます。TypeScript のワーカーがリクエスト、バックアップサーバー、バックグラウンドダウンロード、IndexedDB のトランザクションを統括します。 |
| XMLTV 番組表 | Rust が gzip を展開し、番組を読み取り、タイムゾーンを処理し、グリッドの表示セルを描画します。インポート中も IndexedDB が以前の番組表を利用可能に保ちます。 |
| 検索と並べ替え | Rust がタイトルを索引化し、チャンネルを並べ替え、言語を判定し、LZ4 圧縮ページからカタログの索引を復元します。 |
| 映画とシリーズ | Rust が Xtream のエピソードと TMDB のメタデータ（年齢区分、キャスト、コレクションを含む）を読み取ります。ページのヘッダー、シーズン、エピソード、ライブラリ、カードも Rust が描画します。トラック選択とストリーム内シークの判断も Rust です。 |
| 見逃し配信と字幕 | Rust が ARTE と france.tv のカタログとストリーム、YouTube の RSS フィード、SRT と WebVTT、OpenSubtitles のハッシュを処理します。 |
| インターフェースとリモコン | メインメニュー、プロフィールタイル、翻訳、方向キー操作、仮想化、音声コマンドは Rust です。Trakt クライアント、OpenSubtitles の並べ替え、QR コード交換の検証も同様です。ホーム、グリッド、検索結果、見逃し配信ページには Rust のビューがあります。React と TypeScript は画面のマウント、イベント処理、いくつかのサービス連携を担当します。 |
| 端末機能 | Android は Media3、キャッシュ、タイムシフト、安全な保管領域、テレビのペアリングのための Java ブリッジを維持しています。iOS ホストは Swift、デスクトップホストは Electron です。 |

移行中も利用の流れを保つため、CyberTV の画面を引き継いでいます。Android TV、iOS、デスクトップでの完全な同等性はまだ検証が必要です。元の仕様は [docs/SPECIFICATIONS.md](docs/SPECIFICATIONS.md)（フランス語）にあります。

## 🛠️ ビルドとテスト

Web とローカルテストの要件：WebAssembly ターゲット付きの安定版 Rust、Node.js 22.12 以降、npm。バインディング生成ツールのバージョンは crate のバージョンと一致させる必要があります。

```sh
rustup target add wasm32-unknown-unknown
cargo install --locked wasm-bindgen-cli --version 0.2.108
npm ci
cargo test --locked
npm test
npm run build
```

Android SDK 36、JDK 21 を用意し、`JAVA_HOME` と `ANDROID_HOME` を設定した状態で：

```sh
npm run android:apk
adb -d install -r android/app/build/outputs/apk/debug/app-debug.apk
```

プロフィールとソースは端末上で設定します。モックデータで Web 版を試すには、`npm run dev -- --host 127.0.0.1` を実行し、設定時にデモソースを選びます。任意のサービスキーはプロフィール設定に入力します。バージョン 0.16.3 以降、プレーヤーはプレリリースを含む Cyberstream の GitHub リリースを確認します。各 Android リリースには `update.json` マニフェストと、それが参照する APK を添付する必要があります。別のチャンネルを試すには、ビルド時に `CYBER_UPDATE_URL` にマニフェストの URL を設定します。バージョン 0.16.1 と 0.16.2 のユーザーは、一度だけ新しい APK を手動でインストールする必要があります。

## 📺 Android TV でのリソース

カタロググリッドは並べ替え済みの ID を保持し、表示中の行ごとにポスターを読み込みます。最初のダウンロードではプロフィールの音声言語のカテゴリを選択し、すべての言語を残すオプションもあります。

Xtream 項目のフィンガープリントにより、2 回の同期の間で変更のない行が保持されます。番組表も安定した枠 ID を保ち、変更された番組だけを書き換えます。

ランチャーとインターフェースのアイコンはベクター画像です。Android は受け取った SVG とアニメーションを保持し、写真は用途に合わせてリサイズします。最大辺はロゴで 224 ピクセル、カードで 448、メインビジュアルで 1,024 です。画像のデコードは同時に 2 つまで実行できます。ディスクキャッシュは 96 MiB を目標とし、最も長く使われていないファイルを定期的に削除します。

Android ではパフォーマンスモードが既定で有効です。ホームは限られた数の映画のサンプルを読み込みます。このモードでは検索の索引は必要に応じて作成されます。メモリ不足とされる端末では、プレーヤーは 24 MiB のメディアバッファを目標にします。これらの制限は特定のサブシステムに対するものです。総メモリ、起動時間、滑らかさは対象のテレビで計測する必要があります。

## 🌐 ウェブサイト

ウェブサイトは [`docs/`](docs/) にあります（素の HTML、CSS、JS、ビルド不要）。ルートがフランス語、`docs/en/` が英語です。GitHub Pages で `main` ブランチの `/docs` フォルダから公開しています。ローカルプレビュー：

```sh
python3 -m http.server 8090 -d docs
```

## 📄 ライセンス

コードは [MIT](LICENSE) ライセンスで公開されています。

---

<p align="center"><sub>ポスター、写真、メタデータ：<a href="https://www.themoviedb.org/">TMDB</a>。本製品は TMDB API を使用していますが、TMDB による承認や認定を受けたものではありません。チャンネルロゴと無料チャンネルのリスト：<a href="https://github.com/iptv-org">iptv-org</a>。商標と画像は各所有者に帰属します。番組表：xmltvfr.fr と epgshare01。ラジオ：Radio Browser。プレーヤーの映像：テストストリーム <i>Big Buck Bunny</i> © Blender Foundation, CC BY 3.0。</sub></p>
