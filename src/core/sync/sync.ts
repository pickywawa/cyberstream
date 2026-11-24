import { db, getMeta, setMeta } from '../db';
import type { Category, Channel, Episode, Movie, Program, Series, Source, SyncProgress } from '../types';
import { XtreamList, PlaylistCatalog, xtream_episodes } from '../../rust/generated/cyberstream';
import { XtreamClient, asArray, num, normalizeServer } from '../sources/xtream';
import { decodeTextBody, fetchTextStream, setPrefetchSince, prefetched, fetchWithTimeout } from '../net/http';
import { cleanName, norm, uid } from '../util/text';
import { langPrefs } from '../prefs';
import { keepCategory } from '../util/lang';
import { GuideImport } from '../epg/staging';
import { parseXmltv, type XmltvChannel } from '../epg/xmltv';
import { serversOf, serverLabel } from '../sources/servers';
import { IPTV_ORG, applyIptvOrg, refreshIptvOrg } from './iptvorg';
import { giveWay } from '../quiet';

export type Progress = (p: SyncProgress) => void;

const BATCH = 2000;
/**
 * Remove rows of a source that disappeared from the provider — unless the new list looks broken:
 * an empty answer, or a big catalogue suddenly shrinking by more than 70 % (truncated download,
 * rate-limited panel, error page…). Then the existing rows are kept and the next sync decides.
 */
/** a part of the catalogue could not be read: the rest is saved, existing data is kept */
class PartialSync extends Error {
  constructor(public what: string) {
    super(`Liste des ${what} indisponible, catalogue précédent conservé`);
  }
}

export function pruneLooksSafe(existing: number, incoming: number): boolean {
  if (existing === 0) return true;
  if (incoming === 0) return false;
  return !(existing > 200 && incoming < existing * 0.3);
}

async function pruneStale(table: any, sourceId: string, keep: Set<string>): Promise<boolean> {
  const ids: string[] = await table.where('sourceId').equals(sourceId).primaryKeys();
  if (!pruneLooksSafe(ids.length, keep.size)) return false;
  const stale = ids.filter((id) => !keep.has(id));
  for (let i = 0; i < stale.length; i += BATCH) await table.bulkDelete(stale.slice(i, i + BATCH));
  return true;
}

const ENRICH_FIELDS = [
  'poster', 'backdrop', 'logo', 'plot', 'rating', 'genres', 'cast', 'director', 'trailer', 'tmdbId', 'durationSec', 'year', 'enrichedAt', 'origLang',
  'enrichV', 'imdbId', 'imdbRating', 'imdbVotes', 'cert', 'certAge', 'recos', 'people', 'collection', 'providerInfoAt',
] as const;

/** keep TMDB enrichment & first-seen date when a row is re-synced */
async function mergeExisting<T extends Movie | Series>(table: any, rows: T[], firstSync: boolean) {
  const now = Date.now();
  for (let offset = 0; offset < rows.length; offset += BATCH) {
    await giveWay();
    const batch = rows.slice(offset, offset + BATCH);
    const existing: (T | undefined)[] = await table.bulkGet(batch.map(row => row.id));
    for (const [i, r] of batch.entries()) {
      const old = existing[i];
      if (!old) {
        if (!r.addedAt) r.addedAt = firstSync ? 0 : now;
        continue;
      }
      if (!r.addedAt) r.addedAt = old.addedAt;
      if (old.enrichedAt) {
        for (const f of ENRICH_FIELDS) {
          const v = (old as any)[f];
          if (v !== undefined && v !== null && v !== '') (r as any)[f] = v;
        }
      }
      if ((old as Series).episodesLoadedAt) (r as Series).episodesLoadedAt = (old as Series).episodesLoadedAt;
      // languages learned from the real stream tracks beat provider tags
      if ((old as Movie).tracksAt) {
        (r as Movie).langs = (old as Movie).langs;
        (r as Movie).subs = (old as Movie).subs;
        (r as Movie).tracksAt = (old as Movie).tracksAt;
      }
    }
  }
}

type ListKind = 'live' | 'vod' | 'series';

async function catalogLangs(profileId: string) {
  const profile = await db.profiles.get(profileId);
  return profile && !profile.catalogAllLangs ? langPrefs(profile).audio : [];
}

