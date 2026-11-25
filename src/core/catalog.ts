import { VariantGroups } from '../rust/generated/cyberstream';
import { awards } from './enrich/awards';
import { db, getMeta } from './db';
import type { Movie, Series, TmdbListItem } from './types';
import { listsKey, type TmdbLists } from './enrich/enrich';
import { movieGroupKey, seriesGroupKey } from './util/text';
import { langScore, sortByLang, type LangPrefs } from './util/lang';

/** language-aware dedup: best variant for the user's languages represents the group, languages merged */
export function dedupLang<T extends { groupKey: string; origLang?: string; langs?: string[]; subs?: string[] }>(rows: T[], prefs?: LangPrefs): T[] {
  if (!prefs) return dedup(rows);
  const groups = new VariantGroups(prefs.audio, prefs.subs);
  try {
    for (let i = 0; i < rows.length; i += 1500) {
      groups.append(JSON.stringify(rows.slice(i, i + 1500).map(r => [r.groupKey, r.langs || [], r.subs || [], r.origLang || ''])));
    }
    groups.finish();
    const out: T[] = [];
    const length = groups.len();
    for (let i = 0; i < length; i += 1500) {
      const part: [number, string[], string[]][] = JSON.parse(groups.page(i, 1500));
      for (const [index, langs, subs] of part) out.push({ ...rows[index], langs, subs });
    }
    return out;
  } finally { groups.free(); }
}

export function dedup<T extends { groupKey: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const r of rows) {
    if (seen.has(r.groupKey)) continue;
    seen.add(r.groupKey);
    out.push(r);
  }
  return out;
}

// ─────────── VOD ───────────

export async function tmdbLists(lang: string): Promise<TmdbLists | undefined> {
  return getMeta<TmdbLists>(listsKey(lang));
}

/** Movies of the catalog matching a TMDB list, in list order */
export async function matchMovies(profileId: string, list: TmdbListItem[]): Promise<Movie[]> {
  if (!list.length) return [];
  const ids = list.map((i) => i.tmdbId);
  const keys = list.flatMap((i) => [movieGroupKey(i.title, i.year), movieGroupKey(i.title, undefined)]);
  const [byId, byKey] = await Promise.all([
    db.movies.where('tmdbId').anyOf(ids).filter((m) => m.profileId === profileId).toArray(),
    db.movies.where('groupKey').anyOf(keys).filter((m) => m.profileId === profileId).toArray(),
  ]);
  const idMap = new Map<number, Movie>();
  for (const m of [...byId, ...byKey]) if (m.tmdbId && !idMap.has(m.tmdbId)) idMap.set(m.tmdbId, m);
  const keyMap = new Map<string, Movie>();
  for (const m of byKey) keyMap.set(m.groupKey, m);
  const out: Movie[] = [];
  const seen = new Set<string>();
  for (const i of list) {
    const m = idMap.get(i.tmdbId) || keyMap.get(movieGroupKey(i.title, i.year)) || keyMap.get(movieGroupKey(i.title, undefined));
    if (m && !seen.has(m.groupKey)) {
      seen.add(m.groupKey);
      out.push({ ...m, poster: m.poster || i.poster, backdrop: m.backdrop || i.backdrop });
    }
  }
  return out;
}

export async function matchSeries(profileId: string, list: TmdbListItem[]): Promise<Series[]> {
  if (!list.length) return [];
  const ids = list.map((i) => i.tmdbId);
  const keys = list.map((i) => seriesGroupKey(i.title));
  const [byId, byKey] = await Promise.all([
    db.series.where('tmdbId').anyOf(ids).filter((m) => m.profileId === profileId).toArray(),
    db.series.where('groupKey').anyOf(keys).filter((m) => m.profileId === profileId).toArray(),
  ]);
  const idMap = new Map<number, Series>();
  for (const m of [...byId, ...byKey]) if (m.tmdbId && !idMap.has(m.tmdbId)) idMap.set(m.tmdbId, m);
  const keyMap = new Map(byKey.map((m) => [m.groupKey, m]));
  const out: Series[] = [];
  const seen = new Set<string>();
  for (const i of list) {
    const m = idMap.get(i.tmdbId) || keyMap.get(seriesGroupKey(i.title));
    if (m && !seen.has(m.groupKey)) {
      seen.add(m.groupKey);
      out.push({ ...m, poster: m.poster || i.poster, backdrop: m.backdrop || i.backdrop });
    }
  }
  return out;
}

export async function latestMovies(profileId: string, limit = 40, hideAdult = true, prefs?: LangPrefs): Promise<Movie[]> {
  const rows = await db.movies.where('[profileId+addedAt]').between([profileId, -Infinity], [profileId, Infinity]).reverse().limit(limit * 4).toArray();
  return dedupLang(rows.filter((m) => !(hideAdult && m.universe === 'adult')), prefs).slice(0, limit);
}

export async function latestSeries(profileId: string, limit = 40, hideAdult = true, prefs?: LangPrefs): Promise<Series[]> {
  const rows = await db.series.where('[profileId+addedAt]').between([profileId, -Infinity], [profileId, Infinity]).reverse().limit(limit * 4).toArray();
  return dedupLang(rows.filter((m) => !(hideAdult && m.universe === 'adult')), prefs).slice(0, limit);
}

/**
 * Films for the genre / kids / must-see rails: those TMDB already enriched (genres, ratings) first,
 * then the rest of the catalogue. Taking the first rows of the table instead left those rails
 * empty on a big catalogue, where few of those rows were enriched yet.
 */
