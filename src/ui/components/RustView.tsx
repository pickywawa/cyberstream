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