/** Only remove explicitly excluded categories after a complete, valid download. */
async function dropExcluded(source: string, kind: ListKind, ids: string[]) {
  const meta = `catalog:excluded:${source}:${kind}`;
  const signature = JSON.stringify(ids.sort());
  if (await getMeta(meta) === signature) return;
  if (ids.length) {
    const excluded = new Set(ids);
    const table = kind === 'live' ? db.channels : kind === 'vod' ? db.movies : db.series;
    const stale = await (table as typeof db.channels).where('sourceId').equals(source).filter(r => !!r.categoryId && excluded.has(r.categoryId)).primaryKeys();
    for (let i=0;i<stale.length;i+=BATCH) await table.bulkDelete(stale.slice(i,i+BATCH));
    await db.categories.bulkDelete(ids);
  }
  await setMeta(meta, signature);
}

/** Stream one catalogue in bounded batches. Only primary keys survive between committed batches.
 * A malformed or truncated response may add rows, but never authorises deletion. */
async function importList(src: Source, kind: ListKind, cats: unknown[], load: (category?:string) => Promise<Response>, parts: string[], excluded:string[], progress: Progress, liveReady?: Promise<void>, setup = false) {
  const parser = new XtreamList(kind, src.id, src.profileId, JSON.stringify(cats));
  const keep = new Set<string>();
  const table = kind === 'live' ? db.channels : kind === 'vod' ? db.movies : db.series;
  let pending: (Movie | Series | Channel)[] = [];
  const prefix = `setup:batch:${Date.now()}:${uid()}:`;
  let written = 0, published = 0;
  let waiting = !!liveReady;
  void liveReady?.then(() => { waiting = false; }, () => { waiting = false; });
  const save = async (batch: typeof pending) => {
    await giveWay();
    if (kind !== 'live') await mergeExisting(table, batch as (Movie | Series)[], !src.lastSyncAt);
    if (kind === 'live') await db.channels.bulkPut(batch as Channel[]);
    else if (kind === 'vod') await db.movies.bulkPut(batch as Movie[]);
    else await db.series.bulkPut(batch as Series[]);
  };
  const publishStaged = async () => {
    while (published < written) {
      const key = prefix + published;
      const batch = await getMeta<typeof pending>(key);
      if (!batch) throw new Error('Lot de catalogue manquant');
      await save(batch);
      await db.meta.delete(key);
      published++;
    }
  };
  const flush = async () => {
    const batch = pending;
    pending = [];
    if (setup && waiting) {
      // Keep draining the provider while live is being validated, without exposing backup rows.
      await setMeta(prefix + written, batch);
      written++;
    } else {
      await liveReady;
      await publishStaged();
      await save(batch);
    }
    for (const r of batch) keep.add(r.id);
  };
  try {
    const manifest = `xtream:rows:v1:${src.id}:${kind}`;
    // Invalidate before the first write. A stopped or interrupted import will reread all rows.
    const snapshot = await db.transaction('rw', db.meta, async () => {
      const saved = await getMeta<Uint8Array>(manifest);
      if (saved) await db.meta.delete(manifest);
      return saved;
    });
    if (snapshot && src.lastSyncAt) {
      try { parser.restore(snapshot); } catch { /* Rebuild from the response on cache corruption. */ }
    }
    const documents = parts.length ? parts : [undefined];
    let nextReport = 0;
    for (const [index, category] of documents.entries()) {
      const response = await load(category);
      const reader = response.body?.getReader();
      if (!reader) throw new Error('Réponse Xtream vide');
      parser.next_document(category || '', excluded.length > 0);
      const size = Number(response.headers.get('content-length')) || 0;
      let bytes = 0;
      try {
        for (;;) {
          const { value, done } = await reader.read();
          bytes += value?.length || 0;
          for (let i = 0; i < (value?.length || 0) || (done && i === 0); i += 65536) {
            const rows: (Movie | Series | Channel | string)[] = JSON.parse(parser.feed(value?.subarray(i,i+65536) || new Uint8Array(0), done));
            for (const row of rows) {
              if (typeof row === 'string') keep.add(row);
              else pending.push(row);
            }
            if (pending.length >= BATCH) await flush();
          }
          if (Date.now() >= nextReport || done) {
            const items = keep.size + pending.length;
            if (parts.length) progress({sourceId:src.id,step:kind,done:index+(done?1:0),total:parts.length,unit:'categories',items});
            else if (size) progress({sourceId:src.id,step:kind,done:Math.min(bytes,size),total:size,unit:'bytes',items});
            else progress({sourceId:src.id,step:kind,items});
            nextReport=Date.now()+250;
          }
          if (done) break;
        }
      } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
    }
    if (pending.length) await flush();
    await liveReady;
    await publishStaged();
    const categories: Category[] = JSON.parse(parser.categories());
    await db.categories.bulkPut(categories);
    await dropExcluded(src.id,kind,excluded);
    await pruneStale(table, src.id, keep);
    try { await setMeta(manifest, parser.snapshot()); } catch { /* The catalogue is usable without the snapshot. */ }
    return { count: keep.size, categories: categories.map(c => c.id) };
  } finally {
    parser.free();
    if (published < written) await db.meta.where('key').startsWith(prefix).delete();
  }
}

