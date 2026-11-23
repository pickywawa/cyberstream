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
  await syncProfile(source.profileId, {}, () => {}, true, true);
  expect(await db.sources.get(source.id)).toMatchObject({ status: 'degraded', url: 'https://backup.invalid' });
  expect(await db.movies.count()).toBe(0);
  expect(await db.programs.toArray()).toMatchObject([{ title: 'On air' }]);
});

it('drains large movies, series and XMLTV bodies on the setup screen while live is still downloading', async () => {
  await db.sources.put(source);
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const n = 4100;
  vi.stubGlobal('fetch', async (input: string) => {
    const url = new URL(input);
    const key = url.searchParams.get('action');
    if (key === 'get_live_streams') await gate;
    if (key === 'get_series' || key === 'get_vod_streams') {
      const id = key === 'get_series' ? 'series_id' : 'stream_id';
      return Response.json(Array.from({ length: n }, (_, i) => ({ [id]: i + 1, name: 'Title ' + i, category_id: '1' })));
    }
    return fixture(url);
  });
  const events: SyncProgress[] = [];
  const run = syncProfile(source.profileId, {}, p => events.push(p), true, true);
  try {
    await vi.waitFor(() => {
      for (const step of ['vod', 'series']) expect(events.some(e => e.step === step && e.items === n)).toBe(true);
      expect(events.some(e => e.step === 'epg' && e.unit === 'bytes' && (e.done || 0) > 0)).toBe(true);
    }, { timeout: 5000 });
    expect(await db.movies.count()).toBe(0);
    expect(await db.series.count()).toBe(0);
  } finally {
    release();
    await run;
  }
  expect(await db.movies.count()).toBe(n);
  expect(await db.series.count()).toBe(n);
  expect(await db.programs.count()).toBe(1);
  expect(await db.meta.where('key').startsWith('setup:batch:').count()).toBe(0);
}, 15000);

it('shows M3U counts and reads the guide from the playlist header before the final chunk', async () => {
  const playlist = 'https://provider.invalid/tv.m3u';
  await db.sources.put({ ...source, type: 'm3u', url: playlist });
  let end!: () => void;
  let requests = 0;
  vi.stubGlobal('fetch', async (url: string) => {
    if (url !== playlist) return fixture(new URL(url));
    requests++;
    return new Response(new ReadableStream({ start(c) {
      c.enqueue(new TextEncoder().encode('#EXTM3U url-tvg="https://provider.invalid/xmltv.php"\n#EXTINF:-1 tvg-id="tv",TV\nhttps://p.invalid/live/ch.ts\n#EXTINF:-1,Film\nhttps://p.invalid/movie/film.mp4\n#EXTINF:-1,Show S01E01\nhttps://p.invalid/series/1.mp4\n'));
      end = () => c.close();
    } }));
  });
  const events: SyncProgress[] = [];
  const run = syncProfile(source.profileId, {}, p => events.push(p), true, true);
  try {
    await vi.waitFor(() => {
      for (const step of ['live', 'vod', 'series']) expect(events.some(e => e.step === step && e.items === 1)).toBe(true);
      expect(events.some(e => e.step === 'epg' && (e.done || 0) > 0)).toBe(true);
    });
  } finally {
    end?.();
    await run;
  }
  expect(requests).toBe(1);
  expect(await db.programs.count()).toBe(1);
});
