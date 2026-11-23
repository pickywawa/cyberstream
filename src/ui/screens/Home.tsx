import { dataWorker } from '@/core/workers';
import { useContext, useEffect, useMemo } from 'react';
import { useApp } from '@/state/store';
import { t } from '@/core/i18n';
import { db, setMeta } from '@/core/db';
import {
  continueWatching, favoritesOf, getProgress, hideFromContinue, matchMovies, matchSeries,
} from '@/core/repo';
import type { Movie, Series } from '@/core/types';
import { ScreenActive, useAsync, useCarousel } from '../hooks';
import { TrailerBg, useTrailers } from '../components/Trailer';
import { RustView, readCommand } from '../components/RustView';
import { home_html, hero_html } from '@/rust/generated/cyberstream';
import { openMovie, openSeries, playMovie, prioritizeEnrichment, resume } from '../actions';
import { langPrefs } from '@/core/prefs';
import { sortByLang, type LangPrefs } from '@/core/util/lang';
import { traktLists } from '@/core/trakt';
import type { TmdbListItem } from '@/core/types';

type HeroItem = { kind: 'movie' | 'series'; item: Movie | Series };
type MixItem = HeroItem;

export const homeKey = (profileId: string, prefsKey: string, hideAdult: boolean) => `home:${profileId}:${prefsKey}:${hideAdult}`;
export const homePrefsKey = (p: { lang: string; audioLangs?: string[]; subLangs?: string[] }) => `${p.lang}|${p.audioLangs?.join()}|${p.subLangs?.join()}`;

let lastSnapshot = 0;
/** persisted (throttled) so the next launch shows Home immediately — see loadHomeSnapshot() */
function saveHomeSnapshot(profileId: string, key: string, data: unknown) {
  if (Date.now() - lastSnapshot < 20000) return;
  lastSnapshot = Date.now();
  void setMeta(`snapshot:home:${profileId}`, { key, data, at: Date.now() }).catch(() => {});
}

const SHELF_FIELDS = ['cont','hasVod','trakt','lists','forYou','watchlist','items','name','item','kind','fresh','newSeries','top','nowPlaying','popularMovies','mustSee','trendingTv','popularTv','genres','kids','favMovies','favSeries','id','key','groupKey','title','subtitle','poster','image','backdrop','year','imdbRating','durationSec','positionSec'];

function featured<T extends Movie | Series>(pool: T[], prefs: LangPrefs, hideAdult: boolean): T[] {
  const eligible = sortByLang(pool.filter(m => !hideAdult || m.universe !== 'adult'), prefs);
  const artworkRank = (m: T) => m.backdrop ? 0 : m.poster ? 1 : 2;
  eligible.sort((a, b) => artworkRank(a) - artworkRank(b));
  const seen = new Set<string>();
  return eligible.filter(m => !seen.has(m.groupKey) && seen.add(m.groupKey)).slice(0, 6);
}