async function syncXtream(src: Source, password: string, progress: Progress, setup: boolean) {
  const x = new XtreamClient({ server: src.url, username: src.username!, password });
  const { auth, ...account } = await x.account();
  if (!auth) throw new Error('Authentification Xtream refusée');
  src.account = account;
  const languages = await catalogLangs(src.profileId);
  const counts = { live: 0, vod: 0, series: 0 };
  const categories = new Set<string>();
  const missing: string[] = [];
  let completeCats = true;
  const importKind = async (kind: ListKind, liveReady?: Promise<void>) => {
    progress({ sourceId: src.id, step: kind });
    const rawCats = await x.categories(kind).catch(() => null);
    const cats = asArray<{category_name?: string; category_id:string|number}>(rawCats).filter(c => c && c.category_id != null);
    if (!cats.length) completeCats = false;
    const selected = languages.length ? cats.filter(c => keepCategory(String(c.category_name || ''),languages)) : cats;
    const restricted = selected.length > 0 && selected.length < cats.length;
    const ids = restricted ? selected.map(c => String(c.category_id)) : [];
    const catPrefix = kind === 'live' ? 'lc' : kind === 'vod' ? 'vc' : 'sc';
    const allowed = new Set(ids);
    const excluded = restricted ? cats.filter(c => !allowed.has(String(c.category_id))).map(c => `${src.id}:${catPrefix}:${c.category_id}`) : [];
    const active = restricted ? selected : cats;
    const load = (category?:string) => fetchWithTimeout(x.listUrl(kind,category),{timeoutMs:180000});
    try {
      const local = await prefetched(x.listUrl(kind));
      let result = local ? await importList(src,kind,active,async () => local,[],excluded,progress,liveReady,setup).catch(() => null) : null;
      if (!result && ids.length && ids.length <= 40) {
        // A provider ignoring category_id is detected by Rust on its first mismatched record.
        result = await importList(src,kind,active,load,ids,excluded,progress,liveReady,setup).catch(() => null);
      }
      result ??= await importList(src,kind,active,load,[],excluded,progress,liveReady,setup);
      counts[kind] = result.count;
      for (const id of result.categories) categories.add(id);
    } catch (error) {
      if (kind === 'live') throw error;
      missing.push(kind === 'vod' ? 'films' : 'séries');
      counts[kind] = await (kind === 'vod' ? db.movies : db.series).where('sourceId').equals(src.id).count();
    }
    progress({ sourceId: src.id, step: kind, count: counts[kind] });
  };
  // Download all three lists immediately. Only publish VOD from a server with a valid live list.
  const live = importKind('live');
  const imports = [live, importKind('vod', live), importKind('series', live)];
  // A backup server must never write alongside an unfinished import from the previous one.
  for (const result of await Promise.allSettled(imports)) {
    if (result.status === 'rejected') throw result.reason;
  }
  src.counts = counts;
  if (missing.length) throw new PartialSync(missing.join(' et '));
  if (completeCats) await pruneStale(db.categories, src.id, categories);
}

/** Lazily loads Xtream episodes of one series (M3U episodes are loaded at sync time) */
export async function loadXtreamEpisodes(seriesId: string, password: string): Promise<Episode[]> {
  const s = await db.series.get(seriesId);
  if (!s) return [];
  const src = await db.sources.get(s.sourceId);
  if (!src || src.type !== 'xtream') return db.episodes.where('seriesId').equals(seriesId).toArray();
  const x = new XtreamClient({ server: src.url, username: src.username!, password });
  const info = await x.seriesInfo(s.extId);
  const eps: Episode[] = JSON.parse(xtream_episodes(JSON.stringify(info), src.id, seriesId, s.title));
  await db.transaction('rw', db.episodes, db.series, async () => {
    const old = await db.episodes.where('seriesId').equals(seriesId).primaryKeys();
    if (!pruneLooksSafe(old.length, eps.length)) return;
    await db.episodes.bulkDelete(old);
    await db.episodes.bulkPut(eps);
    const patch: Partial<Series> = { episodesLoadedAt: Date.now() };
    const i = info?.info || {};
    if (!s.plot && i.plot) patch.plot = i.plot;
    if (!s.tmdbId && num(i.tmdb)) patch.tmdbId = num(i.tmdb);
    await db.series.update(seriesId, patch);
  });
  return db.episodes.where('seriesId').equals(seriesId).toArray();
}

const list = (v: unknown) => String(v ?? '').split(/\s*[,/|]\s*/).map(x => x.trim()).filter(Boolean);

