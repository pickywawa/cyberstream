import { useLayoutEffect, useRef, type MouseEvent, type RefObject } from 'react';

/** Keep the remote's current selection and the horizontal position of its shelf across updates. */
export function useViewMarkup(ref: RefObject<HTMLElement | null>, html: string) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const active = document.activeElement as HTMLElement | null;
    const command = active && el.contains(active) ? active.dataset.cmd : undefined;
    const rail = command && active?.closest<HTMLElement>('[data-rail]')?.dataset.rail;
    const tracks = el.querySelectorAll<HTMLElement>('[data-rail] .rail-track,[data-scroll]');
    const offsets = new Map<string, number>();
    tracks.forEach(track => {
      if (track.scrollLeft) offsets.set(track.dataset.scroll || track.closest<HTMLElement>('[data-rail]')!.dataset.rail!, track.scrollLeft);
    });
    el.innerHTML = html;
    if (offsets.size) el.querySelectorAll<HTMLElement>('[data-rail] .rail-track,[data-scroll]').forEach(track => {
      const x = offsets.get(track.dataset.scroll || track.closest<HTMLElement>('[data-rail]')!.dataset.rail!);
      if (x !== undefined) track.scrollLeft = x;
    });
    if (command) {
      const scope = rail ? el.querySelector(`[data-rail="${CSS.escape(rail)}"]`) : el;
      // [data-f] first: the top bar's logo shares the Home tab's command but isn't selectable
      const next = scope?.querySelector<HTMLElement>(`[data-f][data-cmd="${CSS.escape(command)}"]`) || scope?.querySelector<HTMLElement>('[data-f]');
      next?.focus({ preventScroll: true });
    }
  }, [ref, html]);
}

const blockHtml = new WeakMap<Element, string>();
/**
 * Markup in blocks `[key, html]` (one top-level element each, e.g. Home's shelves), the first `count`
 * of them in the page: a block whose markup didn't change is left as it is (cards, pictures, the
 * remote's place, its horizontal scroll); a changed one is replaced and keeps the remote's place.
 */
export function useBlocksMarkup(ref: RefObject<HTMLElement | null>, blocks: [string, string][], count: number) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const current = new Map<string, HTMLElement>();
    for (const c of Array.from(el.children) as HTMLElement[]) if (c.dataset.block) current.set(c.dataset.block, c);
    const active = document.activeElement as HTMLElement | null;
    const focusedBlock = active && el.contains(active) ? active.closest<HTMLElement>('[data-block]') : null;
    const focusedIndex = focusedBlock ? Array.prototype.indexOf.call(el.children, focusedBlock) : -1;
    let refocus: HTMLElement | null = null;
    let prev: Element | null = null;
    for (const [key, html] of blocks.slice(0, count)) {
      let node = current.get(key);
      current.delete(key);
      if (!node || blockHtml.get(node) !== html) {
        const t = document.createElement('template');
        t.innerHTML = html;
        const fresh = (t.content.firstElementChild as HTMLElement | null) || document.createElement('div');
        fresh.dataset.block = key;
        blockHtml.set(fresh, html);
        if (node) {
          // same shelf, new content: its horizontal position and the remote's card are kept
          const track = node.querySelector<HTMLElement>('.rail-track');
          const x = track?.scrollLeft || 0;
          node.replaceWith(fresh);
          if (x) { const t2 = fresh.querySelector<HTMLElement>('.rail-track'); if (t2) t2.scrollLeft = x; }
          if (node === focusedBlock) {
            const cmd = active!.dataset.cmd;
            refocus = (cmd && fresh.querySelector<HTMLElement>(`[data-f][data-cmd="${CSS.escape(cmd)}"]`)) || fresh.querySelector<HTMLElement>('[data-f]');
          }
        }
        node = fresh;
      }
      const at: Element | null = prev ? prev.nextElementSibling : el.firstElementChild;
      if (at !== node) el.insertBefore(node, at);
      prev = node;
    }
    // shelves gone: the remote goes to the shelf now at the same place
    for (const gone of current.values()) gone.remove();
    if (focusedBlock && !focusedBlock.isConnected && !refocus) {
      const near = el.children[Math.min(focusedIndex, el.children.length - 1)];
      refocus = near?.querySelector<HTMLElement>('[data-f]') || null;
    }
    refocus?.focus({ preventScroll: true });
  }, [ref, blocks, count]);
}

/** A single listener dispatches Rust-rendered controls, including bubbling TV long presses. */
export function RustView({ tag: Tag = 'div', className, html, onCommand, row, scope, tabs, onHold }: {
  tag?: 'header' | 'div' | 'nav'; className: string; html: string; onCommand: (id: string) => void; row?: boolean;
  scope?: boolean; tabs?:boolean; onHold?: (id: string) => void;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useViewMarkup(ref, html);
  const held = useRef(onHold);
  held.current = onHold;
  useLayoutEffect(() => {
    const el = ref.current!;
    const listener = (e: Event) => {
      const cmd = (e.target as Element).closest<HTMLElement>('[data-lp]')?.dataset.cmd;
      if (cmd) held.current?.(cmd);
    };
    el.addEventListener('longpress', listener);
    return () => el.removeEventListener('longpress', listener);
  }, []);
  const click = (e: MouseEvent<HTMLElement>) => {
    const cmd = (e.target as Element).closest<HTMLElement>('[data-cmd]')?.dataset.cmd;
    if (cmd) onCommand(cmd);
  };
  return <Tag ref={el => { ref.current = el; }} className={className} data-tabs={tabs ? '' : undefined} data-scope={scope ? '' : undefined} data-row={row ? '' : undefined} onClick={click} />;
}

/** Item IDs can themselves contain colons. */
export function readCommand(cmd: string): [string, string] {
  const i = cmd.indexOf(':');
  return i === -1 ? [cmd, ''] : [cmd.slice(0, i), cmd.slice(i + 1)];
}
