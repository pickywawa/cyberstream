import { useEffect, useMemo, useState } from 'react';
import { useApp } from '@/state/store';
import { fmtDate } from '@/core/i18n';
import { getProgress } from '@/core/repo';
import { replayCatalog, replayInfo, replayShow, type ReplayCatalog, type ReplayItem, type ReplayProvider, type ReplayShow } from '@/core/replay';
import { useAsync } from '../hooks';
import { profileCountries } from '@/core/prefs';
import { RustView, readCommand } from '../components/RustView';
import { ShelvesView } from '../components/Shelves';
import { replay_blocks, replay_filters, replay_page } from '@/rust/generated/cyberstream';
import { openReplay, playReplay } from '../actions';
import { Radios } from './Radios';
import { ReplayMenu } from '../components/TitleMenu';

const MEM = new Map<string, ReplayCatalog>();
type Filter = 'all' | ReplayProvider | 'kids';
type Status = 'loading' | 'error' | 'ready';

const SHELF_FIELDS = ['rails','kids','youtube','failed','id','title','provider','items','kind','subtitle','channel','image','durationSec','published','expires'];
/**
 * The shelves' markup, kept per catalogue copy and filter: coming back to the tab (or to a filter)
 * reuses it at once. Rebuilt after 10 min ("il y a 5 min" labels, programmes leaving soon).
 */
const BLOCKS = new WeakMap<object, Map<string, { at: number; blocks: [string, string][] }>>();
const NO_CAT = {};
function shelvesFor(cat: ReplayCatalog | null | undefined, filter: Filter, lang: string, status: Status): [string, string][] {
  const owner = cat || NO_CAT;
  const key = `${filter}|${lang}|${status}`;
  let byKey = BLOCKS.get(owner);
  if (!byKey) BLOCKS.set(owner, byKey = new Map());
  const hit = byKey.get(key);
  if (hit && Date.now() - hit.at < 600000) return hit.blocks;
  // "Reprendre la lecture" lives in Mes vidéos: no resume shelf here
  const blocks = JSON.parse(replay_blocks(JSON.stringify(cat || null, SHELF_FIELDS), '[]', filter, lang, Date.now(), status)) as [string, string][];
  byKey.set(key, { at: Date.now(), blocks });
  return blocks;
}
/** filter chips of the services the catalogue holds (france.tv, ARD, ARTE, YouTube, youth) */
function filtersOf(cat: ReplayCatalog | null | undefined): string {
  if (!cat) return '';
  const set = new Set(cat.rails.map((r) => r.provider));
  if (cat.youtube?.length) set.add('youtube');
  return [...(['francetv', 'ard', 'arte', 'youtube'] as const).filter((p) => set.has(p)), ...(cat.kids?.length ? ['kids'] : [])].join();
}
const idle = (fn: () => void) => {
  const w = window as Window & { requestIdleCallback?: typeof requestIdleCallback };
  if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 4000 });
  else setTimeout(fn, 1500);
};

/**
 * Profile start: the saved catalogue goes to memory and its shelves are prepared when the app is idle,
 * so the tab shows them at once; the network (data worker) refreshes it a little later.
 */
export async function preloadReplay(lang: string, country: string) {
  const key = `${lang}:${country}`;
  if (MEM.has(key)) return;
  const saved = await replayCatalog(lang, { cachedOnly: true, country }).catch(() => null);
  if (saved && !MEM.has(key)) {
    MEM.set(key, saved);
    idle(() => shelvesFor(saved, 'all', lang, 'ready'));
  }
  // a little later, so the start of the app isn't slowed down (fresh enough copies are kept as is)
  setTimeout(() => void replayCatalog(lang, { country, known: MEM.get(key) }).then((c) => {
    if (!c || c === MEM.get(key)) return;
    MEM.set(key, c);
    idle(() => shelvesFor(c, 'all', lang, 'ready'));
  }, () => {}), 8000);
}

export function Replay() {
  const profile = useApp((s) => s.profile)!;
  const lang = profile.lang;
  const country = profileCountries(profile).join();
  const memKey = `${lang}:${country}`;
  const [cat, setCat] = useState<ReplayCatalog | null | undefined>(() => MEM.get(memKey));
  const [filter, setFilter] = useState<Filter>('all');
  const [reload, setReload] = useState(0);
  const [menu, setMenu] = useState<ReplayItem | null>(null);

  useEffect(() => {
    let off = false;
    // the copy in memory (or the saved one) shows at once; the network refreshes it only when it is old
    if (!MEM.has(memKey)) void replayCatalog(lang, { cachedOnly: true, country }).then((c) => !off && c && setCat((x) => x ?? c));
    replayCatalog(lang, { force: reload > 0, country, known: MEM.get(memKey) }).then(
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

  const status: Status = cat === undefined ? 'loading' : cat === null ? 'error' : 'ready';
  const blocks = useMemo(() => shelvesFor(cat, filter, lang, status), [cat, filter, lang, status]);
  const lookup = useMemo(() => {
    const map = new Map<string,ReplayItem>();
    if (cat) for (const rail of [...cat.rails, ...(cat.kids || []), ...(cat.youtube || [])]) for (const item of rail.items) map.set(item.id,item);
    return map;
  }, [cat]);
  return (
    <div className="tab-replay">
      <div className="hero-spacer" />
      <Radios />
      <RustView className="chips" row tabs html={replay_filters(filter, lang, filtersOf(cat))} onCommand={f => setFilter(f as Filter)} />
      <ShelvesView className="replay-shelves" blocks={blocks} resetKey={filter} onCommand={cmd => {
        const [action, id] = readCommand(cmd);
        if (action === 'retry') setReload(n => n+1);
        if (action === 'item') { const item = lookup.get(id); if (item) openReplay(item); }
      }} onHold={cmd => {
        const [action, id] = readCommand(cmd);
        const item = action === 'item' ? lookup.get(id) : undefined;
        if (item) setMenu(item);
      }} />
      {menu && <ReplayMenu item={menu} onClose={() => setMenu(null)} onOpen={() => openReplay(menu)} />}
    </div>
  );
}

/** a replay video (play / resume) or a show (its seasons and episodes) */
export function ReplayPage({ id, item }: { id: string; item?: ReplayItem }) {
  const profile = useApp((s) => s.profile)!;
  const lang = profile.lang;
  const isShow = item ? item.kind === 'show' : /^ftvp:|^ardp:|^arte:RC-/.test(id);
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