/**
 * Details from the provider (Xtream get_vod_info) for a film TMDB hasn't enriched (no TMDB key, or
 * no match): duration, genres, age, director, cast, plot, trailer, backdrop. Never overwrites TMDB data.
 */
export async function loadXtreamVodInfo(movieId: string, password: string): Promise<boolean> {
  const m = await db.movies.get(movieId);
  if (!m) return false;
  const src = await db.sources.get(m.sourceId);
  if (!src || src.type !== 'xtream') return false;
  const r = await new XtreamClient({ server: src.url, username: src.username!, password }).vodInfo(m.extId);
  const i = r?.info && typeof r.info === 'object' && !Array.isArray(r.info) ? r.info : {};
  // TMDB may have enriched it during the request
  Object.assign(m, await db.movies.get(movieId));
  const tmdb = (m.enrichedAt || 0) > 0;
  const patch: Partial<Movie> = { providerInfoAt: Date.now() };
  const put = <K extends keyof Movie>(k: K, v: Movie[K] | undefined) => {
    const empty = v === undefined || v === '' || (Array.isArray(v) && !v.length);
    if (!empty && (!tmdb || m[k] === undefined)) patch[k] = v;
  };
  const secs = num(i.duration_secs) || (num(i.episode_run_time ?? i.runtime) || 0) * 60;
  put('durationSec', secs > 0 ? Math.round(secs) : undefined);
  put('genres', list(i.genre));
  put('director', String(i.director || '').trim() || undefined);
  put('cast', list(i.cast || i.actors).slice(0, 10));
  put('plot', String(i.plot || i.description || '').trim() || undefined);
  const age = parseInt(String(i.age || i.mpaa_rating || '').replace(/[^\d]/g, ''), 10);
  if (Number.isFinite(age) && age > 0 && age <= 21) { put('certAge', age); put('cert', String(age)); }
  const yt = String(i.youtube_trailer || '').trim();
  const key = yt.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1] || (/^[\w-]{11}$/.test(yt) ? yt : '');
  put('trailer', key ? `https://www.youtube.com/watch?v=${key}` : undefined);
  const backdrop = asArray<string>(i.backdrop_path).find(x => typeof x === 'string' && /^https?:/.test(x));
  if (!m.backdrop) put('backdrop', backdrop);
  const rating = num(i.rating);
  if (rating && rating > 0 && !m.rating) put('rating', Math.round(rating * 10) / 10);
  const tmdbId = num(i.tmdb_id);
  if (tmdbId && !m.tmdbId) put('tmdbId', tmdbId);
  await db.movies.update(movieId, patch);
  return Object.keys(patch).length > 1;
}

// ───────────────────────────── M3U ─────────────────────────────

async function syncM3u(src: Source, progress: Progress, setup?: SetupDownload, all = false): Promise<void> {
  progress({ sourceId: src.id, step: 'live', message: 'Téléchargement de la playlist' });
  const reader = (await fetchTextStream(src.url, 300000)).getReader();
  const parser = new PlaylistCatalog(src.id, src.profileId, Date.now());
  const languages = all ? [] : await catalogLangs(src.profileId);
  parser.languages(languages);
  let excluded: string[] = [];
  const keep = { categories: new Set<string>(), channels: new Set<string>(), movies: new Set<string>(), series: new Set<string>(), episodes: new Set<string>() };
  type Rows = { categories: Category[]; channels: Channel[]; movies: Movie[]; series: Series[]; episodes: Episode[] };
  const tables = Object.keys(keep) as (keyof Rows)[];
  let pending: Rows = { categories: [], channels: [], movies: [], series: [], episodes: [] };
  const kinds = [['live', 'channels'], ['vod', 'movies'], ['series', 'series']] as const;
  let headerRead = false, lastReport = 0;
  if (setup) for (const [step] of kinds) progress({ sourceId: src.id, step, items: 0 });
  let n = 0, total = 0, nextProgress = 25000;
  try {
    for (;;) {
      const { value = '', done } = await reader.read();
      const batch: Rows = JSON.parse(parser.feed(value, done));
      if (setup && !headerRead && (value.includes('\n') || done)) {
        headerRead = true;
        for (const url of JSON.parse(parser.header()).epgUrls) setup.queueGuide(url);
      }
      for (const key of tables) {
        for (const row of batch[key]) {
          (pending[key] as { id: string }[]).push(row);
          keep[key].add(row.id);
          n++;
        }
      }
      total += batch.channels.length + batch.movies.length + batch.episodes.length;
      if (n >= BATCH || done) {
        await giveWay();
        await mergeExisting(db.movies, pending.movies, !src.lastSyncAt);
        await mergeExisting(db.series, pending.series, !src.lastSyncAt);
        await db.transaction('rw', tables.map(key => db[key]), async () => {
          await db.categories.bulkPut(pending.categories);
          await db.channels.bulkPut(pending.channels);
          await db.movies.bulkPut(pending.movies);
          await db.series.bulkPut(pending.series);
          await db.episodes.bulkPut(pending.episodes);
        });
        pending = { categories: [], channels: [], movies: [], series: [], episodes: [] };
        n = 0;
      }
      if (setup && (Date.now() - lastReport >= 250 || done)) {
        for (const [step, key] of kinds) progress({ sourceId: src.id, step, items: keep[key].size });
        lastReport = Date.now();
      }
      if (done) break;
      if (!setup && total >= nextProgress) {
        progress({ sourceId: src.id, step: 'live', message: `${total} entrées lues` });
        nextProgress = total + 25000;
      }
    }
    excluded = parser.rejected_categories();
    if (!total && !excluded.length) throw new Error('Playlist vide ou invalide');
    await setMeta(`epg:auto:${src.id}`, JSON.parse(parser.header()).epgUrls);
  } finally { parser.free(); reader.releaseLock(); }
  if (!total && excluded.length) return syncM3u(src,progress,setup,true);
  for (const [kind,prefix] of [['live','lc'],['vod','vc'],['series','sc']] as const) {
    await dropExcluded(src.id,kind,excluded.filter(k => k.startsWith(src.id+':'+prefix+':')));
  }
  for (const key of tables) await pruneStale(db[key], src.id, keep[key]);
  src.counts = { live: keep.channels.size, vod: keep.movies.size, series: keep.series.size };
  for (const step of ['live', 'vod', 'series'] as const) progress({ sourceId: src.id, step, count: src.counts[step] });
}

