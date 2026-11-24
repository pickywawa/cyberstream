import { home_blocks } from '../rust/generated/cyberstream';
import { homeCatalog } from './catalog';
import { sortByLang, type LangPrefs } from './util/lang';
import type { Movie, Series, WatchState } from './types';

/**
 * Home, built in the data worker: the catalogue's rows are read and turned into markup here, only
 * the shelves' HTML (one block per shelf) and the few banner titles cross to the screen.
 */
export type HomeItem = { kind: 'movie' | 'series'; item: Movie | Series };
export interface HomeExtra {
  cont: WatchState[];
  favMovies: Movie[];
  favSeries: Series[];
  trakt: { forYou: HomeItem[]; watchlist: HomeItem[]; lists: { name: string; items: HomeItem[] }[] } | null;
}
type EnrichRef = Pick<Movie, 'id' | 'enrichedAt' | 'enrichV' | 'tmdbId'>;
const ref = ({ id, enrichedAt, enrichV, tmdbId }: Movie | Series): EnrichRef => ({ id, enrichedAt, enrichV, tmdbId });
export interface HomeView {
  /** [key, html] per shelf, in page order */
  blocks: [string, string][];
  hero: HomeItem[];
  cont: WatchState[];
  hasVod: boolean;
  /** titles on screen first, for TMDB */
  enrich: { movie: EnrichRef[]; series: EnrichRef[] };
}

const SHELF_FIELDS = ['classics','awardMovies','awardSeries','reality','buzz','platforms','cont','hasVod','trakt','lists','forYou','watchlist','items','name','item','kind','fresh','newSeries','top','nowPlaying','popularMovies','mustSee','trendingTv','popularTv','genres','kids','favMovies','favSeries','id','key','groupKey','title','subtitle','poster','image','backdrop','year','imdbRating','rating','durationSec','positionSec'];

function featured<T extends Movie | Series>(pool: T[], prefs: LangPrefs, hideAdult: boolean): T[] {
  const eligible = sortByLang(pool.filter(m => !hideAdult || m.universe !== 'adult'), prefs);
  const artworkRank = (m: T) => m.backdrop ? 0 : m.poster ? 1 : 2;
  eligible.sort((a, b) => artworkRank(a) - artworkRank(b));
  const seen = new Set<string>();
  return eligible.filter(m => !seen.has(m.groupKey) && seen.add(m.groupKey)).slice(0, 6);
}

export async function homeView(profileId: string, lang: string, hideAdult: boolean, prefs: LangPrefs, extra: HomeExtra): Promise<HomeView> {
  const catalog = await homeCatalog(profileId, lang, hideAdult, prefs);
  const data = { ...catalog, ...extra, genres: catalog.genres.map(([genre, rows]) => [genre, rows.slice(0, 30)]) };
  const blocks = JSON.parse(home_blocks(JSON.stringify(data, SHELF_FIELDS), lang)) as [string, string][];
  const movies = featured([...catalog.top, ...catalog.nowPlaying, ...catalog.popularMovies, ...catalog.fresh, ...catalog.mustSee], prefs, hideAdult);
  const hero: HomeItem[] = movies.length
    ? movies.map(item => ({ kind: 'movie', item }))
    : featured([...catalog.trendingTv, ...catalog.newSeries], prefs, hideAdult).map(item => ({ kind: 'series', item }));
  return {
    blocks, hero, cont: extra.cont, hasVod: catalog.hasVod,
    enrich: {
      movie: [...catalog.top, ...catalog.fresh.slice(0, 16), ...catalog.nowPlaying.slice(0, 10)].map(ref),
      series: [...catalog.trendingTv.slice(0, 10), ...catalog.newSeries.slice(0, 16)].map(ref),
    },
  };
}
