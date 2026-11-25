import { db, getMeta } from '@/core/db';
import type { LangPrefs } from '@/core/util/lang';
import type { GridFilter } from '@/state/store';
import { GridCatalog } from '@/rust/generated/cyberstream';

type Kind = 'movie' | 'series';
const fields = ['id','title','groupKey','categoryId','universe','genres','langs','subs','origLang','year','addedAt','rating','imdbRating'];
let current: { key: string; catalog: GridCatalog; at: number; alphabet: boolean } | undefined;
let pending: Promise<void> = Promise.resolve();

/**
 * The catalogue's rows (only the grid's fields, as JSON pages), kept per kind until a sync changes
 * the catalogue. Reading the whole table out of IndexedDB is the slow part on a TV: Home's
 * categories (films, kids, docs…) used to read it again for each category, and again after 45 s.
 * Now a category only filters these pages. Kept 10 min, so ratings and genres TMDB adds show up.
 */
const pages = new Map<Kind, { key: string; chunks: string[]; at: number }>();
const PAGES_TTL = 10 * 60000;

async function catalogPages(profile: string, kind: Kind): Promise<{ key: string; chunks: string[]; at: number }> {
  const sources = (await db.sources.where('profileId').equals(profile).primaryKeys()).sort();
  const version = await getMeta<number>(`catalog:version:${profile}`);
  const key = JSON.stringify([profile, kind, sources, version]);
  const saved = pages.get(kind);
  if (saved && saved.key === key && Date.now() - saved.at < PAGES_TTL) return saved;
  pages.delete(kind);
  const table = kind === 'movie' ? db.movies : db.series;
  const chunks: string[] = [];
  for (const source of sources) {
    const prefix = source + (kind === 'movie' ? ':m:' : ':s:');
    let cursor = prefix;
    for (;;) {
      const rows = await table.where(':id').between(cursor, prefix + '\uffff', false, false).limit(1200).toArray();
      chunks.push(JSON.stringify(rows, fields));
      if (rows.length < 1200) break;
      cursor = rows[rows.length - 1].id;
    }
  }
  const entry = { key, chunks, at: Date.now() };
  pages.set(kind, entry);
  return entry;
}

async function read(profile: string, kind: Kind, filter: GridFilter, hide: boolean, prefs: LangPrefs, sub: number): Promise<[string[], number[]]> {
  const {sort = 'added', ...constraints} = filter;
  const data = await catalogPages(profile, kind);
  // the pages' date too: pages read again (sync, TTL) rebuild the category's list
  const key = JSON.stringify([data.key,data.at,constraints,hide,prefs]);
  if (!current || current.key !== key) {
    current?.catalog.free();
    current = undefined;
    const categories = await db.categories.where('[profileId+kind]').between([profile,''],[profile,'\uffff']).toArray();
    const catalog = new GridCatalog(JSON.stringify(constraints), hide, prefs.audio, prefs.subs, JSON.stringify(categories.map(c => [c.id,c.name])));
    try {
      for (const chunk of data.chunks) catalog.append(chunk);
      catalog.finish();
      current = {key,catalog,at:Date.now(),alphabet:false};
    } catch (e) { catalog.free(); throw e; }
  }
  if (sort === 'title' && !current.alphabet) {
    const titles = current.catalog.titles();
    const collator = new Intl.Collator('fr');
    const order = Uint32Array.from(titles, (_,i) => i).sort((a,b) => collator.compare(titles[a],titles[b]));
    current.catalog.alphabet(order);
    current.alphabet = true;
  }
  return JSON.parse(current.catalog.select(sort, sub));
}

export function grid(...args: Parameters<typeof read>) {
  const result = pending.then(() => read(...args));
  pending = result.then(() => {}, () => {});
  return result;
}

/** reads the catalogue's pages ahead (after Home shows), so the first category opens at once */
export function warmGrid(profile: string, kind: Kind) {
  const result = pending.then(() => catalogPages(profile, kind)).then(() => {});
  pending = result.catch(() => {});
  return result;
}