// ───────────────────────────── EPG ─────────────────────────────

export async function epgUrlsForProfile(profileId: string, secrets: Record<string, string | undefined>): Promise<string[]> {
  const sources = (await db.sources.where('profileId').equals(profileId).toArray()).filter((s) => s.enabled).sort((a, b) => a.priority - b.priority);
  const urls: string[] = [];
  // the free national guide first: a week of programmes for the main channels, where providers'
  // guides often stop after a few hours (a guide only fills the channels earlier ones didn't cover)
  const prof = await db.profiles.get(profileId);
  const country = prof?.country || (prof?.lang === 'fr' ? 'FR' : undefined);
  if (country && DEFAULT_EPG[country]) urls.push(DEFAULT_EPG[country]);
  for (const s of sources) {
    urls.push(...(s.epgUrls || []));
    if (s.type === 'xtream') urls.push(new XtreamClient({ server: s.url, username: s.username!, password: secrets[s.id] || '' }).xmltvUrl());
    else urls.push(...((await getMeta<string[]>(`epg:auto:${s.id}`)) || []));
  }
  return [...new Set(urls.filter(Boolean))];
}

/** public XMLTV guides (ids like "TF1.fr", matching iptv-org's "tf1.fr@SD") */
const DEFAULT_EPG: Record<string, string> = {
  FR: 'https://xmltvfr.fr/xmltv/xmltv_tnt.xml.gz',
};

/** "tf1.fr@sd" → "tf1.fr" (iptv-org feed suffix) */
const epgBase = (id: string) => id.split('@')[0];

async function openGuide(url: string, since: number, signal?: AbortSignal) {
  const cached = await prefetched(url, since, signal);
  if (cached) return { response: cached, cached: true };
  return { response: await fetchWithTimeout(url, { timeoutMs: 300000, signal }), cached: false };
}

type GuideResponse = Awaited<ReturnType<typeof openGuide>>;
type EarlyGuides = Map<string, Promise<GuideResponse | null>>;
type SetupDownload = { queueGuide: (url: string) => void };

/** Drain the response into browser-managed blob storage while catalogues are being imported.
 * XMLTV matching still runs against the final channels, in guide priority order. */
async function downloadGuide(url: string, since: number, signal: AbortSignal, progress: Progress) {
  const guide = await openGuide(url, since, signal);
  const body = guide.response.body;
  if (!body) throw new Error('Guide vide');
  let bytes = 0, lastReport = 0;
  const total = Number(guide.response.headers.get('content-length')) || undefined;
  const report = () => progress({ step: 'epg', done: bytes, total, unit: 'bytes' });
  const stream = body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, out) {
      bytes += chunk.byteLength;
      if (Date.now() - lastReport >= 250) { report(); lastReport = Date.now(); }
      out.enqueue(chunk);
    },
    flush: report,
  }));
  const blob = await new Response(stream).blob();
  return { cached: guide.cached, response: new Response(blob) };
}

