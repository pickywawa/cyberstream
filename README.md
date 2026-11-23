# Cyberstream

Cyberstream porte le lecteur IPTV CyberTV vers Rust. Le même module WebAssembly sert le navigateur, Android mobile et TV, iOS et Electron. Android utilise Media3 pour le décodage vidéo et le choix des pistes.

## État du portage

La préversion suit CyberTV 0.16.0. Le portage reste hybride.

| Fonction | Implémentation dans cette version |
| --- | --- |
| Sources Xtream et M3U | Rust lit les catalogues par blocs, classe les entrées et construit les adresses de lecture et de rattrapage. Le worker TypeScript orchestre les requêtes, les serveurs de secours, les téléchargements en arrière-plan et les transactions IndexedDB. |
| Guide XMLTV | Rust décompresse gzip, lit les programmes, gère les fuseaux et rend les cellules visibles de la grille. IndexedDB garde l’ancien horaire disponible pendant un import. |
| Recherche et classement | Rust indexe les titres, classe les chaînes, reconnaît les langues et restaure l’index du catalogue depuis des pages compressées LZ4. |
| Films et séries | Rust lit les épisodes Xtream et les métadonnées TMDB, dont les restrictions d’âge, acteurs et collections. Rust rend les en-têtes des fiches, les saisons, les épisodes, la bibliothèque et les cartes. La sélection des pistes et les décisions de recherche dans le flux utilisent aussi Rust. |
| Replay et sous-titres | Rust traite les catalogues et flux ARTE et france.tv, les flux RSS YouTube, les formats SRT et WebVTT et l’empreinte OpenSubtitles. |
| Interface et télécommande | Les menus principaux, les tuiles de profil, les traductions, le déplacement directionnel, la virtualisation et les commandes vocales utilisent Rust. Le client Trakt, le classement OpenSubtitles et la validation des échanges par QR code utilisent également Rust. L’accueil, les grilles, les résultats de recherche et les fiches Replay ont des vues Rust. React et TypeScript assurent le montage des écrans, les événements et plusieurs intégrations de services. |
| Fonctions d’appareil | Android conserve les ponts Java pour Media3, le cache, le timeshift, le coffre de secrets et l’appairage TV. L’hôte iOS utilise Swift et l’hôte de bureau utilise Electron. |

Les écrans de CyberTV ont été repris pour conserver les parcours pendant la migration. La parité complète sur Android TV, iOS et ordinateur reste à tester. Les spécifications d’origine se trouvent dans [docs/SPECIFICATIONS.md](docs/SPECIFICATIONS.md).

## Compiler et tester

Prérequis pour le web et les tests locaux : Rust stable avec la cible WebAssembly, Node.js 22.12 ou ultérieur et npm. Le générateur de liaisons doit correspondre à la version du crate.

```sh
rustup target add wasm32-unknown-unknown
cargo install --locked wasm-bindgen-cli --version 0.2.108
npm ci
cargo test --locked
npm test
npm run build
```

Avec le SDK Android 36, JDK 21, `JAVA_HOME` et `ANDROID_HOME` configurés :

```sh
npm run android:apk
adb -d install -r android/app/build/outputs/apk/debug/app-debug.apk
```

Le paquet Android est `app.cyberstream.player`. Le même APK s’installe sur mobile et apparaît dans le lanceur Android TV. Le minimum déclaré dans le projet est Android 7 (API 24). L’interface nécessite un WebView compatible WebAssembly et modules JavaScript. La version du système seule ne garantit pas cette compatibilité.

Le profil et les sources se configurent sur l’appareil. Pour tester le web avec les données fictives, lancer `npm run dev -- --host 127.0.0.1` et sélectionner la source de démonstration pendant la configuration. Les clés de services facultatifs se renseignent dans les paramètres du profil. Depuis la version 0.16.3, le lecteur vérifie les publications GitHub de Cyberstream, préversions comprises. Chaque publication Android doit joindre son manifeste `update.json` et l’APK qu’il référence. Pour tester un autre canal, définir `CYBER_UPDATE_URL` avec l’URL d’un manifeste lors du build. Les utilisateurs des versions 0.16.1 et 0.16.2 doivent installer manuellement une première fois un APK plus récent.

## Ressources sur Android TV

La grille du catalogue conserve des identifiants triés et lit les affiches par rangée visible. Le premier téléchargement sélectionne les catégories dans les langues audio du profil, avec une option pour garder toutes les langues.

Une empreinte des entrées Xtream permet de conserver les lignes inchangées entre deux synchronisations. Le guide conserve aussi les identifiants des créneaux stables et réécrit les programmes modifiés.

Les lanceurs et les icônes d’interface utilisent des dessins vectoriels. Android conserve les SVG et animations reçus et adapte les photographies à leur usage. Le bord maximal est de 224 pixels pour un logo, 448 pour une carte et 1 024 pour un visuel principal. Deux décodages d’image peuvent fonctionner simultanément. Le cache disque vise 96 Mio avec éviction périodique des fichiers les moins récemment utilisés.

Le mode performance est activé par défaut sur Android. L’accueil lit un échantillon borné de films. La recherche construit son index à la demande dans ce mode. Sur un appareil identifié comme pauvre en mémoire, le lecteur cible 24 Mio de tampon média. Ces limites encadrent des sous-systèmes précis. La mémoire totale, le temps de démarrage et la fluidité doivent être mesurés sur le téléviseur cible.