export async function moviesSample(profileId: string, limit = 3000): Promise<Movie[]> {
  const enriched = await db.movies.where('enrichedAt').above(0).filter((m) => m.profileId === profileId).limit(limit).toArray();
  if (enriched.length >= limit) return enriched;
  const seen = new Set(enriched.map((m) => m.id));
  const rest = await db.movies.where('profileId').equals(profileId).filter((m) => !seen.has(m.id)).limit(limit - enriched.length).toArray();
  return [...enriched, ...rest];
}

export async function similarByGenre(profileId: string, kind: 'movie'|'series', groupKey: string, genre: string | undefined, prefs: LangPrefs, categoryId?: string) {
  const table = (kind === 'movie' ? db.movies : db.series) as typeof db.movies;
  const rank = (rows: (Movie | Series)[]) => dedupLang(rows,prefs).sort((a,b) => (b.imdbRating || b.rating || 0) - (a.imdbRating || a.rating || 0));
  const byGenre = genre ? rank(await table.where('profileId').equals(profileId)
    .filter(x => x.groupKey !== groupKey && !!x.genres?.includes(genre)).limit(200).toArray()) : [];
  if (byGenre.length >= 12 || !categoryId) return byGenre.slice(0,24);
  // titles TMDB hasn't enriched have no genres: the provider's category ("FR - Comédie") instead
  const seen = new Set(byGenre.map(x => x.groupKey));
  const byCategory = rank(await table.where('categoryId').equals(categoryId)
    .filter(x => x.groupKey !== groupKey && x.profileId === profileId && !seen.has(x.groupKey)).limit(200).toArray());
  return [...byGenre, ...byCategory].slice(0,24);
}

/** the film / series rails of Home (the rest — continue watching, favourites, Trakt — is small) */
export async function homeCatalog(profileId: string, lang: string, hideAdult: boolean, prefs: LangPrefs, sampleSize = 4000) {
  const lists = await tmdbLists(lang);
  const [fresh, newSeries, top0, nowPlaying0, popularMovies0, topRated0, trendingTv0, popularTv0, sample0] = await Promise.all([
    latestMovies(profileId, 40, hideAdult, prefs),
    latestSeries(profileId, 40, hideAdult, prefs),
    matchMovies(profileId, lists?.trendingMovies || []),
    matchMovies(profileId, lists?.nowPlaying || []),
    matchMovies(profileId, lists?.popularMovies || []),
    matchMovies(profileId, lists?.topRatedMovies || []),
    matchSeries(profileId, lists?.trendingTv || []),
    matchSeries(profileId, lists?.popularTv || []),
    moviesSample(profileId, sampleSize),
  ]);
  // content in the user's audio languages first (secondary language next, then untagged, then the rest)
  const L = <T extends Movie | Series>(rows: T[]) => sortByLang(rows, prefs);
  const top = L(top0.filter((m) => langScore(m, prefs) < 4).length >= 6 ? top0.filter((m) => langScore(m, prefs) < 4) : top0);
  const [nowPlaying, popularMovies, topRated, trendingTv, popularTv] = [L(nowPlaying0), L(popularMovies0), L(topRated0), L(trendingTv0), L(popularTv0)];
  const sample = dedupLang(sample0, prefs);
  // genre rails from enriched movies
  const byGenre = new Map<string, Movie[]>();
  for (const m of sample) for (const g of m.genres || []) (byGenre.get(g) || byGenre.set(g, []).get(g)!).push(m);
  const genres = [...byGenre.entries()]
    .filter(([, l]) => l.length >= 6)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
    .map(([g, l]) => [g, l.slice(0, 30)] as [string, Movie[]]);
  const mustSee = topRated.length >= 6 ? topRated : L(sample.filter((m) => (m.rating || 0) >= 7.3).sort((a, b) => (b.rating || 0) - (a.rating || 0))).slice(0, 30);
  const kids = sample.filter((m) => m.universe === 'kids' || (m.genres || []).some((g) => /anim|famil/i.test(g))).slice(0, 30);
  // the rows at the bottom: classics, award winners (Wikidata, no key needed), reality TV, talk
  // shows, and the films of each streaming platform
  const aw = await awards(lang).catch(() => null);
  const [classics, awardMovies, awardSeries0, reality, buzz, topRatedTvRows] = await Promise.all([
    matchMovies(profileId, lists?.classics || []),
    matchMovies(profileId, aw?.movies || []),
    matchSeries(profileId, aw?.series || []),
    matchSeries(profileId, lists?.realityTv || []),
    matchSeries(profileId, lists?.buzzTv || []),
    matchSeries(profileId, lists?.topRatedTv || []),
  ]);
  // few series carry their awards in Wikidata: completed with the most acclaimed ones
  const seenSeries = new Set(awardSeries0.map((s) => s.groupKey));
  const awardSeries = awardSeries0.length >= 12 ? awardSeries0 : [...awardSeries0, ...topRatedTvRows.filter((s) => !seenSeries.has(s.groupKey))];
  const platforms: [string, Movie[]][] = [];
  for (const p of lists?.platforms || []) {
    const rows = await matchMovies(profileId, p.items);
    if (rows.length >= 3) platforms.push([p.name, L(rows).slice(0, 30)]);
  }
  const vis = <T extends Movie | Series>(rows: T[]) => rows.filter((m) => !hideAdult || m.universe !== 'adult').slice(0, 30);
  return {
    classics: vis(classics), awardMovies: vis(awardMovies), awardSeries: vis(awardSeries), reality: vis(L(reality)), buzz: vis(L(buzz)), platforms,
    fresh, newSeries, top: top.slice(0, 10), nowPlaying, popularMovies, mustSee, trendingTv, popularTv, genres, kids,
    hasVod: sample.length > 0 || newSeries.length > 0,
  };
}