export async function syncEpg(profileId: string, secrets: Record<string, string | undefined>, progress: Progress, early?: EarlyGuides) {
  const urls = await epgUrlsForProfile(profileId, secrets);
  if (!urls.length) return;
  const channels = await db.channels.where('profileId').equals(profileId).toArray();
  const byEpg = new Set(channels.map((c) => c.epgId).filter(Boolean) as string[]);
  const byBase = new Map<string, Channel[]>();
  for (const c of channels) if (c.epgId && c.epgId.includes('@')) {
    const b = epgBase(c.epgId);
    (byBase.get(b) || byBase.set(b, []).get(b)!).push(c);
  }
  const byName = new Map<string, Channel[]>();
  for (const c of channels) {
    const k = norm(c.name);
    (byName.get(k) || byName.set(k, []).get(k)!).push(c);
  }
  const maxCatchup = channels.reduce((days, c) => Math.max(days, c.catchupDays || 0), 1);
  const from = Date.now() - Math.min(maxCatchup, 7) * 86400000 - 3600000;
  const to = Date.now() + 3 * 86400000;
  const covered = new Set<string>();
  const since = (await getMeta<number>(`epg:last:${profileId}`)) || 0;
  await syncEpgUrls(urls, byEpg, byBase, byName, covered, from, to, progress, since, early);
  await db.programs.where('start').below(Date.now() - 8 * 86400000).delete();
  await fillMissingEpgIds(profileId);
  if (covered.size) await setMeta(`epg:last:${profileId}`, Date.now());
}

/**
 * Providers often give a guide id only to some versions of a channel ("TF1 HD" has tf1.fr,
 * "TF1 UHD/4K" has none). The others take it from a sibling (same channel) or from their
 * iptv-org id when the guide knows it, so every version shows its programmes.
 */
export async function fillMissingEpgIds(profileId: string): Promise<number> {
  const all = await db.channels.where('profileId').equals(profileId).toArray();
  const byGroup = new Map<string, string>();
  const known = new Set<string>();
  for (const c of all) {
    if (!c.epgId) continue;
    known.add(c.epgId);
    if (!byGroup.has(c.groupKey)) byGroup.set(c.groupKey, c.epgId);
  }
  const patches: { id: string; changes: Partial<Channel> }[] = [];
  for (const c of all) {
    const changes: Partial<Channel> = {};
    if (!c.epgId) {
      const iptv = c.iptvId?.toLowerCase().replace(/@.*$/, '');
      const id = byGroup.get(c.groupKey) || (iptv && known.has(iptv) ? iptv : undefined);
      if (id) changes.epgId = id;
    }
    // names stored before the cleaner removed provider junk ("TF1 //")
    const clean = cleanName(c.name);
    if (clean !== c.name) changes.name = clean;
    if (Object.keys(changes).length) patches.push({ id: c.id, changes });
  }
  if (patches.length) {
    for (let i = 0; i < patches.length; i += BATCH)
      await db.channels.bulkUpdate(patches.slice(i, i + BATCH).map(p => ({ key: p.id, changes: p.changes })));
  }
  return patches.length;
}

