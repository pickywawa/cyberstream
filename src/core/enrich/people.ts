import { getMeta, setMeta } from '../db';
import { timeoutSignal } from '../net/http';

/**
 * Photo of a cast member known only by name (no TMDB key): the thumbnail of their Wikipedia page
 * (public REST API, no key). Only pages describing a performer/filmmaker are kept, so a namesake's
 * photo isn't shown. Cached a month (misses too).
 */
const PERFORMER = /act(eur|rice|or|ress)|com[ée]dien|r[ée]alisat|director|humorist|chanteu|singer|animat|présentat|presenter|mannequin|model|scénariste|screenwriter|cascadeu|stunt|danseu|dancer|doubl/i;
const mem = new Map<string, Promise<string | undefined>>();

async function lookup(name: string, lang: string): Promise<string | undefined> {
  const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.trim().replace(/ /g, '_'))}`, { signal: timeoutSignal(8000) });
  if (!res.ok) return undefined;
  const j = await res.json();
  if (j?.type !== 'standard' || !PERFORMER.test(`${j.description || ''} ${String(j.extract || '').slice(0, 200)}`)) return undefined;
  return j.thumbnail?.source || undefined;
}

export function actorPhoto(name: string, lang: string): Promise<string | undefined> {
  const key = `wiki:photo:${name.toLowerCase()}`;
  let p = mem.get(key);
  if (!p) {
    p = (async () => {
      const cached = await getMeta<{ at: number; url?: string }>(key).catch(() => undefined);
      if (cached && Date.now() - cached.at < 30 * 86400000) return cached.url;
      let url: string | undefined;
      for (const l of [...new Set([lang, 'en'])]) {
        url = await lookup(name, l).catch(() => undefined);
        if (url) break;
      }
      await setMeta(key, { at: Date.now(), url }).catch(() => {});
      return url;
    })();
    mem.set(key, p);
  }
  return p;
}

export interface WikiCredit { kind: 'movie' | 'series'; tmdbId?: number; title?: string; year?: number; director: boolean }
export interface WikiPerson {
  name: string; photo?: string; description?: string; bio?: string;
  birthday?: string; deathday?: string; place?: string; credits: WikiCredit[];
}

const sparql = async (query: string) => {
  const res = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(query)}`, {
    headers: { Accept: 'application/sparql-results+json' }, signal: timeoutSignal(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return ((await res.json())?.results?.bindings || []) as Record<string, { value: string } | undefined>[];
};

/**
 * Actor / director page without TMDB: Wikipedia (photo, description, introduction) and Wikidata
 * (birth, death, birthplace, and the films / series they played in or directed, with their TMDB
 * ids so they can be found in the catalogue). Cached a week.
 */
export async function wikiPerson(name: string, lang: string): Promise<WikiPerson | null> {
  const key = `wiki:person:${lang}:${name.toLowerCase()}`;
  const cached = await getMeta<{ at: number; p: WikiPerson | null }>(key).catch(() => undefined);
  if (cached && Date.now() - cached.at < 7 * 86400000) return cached.p;
  let page: any = null, wiki = lang;
  for (const l of [...new Set([lang, 'en'])]) {
    const res = await fetch(`https://${l}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.trim().replace(/ /g, '_'))}`, { signal: timeoutSignal(8000) }).catch(() => null);
    const j = res?.ok ? await res.json() : null;
    if (j?.type === 'standard' && PERFORMER.test(`${j.description || ''} ${String(j.extract || '').slice(0, 200)}`)) { page = j; wiki = l; break; }
  }
  if (!page) {
    await setMeta(key, { at: Date.now(), p: null }).catch(() => {});
    return null;
  }
  const p: WikiPerson = {
    name: page.titles?.normalized || page.title || name, photo: page.originalimage?.source || page.thumbnail?.source,
    description: page.description, bio: page.extract, credits: [],
  };
  // the whole introduction (the summary stops after a paragraph)
  const intro = await fetch(`https://${wiki}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&redirects=1&format=json&origin=*&titles=${encodeURIComponent(page.title)}`, { signal: timeoutSignal(8000) })
    .then(r => r.json()).catch(() => null);
  const text = Object.values<any>(intro?.query?.pages || {})[0]?.extract;
  if (typeof text === 'string' && text.length > (p.bio || '').length) p.bio = text.trim();
  const q = page.wikibase_item;
  if (q && /^Q\d+$/.test(q)) {
    const L = lang === 'en' ? 'en' : 'fr';
    const [facts, works] = await Promise.all([
      sparql(`SELECT ?birth ?death ?placeLabel WHERE { OPTIONAL { wd:${q} wdt:P569 ?birth } OPTIONAL { wd:${q} wdt:P570 ?death }
        OPTIONAL { wd:${q} wdt:P19 ?place . ?place rdfs:label ?placeLabel FILTER(lang(?placeLabel) = "${L}") } } LIMIT 1`).catch(() => []),
      sparql(`SELECT ?item ?role ?tmdbM ?tmdbT ?label ?date WHERE {
        { ?item wdt:P161 wd:${q} . BIND("cast" AS ?role) } UNION { ?item wdt:P57 wd:${q} . BIND("director" AS ?role) }
        OPTIONAL { ?item wdt:P4947 ?tmdbM } OPTIONAL { ?item wdt:P4983 ?tmdbT } OPTIONAL { ?item wdt:P577 ?date }
        OPTIONAL { ?item rdfs:label ?label FILTER(lang(?label) = "${L}") } } LIMIT 800`).catch(() => []),
    ]);
    const f = facts[0] || {};
    p.birthday = f.birth?.value?.slice(0, 10);
    p.deathday = f.death?.value?.slice(0, 10);
    p.place = f.placeLabel?.value;
    const seen = new Set<string>();
    for (const w of works) {
      const id = w.item?.value || '';
      if (seen.has(id)) continue;
      seen.add(id);
      const tmdbT = Number(w.tmdbT?.value) || undefined;
      const tmdbM = Number(w.tmdbM?.value) || undefined;
      const year = parseInt(w.date?.value?.slice(0, 4) || '', 10) || undefined;
      p.credits.push({ kind: tmdbT && !tmdbM ? 'series' : 'movie', tmdbId: tmdbM || tmdbT, title: w.label?.value, year, director: w.role?.value === 'director' });
    }
  }
  await setMeta(key, { at: Date.now(), p }).catch(() => {});
  return p;
}
