import { cast_html, detail_header, series_panel } from '@/rust/generated/cyberstream';
import { RustView, readCommand } from '../components/RustView';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '@/state/store';
import { t, getLang } from '@/core/i18n';
import { db } from '@/core/db';
import { availableByTmdb, episodesOf, toggleFavorite } from '@/core/repo';
import type { Movie, Person, Series, WatchState } from '@/core/types';
import { resizeTmdb } from '@/core/enrich/tmdb';
import { dataWorker } from '@/core/workers';
import { useAsync } from '../hooks';
import { Img } from '../components/Img';
import { BackButton } from '../components/BackButton';
import { Rail } from '../components/Rail';
import { PosterCard } from '../components/Cards';
import { IcVolume, IcVolumeOff } from '../icons';
import { flagOf } from '@/core/util/lang';
import { langPrefs } from '@/core/prefs';
import { openMovie, openSeries, playEpisode, playMovie, prioritizeEnrichment } from '../actions';
import { loadVodInfoIfNeeded, loadXtreamEpisodesIfNeeded } from '../episodes';
import { actorPhoto } from '@/core/enrich/people';

export function Detail({ kind, id }: { kind: 'movie' | 'series'; id: string }) {
  const item = useLiveQuery(() => (kind === 'movie' ? db.movies.get(id) : db.series.get(id)), [kind, id]);
  useEffect(() => {
    if (item) prioritizeEnrichment(kind, [item]);
  }, [item, kind]);
  // no TMDB key (or no TMDB match): the provider's own details
  useEffect(() => {
    if (kind === 'movie') void loadVodInfoIfNeeded(id);
  }, [kind, id]);
  // enriched before trailers in every language were looked for: look once more (at most daily)
  const needTrailer = !!item && !item.trailer && !!item.tmdbId && Date.now() - (item.trailerCheckedAt || 0) > 86400000;
  useEffect(() => {
    if (!needTrailer || !item?.tmdbId) return;
    const table = kind === 'movie' ? db.movies : db.series;
    void dataWorker().tmdbTrailer(kind === 'movie' ? 'movie' : 'tv', item.tmdbId).then(async (trailer) => {
      const keys = await (table as typeof db.movies).where('groupKey').equals(item.groupKey).primaryKeys();
      for (const k of new Set([item.id, ...keys])) await (table as typeof db.movies).update(k, trailer ? { trailer, trailerCheckedAt: Date.now() } : { trailerCheckedAt: Date.now() });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needTrailer, item?.tmdbId]);
  if (item === undefined) return <div className="spinner big" style={{ margin: '30vh auto' }} />;
  if (!item) return <div className="empty">{t('common.empty')}</div>;
  return kind === 'movie' ? <MovieDetail m={item as Movie} /> : <SeriesDetail s={item as Series} />;
}

function CastRail({ people, names }: { people?: Person[]; names?: string[] }) {
  const push = useApp(s => s.push);
  const lang = getLang();
  // no TMDB cast: the provider's names, with a Wikipedia photo when one is found
  const fromNames = useAsync(async () => {
    if (people?.length || !names?.length) return undefined;
    const list = names.slice(0, 12);
    const photos = await Promise.all(list.map(n => actorPhoto(n, lang)));
    return list.map((name, i) => ({ id: -(i + 1), name, photo: photos[i] }));
  }, [people?.length, names?.join('|'), lang]);
  const shown = people?.length ? people : fromNames || names?.slice(0, 12).map((name, i) => ({ id: -(i + 1), name }));
  const html = useMemo(() => shown?.length ? cast_html(JSON.stringify(shown), lang) : '', [shown, lang]);
  if (!html || !shown) return null;
  return <RustView className="cast-rail" html={html} onCommand={id => {
    const person = shown.find(p => p.id === Number(id));
    if (!person) return;
    // TMDB person page, or (name alone) the Wikipedia / Wikidata one
    push({ name:'person', id: person.id > 0 ? person.id : 0, title: person.name });
  }} />;
}

/** TMDB recommendations available in the catalogue; same-genre titles when there are too few */
function useRecommendations(kind: 'movie' | 'series', it: Movie | Series) {
  const profile = useApp((s) => s.profile)!;
  return useAsync(async () => {
    const prefs = langPrefs(profile);
    const recos = (await availableByTmdb(profile.id, kind, it.recos || [], prefs)).filter((x) => x.groupKey !== it.groupKey);
    if (recos.length >= 3) return { title: t('detail.recommended'), items: recos.slice(0, 24) };
    const g = it.genres?.[0];
    if (!g && !it.categoryId) return { title: t('detail.recommended'), items: recos };
    const more = await dataWorker().similarByGenre(profile.id,kind,it.groupKey,g,prefs,it.categoryId);
    const seen = new Set(recos.map((x) => x.groupKey));
    return { title: recos.length ? t('detail.recommended') : t('detail.similar'), items: [...recos, ...more.filter((x) => !seen.has(x.groupKey))].slice(0, 24) };
  }, [kind, it.id, it.recos?.join(), it.genres?.join()]);
}

/** other films of the saga that are in the catalogue, in release order */
function SagaRail({ m }: { m: Movie }) {
  const profile = useApp((s) => s.profile)!;
  const data = useAsync(async () => {
    if (!m.collection) return null;
    const col = await dataWorker().tmdbCollection(m.collection.id);
    if (!col) return null;
    const parts = [...col.parts].sort((a, b) => (a.year || 9999) - (b.year || 9999));
    const items = await availableByTmdb(profile.id, 'movie', parts.map((p) => p.tmdbId), langPrefs(profile));
    // position in the whole saga (some parts may be missing from the catalogue)
    const pos = new Map(parts.map((p, i) => [p.tmdbId, i + 1]));
    return { name: col.name, items, total: parts.length, pos };
  }, [m.collection?.id]);
  if (!data || data.items.length < 2) return null;
  return (
    <Rail title={`${t('detail.saga')} · ${data.name}`}>
      {data.items.map((x) => (
        <PosterCard
          imdb={x.imdbRating}
          key={x.id}
          title={x.title}
          sub={[x.year, x.groupKey === m.groupKey ? t('detail.thisOne') : `${data.pos?.get(x.tmdbId!) ?? '?'}/${data.total}`].filter(Boolean).join(' · ')}
          image={x.poster}
          onClick={() => (x.groupKey === m.groupKey ? undefined : openMovie(x.id))}
        />
      ))}
    </Rail>
  );
}

function youtubeKey(url?: string): string | undefined {
  return url?.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];
}

/**
 * Trailer replacing the backdrop shortly after the page opens (YouTube embed, no controls).
 * Sound on by default; muting is remembered for the next trailers. If the browser refuses to
 * autoplay with sound, it plays muted instead (without changing the saved choice).
 */
function TrailerBg({ url }: { url?: string }) {
  const settings = useApp((s) => s.settings);
  const update = useApp((s) => s.updateSettings);
  const playing = useApp((s) => !!s.player);
  const key = youtubeKey(url);
  const [mount, setMount] = useState(false);
  const [on, setOn] = useState(false);
  const [muted, setMuted] = useState(settings.trailerMuted);
  const ref = useRef<HTMLIFrameElement>(null);
  // like cybertv: "Animations réduites" (on by default on Android) no longer turns trailers off, only the setting does
  const enabled = !!key && settings.autoTrailer && !playing;
  const startMuted = useRef(settings.trailerMuted);
  useEffect(() => {
    if (!enabled) {
      setMount(false);
      setOn(false);
      return;
    }
    startMuted.current = useApp.getState().settings.trailerMuted;
    setMuted(startMuted.current);
    const tm = setTimeout(() => setMount(true), 900);
    return () => clearTimeout(tm);
  }, [enabled]);

  const cmd = (func: string) => ref.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');

  // YouTube IFrame API messages: reveal once the video really plays, fall back to muted if blocked
  useEffect(() => {
    if (!mount) return;
    let playingSeen = false;
    const onMsg = (e: MessageEvent) => {
      if (!/youtube(-nocookie)?\.com$/.test(new URL(e.origin).hostname) || e.source !== ref.current?.contentWindow) return;
      let d: any;
      try {
        d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      const state = d?.event === 'onStateChange' ? d.info : d?.info?.playerState;
      if (state === 1 && !playingSeen) {
        playingSeen = true;
        // a short beat hides YouTube's title overlay
        setTimeout(() => setOn(true), 350);
      }
    };
    window.addEventListener('message', onMsg);
    const fallback = setTimeout(() => {
      if (playingSeen) return;
      if (!startMuted.current) {
        cmd('mute');
        cmd('playVideo');
        setMuted(true);
      }
      // no API message at all (blocked postMessage): show it anyway, as before
      setTimeout(() => setOn(true), 1200);
    }, 3500);
    return () => {
      window.removeEventListener('message', onMsg);
      clearTimeout(fallback);
    };
  }, [mount]);

  if (!enabled || !mount) return null;
  const params = new URLSearchParams({
    autoplay: '1', mute: startMuted.current ? '1' : '0', controls: '0', loop: '1', playlist: key!, modestbranding: '1', playsinline: '1', rel: '0',
    iv_load_policy: '3', disablekb: '1', fs: '0', enablejsapi: '1', origin: location.origin,
  });
  return (
    <>
      <div className={`trailer ${on ? 'on' : ''}`}>
        <iframe
          ref={ref}
          src={`https://www.youtube-nocookie.com/embed/${key}?${params}`}
          title="trailer"
          tabIndex={-1}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => ref.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'cyber-trailer' }), '*')}
        />
      </div>
      {on && (
        <button
          className="icon-btn trailer-mute"
          data-f
          onClick={() => {
            const next = !muted;
            cmd(next ? 'mute' : 'unMute');
            setMuted(next);
            // remembered for the next trailers
            update({ trailerMuted: next });
          }}
          aria-label={muted ? t('detail.unmute') : t('detail.mute')}
        >
          {muted ? <IcVolumeOff /> : <IcVolume />}
        </button>
      )}
    </>
  );
}

