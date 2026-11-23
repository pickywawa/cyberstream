import { afterEach, expect, it, vi } from 'vitest';
import { checkForUpdate } from '../src/core/updater';

vi.mock('../src/core/platform', () => ({ isAndroidApp: true, isDesktop: false }));
vi.mock('../src/core/native', () => ({
  CyberNative: { updateInfo: async () => ({ versionCode: 19, silentUpdates: false, webVersion: '0.16.2' }) },
}));
afterEach(() => vi.unstubAllGlobals());

const releases = 'https://api.github.com/repos/pickywawa/cyberstream/releases?per_page=30';
const base = 'https://github.com/pickywawa/cyberstream/releases/download/v0.16.3';
const manifest = { version: '0.16.3', versionCode: 20, minVersionCode: 19, apk: base + '/Cyberstream-0.16.3-android.apk' };
const preview = { tag_name: 'v0.16.3', draft: false, prerelease: true, assets: [{ name: 'update.json', browser_download_url: base + '/update.json' }] };

it('checks the default public channel and offers the APK from a numbered prerelease', async () => {
  const fetch = vi.fn(async (url: string) => {
    if (url === releases) return Response.json([{ ...preview, tag_name: 'v0.17.0', draft: true }, { ...preview, tag_name: 'v0.16.2' }, preview]);
    if (url === base + '/update.json') return Response.json(manifest);
    throw Error('Unexpected URL');
  });
  vi.stubGlobal('fetch', fetch);
  expect(await checkForUpdate()).toMatchObject({ status: 'checked', update: { kind: 'apk', version: manifest.version, url: manifest.apk } });
  expect(fetch).toHaveBeenCalledTimes(2);
});

it('reports a missing manifest on the newest published version as unavailable', async () => {
  vi.stubGlobal('fetch', async () => Response.json([{ ...preview, assets: [] }]));
  expect(await checkForUpdate()).toEqual({ status: 'unavailable' });
});

it('installs the TV from the newest release APK, even without its update.json', async () => {
  const { latestApkUrl } = await import('../src/core/updater');
  const apk = { name: 'Cyberstream-0.16.3-android.apk', browser_download_url: base + '/Cyberstream-0.16.3-android.apk' };
  vi.stubGlobal('fetch', async (url: string) => {
    if (url === releases) return Response.json([{ ...preview, tag_name: 'v0.16.2', assets: [] }, { ...preview, assets: [apk] }]);
    throw Error('Unexpected URL');
  });
  expect(await latestApkUrl()).toBe(apk.browser_download_url);
});

it('refuses to fall back to the phone APK when the releases are unreachable', async () => {
  const { latestApkUrl } = await import('../src/core/updater');
  vi.stubGlobal('fetch', async () => { throw new TypeError('Failed to fetch'); });
  await expect(latestApkUrl()).rejects.toThrow();
});
