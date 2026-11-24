import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FocusEvent } from 'react';
import { useBlocksMarkup } from './RustView';

const FIRST = 6;
const MORE = 4;

/**
 * Shelves rendered by Rust, block by block (Home, Contenus): a shelf whose markup didn't change keeps
 * its cards (and the remote's place in it), and only the first shelves are in the page; more come
 * when the remote reaches the last ones or the page is scrolled near its end (pagination).
 * `resetKey`: another list (a filter): back to the first shelves only.
 */
export function ShelvesView({ className, blocks, onCommand, onHold, resetKey }: {
  className: string; blocks: [string, string][]; onCommand: (cmd: string) => void; onHold?: (cmd: string) => void; resetKey?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const [limit, setLimit] = useState(FIRST);
  const [lastReset, setLastReset] = useState(resetKey);
  if (resetKey !== lastReset) {
    setLastReset(resetKey);
    setLimit(FIRST);
  }
  const more = useCallback(() => setLimit((l) => l + MORE), []);
  const shown = Math.min(limit, blocks.length);
  const left = blocks.length > shown;
  useBlocksMarkup(ref, blocks, shown);
  // the scroll (mouse, touch, the remote's moves) nearing the end of the page
  useLayoutEffect(() => {
    const el = end.current;
    if (!el || !left) return;
    // measured against the page that scrolls (it clips what lies below it: the window as root would
    // never see the end coming, whatever the margin)
    const root = el.closest<HTMLElement>('.stack-page, .page');
    const io = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && more(), { root, rootMargin: '0px 0px 900px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [shown, left, more]);
  // the remote reaching one of the last two shelves shown: Down always has a shelf to go to
  const focusIn = (e: FocusEvent<HTMLDivElement>) => {
    if (!left) return;
    const block = (e.target as Element).closest<HTMLElement>('[data-block]');
    const i = block ? Array.prototype.indexOf.call(ref.current!.children, block) : -1;
    if (i >= shown - 2) more();
  };
  const held = useRef(onHold);
  held.current = onHold;
  useEffect(() => {
    const el = ref.current!;
    const listener = (e: Event) => {
      const cmd = (e.target as Element).closest<HTMLElement>('[data-lp]')?.dataset.cmd;
      if (cmd) held.current?.(cmd);
    };
    el.addEventListener('longpress', listener);
    return () => el.removeEventListener('longpress', listener);
  }, []);
  return <>
    <div ref={ref} className={className} onFocus={focusIn} onClick={(e) => {
      const cmd = (e.target as Element).closest<HTMLElement>('[data-cmd]')?.dataset.cmd;
      if (cmd) onCommand(cmd);
    }} />
    <div ref={end} className="shelves-more" aria-hidden />
  </>;
}
