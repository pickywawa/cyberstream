import { dataWorker } from '@/core/workers';
import { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useApp } from '@/state/store';
import { t } from '@/core/i18n';
import { db, setMeta } from '@/core/db';
import {
  continueWatching, favoritesOf, getProgress, hideFromContinue, matchMovies, matchSeries,
} from '@/core/repo';
import type { Movie, Series } from '@/core/types';
import { ScreenActive, useAsync, useCarousel } from '../hooks';
import { TrailerBg, useTrailers } from '../components/Trailer';
import { TitleMenu } from '../components/TitleMenu';
import { RustView, readCommand } from '../components/RustView';
import { ShelvesView } from '../components/Shelves';
import { hero_html, home_categories } from '@/rust/generated/cyberstream';
import { Grid } from './Grid';
import type { GridFilter } from '@/state/store';
import { openMovie, openSeries, prioritizeEnrichment, resume } from '../actions';
import { langPrefs } from '@/core/prefs';
import { traktLists } from '@/core/trakt';
import { isLowEnd } from '@/core/perfTier';
import type { TmdbListItem } from '@/core/types';
import type { HomeItem } from '@/core/homeView';

type HeroItem = HomeItem;

/** what each category of Home's bar shows (genre bits: rust/genres.rs — 11 documentary, 14 music, 16 shows on stage) */
const HOME_CATEGORIES = {
  cinema: { kind: 'movie', label: 'universe.cinema', filter: {} },
  series: { kind: 'series', label: 'universe.series', filter: {} },
  kids: { kind: 'movie', label: 'universe.kids', filter: { universe: 'kids' } },
  docs: { kind: 'movie', label: 'home.docs', filter: { universe: 'docs', mask: 1 << 11 } },
  ent: { kind: 'series', label: 'universe.ent', filter: { universe: 'ent' } },
  music: { kind: 'movie', label: 'universe.music', filter: { universe: 'music', mask: 1 << 14 } },
  shows: { kind: 'movie', label: 'home.shows', filter: { mask: 1 << 16 } },
} as Record<string, { kind: 'movie' | 'series'; label: Parameters<typeof t>[0]; filter: GridFilter } | undefined>;
type HomeCategory = 'all' | keyof typeof HOME_CATEGORIES;
type MixItem = HeroItem;

// v2: Home built by the data worker (a saved copy of the older shape is never shown)
export const homeKey = (profileId: string, prefsKey: string, hideAdult: boolean) => `home2:${profileId}:${prefsKey}:${hideAdult}`;
export const homePrefsKey = (p: { lang: string; audioLangs?: string[]; subLangs?: string[] }) => `${p.lang}|${p.audioLangs?.join()}|${p.subLangs?.join()}`;

let lastSnapshot = 0;
/** persisted (throttled) so the next launch shows Home immediately — see loadHomeSnapshot() */
function saveHomeSnapshot(profileId: string, key: string, data: unknown) {
  if (Date.now() - lastSnapshot < 20000) return;
  lastSnapshot = Date.now();
  void setMeta(`snapshot:home:${profileId}`, { key, data, at: Date.now() }).catch(() => {});
}