async function syncEpgUrls(
  urls: string[], byEpg: Set<string>, byBase: Map<string, Channel[]>, byName: Map<string, Channel[]>, covered: Set<string>,
  from: number, to: number, progress: Progress, since: number, early?: EarlyGuides,
) {
  await GuideImport.clearAbandoned();
  for (const url of urls) {
    progress({ step: 'epg', message: url.replace(/(password|username)=[^&]+/g, '$1=***') });
    const importDocument = async (response: Response) => {
      if (!response.body) throw new Error('Guide vide');
      const stage = new GuideImport();
      try {
        const stream = decodeTextBody(response.body);
        const channelPatches: { id: string; epgId: string }[] = [];
        const res = await parseXmltv(stream, {
          from,
          to,
          onChannels: (xch: XmltvChannel[]) => {
            const map = new Map<string, string>();
            const docIds = new Set(xch.map((x) => x.id.toLowerCase()));
            for (const x of xch) {
              const xid = x.id.toLowerCase();
              if (covered.has(xid)) continue;
              if (byEpg.has(xid)) {
                map.set(x.id, xid);
                continue;
              }
              // same channel id without the feed suffix
              const base = byBase.get(xid);
              if (base?.length) {
                for (const h of base) channelPatches.push({ id: h.id, epgId: xid });
                map.set(x.id, xid);
                continue;
              }
              for (const n of x.names) {
                const hits = byName.get(norm(cleanName(n)));
                if (hits?.length) {
                  // name match unless the channel's own id is served by this guide
                  for (const h of hits) if (!h.epgId || (!docIds.has(h.epgId) && !covered.has(h.epgId))) channelPatches.push({ id: h.id, epgId: xid });
                  map.set(x.id, xid);
                  break;
                }
              }
            }
            return map;
          },
          onPrograms: async (batch: Program[]) => {
            await stage.append(batch);
            progress({ step: 'epg', count: batch.length });
          },
        });
        const published = new Set(await stage.publish());
        const updates = new Map(channelPatches.filter(p => published.has(p.epgId)).map(p => [p.id, p.epgId]));
        const changes = [...updates].map(([key, epgId]) => ({ key, changes: { epgId } }));
        for (let i = 0; i < changes.length; i += BATCH) await db.channels.bulkUpdate(changes.slice(i, i + BATCH));
        for (const id of published) { byEpg.add(id); covered.add(id); }
        progress({ step: 'epg', message: `${res.programs} programmes` });
      } finally {
        await stage.discard();
      }
    };
    try {
      // Recheck the URL list after sync: a failover or an M3U header can change the guides.
      const ready = await early?.get(url);
      early?.delete(url);
      const guide = ready ?? await openGuide(url, since);
      try {
        await importDocument(guide.response);
      } catch (error) {
        if (!guide.cached) throw error;
        await importDocument(await fetchWithTimeout(url, { timeoutMs: 300000 }));
      }
    } catch (e) {
      progress({ step: 'epg', message: `EPG ignoré : ${e instanceof Error ? e.message : String(e)}` });
    }
  }
}

/** URLs read by a full sync of the profile (catalogues + guides), for the background pre-download */
export async function prefetchPlan(profileId: string, secrets: Record<string, string | undefined>): Promise<string[]> {
  const sources = (await db.sources.where('profileId').equals(profileId).toArray()).filter((s) => s.enabled);
  const urls: string[] = [];
  for (const s of sources) {
    if (s.type === 'xtream') urls.push(...new XtreamClient({ server: s.url, username: s.username!, password: secrets[s.id] || '' }).syncUrls());
    else urls.push(s.url);
  }
  urls.push(...(await epgUrlsForProfile(profileId, secrets)));
  urls.push(IPTV_ORG.channels, IPTV_ORG.logos, IPTV_ORG.feeds);
  return [...new Set(urls)];
}

// ───────────────────────────── Orchestration ─────────────────────────────

/**
 * Syncs a source on the server in use; when it fails, tries the backup servers in order.
 * The first one that works becomes the server in use (persisted, so the next start uses it too).
 */
export async function syncSource(src: Source, password: string | undefined, progress: Progress, setup?: SetupDownload): Promise<Source> {
  const sync = () => syncSourceLocked(src, password, progress, setup);
  if (typeof navigator !== 'undefined' && navigator.locks) return navigator.locks.request(`cyberstream:sync:${src.id}`, sync);
  return sync();
}

async function syncSourceLocked(src: Source, password: string | undefined, progress: Progress, setup?: SetupDownload): Promise<Source> {
  progress({ sourceId: src.id, step: 'start' });
  const servers = serversOf(src);
  const errors: string[] = [];
  let ok = false;
  // use the background pre-downloaded copies when they are newer than what we have
  setPrefetchSince(src.lastSyncAt || 0);
  let partial: { server: string; msg: string } | null = null;
  for (const [i, server] of servers.entries()) {
    src.url = server;
    if (i > 0) progress({ sourceId: src.id, step: 'start', message: `Serveur de secours : ${serverLabel(server)}` });
    try {
      if (src.type === 'xtream') await syncXtream(src, password || '', progress, !!setup);
      else await syncM3u(src, progress, setup);
      ok = true;
      break;
    } catch (e) {
      const msg = (e instanceof Error ? e.message : String(e)).replace(/ — .*$/, '');
      // channels saved but movies or series unreadable: a backup may do better, else keep this
      if (e instanceof PartialSync && !partial) partial = { server, msg };
      errors.push(`${serverLabel(server)} : ${msg}`);
    }
  }
  if (!ok && partial) {
    ok = true;
    src.url = partial.server;
  }
  setPrefetchSince(null);
  if (ok) {
    src.status = errors.length ? 'degraded' : 'ok';
    // keep a trace of the failover for the source card
    src.lastError = errors.length ? `Bascule sur ${serverLabel(src.url)} (${errors.join(' · ')})` : undefined;
    src.lastSyncAt = Date.now();
  } else {
    // nothing works: stay on the first server for the next attempt
    src.url = servers[0];
    src.status = 'down';
    src.lastError = errors.join(' · ');
    progress({ sourceId: src.id, step: 'error', message: src.lastError });
  }
  await db.sources.put(src);
  if (ok) await applyIptvOrg(src.profileId).catch(() => 0);
  // screens and the catalogue index key off this
  if (ok) await setMeta(`catalog:version:${src.profileId}`, Date.now());
  return src;
}

