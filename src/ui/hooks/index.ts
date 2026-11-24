import type React from 'react';
import { createContext, useContext, useEffect, useRef, useState, type DependencyList } from 'react';
import { useApp } from '@/state/store';

/**
 * Last result of each keyed query, kept across tab switches (screens remount on every switch):
 * a revisited screen renders its previous content at once while the query refreshes it.
 */
const MEM = new Map<string, { value: unknown; weight: number }>();
const MEM_MAX = 60;
const ROW_BUDGET = 24000;
let retained = 0;
function size(value: unknown) {
  if (Array.isArray(value)) return value.length + (Array.isArray(value[0]) ? value[0].length : 0);
  if (value instanceof Map || value instanceof Set) return value.size;
  return 1;
}
export function primeCache(key: string, value: unknown) {
  const old = MEM.get(key);
  if (old) { retained -= old.weight; MEM.delete(key); }
  const weight = size(value);
  if (weight > ROW_BUDGET) return;
  MEM.set(key, { value, weight });
  retained += weight;
  while (MEM.size > MEM_MAX || retained > ROW_BUDGET) {
    const oldest = MEM.keys().next().value!;
    retained -= MEM.get(oldest)!.weight;
    MEM.delete(oldest);
  }
}
export function cached<T>(key: string): T | undefined {
  return MEM.get(key)?.value as T | undefined;
}

/**
 * false for a screen that is covered (the tab under a film page, everything under the player):
 * its queries don't follow catalogue / guide updates until it is shown again — on a TV box, the
 * Home recomputed behind a film page every few seconds while TMDB enrichment was running.
 */
export const ScreenActive = createContext(true);

/**
 * Async query re-run on deps change and whenever the catalog version bumps (visible screens only).
 * With `key`, the previous result is shown immediately (stale-while-revalidate).
 */
export function useAsync<T>(fn: () => Promise<T>, deps: DependencyList, opts: { epg?: boolean; key?: string; lazy?: boolean } = {}): T | undefined {
  const active = useContext(ScreenActive);
  const liveCatalog = useApp((s) => s.catalogVersion);
  const liveEpg = useApp((s) => (opts.epg ? s.epgVersion : 0));
  const versions = useRef({ c: liveCatalog, e: liveEpg });
  // lazy: data changes made meanwhile are picked up only when the screen comes back (not while it is shown)
  const wasActive = useRef(active);
  if (active && (!opts.lazy || !wasActive.current)) versions.current = { c: liveCatalog, e: liveEpg };
  wasActive.current = active;
  const { c: catalogVersion, e: epgVersion } = versions.current;
  const [v, setV] = useState<T | undefined>(() => (opts.key ? cached<T>(opts.key) : undefined));
  const seq = useRef(0);
  const applied = useRef(0);
  const running = useRef(false);
  const again = useRef(false);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const lastKey = useRef(opts.key);
  if (opts.key !== lastKey.current) {
    // another query (e.g. other filter): show its cached result, never the previous query's
    lastKey.current = opts.key;
    const c = opts.key ? cached<T>(opts.key) : undefined;
    if (c !== v) setV(c);
  }
  useEffect(() => {
    /**
     * One run at a time: while a slow query runs (big guide on a phone, sync writing the guide),
     * new triggers only ask for one more run afterwards. A result is shown as long as it is the
     * newest one for the current key — a slow query is never thrown away just because data moved.
     */
    const go = () => {
      if (running.current) {
        again.current = true;
        return;
      }
      running.current = true;
      const id = ++seq.current;
      const key = lastKey.current;
      fnRef.current()
        .then(
          (r) => {
            if (key !== lastKey.current || id <= applied.current) return;
            applied.current = id;
            if (key) primeCache(key, r);
            setV(r);
          },
          (e) => console.warn('[query]', e),
        )
        .finally(() => {
          running.current = false;
          if (again.current) {
            again.current = false;
            go();
          }
        });
    };
    go();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, opts.key, catalogVersion, epgVersion]);
  return v;
}

/** current time, refreshed every `ms` (aligned to the minute by default) */
export function useNow(ms = 30000): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

export function useLongPress<T extends HTMLElement>(cb: () => void) {
  const ref = useRef<T>(null);
  const cbRef = useRef(cb);
  cbRef.current = cb;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const h = () => cbRef.current();
    el.addEventListener('longpress', h);
    return () => el.removeEventListener('longpress', h);
  }, []);
  return ref;
}

export function useMediaQuery(q: string): boolean {
  const [m, setM] = useState(() => matchMedia(q).matches);
  useEffect(() => {
    const mq = matchMedia(q);
    const h = () => setM(mq.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, [q]);
  return m;
}

/**
 * Featured banner (Home, Replay): auto-advance every 8 s unless the remote is inside it, the remote's
 * Left on the first button / Right on the last one, dots ("go:N"), and swiping (touch or mouse drag).
 */
export function useCarousel(count: number, opts: { auto?: boolean } = {}) {
  const auto = opts.auto ?? true;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!auto || paused || count < 2) return;
    const tm = setInterval(() => setI((x) => (x + 1) % count), 8000);
    return () => clearInterval(tm);
  }, [count, paused, i, auto]);
  const step = (d: number) => setI((x) => (x + d + count) % count);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const end = (x: number, y: number) => {
    const start = drag.current;
    drag.current = null;
    if (!start || count < 2) return;
    const dx = x - start.x;
    if (Math.abs(dx) > 50 && Math.abs(dx) > 1.5 * Math.abs(y - start.y)) {
      dragged.current = true;
      step(dx < 0 ? 1 : -1);
    }
  };
  const handlers = {
    onFocus: () => setPaused(true),
    onBlur: (e: React.FocusEvent<HTMLElement>) => setPaused(e.currentTarget.contains(e.relatedTarget)),
    onPointerDown: (e: React.PointerEvent) => {
      dragged.current = false;
      drag.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: React.PointerEvent) => end(e.clientX, e.clientY),
    onPointerCancel: () => { drag.current = null; },
    // a drag that changed the slide is not a click on Lecture / Infos
    onClickCapture: (e: React.MouseEvent) => {
      if (dragged.current) {
        dragged.current = false;
        e.stopPropagation();
        e.preventDefault();
      }
    },
    onDragStart: (e: React.DragEvent) => e.preventDefault(),
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => {
      if (count < 2 || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      // the banner's own control (one: Left / Right change slide) or its row of buttons (the ends do)
      const buttons = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('[data-slide], .btn-row [data-f]'));
      const at = buttons.indexOf(document.activeElement as HTMLElement);
      if (at < 0) return;
      const left = e.key === 'ArrowLeft';
      if (left ? at !== 0 : at !== buttons.length - 1) return;
      e.preventDefault();
      e.stopPropagation();
      step(left ? -1 : 1);
    },
  };
  /** true when the command moved the banner */
  const command = (cmd: string) => {
    if (cmd.startsWith('go:')) return (setI(Math.min(count - 1, Math.max(0, Number(cmd.slice(3)) || 0))), true);
    return false;
  };
  return { index: count ? Math.min(i, count - 1) : 0, handlers, command };
}
