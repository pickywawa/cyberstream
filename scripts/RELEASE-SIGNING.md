# Desktop and web releases

| Platform | Output | Signing |
|---|---|---|
| macOS | `Cyberstream-<v>-mac-arm64.dmg`, `…-mac-x64.dmg` | Developer ID *Alexis PICARD (C68LA5KQ8J)* + Apple notarization |
| Windows | `Cyberstream-Setup-<v>-x64.exe`, `Cyberstream-<v>-portable-x64.exe` | not signed (SmartScreen warning) |
| Linux | `Cyberstream-<v>-linux-x86_64.AppImage`, `…-linux-amd64.deb` | not signed, `SHA256SUMS-desktop.txt` on the release |
| Web | https://pickywawa.github.io/cyberstream/app/ | — |

The web build has no proxy: only HTTPS sources that send CORS headers work there. The app says so in the source form.

## Local builds

The keys live outside the repository, in `~/.config/cyberstream-release/` (same Developer ID certificate as Cyberdog):

| File | Content |
|---|---|
| `developer-id.p12` / `.p12.base64` | Developer ID Application certificate + private key |
| `p12.pass` | its password |
| `AuthKey_59CK456HKF.p8` | App Store Connect API key (Developer role) for notarization |
| `env` | `CSC_LINK`, `CSC_KEY_PASSWORD_FILE`, `APPLE_API_KEY`, `APPLE_API_KEY_ID`, `APPLE_API_ISSUER` |

```sh
npm run desktop:dist                # all three platforms into release/desktop
npm run release -- --desktop        # full release (APK + web + desktop)
```

`scripts/desktop-dist.mjs` reads `~/.config/cyberstream-release/env` (environment variables win). Without the certificate the macOS build falls back to ad hoc signing; without `APPLE_API_ISSUER` it is signed but not notarized.

## CI (`.github/workflows/release.yml`)

Each `v*` tag builds the three platforms and attaches the installers to the release. Secrets:

```sh
gh secret set MACOS_CERT_P12_BASE64 < ~/.config/cyberstream-release/developer-id.p12.base64
gh secret set MACOS_CERT_PASSWORD < ~/.config/cyberstream-release/p12.pass
gh secret set APPLE_API_KEY_P8 < ~/.config/cyberstream-release/AuthKey_59CK456HKF.p8
gh secret set APPLE_API_KEY_ID --body 59CK456HKF
gh secret set APPLE_API_ISSUER_ID        # App Store Connect → Users and Access → Integrations → Issuer ID
```

`.github/workflows/pages.yml` publishes `docs/` and the web app on every push to `main` (Pages source: GitHub Actions).
