import { isAndroidApp, isDesktop } from './platform';
import { CyberNative } from './native';
import { fetchWithTimeout } from './net/http';

/**
 * Release manifest published with every GitHub release (scripts/release.mjs):
 * - `version`: web bundle version (package.json)
 * - `versionCode`: Android versionCode of the APK in this release
 * - `minVersionCode`: oldest installed APK able to run this web bundle (native API it relies on)
 */
export interface UpdateManifest {
  version: string;
  versionCode: number;
  minVersionCode: number;
  apk?: string;
  web?: string;
  webSha256?: string;
  notes?: string;
}

export type UpdateState =
  | { kind: 'none' }
  | { kind: 'web-ready'; version: string }
  | { kind: 'apk'; version: string; url: string; notes?: string }
  /** downloaded; Android 12+ installs it silently when the app goes to the background */
  | { kind: 'apk-silent'; version: string }
  /** desktop: a newer installer is published (opens the release page) */
  | { kind: 'desktop'; version: string; url: string };

export const APP_VERSION = __APP_VERSION__;
export const RELEASES_URL = 'https://github.com/pickywawa/cyberstream/releases';
export const hasUpdateChannel = Boolean(__UPDATE_URL__);

export function cmpVersion(a: string, b: string): number {
  const pa = a.split('.').map((x) => parseInt(x, 10) || 0);
  const pb = b.split('.').map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}

/** what to do for a given manifest and installed state (pure, unit-tested) */
export function decide(m: UpdateManifest, installed: { versionCode: number; webVersion: string }): 'web' | 'apk' | 'none' {
  const webNewer = cmpVersion(m.version, installed.webVersion) > 0;
  if (webNewer && m.web && m.minVersionCode <= installed.versionCode) return 'web';
  if (m.versionCode > installed.versionCode && m.apk) return 'apk';
  return 'none';
}

const fetchOptions = { cache: 'no-store', timeoutMs: 10000 } as const;
const releasesRepo = () => __UPDATE_URL__.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/releases\/?$/)?.[1];
type Release = { tag_name: string; draft: boolean; assets: { name: string; browser_download_url: string }[] };

/** newest published numbered release (prereleases included: /releases/latest skips them) */
async function newestRelease(repo: string): Promise<Release | undefined> {
  const res = await fetchWithTimeout(`https://api.github.com/repos/${repo}/releases?per_page=30`, fetchOptions);
  const releases: Release[] = await res.json();
  return releases.filter(r => !r.draft && /^v\d+\.\d+\.\d+$/.test(r.tag_name))
    .sort((a, b) => cmpVersion(b.tag_name.slice(1), a.tag_name.slice(1)))[0];
}

/**
 * APK of the newest release, for installing on a TV from the phone. '' when no update channel is
 * configured (dev builds: the phone sends its own APK). Throws when the release can't be reached,
 * so an older copy is never sent silently.
 */
export async function latestApkUrl(): Promise<string> {
  if (!__UPDATE_URL__) return '';
  const repo = releasesRepo();
  if (repo) {
    const newest = await newestRelease(repo);
    const apk = newest?.assets.find(a => /\.apk$/i.test(a.name));
    if (apk) return apk.browser_download_url;
  }
  const m = await fetchManifest();
  if (!m?.apk) throw new Error('no apk');
  return m.apk;
}

export async function fetchManifest(): Promise<UpdateManifest | null> {
  if (!__UPDATE_URL__) return null;
  try {
    const options = fetchOptions;
    let url: string = __UPDATE_URL__;
    let expectedVersion: string | undefined;
    const repo = releasesRepo();
    if (repo) {
      const newest = await newestRelease(repo);
      const manifest = newest?.assets.find(asset => asset.name === 'update.json');
      if (!newest || !manifest) return null;
      url = manifest.browser_download_url;
      expectedVersion = newest.tag_name.slice(1);
    }
    const res = await fetchWithTimeout(url, options);
    const manifest: UpdateManifest = await res.json();
    if (typeof manifest?.version !== 'string' || !Number.isInteger(manifest.versionCode) || !Number.isInteger(manifest.minVersionCode)) return null;
    return expectedVersion && expectedVersion !== manifest.version ? null : manifest;
  } catch {
    return null;
  }
}

export type UpdateCheck =
  | { status: 'unconfigured' | 'unavailable' }
  | { status: 'checked'; update: UpdateState };

let checking: Promise<UpdateCheck> | undefined;
export function checkForUpdate(): Promise<UpdateCheck> {
  checking ??= checkInstalledVersion().finally(() => { checking = undefined; });
  return checking;
}

/** Web updates are staged for restart. APKs require the native installer. */
async function checkInstalledVersion(): Promise<UpdateCheck> {
  if (!hasUpdateChannel || (!isAndroidApp && !isDesktop)) return { status: 'unconfigured' };
  try {
    const m = await fetchManifest();
    if (!m) return { status: 'unavailable' };
    if (isDesktop) {
      const repo = __UPDATE_URL__.match(/github\.com\/([^/]+\/[^/]+)\//)?.[1];
      const url = repo ? `https://github.com/${repo}/releases/tag/v${m.version}` : __UPDATE_URL__;
      return { status: 'checked', update: cmpVersion(m.version, APP_VERSION) > 0
        ? { kind: 'desktop', version: m.version, url } : { kind: 'none' } };
    }
    const info = await CyberNative.updateInfo();
    const what = decide(m, { versionCode: info.versionCode, webVersion: info.webVersion || APP_VERSION });
    if (what === 'web') {
      await CyberNative.updateWeb({ url: m.web!, version: m.version, sha256: m.webSha256 });
      return { status: 'checked', update: { kind: 'web-ready', version: m.version } };
    }
    if (what === 'apk') {
      if (info.silentUpdates) {
        await CyberNative.updateDownloadApk({ url: m.apk! });
        return { status: 'checked', update: { kind: 'apk-silent', version: m.version } };
      }
      return { status: 'checked', update: { kind: 'apk', version: m.version, url: m.apk!, notes: m.notes } };
    }
    return { status: 'checked', update: { kind: 'none' } };
  } catch {
    return { status: 'unavailable' };
  }
}

export async function installApk(url: string): Promise<'installing' | 'permission'> {
  await CyberNative.updateDownloadApk({ url });
  const r = await CyberNative.updateInstallApk();
  return r.needsPermission ? 'permission' : 'installing';
}

/** the running bundle booted fine: keep it (otherwise the native side rolls back after 2 launches) */
export function reportBootOk() {
  if (isAndroidApp) void CyberNative.updateBootOk().catch(() => {});
}

/** installs a silently-installable update now (the app is replaced and closes) */
export async function installSilentNow(): Promise<void> {
  await CyberNative.updateInstallApk();
}
