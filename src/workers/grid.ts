import { db, getMeta } from '@/core/db';
import type { LangPrefs } from '@/core/util/lang';
import type { GridFilter } from '@/state/store';
import { GridCatalog } from '@/rust/generated/cyberstream';

type Kind = 'movie' | 'series';
const fields = ['id','title','groupKey','categoryId','universe','genres','langs','subs','origLang','year','addedAt','rating','imdbRating'];
let current: { key: string; catalog: GridCatalog; at: number; alphabet: boolean } | undefined;
let pending: Promise<void> = Promise.resolve();

async function read(profile: string, kind: Kind, filter: GridFilter, hide: boolean, prefs: LangPrefs, sub: number): Promise<[string[], number[]]> {
  const sources = (await db.sources.where('profileId').equals(profile).primaryKeys()).sort();
  const version = await getMeta<number>(`catalog:version:${profile}`);
  const {sort = 'added', ...constraints} = filter;
  const key = JSON.stringify([profile,kind,sources,version,constraints,hide,prefs]);
  if (!current || current.key !== key || Date.now() - current.at >= 45000) {
    current?.catalog.free();
    current = undefined;
    const categories = await db.categories.where('[profileId+kind]').between([profile,''],[profile,'\uffff']).toArray();
    const catalog = new GridCatalog(JSON.stringify(constraints), hide, prefs.audio, prefs.subs, JSON.stringify(categories.map(c => [c.id,c.name])));
    try {
      const table = kind === 'movie' ? db.movies : db.series;
      for (const source of sources) {
        const prefix = source + (kind === 'movie' ? ':m:' : ':s:');
        let cursor = prefix;
        for (;;) {
          const rows = await table.where(':id').between(cursor, prefix + '\uffff', false, false).limit(1200).toArray();
          catalog.append(JSON.stringify(rows, fields));
          if (rows.length < 1200) break;
          cursor = rows[rows.length - 1].id;
        }
      }
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