export async function syncProfile(profileId: string, secrets: Record<string, string | undefined>, progress: Progress, withEpg = true, setupScreen = false) {
  const sources = (await db.sources.where('profileId').equals(profileId).toArray()).filter((s) => s.enabled).sort((a, b) => a.priority - b.priority);
  // setup screen: logos last, so the iptv-org download doesn't slow down the catalogues and guides
  let org = setupScreen ? undefined : refreshIptvOrg(false, true).catch(() => false);
  const controller = new AbortController();
  const early: EarlyGuides = new Map();
  const since = withEpg ? (await getMeta<number>(`epg:last:${profileId}`)) || 0 : 0;
  let queued = Promise.resolve();
  const queueGuide = (url: string) => {
    if (!withEpg || !url || early.has(url)) return;
    const download = queued.then(async () => {
      if (controller.signal.aborted) return null;
      progress({ step: 'epg' });
      return setupScreen ? downloadGuide(url, since, controller.signal, progress) : openGuide(url, since, controller.signal);
    }).catch(() => null);
    early.set(url, download);
    queued = download.then(() => {});
  };
  try {
    if (setupScreen) {
      const cutoff = `setup:batch:${Date.now() - 86400000}:`;
      await db.meta.where('key').between('setup:batch:', cutoff).delete();
    }
    if (withEpg) {
      const urls = await epgUrlsForProfile(profileId, secrets);
      for (const url of setupScreen ? urls : urls.slice(0, 1)) queueGuide(url);
    }
    for (const s of sources) await syncSource(s, secrets[s.id], progress, setupScreen ? { queueGuide } : undefined);
    if (withEpg) await syncEpg(profileId, secrets, progress, early);
    progress({ step: 'logos' });
    try {
      org ??= refreshIptvOrg(false, true).catch(() => false);
      if ((await org) === false && !(await getMeta('iptvorg:index'))) await refreshIptvOrg(true);
      progress({ step: 'logos', count: await applyIptvOrg(profileId) });
    } catch {
      /* offline: next sync */
      progress({ step: 'logos', count: 0 });
    }
    // channels were rewritten (and iptv-org ids added): versions without a guide id take their sibling's again
    await fillMissingEpgIds(profileId);
  } finally {
    // Also releases an unused response body if its source switched to a backup.
    controller.abort();
    await queued;
  }
  await db.profiles.update(profileId, { lastSyncAt: Date.now() });
  await setMeta(`catalog:version:${profileId}`, Date.now());
  progress({ step: 'done' });
}

export interface ServerTest {
  server: string;
  ok: boolean;
  message: string;
}

async function testOne(
  src: Pick<Source, 'type' | 'url' | 'username'>,
  password?: string,
): Promise<{ ok: boolean; message: string; account?: Source['account'] }> {
  try {
    if (src.type === 'xtream') {
      const acc = await new XtreamClient({ server: normalizeServer(src.url), username: src.username || '', password: password || '' }).account();
      if (!acc.auth) return { ok: false, message: 'auth' };
      const { auth: _a, ...account } = acc;
      return { ok: true, message: 'ok', account };
    }
    const stream = await fetchTextStream(src.url, 30000);
    const reader = stream.getReader();
    let head = '';
    while (head.length < 4096) {
      const { value, done } = await reader.read();
      if (done) break;
      head += value;
    }
    reader.cancel().catch(() => {});
    if (!/#EXTM3U|#EXTINF/i.test(head)) return { ok: false, message: 'notm3u' };
    return { ok: true, message: 'ok' };
  } catch (e) {
    return { ok: false, message: (e as Error).message };
  }
}

/**
 * "Tester" button: tries the servers in order and stops at the first one that answers.
 * `server` is the one to use (the UI switches to it), `tried` lists every attempt.
 */
export async function testSource(
  src: Pick<Source, 'type' | 'url' | 'username' | 'servers'>,
  password?: string,
): Promise<{ ok: boolean; message: string; account?: Source['account']; server?: string; tried: ServerTest[] }> {
  const tried: ServerTest[] = [];
  for (const server of serversOf(src)) {
    const r = await testOne({ ...src, url: server }, password);
    tried.push({ server, ok: r.ok, message: r.message });
    if (r.ok) return { ...r, server, tried };
  }
  const last = tried[tried.length - 1];
  return { ok: false, message: last?.message || 'no server', tried };
}