export function Home() {
  const profile = useApp((s) => s.profile)!;
  const settings = useApp((s) => s.settings);
  const push = useApp((s) => s.push);
  const setTab = useApp((s) => s.setTab);
  const hideAdult = settings.hideAdult || (profile.parental.enabled && !useApp.getState().unlockedAdult);

  const prefsKey = homePrefsKey(profile);
  const [menu, setMenu] = useState<{ kind: 'movie' | 'series'; id: string } | null>(null);
  // the category bar: "Tout" shows Home's shelves, the others their grid right under the bar
  const [cat, setCat] = useState<HomeCategory>('all');
  // the bar reached or a category chosen: the page scrolls so the bar sits right under the top bar,
  // its list in full view below (not on the app's start: the banner stays in view then)
  const barRef = useRef<HTMLDivElement>(null);
  const toBar = useCallback(() => requestAnimationFrame(() => {
    const bar = barRef.current;
    const page = bar?.closest<HTMLElement>('.page');
    if (!bar || !page) return;
    const top = document.querySelector('.topnav')?.getBoundingClientRect().bottom ?? page.getBoundingClientRect().top;
    const y = page.scrollTop + bar.getBoundingClientRect().top - top - 4;
    if (Math.abs(y - page.scrollTop) < 2) return;
    page.scrollTo({ top: y, behavior: document.documentElement.classList.contains('perf') ? 'auto' : 'smooth' });
  }), []);
  const chosen = useRef(false);
  useEffect(() => { if (chosen.current) toBar(); }, [cat, toBar]);
  // low-end device: once Home has content, background updates (enrichment, sync) no longer rebuild it
  // while it is on screen, only when coming back to it; the user's own changes refresh it at once
  const [nonce, refresh] = useReducer((n: number) => n + 1, 0);
  const filled = useRef(false);
  const data = useAsync(async () => {
    const prefs = langPrefs(profile);
    const [cont,favs] = await Promise.all([continueWatching(profile.id),favoritesOf(profile.id)]);
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
    // the catalogue is read and the shelves built in the data worker: only their HTML comes back
    return dataWorker().homeView(profile.id, profile.lang, hideAdult, prefs, { trakt, cont, favMovies, favSeries });
  }, [profile.id, prefsKey, hideAdult, nonce], { key: homeKey(profile.id, prefsKey, hideAdult), lazy: isLowEnd() && filled.current });
  filled.current = !!data?.hasVod;

  // snapshot for the next cold start: Home renders at once, then refreshes
  useEffect(() => {
    if (data) saveHomeSnapshot(profile.id, homeKey(profile.id, prefsKey, hideAdult), data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // enrich what's on screen first
  useEffect(() => {
    if (!data) return;
    prioritizeEnrichment('movie', data.enrich.movie);
    prioritizeEnrichment('series', data.enrich.series);
  }, [data]);

  if (!data) return <div className="empty"><div className="spinner big" style={{ margin: '80px auto' }} /></div>;
  const hero = data.hero;

  const select = (cmd: string, hold = false) => {
    const [action, id] = readCommand(cmd);
    // long press: watch / favourite / page
    if ((action === 'movie' || action === 'series') && hold) return setMenu({ kind: action, id });
    if (action === 'movie') return openMovie(id);
    if (action === 'series') return openSeries(id);
    if (action === 'remove' || action === 'resume') {
      const key = action === 'remove' ? readCommand(id)[1] : id;
      // the rail may come from the saved copy of Home: the position is read again
      void getProgress(profile.id, key).then((fresh) => {
        const w = fresh || data.cont.find(w => w.key === key);
        if (w) action === 'remove' ? void hideFromContinue(w).then(() => { useApp.getState().bumpCatalog(); refresh(); }) : void resume(w);
      });
    }
    // no film / series at all: the TV tab
    if (action === 'tile' && id === 'live') return setTab('tv');
    if (action === 'genre') push({ name: 'grid', kind: 'movie', title: id, filter: { genre: id } });
    if (action === 'all' && (id === 'fresh' || id === 'newSeries' || id === 'mustSee' || id === 'kids')) push({
      name: 'grid', kind: id === 'newSeries' ? 'series' : 'movie', title: t(`home.${id}`),
      filter: id === 'kids' ? { universe: 'kids' } : { sort: id === 'mustSee' ? 'rating' : 'added' },
    });
  };
  const category = HOME_CATEGORIES[cat];
  return <div>
    {hero.length ? <Hero items={hero} lang={profile.lang} /> : <div className="hero-spacer" />}
    {/* a tab reached with the remote opens by itself after a short pause (data-tabs, see spatial.ts) */}
    <div ref={barRef} onFocus={toBar}>
      <RustView className="chips home-cats" row tabs html={home_categories(cat, profile.lang)}
        onCommand={cmd => {
          const [action, id] = readCommand(cmd);
          if (action !== 'cat' || !(id === 'all' || id in HOME_CATEGORIES)) return;
          chosen.current = true;
          setCat(id as HomeCategory);
          toBar();
        }} />
    </div>
    {/* at least a screen high: the bar can always reach the top, even over a short list */}
    <div className="home-cat-content">
      {category
        ? <Grid key={cat} embedded kind={category.kind} title={t(category.label)} filter={category.filter} />
        : <ShelvesView className="home-shelves" blocks={data.blocks} onCommand={select} onHold={cmd => select(cmd, true)} />}
    </div>
    {menu && <TitleMenu kind={menu.kind} id={menu.id} onClose={() => setMenu(null)} />}
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
  // low-end device: the trailer plays only while the banner has the focus (stops as soon as the remote goes down)
  const [focused, setFocused] = useState(false);
  const low = isLowEnd();
  const html = useMemo(() => hero_html(JSON.stringify(h.item, ['title','backdrop','poster','logo','year','rating','genres']), i, items.length, lang), [h.item, i, items.length, lang]);
  return <section className="hero" {...handlers}
    onFocus={() => { handlers.onFocus(); setFocused(true); }}
    onBlur={e => { handlers.onBlur(e); setFocused(e.currentTarget.contains(e.relatedTarget)); }}>
    <RustView className="hero-inner" html={html} onCommand={cmd => {
      if (command(cmd)) return;
      if (cmd === 'info') return h.kind === 'series' ? openSeries(h.item.id) : openMovie(h.item.id);
    }} />
    <div className="hero-trailer"><TrailerBg urls={trailers} delay={700} active={active && (!low || focused)} /></div>
  </section>;
}
