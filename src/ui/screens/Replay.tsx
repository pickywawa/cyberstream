import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/state/store';
import { t, fmtDate, getLang } from '@/core/i18n';
import { db, getMeta, setMeta } from '@/core/db';
import { continueWatching, getProgress } from '@/core/repo';
import type { Channel } from '@/core/types';
import { OFFICIAL_LIVE, officialFor, replayCatalog, replayInfo, replayShow, type OfficialLive, type ReplayCatalog, type ReplayItem, type ReplayProvider, type ReplayShow } from '@/core/replay';
import { useAsync } from '../hooks';
import { profileCountry } from '@/core/prefs';
import { Rail } from '../components/Rail';
import { LogoTile } from '../components/Cards';
import { RustView, readCommand } from '../components/RustView';
import { replay_shelves, replay_filters, replay_banner, replay_page } from '@/rust/generated/cyberstream';
import { openReplay, playChannel, playOfficial, playReplay, resume } from '../actions';

const MEM = new Map<string, ReplayCatalog>();
const LIVE_SNAP = new Map<string, Map<string, Channel>>();
type Filter = 'all' | ReplayProvider | 'kids';

export function Replay() {
  const profile = useApp((s) => s.profile)!;
  const lang = profile.lang;
  const country = profileCountry(profile);
  const memKey = `${lang}:${country}`;
  const [cat, setCat] = useState<ReplayCatalog | null | undefined>(() => MEM.get(memKey));
  const [filter, setFilter] = useState<Filter>('all');
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let off = false;
    // the saved copy shows at once, the network refreshes it when it is old
    if (!MEM.has(memKey)) void replayCatalog(lang, { cachedOnly: true, country }).then((c) => !off && c && setCat((x) => x ?? c));
    replayCatalog(lang, { force: reload > 0, country }).then(
      (c) => {
        if (off || !c) return;
        MEM.set(memKey, c);
        setCat(c);
      },
      () => !off && setCat((x) => x ?? null),
    );
    return () => {
      off = true;
    };
  }, [lang, country, memKey, reload]);

  const cont = useAsync(async () => (await continueWatching(profile.id)).filter((w) => w.kind === 'replay'), [profile.id], { key: `replay:cont:${profile.id}` });
  const shelves = useMemo(() => replay_shelves(JSON.stringify(cat || null, [
    'rails','kids','youtube','failed','id','title','provider','items','kind','subtitle','channel','image','durationSec','published','expires'
  ]), JSON.stringify(cont || [], ['key','title','subtitle','image','positionSec','durationSec']), filter, lang, Date.now(), cat === undefined ? 'loading' : cat === null ? 'error' : 'ready'), [cat,cont,filter,lang]);
  const lookup = useMemo(() => {
    const map = new Map<string,ReplayItem>();
    if (cat) for (const rail of [...cat.rails, ...(cat.kids || []), ...(cat.youtube || [])]) for (const item of rail.items) map.set(item.id,item);
    return map;
  }, [cat]);
  const hero = useMemo(
    () => (filter === 'kids' ? cat?.kidsHero || [] : filter === 'youtube' ? [] : (cat?.hero || []).filter((h) => filter === 'all' || h.provider === filter)),
    [cat, filter],
  );

  return (
    <div className="tab-replay">
      {hero.length > 0 ? (
        <ReplayHero items={hero} />
      ) : cat === undefined && filter !== 'youtube' ? (
        // same height as the banner while the catalogue loads: nothing jumps when it arrives
        <section className="hero hero-skeleton" aria-hidden />
      ) : (
        <div className="hero-spacer" />
      )}
      <RustView className="chips" row tabs html={replay_filters(filter, lang)} onCommand={f => setFilter(f as Filter)} />
      {(filter === 'all' || filter === 'francetv') && <LiveRail />}
      <RustView className="replay-shelves" html={shelves} onCommand={cmd => {
        const [action, id] = readCommand(cmd);
        if (action === 'retry') setReload(n => n+1);
        if (action === 'item') { const item = lookup.get(id); if (item) openReplay(item); }
        if (action === 'resume') { const w = cont?.find(w => w.key === id); if (w) void resume(w); }
      }} />
    </div>
  );
}

