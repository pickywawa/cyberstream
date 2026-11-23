import { getMeta, setMeta } from '../db';
import { timeoutSignal } from '../net/http';
import type { TmdbListItem } from '../types';

/**
 * Award winners from Wikidata (no TMDB key needed), with their TMDB ids so the catalogue can be
 * matched: films (Oscar of the best picture, Palme d'or, César of the best film) and series
 * (Emmy "Outstanding … Series", Golden Globe of the best series / miniseries). Newest first,
 * cached a week.
 */
export interface Awards {
  at: number;
  movies: TmdbListItem[];
  series: TmdbListItem[];
}

const KEY = (lang: string) => `awards:v1:${lang}`;
const WEEK = 7 * 86400000;

const MOVIES = (lang: string) => `SELECT ?tmdb (SAMPLE(?l) AS ?label) (MIN(?d) AS ?date) WHERE {
  VALUES ?award { wd:Q102427 wd:Q179808 wd:Q900494 }
  ?f p:P166/ps:P166 ?award ; wdt:P4947 ?tmdb .
  OPTIONAL { ?f wdt:P577 ?d }
  OPTIONAL { ?f rdfs:label ?l FILTER(lang(?l) = "${lang}") }
} GROUP BY ?tmdb`;

const SERIES = (lang: string) => `SELECT ?tmdb (SAMPLE(?l) AS ?label) (MIN(?d) AS ?date) WHERE {
  ?s wdt:P4983 ?tmdb ; p:P166/ps:P166 ?award .
  ?award rdfs:label ?al . FILTER(lang(?al) = "en")
  FILTER((STRSTARTS(?al, "Primetime Emmy Award for Outstanding") && CONTAINS(?al, "Series")) ||
         STRSTARTS(?al, "Golden Globe Award for Best Television Series") || STRSTARTS(?al, "Golden Globe Award for Best Miniseries"))
  OPTIONAL { ?s wdt:P580 ?d }
  OPTIONAL { ?s rdfs:label ?l FILTER(lang(?l) = "${lang}") }
} GROUP BY ?tmdb`;

async function query(q: string): Promise<TmdbListItem[]> {
  const res = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(q)}`, {
    headers: { Accept: 'application/sparql-results+json' }, signal: timeoutSignal(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const rows: Record<string, { value: string } | undefined>[] = (await res.json())?.results?.bindings || [];
  return rows
    .map((r) => ({ tmdbId: Number(r.tmdb?.value), title: r.label?.value || '', year: r.date ? Number(r.date.value.slice(0, 4)) || undefined : undefined }))
    .filter((x) => Number.isInteger(x.tmdbId) && x.tmdbId > 0)
    .sort((a, b) => (b.year || 0) - (a.year || 0));
}

let loading: Promise<Awards | null> | null = null;

/** saved lists at once (refreshed in the background once a week); the first time, waits a little */
export async function awards(lang: string): Promise<Awards | null> {
  const l = lang === 'en' ? 'en' : 'fr';
  const saved = await getMeta<Awards>(KEY(l)).catch(() => undefined);
  if (saved && Date.now() - saved.at < WEEK) return saved;
  loading ??= Promise.all([query(MOVIES(l)), query(SERIES(l))])
    .then(async ([movies, series]) => {
      const a: Awards = { at: Date.now(), movies, series };
      await setMeta(KEY(l), a);
      return a;
    })
    .catch(() => null)
    .finally(() => (loading = null));
  if (saved) return saved;
  return Promise.race([loading, new Promise<null>((r) => setTimeout(() => r(null), 8000))]);
}
