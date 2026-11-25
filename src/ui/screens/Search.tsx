import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp, type SearchPick } from '@/state/store';
import { t, fmtTime, langInfo } from '@/core/i18n';
import { db, getMeta } from '@/core/db';
import { searchWorker } from '@/core/workers';
import type { SearchHit } from '@/core/search';
import type { Channel, Movie, Program, Series } from '@/core/types';
import { isAndroidApp } from '@/core/platform';
import { CyberNative } from '@/core/native';
import { sortByLang } from '@/core/util/lang';
import { langPrefs } from '@/core/prefs';
import { dedupLang } from '@/core/repo';
import { search_results_html } from '@/rust/generated/cyberstream';
import { RustView, readCommand } from '../components/RustView';
import { IcMic, IcSearch, IcClose } from '../icons';
import { takePendingSearch } from '../voice/run';
import { openMovie, openSeries, playChannel, prioritizeEnrichment } from '../actions';
import { ProgramSheet } from './Guide';
import { ChannelMenu } from './LiveTv';
import { TitleMenu } from '../components/TitleMenu';

interface Results {
  channels: Channel[];
  movies: Movie[];
  series: Series[];
  programs: { p: Program; ch: Channel }[];
}

/** results of recent queries (typing back / reopening the tab is instant) */
const RESULTS = new Map<string, Results>();
function rememberResults(key: string, r: Results) {
  RESULTS.delete(key);
  RESULTS.set(key, r);
  if (RESULTS.size > 30) RESULTS.delete(RESULTS.keys().next().value!);
}

type SpeechRec = { lang: string; interimResults: boolean; start(): void; stop(): void; onresult: (e: any) => void; onend: () => void; onerror: () => void };