/** official free live streams; the user's own channel (with its guide) when a source carries it */
function LiveRail() {
  const profile = useApp((s) => s.profile)!;
  // the user's own versions of these channels (logos, guide); saved so their logos show at once
  const snapKey = `snapshot:replaylive:${profile.id}`;
  const [saved, setSaved] = useState<Map<string, Channel> | undefined>(() => LIVE_SNAP.get(snapKey));
  useEffect(() => {
    if (LIVE_SNAP.has(snapKey)) return;
    void getMeta<[string, Channel][]>(snapKey).then((rows) => {
      if (!rows) return;
      const m = new Map(rows);
      LIVE_SNAP.set(snapKey, m);
      setSaved((x) => x || m);
    });
  }, [snapKey]);
  const fresh = useAsync(async () => {
    const keys = OFFICIAL_LIVE.flatMap((o) => o.keys);
    const rows = (await db.channels.where('groupKey').anyOf(keys).toArray()).filter((c) => c.profileId === profile.id);
    const out = new Map<string, Channel>();
    for (const c of rows) {
      const o = officialFor(c);
      if (o && !out.has(o.key)) out.set(o.key, c);
    }
    LIVE_SNAP.set(snapKey, out);
    void setMeta(snapKey, [...out.entries()]).catch(() => {});
    return out;
  }, [profile.id], { key: `replay:live:${profile.id}` });
  const matches = fresh || saved;
  const play = (o: OfficialLive) => {
    const ch = matches?.get(o.key);
    void (ch ? playChannel(ch) : playOfficial(o));
  };
  return (
    <Rail title={t('replay.live')}>
      {OFFICIAL_LIVE.map((o) => {
        const ch = matches?.get(o.key);
        return <LogoTile key={o.key} name={o.name} logo={ch ? [ch.logoAlt, ch.logo] : undefined} onClick={() => play(o)} />;
      })}
    </Rail>
  );
}

function ReplayHero({ items }: { items: ReplayItem[] }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || items.length < 2) return;
    const tm = setInterval(() => setI((x) => (x + 1) % items.length), 8000);
    return () => clearInterval(tm);
  }, [items.length, paused]);
  const it = items[Math.min(i, items.length - 1)];
  const html = useMemo(() => replay_banner(JSON.stringify(it), getLang(), i, items.length), [it, i, items.length]);
  return <section className="hero" onFocus={() => setPaused(true)} onBlur={e => setPaused(e.currentTarget.contains(e.relatedTarget))}>
    <RustView className="hero-inner" html={html} onCommand={cmd => {
      if (cmd === 'play' && it.kind === 'video') void playReplay(it);
      else openReplay(it);
    }} />
  </section>;
}

/** a replay video (play / resume) or a show (its seasons and episodes) */
export function ReplayPage({ id, item }: { id: string; item?: ReplayItem }) {
  const profile = useApp((s) => s.profile)!;
  const lang = profile.lang;
  const isShow = item ? item.kind === 'show' : /^ftvp:|^arte:RC-/.test(id);
  const [season, setSeason] = useState(0);
  const [failed, setFailed] = useState(false);
  const [show, setShow] = useState<ReplayShow | null>(null);
  const [info, setInfo] = useState<ReplayItem | undefined>(item);
  const progress = useAsync(() => (isShow ? Promise.resolve(undefined) : getProgress(profile.id, `replay:${id}`)), [id, profile.id]);

  useEffect(() => {
    let off = false;
    setFailed(false);
    if (isShow) replayShow(id, lang).then((s) => !off && (setShow(s), setInfo((x) => ({ ...s.item, ...x, desc: x?.desc || s.item.desc }))), () => !off && setFailed(true));
    else if (!item?.desc) replayInfo(id, lang).then((x) => !off && setInfo((cur) => ({ ...x, ...cur, desc: cur?.desc || x.desc })), () => !off && !item && setFailed(true));
    return () => {
      off = true;
    };
  }, [id, lang, isShow, item]);

  const html = useMemo(() => replay_page(JSON.stringify({
    item:info, seasons:show?.seasons || [], isShow, hasShow:!!show, failed, season, progress,
    expires:info?.expires ? fmtDate(info.expires, {day:'numeric', month:'long'}) : '',
  }), lang, Date.now()), [info,show,isShow,failed,season,progress,lang]);
  return <div style={{paddingBottom:40}}><RustView className="replay-detail" html={html} onCommand={cmd => {
    const [action, value] = readCommand(cmd);
    if (action === 'back') useApp.getState().pop();
    if (action === 'season') setSeason(Number(value));
    if (action === 'play' && info) void playReplay(info,Number(value));
    if (action === 'episode' && show) {
      for (const s of show.seasons) {
        const ep = s.items.find(x => x.id === value);
        if (ep) { void playReplay(ep); break; }
      }
    }
  }} /></div>;
}
