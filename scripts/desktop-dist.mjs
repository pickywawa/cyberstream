#!/usr/bin/env node
/**
 * Builds the desktop app (Electron) installers into release/desktop.
 *
 *   node scripts/desktop-dist.mjs [--mac] [--win] [--linux]     (no flag: all three)
 *
 * macOS is signed with the Developer ID certificate and notarized by Apple when the signing keys are
 * available, otherwise it falls back to an ad hoc (unsigned) build. The keys come from the environment
 * (CI secrets) or from ~/.config/cyberstream-release/env (local builds):
 *   CSC_LINK (.p12 path or base64), CSC_KEY_PASSWORD or CSC_KEY_PASSWORD_FILE,
 *   APPLE_API_KEY (.p8 path), APPLE_API_KEY_ID, APPLE_API_ISSUER
 * In CI the certificate is imported into a keychain beforehand and CSC_KEYCHAIN is set instead of CSC_LINK.
 * Windows and Linux are not signed.
 *
 * Expects dist/ (vite build) to be built already; builds dist-electron/ itself.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const wanted = ['--mac', '--win', '--linux'].filter((f) => args.includes(f));
const targets = wanted.length ? wanted : ['--mac', '--win', '--linux'];
const out = join(root, 'release', 'desktop');
const IDENTITY = 'Alexis PICARD (C68LA5KQ8J)';

const run = (cmd, env = {}) => execSync(cmd, { cwd: root, stdio: 'inherit', env: { ...process.env, ...env } });

/** KEY="value" lines, $HOME expanded; the environment wins over the file */
function loadEnvFile(file) {
  if (!existsSync(file)) return {};
  const env = {};
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?(.*?)"?\s*$/);
    if (m && m[2]) env[m[1]] = m[2].replace(/\$HOME|~(?=\/)/g, homedir());
  }
  return env;
}

const signing = { ...loadEnvFile(join(homedir(), '.config/cyberstream-release/env')), ...process.env };
if (!signing.CSC_KEY_PASSWORD && signing.CSC_KEY_PASSWORD_FILE && existsSync(signing.CSC_KEY_PASSWORD_FILE)) {
  signing.CSC_KEY_PASSWORD = readFileSync(signing.CSC_KEY_PASSWORD_FILE, 'utf8').trim();
}
const hasCert = !!(signing.CSC_KEYCHAIN || (signing.CSC_LINK && signing.CSC_KEY_PASSWORD));
const hasNotary = !!(signing.APPLE_API_KEY && signing.APPLE_API_KEY_ID && signing.APPLE_API_ISSUER);

rmSync(out, { recursive: true, force: true });
run('npm run desktop:build-main');

const builder = (platform, extra = '', env = {}) =>
  run(`npx electron-builder ${platform} --publish never -c.directories.output=release/desktop ${extra}`, env);

if (targets.includes('--mac')) {
  if (process.platform !== 'darwin') throw new Error('the macOS build needs a Mac');
  if (hasCert) {
    if (!hasNotary) console.warn('\n⚠ APPLE_API_ISSUER / APPLE_API_KEY / APPLE_API_KEY_ID missing: signed but NOT notarized\n');
    const env = {
      CSC_KEY_PASSWORD: signing.CSC_KEY_PASSWORD ?? '',
      ...(signing.CSC_KEYCHAIN ? { CSC_KEYCHAIN: signing.CSC_KEYCHAIN } : { CSC_LINK: signing.CSC_LINK }),
      ...(hasNotary ? { APPLE_API_KEY: signing.APPLE_API_KEY, APPLE_API_KEY_ID: signing.APPLE_API_KEY_ID, APPLE_API_ISSUER: signing.APPLE_API_ISSUER } : {}),
    };
    builder(
      '--mac',
      `-c.mac.identity="${IDENTITY}" -c.mac.hardenedRuntime=true -c.mac.gatekeeperAssess=false -c.mac.notarize=${hasNotary} ` +
        '-c.mac.entitlements=electron/build/entitlements.mac.plist -c.mac.entitlementsInherit=electron/build/entitlements.mac.plist',
      env,
    );
    for (const dir of readdirSync(out).filter((d) => d.startsWith('mac'))) {
      const app = join(out, dir, 'Cyberstream.app');
      if (!existsSync(app)) continue;
      console.log(`\n== ${app}`);
      run(`codesign --verify --deep --strict --verbose=2 "${app}"`);
      if (hasNotary) {
        run(`xcrun stapler validate "${app}"`);
        run(`spctl --assess --type execute --verbose=4 "${app}"`);
      }
    }
  } else {
    console.warn('\n⚠ no Developer ID certificate: ad hoc (unsigned) macOS build\n');
    builder('--mac', '', { CSC_IDENTITY_AUTO_DISCOVERY: 'false' });
  }
}
if (targets.includes('--win')) builder('--win', '', { CSC_IDENTITY_AUTO_DISCOVERY: 'false' });
if (targets.includes('--linux')) builder('--linux', '', { CSC_IDENTITY_AUTO_DISCOVERY: 'false' });

const files = readdirSync(out).filter((f) => /\.(dmg|exe|AppImage|deb)$/.test(f));
console.log('\nrelease/desktop:', files.join(', '));
