import 'fake-indexeddb/auto';
import { afterEach, expect, it, vi } from 'vitest';
import { db } from '../src/core/db';
import { syncProfile } from '../src/core/sync/sync';
import type { Source, SyncProgress } from '../src/core/types';

const source: Source = {
  id: 'src', profileId: 'profile', type: 'xtream', label: 'Fixture', priority: 0, enabled: true,
  url: 'https://provider.invalid', username: 'fixture', epgUrls: [], status: 'unknown',
};
const lists: Record<string, unknown[]> = {
  get_live_streams: [{ stream_id: 1, name: 'TV', epg_channel_id: 'tv', category_id: '1' }],
  get_vod_streams: [{ stream_id: 2, name: 'Movie', category_id: '1' }],
  get_series: [{ series_id: 3, name: 'Series', category_id: '1' }],
};
const stamp = (ms: number) => new Date(ms).toISOString().slice(0, 19).replace(/[-:T]/g, '') + ' +0000';
function fixture(url: URL) {
  if (url.hostname === 'iptv-org.github.io') return Response.json([]);
  if (url.pathname === '/xmltv.php') return new Response(`<tv><channel id="tv"><display-name>TV</display-name></channel><programme channel="tv" start="${stamp(Date.now())}" stop="${stamp(Date.now() + 3600000)}"><title>On air</title></programme></tv>`);
  const action = url.searchParams.get('action');
  if (!action) return Response.json({ user_info: { auth: 1 } });
  return Response.json(lists[action] ?? [{ category_id: '1', category_name: 'General' }]);
}

afterEach(async () => {
  vi.unstubAllGlobals();
  await Promise.all(db.tables.map(t => t.clear()));
});

it('starts all three Xtream lists and the first guide together and imports the guide once', async () => {
  await db.sources.put(source);
  const downloads: string[] = [];
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  vi.stubGlobal('fetch', async (input: string) => {
    const url = new URL(input);
    const key = url.searchParams.get('action') || url.pathname;
    if (key in lists || key === '/xmltv.php') {
      downloads.push(key);
      await gate;
    }
    return fixture(url);
  });
  const progress: SyncProgress[] = [];
  const run = syncProfile(source.profileId, {}, p => progress.push(p));
  try {
    await vi.waitFor(() => expect(downloads).toHaveLength(4));
  } finally {
    release();
    await run;
  }
  expect(downloads.sort()).toEqual(['/xmltv.php', ...Object.keys(lists)].sort());
  expect(await db.sources.get(source.id)).toMatchObject({ status: 'ok', counts: { live: 1, vod: 1, series: 1 } });
  expect(await db.programs.toArray()).toMatchObject([{ epgId: 'tv', title: 'On air' }]);
  expect(progress.at(-1)?.step).toBe('done');
});

it('discards VOD from a server whose live list failed and uses the backup guide', async () => {
  await db.sources.put({ ...source, servers: [source.url, 'https://backup.invalid'] });
  vi.stubGlobal('fetch', async (input: string) => {
    const url = new URL(input);
    if (url.origin === source.url) {
      if (url.searchParams.get('action') === 'get_live_streams') return new Response('', { status: 503 });
      if (url.searchParams.get('action') === 'get_vod_streams') return Response.json([{ stream_id: 99, name: 'Wrong movie' }]);
      if (url.pathname === '/xmltv.php') return new Response('<tv/>');
    } else if (url.searchParams.get('action') === 'get_vod_streams') return Response.json([]);
    return fixture(url);
  });
  await syncProfile(source.profileId, {}, () => {});
  expect(await db.sources.get(source.id)).toMatchObject({ status: 'degraded', url: 'https://backup.invalid' });
  expect(await db.movies.count()).toBe(0);
  expect(await db.programs.toArray()).toMatchObject([{ title: 'On air' }]);
});