/** audio / subtitle languages of all versions of a title */
function useGroupLangs(kind: 'movie' | 'series', it: Movie | Series) {
  return useAsync(async () => {
    const rows: (Movie | Series)[] = kind === 'movie'
      ? await db.movies.where('groupKey').equals(it.groupKey).toArray()
      : await db.series.where('groupKey').equals(it.groupKey).toArray();
    const audio = new Set<string>();
    const subs = new Set<string>();
    for (const r of rows.filter((x) => x.profileId === it.profileId)) {
      for (const l of r.langs || []) audio.add(l);
      for (const l of r.subs || []) subs.add(l);
    }
    return { audio: [...audio], subs: [...subs] };
  }, [kind, it.groupKey, it.langs?.join(), it.subs?.join()]);
}

function HeroBlock({ it, langs, fav, variants, series, resumeLabel, playable, progress, select }: {
  it: Movie | Series; langs?: {audio:string[];subs:string[]}; fav:boolean; variants?:number; series?:boolean;
  resumeLabel?:string | null; playable?:boolean; progress?: WatchState; select:(cmd:string)=>void;
}) {
  const profile = useApp(s => s.profile)!;
  const html = useMemo(() => {
    const prefs = langPrefs(profile);
    const pairs = (languages?:string[]) => (languages || []).map(l => [l, flagOf(l)]);
    return detail_header(JSON.stringify({item:{...it,votes:it.imdbVotes ? it.imdbVotes.toLocaleString()+' votes' : undefined},
      audio:pairs(langs?.audio), subs:pairs(langs?.subs), prefs:prefs.audio, subPrefs:prefs.subs, hasLangs:!!langs,
      fav, variants, series, resumeLabel, playable, progress},
      ['item','year','title','logo','durationSec','certAge','cert','imdbRating','rating','votes','genres','plot','director','cast','trailer',
       'audio','subs','prefs','subPrefs','hasLangs','fav','variants','series','resumeLabel','playable','progress','completed','durationSec','positionSec']),
       profile.lang);
  }, [it, langs, fav, variants, series, resumeLabel, playable, progress, profile]);
  return <section className="detail-hero"><div className="bg">
    <Img srcs={[resizeTmdb(it.backdrop, 'w1280'), it.poster]} eager label={it.title} /><TrailerBg url={it.trailer} />
  </div><RustView className="content" html={html} onCommand={select} /></section>;
}