export function Home() {
  const profile = useApp((s) => s.profile)!;
  const settings = useApp((s) => s.settings);
  const push = useApp((s) => s.push);
  const setTab = useApp((s) => s.setTab);
  const hideAdult = settings.hideAdult || (profile.parental.enabled && !useApp.getState().unlockedAdult);

  const prefsKey = homePrefsKey(profile);
  const data = useAsync(async () => {
    const prefs = langPrefs(profile);
    const [catalog,cont,favs] = await Promise.all([
      dataWorker().homeCatalog(profile.id,profile.lang,hideAdult,prefs),continueWatching(profile.id),favoritesOf(profile.id),
    ]);
    const favMovies = (await db.movies.bulkGet(favs.filter((f) => f.kind === 'movie').map((f) => f.itemId))).filter(Boolean) as Movie[];
    const favSeries = (await db.series.bulkGet(favs.filter((f) => f.kind === 'series').map((f) => f.itemId))).filter(Boolean) as Series[];
    // Trakt: recommendations, watchlist and personal lists, only what the sources carry
    // never wait long for Trakt: the rails below would stay on the saved copy meanwhile
    const tr = await Promise.race([traktLists(profile.id).catch(() => null), new Promise<null>((r) => setTimeout(() => r(null), 4000))]);
    const mixed = async (movies: TmdbListItem[], shows: TmdbListItem[]) => {
      const [m, sr] = await Promise.all([matchMovies(profile.id, movies), matchSeries(profile.id, shows)]);
      const out: MixItem[] = [];
      for (let i = 0; i < Math.max(m.length, sr.length); i++) {
        if (m[i]) out.push({ kind: 'movie', item: m[i] });
        if (sr[i]) out.push({ kind: 'series', item: sr[i] });
      }
      return out;
    };
    const trakt = tr
      ? {
          forYou: await mixed(tr.forYouMovies, tr.forYouShows),
          watchlist: await mixed(tr.watchlistMovies, tr.watchlistShows),
          lists: await Promise.all(tr.lists.map(async (l) => ({ name: l.name, items: await mixed(l.movies, l.shows) }))),
        }
      : null;
    return {
      trakt,
      ...catalog, cont, favMovies, favSeries,
    };
  }, [profile.id, prefsKey, hideAdult], { key: homeKey(profile.id, prefsKey, hideAdult) });

  // snapshot for the next cold start: Home renders at once, then refreshes
  useEffect(() => {
    if (data) saveHomeSnapshot(profile.id, homeKey(profile.id, prefsKey, hideAdult), data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // enrich what's on screen first
  useEffect(() => {
    if (!data) return;
    prioritizeEnrichment('movie', [...data.top, ...data.fresh.slice(0, 16), ...data.nowPlaying.slice(0, 10)]);
    prioritizeEnrichment('series', [...data.trendingTv.slice(0, 10), ...data.newSeries.slice(0, 16)]);
  }, [data]);

  const hero = useMemo<HeroItem[]>(() => {
    if (!data) return [];
    const prefs = langPrefs(profile);
    const movies = featured([...data.top, ...data.nowPlaying, ...data.popularMovies, ...data.fresh, ...data.mustSee], prefs, hideAdult);
    if (movies.length) return movies.map(item => ({ kind: 'movie', item }));
    return featured([...data.trendingTv, ...data.newSeries], prefs, hideAdult).map(item => ({ kind: 'series', item }));
  }, [data, profile, hideAdult]);

  const shelves = useMemo(() => data && home_html(JSON.stringify({
    ...data, genres: data.genres.map(([genre, rows]) => [genre, rows.slice(0, 30)]),
  }, SHELF_FIELDS), profile.lang), [data, profile.lang]);
  if (!data || !shelves) return <div className="empty"><div className="spinner big" style={{ margin: '80px auto' }} /></div>;

  const select = (cmd: string, hold = false) => {
    const [action, id] = readCommand(cmd);
    if (action === 'movie') return hold ? void playMovie(id) : openMovie(id);
    if (action === 'series') return openSeries(id);
    if (action === 'remove' || action === 'resume') {
      const key = action === 'remove' ? readCommand(id)[1] : id;
      // the rail may come from the saved copy of Home: the position is read again
      void getProgress(profile.id, key).then((fresh) => {
        const w = fresh || data.cont.find(w => w.key === key);
        if (w) action === 'remove' ? void hideFromContinue(w).then(() => useApp.getState().bumpCatalog()) : void resume(w);
      });
    }
    if (action === 'tile') {
      if (id === 'live') return setTab('tv');
      if (id === 'series' || id === 'cinema' || id === 'kids' || id === 'docs') push({ name: 'grid',
        kind: id === 'series' ? 'series' : 'movie', title: t(`universe.${id}`), filter: id === 'kids' || id === 'docs' ? { universe: id } : {} });
    }
    if (action === 'genre') push({ name: 'grid', kind: 'movie', title: id, filter: { genre: id } });
    if (action === 'all' && (id === 'fresh' || id === 'newSeries' || id === 'mustSee' || id === 'kids')) push({
      name: 'grid', kind: id === 'newSeries' ? 'series' : 'movie', title: t(`home.${id}`),
      filter: id === 'kids' ? { universe: 'kids' } : { sort: id === 'mustSee' ? 'rating' : 'added' },
    });
  };
  return <div>
    {hero.length ? <Hero items={hero} lang={profile.lang} /> : <div className="hero-spacer" />}
    <RustView className="home-shelves" html={shelves} onCommand={select} onHold={cmd => select(cmd, true)} />
  </div>;
}

/**
 * Featured titles: one selectable banner (OK / tap opens the page), Left / Right or swipe for the
 * next one, no auto-advance. The image shows first, then the title's trailer plays behind.
 */
function Hero({ items, lang }: { items: HeroItem[]; lang: string }) {
  const { index: i, handlers, command } = useCarousel(items.length, { auto: false });
  const h = items[i];
  const active = useContext(ScreenActive);
  const trailers = useTrailers(h.kind, h.item);
  const html = useMemo(() => hero_html(JSON.stringify(h.item, ['title','backdrop','poster','logo','year','rating','genres']), i, items.length, lang), [h.item, i, items.length, lang]);
  return <section className="hero" {...handlers}>
    <RustView className="hero-inner" html={html} onCommand={cmd => {
      if (command(cmd)) return;
      if (cmd === 'info') return h.kind === 'series' ? openSeries(h.item.id) : openMovie(h.item.id);
    }} />
    <div className="hero-trailer"><TrailerBg urls={trailers} delay={2500} active={active} /></div>
  </section>;
}
