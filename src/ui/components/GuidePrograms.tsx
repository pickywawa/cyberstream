import { memo, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { GuideRow } from '../../rust/generated/cyberstream';
import type { Program } from '@/core/types';

/** One extra viewport on either side keeps adjacent D-pad targets mounted during scrolling. */
export function useGuideWindow(ref: RefObject<HTMLElement | null>) {
  const [range, setRange] = useState<[number, number]>([0, 2048]);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const page = Math.max(256, el.clientWidth);
      const start = Math.max(0, Math.floor(el.scrollLeft / page) - 1) * page;
      const end = (Math.floor(el.scrollLeft / page) + 3) * page;
      setRange(old => old[0] === start && old[1] === end ? old : [start, end]);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    el.addEventListener('scroll', schedule, { passive: true });
    const observer = new ResizeObserver(schedule);
    observer.observe(el);
    update();
    return () => { observer.disconnect(); el.removeEventListener('scroll', schedule); cancelAnimationFrame(frame); };
  }, [ref]);
  return range;
}

type Props = { list: Program[]; day: number; end: number; now: number; range: [number, number]; channelWidth: number; scale: number; catchup: boolean; fr: boolean; select: (p: Program) => void };
export const GuidePrograms = memo(function GuidePrograms(p: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const row = useRef<GuideRow | null>(null);
  useLayoutEffect(() => {
    const host = ref.current!;
    const controller = new GuideRow(host);
    row.current = controller;
    return () => { controller.free(); row.current = null; host.replaceChildren(); };
  }, []);
  useLayoutEffect(() => {
    row.current?.schedule(JSON.stringify(p.list.map(s => [s.start, s.stop, s.title])));
  }, [p.list]);
  useLayoutEffect(() => {
    row.current?.paint(p.day, p.end, p.now, p.range[0], p.range[1], p.channelWidth, p.scale, p.catchup, p.fr);
  }, [p.list, p.day, p.end, p.now, p.range, p.channelWidth, p.scale, p.catchup, p.fr]);
  return <div onClick={e => {
    const slot = (e.target as Element).closest('[data-slot]')?.getAttribute('data-slot');
    if (slot != null && p.list[Number(slot)]) p.select(p.list[Number(slot)]);
  }} ref={ref} />;
});