function useFav(kind: 'movie' | 'series', it: Movie | Series) {
  const profile = useApp((s) => s.profile)!;
  const fav = useLiveQuery(() => db.favorites.get([profile.id, `${kind}:${it.groupKey}`]), [profile.id, it.groupKey]);
  const toggle = () => void toggleFavorite(profile.id, kind, it.groupKey, it.id).then(() => useApp.getState().bumpCatalog());
  return [!!fav, toggle] as const;
}

function MovieDetail({ m }: { m: Movie }) {
  const profile = useApp((s) => s.profile)!;
  const progress = useLiveQuery(() => db.watch.get([profile.id, `movie:${m.id}`]), [profile.id, m.id]);
  const [fav, toggleFav] = useFav('movie', m);
  const variants = useAsync(() => db.movies.where('groupKey').equals(m.groupKey).count(), [m.groupKey]);
  const recos = useRecommendations('movie', m);
  const canResume = progress && !progress.completed && progress.positionSec > 60;
  const langs = useGroupLangs('movie', m);

  return (
    <div style={{ paddingBottom: 40 }}>
      <BackButton />
      <HeroBlock it={m} langs={langs} fav={fav} variants={variants} progress={progress} select={cmd => {
        if (cmd === 'favorite') toggleFav();
        if (cmd === 'play' || cmd === 'restart') void playMovie(m.id, cmd === 'play' && canResume ? progress!.positionSec : 0);
      }} />
      <SagaRail m={m} />
      <CastRail people={m.people} names={m.cast} />
      {recos && recos.items.length > 2 && (
        <Rail title={recos.title}>
          {recos.items.map((x) => <PosterCard imdb={x.imdbRating} key={x.id} title={x.title} sub={x.year ? String(x.year) : undefined} image={x.poster} onClick={() => openMovie(x.id)} />)}
        </Rail>
      )}
    </div>
  );
}

