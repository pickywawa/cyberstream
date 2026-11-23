import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/state/store';
import { fmtDate } from '@/core/i18n';
import { getProgress } from '@/core/repo';
import { replayCatalog, replayInfo, replayShow, type ReplayCatalog, type ReplayItem, type ReplayProvider, type ReplayShow } from '@/core/replay';
import { useAsync } from '../hooks';
import { profileCountry } from '@/core/prefs';
import { RustView, readCommand } from '../components/RustView';
import { replay_shelves, replay_filters, replay_page } from '@/rust/generated/cyberstream';
import { openReplay, playReplay } from '../actions';
import { Radios } from './Radios';

const MEM = new Map<string, ReplayCatalog>();
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

  const shelves = useMemo(() => replay_shelves(JSON.stringify(cat || null, [
    'rails','kids','youtube','failed','id','title','provider','items','kind','subtitle','channel','image','durationSec','published','expires'
  // "Reprendre la lecture" lives in Mes vidéos: no resume shelf here
  ]), '[]', filter, lang, Date.now(), cat === undefined ? 'loading' : cat === null ? 'error' : 'ready'), [cat,filter,lang]);
  const lookup = useMemo(() => {
    const map = new Map<string,ReplayItem>();
    if (cat) for (const rail of [...cat.rails, ...(cat.kids || []), ...(cat.youtube || [])]) for (const item of rail.items) map.set(item.id,item);
    return map;
  }, [cat]);
  return (
    <div className="tab-replay">
      <div className="hero-spacer" />
      <Radios />
      <RustView className="chips" row tabs html={replay_filters(filter, lang)} onCommand={f => setFilter(f as Filter)} />
      <RustView className="replay-shelves" html={shelves} onCommand={cmd => {
        const [action, id] = readCommand(cmd);
        if (action === 'retry') setReload(n => n+1);
        if (action === 'item') { const item = lookup.get(id); if (item) openReplay(item); }
      }} />
    </div>
  );
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