export function Search() {
  const profile = useApp((s) => s.profile)!;
  const settings = useApp((s) => s.settings);
  const update = useApp((s) => s.updateSettings);
  const toast = useApp((s) => s.toast);
  const [q, setQ] = useState(() => takePendingSearch() || '');
  // "recherche Dune" said while the screen is already open
  useEffect(() => {
    const h = () => {
      const v = takePendingSearch();
      if (v) setQ(v);
    };
    window.addEventListener('cyber:voice-search', h);
    return () => window.removeEventListener('cyber:voice-search', h);
  }, []);
  const [res, setRes] = useState<Results | null>(null);
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [prog, setProg] = useState<{ p: Program; ch: Channel } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const epgVersion = useApp((s) => s.epgVersion);
  useEffect(() => {
    const query = q.trim();
    if (query.length < 2) {
      setRes(null);
      return;
    }
    // same query seen earlier in the session: instant, refreshed below
    const memo = RESULTS.get(`${profile.id}|${settings.hideAdult}|${query}`);
    if (memo) setRes(memo);
    setBusy(true);
    let alive = true;
    const tm = setTimeout(async () => {
      const version = (await getMeta<number>(`catalog:version:${profile.id}`)) || 0;
      const hits: SearchHit[] = await searchWorker().search(profile.id, version, query);
      if (!alive) return;
      const ids = (k: SearchHit['kind']) => hits.filter((h) => h.kind === k).map((h) => h.id);
      const [channels, movies, series] = await Promise.all([db.channels.bulkGet(ids('live')), db.movies.bulkGet(ids('movie')), db.series.bulkGet(ids('series'))]);
      if (!alive) return;
      const hide = (u: string) => settings.hideAdult && u === 'adult';
      const prefs = langPrefs(profile);
      // titles first: shown as soon as they're known
      const base: Results = {
        channels: sortByLang((channels.filter(Boolean) as Channel[]).filter((c) => !hide(c.universe)), prefs),
        movies: dedupLang((movies.filter(Boolean) as Movie[]).filter((c) => !hide(c.universe)), prefs),
        series: dedupLang((series.filter(Boolean) as Series[]).filter((c) => !hide(c.universe)), prefs),
        programs: memo?.programs || [],
      };
      setRes(base);
      setBusy(false);
      rememberResults(`${profile.id}|${settings.hideAdult}|${query}`, base);
      // then TV programmes (separate index in the search worker)
      const progIds = await searchWorker().searchPrograms(query, epgVersion);
      if (!alive) return;
      const progRows = (await db.programs.bulkGet(progIds)).filter(Boolean) as Program[];
      const epgIds = [...new Set(progRows.map((p) => p.epgId))];
      const chs = epgIds.length ? await db.channels.where('epgId').anyOf(epgIds).filter((c) => c.profileId === profile.id).toArray() : [];
      const chByEpg = new Map(chs.map((c) => [c.epgId!, c]));
      const full: Results = { ...base, programs: progRows.filter((p) => chByEpg.has(p.epgId)).map((p) => ({ p, ch: chByEpg.get(p.epgId)! })) };
      if (!alive) return;
      rememberResults(`${profile.id}|${settings.hideAdult}|${query}`, full);
      setRes(full);
    }, memo ? 60 : 120);
    return () => {
      alive = false;
      clearTimeout(tm);
    };
  }, [q, profile.id, settings.hideAdult, epgVersion]);

  useEffect(() => {
    if (res) {
      prioritizeEnrichment('movie', res.movies.slice(0, 24));
      prioritizeEnrichment('series', res.series.slice(0, 24));
    }
  }, [res]);

  const remember = () => {
    const v = q.trim();
    if (v.length < 2) return;
    update({ recentSearches: [v, ...settings.recentSearches.filter((x) => x !== v)].slice(0, 8) });
  };

  const voice = async () => {
    if (isAndroidApp) {
      try {
        setListening(true);
        const r = await CyberNative.speech({ lang: langInfo(profile.lang).speech, prompt: t('search.listening') });
        if (r.text) setQ(r.text);
      } catch {
        toast(t('search.voiceUnavailable'));
      } finally {
        setListening(false);
      }
      return;
    }
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) return toast(t('search.voiceUnavailable'));
    const rec: SpeechRec = new Ctor();
    rec.lang = langInfo(profile.lang).speech;
    rec.interimResults = true;
    rec.onresult = (e: any) => setQ(Array.from(e.results).map((r: any) => r[0].transcript).join(''));
    rec.onend = () => setListening(false);
    rec.onerror = () => (setListening(false), toast(t('search.voiceUnavailable')));
    setListening(true);
    rec.start();
  };

  const raw = useMemo(() => JSON.stringify(res && {
    channels: res.channels.slice(0, 30), movies: res.movies.slice(0, 60), series: res.series.slice(0, 18),
    programs: res.programs.map(({ p, ch }) => ({ id: String(p.id ?? p.epgId + ':' + p.start), title: p.title, image: p.icon, time: fmtTime(p.start), channel: ch })),
  }, ['channels','movies','series','programs','id','name','title','time','image','channel','logo','logoAlt','poster','year','imdbRating']), [res, profile.lang]);
  // what was opened from earlier searches (this profile; programmes until a day after they ended)
  const picks = useMemo(() => {
    const old = Date.now() - 24 * 3600_000;
    return settings.recentPicks.filter((x) => x.profileId === profile.id && !(x.kind === 'program' && (x.stop || 0) < old));
  }, [settings.recentPicks, profile.id]);
  const picksRaw = useMemo(() => JSON.stringify(picks.map(({ kind, id, title, image, logo, sub }) => ({ kind, id, title, image, logo, sub }))), [picks]);
  const html = useMemo(() => search_results_html(raw, JSON.stringify(settings.recentSearches), picksRaw, q, profile.lang), [raw, settings.recentSearches, picksRaw, q, profile.lang]);
  const pick = (p: Omit<SearchPick, 'profileId'>) => {
    const all = useApp.getState().settings.recentPicks;
    const entry: SearchPick = { ...p, profileId: profile.id };
    const same = (x: SearchPick) => x.profileId === profile.id && x.kind === p.kind && x.id === p.id;
    const mine = all.filter((x) => x.profileId === profile.id && !same(x)).slice(0, 23);
    update({ recentPicks: [entry, ...mine, ...all.filter((x) => x.profileId !== profile.id)] });
    remember();
  };
  // long press: the same menus as on Home (titles) and in the TV tab (channels)
  const [titleMenu, setTitleMenu] = useState<{ kind: 'movie' | 'series'; id: string } | null>(null);
  const [chMenu, setChMenu] = useState<{ ch: Channel; fav: boolean } | null>(null);
  const openChannelMenu = (ch: Channel) =>
    void db.favorites.get([profile.id, `live:${ch.groupKey}`]).then((f) => setChMenu({ ch, fav: !!f }));
  const openPick = async (kind: string, id: string, hold: boolean) => {
    const it = picks.find((x) => x.kind === kind && x.id === id);
    if (!it) return;
    pick(it);
    if (kind === 'movie' || kind === 'series') {
      if (hold) return setTitleMenu({ kind, id });
      return kind === 'movie' ? openMovie(id) : openSeries(id);
    }
    const ch = await db.channels.get(kind === 'channel' ? id : it.chId!);
    if (!ch) return toast(t('search.pickGone'));
    if (kind === 'channel') return hold ? openChannelMenu(ch) : void playChannel(ch);
    const p = it.epgId && it.start != null ? await db.programs.where('[epgId+start]').equals([it.epgId, it.start]).first() : undefined;
    if (p) setProg({ p, ch });
    else void playChannel(ch);
  };
  const select = (cmd: string, hold = false) => {
    const [action, id] = readCommand(cmd);
    if (action === 'query') setQ(id);
    if (action === 'pick') {
      const i = id.indexOf(':');
      void openPick(id.slice(0, i), id.slice(i + 1), hold);
      return;
    }
    if (action === 'movie') {
      const m = res?.movies.find((x) => x.id === id);
      if (m) pick({ kind: 'movie', id, title: m.title, image: m.poster, sub: m.year ? String(m.year) : undefined });
      hold ? setTitleMenu({ kind: 'movie', id }) : openMovie(id);
    }
    if (action === 'series') {
      const m = res?.series.find((x) => x.id === id);
      if (m) pick({ kind: 'series', id, title: m.title, image: m.poster, sub: t('search.series') });
      hold ? setTitleMenu({ kind: 'series', id }) : openSeries(id);
    }
    if (action === 'channel') {
      const ch = res?.channels.find(x => x.id === id);
      if (ch) {
        pick({ kind: 'channel', id, title: ch.name, logo: [ch.logoAlt, ch.logo] });
        hold ? openChannelMenu(ch) : void playChannel(ch);
      }
    }
    if (action === 'program') {
      const hit = res?.programs.find(({p}) => String(p.id ?? p.epgId + ':' + p.start) === id) || null;
      if (hit) pick({ kind: 'program', id: `${hit.p.epgId}:${hit.p.start}`, title: hit.p.title, image: hit.p.icon, logo: [hit.ch.logoAlt, hit.ch.logo],
        sub: `${hit.ch.name} · ${fmtTime(hit.p.start)}`, chId: hit.ch.id, epgId: hit.p.epgId, start: hit.p.start, stop: hit.p.stop });
      setProg(hit);
    }
  };
  return (
    <div className="tab-search">
      <div className="search-box" data-row>
        <IcSearch />
        <input
          ref={inputRef}
          className="search-input"
          data-f
          data-autofocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onBlur={remember}
          onKeyDown={(e) => e.key === 'Enter' && (remember(), (e.target as HTMLInputElement).blur())}
          placeholder={t('search.placeholder')}
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
        />
        {busy && <span className="spinner" />}
        {q && (
          <button className="icon-btn" data-f onClick={() => (setQ(''), inputRef.current?.focus())} aria-label={t('common.close')}>
            <IcClose />
          </button>
        )}
        <button className={`icon-btn mic ${listening ? 'listening' : ''}`} data-f onClick={() => void voice()} aria-label={t('search.voice')}>
          <IcMic />
        </button>
      </div>
      {listening && <div className="container muted" style={{ marginTop: 6 }}>{t('search.listening')}</div>}

      <RustView className="search-results" html={html} onCommand={select} onHold={cmd => select(cmd, true)} />
      {prog && <ProgramSheet ch={prog.ch} p={prog.p} onClose={() => setProg(null)} />}
      {titleMenu && <TitleMenu kind={titleMenu.kind} id={titleMenu.id} onClose={() => setTitleMenu(null)} />}
      {chMenu && <ChannelMenu ch={chMenu.ch} isFav={chMenu.fav} onClose={() => setChMenu(null)} />}
    </div>
  );
}