function SeriesDetail({ s }: { s: Series }) {
  const profile = useApp((s) => s.profile)!;
  const [fav, toggleFav] = useFav('series', s);
  const langs = useGroupLangs('series', s);
  const [tab, setTab] = useState<'episodes' | 'similar'>('episodes');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    void loadXtreamEpisodesIfNeeded(s.id).finally(() => setLoading(false));
  }, [s.id]);
  const episodes = useLiveQuery(() => episodesOf(s.id), [s.id]);
  const watch = useLiveQuery(() => db.watch.where('profileId').equals(profile.id).filter(w => w.seriesId === s.id).toArray(), [profile.id, s.id]);
  const [season, setSeason] = useState<number | null>(null);
  const recos = useRecommendations('series', s);
  const panel = useMemo((): {html:string;season:number|null;count:number;id:string|null;at:number;label:string|null} =>
    JSON.parse(series_panel(JSON.stringify({title:s.title,backdrop:s.backdrop,episodes:episodes || [], watch:watch || [],
      similar:recos?.items || [], season,tab,loading},
      ['title','backdrop','episodes','watch','similar','season','tab','loading','id','episode','still','durationSec','plot',
       'itemId','updatedAt','positionSec','completed','poster','imdbRating']), profile.lang)), [s.title,s.backdrop,episodes,watch,recos,season,tab,loading,profile.lang]);
  useEffect(() => {
    if (s.tmdbId && panel.season !== null) void dataWorker().enrichSeason(s.id, panel.season);
  }, [s.id, s.tmdbId, panel.season]);
  const panelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = panelRef.current?.querySelector<HTMLElement>('.ep-list');
    const el = panel.id && box?.querySelector<HTMLElement>(`[data-ep="${CSS.escape(panel.id)}"]`);
    if (box && el) box.scrollLeft = Math.max(0, el.offsetLeft - box.offsetLeft - 16);
  }, [panel.id, panel.season, panel.count, tab]);
  return <div style={{paddingBottom:40}}>
    <BackButton />
    <HeroBlock it={s} langs={langs} fav={fav} series playable={!!panel.id} resumeLabel={panel.label} select={cmd => {
      if (cmd === 'favorite') toggleFav();
      if (cmd === 'play' && panel.id) void playEpisode(s.id, panel.id, panel.at);
    }} />
    <div ref={panelRef}><RustView className="series-panel" html={panel.html} onCommand={cmd => {
      const [action, value] = readCommand(cmd);
      if (action === 'episodes' || action === 'similar') setTab(action);
      if (action === 'season') setSeason(Number(value));
      if (action === 'series') openSeries(value);
      if (action === 'episode') {
        const w = watch?.find(w => w.itemId === value);
        void playEpisode(s.id,value,w && !w.completed ? w.positionSec : 0);
      }
    }} /></div>
    <CastRail people={s.people} names={s.cast} />
  </div>;
}
