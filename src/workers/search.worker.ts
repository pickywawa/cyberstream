/// <reference lib="webworker" />

import { grid, warmGrid } from './grid';
import { db, getMeta, setMeta } from '@/core/db';
import { SearchIndex, type SearchDoc } from '@/core/search';
import { norm } from '@/core/util/text';

/**
 * Search runs on the index it already has (stale-while-revalidate): a newer catalogue version
 * rebuilds it in the background, the next keystroke uses the fresh one. The compact document list
 * is saved in IndexedDB so a cold start searches at once instead of re-reading every title.
 */
/** swapped atomically once a rebuild is complete: searches never wait for it */
let index = new SearchIndex();
let current: { profileId: string; version: number } | null = null;
let building: Promise<void> | null = null;

const snapKey = (profileId: string) => `search:rust:v1:${profileId}`;

async function build(profileId: string, version: number) {
  const next = new SearchIndex();
  try {
    const sources = await db.sources.where('profileId').equals(profileId).primaryKeys();
    // Records have stable source-prefixed primary keys. Range paging reads each row once.
    for (const kind of ['live', 'movie', 'series'] as const) {
      const [table, suffix] = kind === 'live' ? [db.channels, 'l'] as const :
        kind === 'movie' ? [db.movies, 'm'] as const : [db.series, 's'] as const;
      for (const source of sources.sort()) {
        const prefix = `${source}:${suffix}:`;
        let cursor = prefix;
        for (;;) {
          const rows = await table.where(':id').between(cursor, prefix + '\uffff', false, false).limit(1500).toArray();
          if (!rows.length) break;
          next.append(rows.map((r): SearchDoc => ({
            kind, id: r.id, groupKey: r.groupKey, title: 'name' in r ? r.name : r.title,
            extra: 'name' in r ? undefined : [r.year, ...(r.cast || []).slice(0,4), 'director' in r ? r.director : ''].filter(Boolean).join(' '),
          })));
          cursor = rows[rows.length - 1].id;
          if (rows.length < 1500) break;
        }
      }
    }
    next.finish();
  } catch (error) { next.free(); throw error; }
  index.free();
  index = next;
  current = { profileId, version };
  try {
    await setMeta(snapKey(profileId), { version, pages: next.snapshot() });
    await db.meta.delete(`search:docs:${profileId}`);
  } catch { /* Storage may be full. The in-memory index is ready. */ }
}

function rebuild(profileId: string, version: number) {
  building = build(profileId, version).finally(() => { building = null; });
  return building;
}

async function ensure(profileId: string, version: number): Promise<void> {
  if (current?.profileId === profileId) {
    if (current.version !== version && !building) void rebuild(profileId, version).catch(() => {});
    return;
  }
  if (building) { await building; return ensure(profileId, version); }
  const snap = await getMeta<{ version: number; pages: Uint8Array[] }>(snapKey(profileId));
  if (building) { await building; return ensure(profileId, version); }
  if (snap?.pages.length) {
    const next = new SearchIndex();
    try { next.restore(snap.pages); }
    catch { next.free(); await rebuild(profileId, version); return; }
    index.free();
    index = next;
    current = { profileId, version: snap.version };
    if (snap.version !== version) void rebuild(profileId, version).catch(() => {});
    return;
  }
  await rebuild(profileId, version);
}

// ─────────── TV programmes (now → +24 h), indexed apart, refreshed every 20 min ───────────
interface ProgDoc {
  id?: number;
  epgId: string;
  start: number;
  stop: number;
  n: string;
}
let progs: { at: number; epgVersion: number; docs: ProgDoc[] } | null = null;
let progBuilding: Promise<void> | null = null;

async function buildProgs(epgVersion: number) {
  const now = Date.now();
  const docs: ProgDoc[] = [];
  await db.programs
    .where('start')
    .between(now - 3 * 3600000, now + 24 * 3600000)
    .each((p) => {
      if (p.stop > now) docs.push({ id: p.id, epgId: p.epgId, start: p.start, stop: p.stop, n: ' ' + norm(p.title) + ' ' });
    });
  progs = { at: now, epgVersion, docs };
}

export const api = {
  grid,
  warmGrid,
  async search(profileId: string, version: number, q: string) {
    await ensure(profileId, version);
    return index.search(q);
  },
  async warm(profileId: string, version: number) {
    await ensure(profileId, version);
    if (!progs) void buildProgs(0);
    return index.size;
  },
  /** programme ids whose title matches, soonest first */
  async searchPrograms(q: string, epgVersion: number, limit = 40): Promise<number[]> {
    const stale = !progs || progs.epgVersion !== epgVersion || Date.now() - progs.at > 20 * 60000;
    if (stale && !progBuilding) progBuilding = buildProgs(epgVersion).finally(() => (progBuilding = null));
    if (!progs) await progBuilding;
    const tokens = norm(q).split(' ').filter(Boolean);
    if (!tokens.length || !progs) return [];
    const now = Date.now();
    const out: ProgDoc[] = [];
    for (const d of progs.docs) {
      if (d.stop <= now) continue;
      if (tokens.every((t) => d.n.includes(' ' + t) || (t.length >= 3 && d.n.includes(t)))) out.push(d);
    }
    out.sort((a, b) => a.start - b.start);
    return out.slice(0, limit).map((d) => d.id!).filter((x) => x !== undefined);
  },
};

export type SearchApi = typeof api;
