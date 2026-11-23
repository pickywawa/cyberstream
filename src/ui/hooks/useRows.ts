import { useLayoutEffect, useState, type RefObject } from 'react';
import { visible_rows } from '../../rust/generated/cyberstream';

/** Uniform-height lists need just the visible interval, including a few adjacent rows for D-pad focus. */
export function useRows(ref: RefObject<HTMLElement | null>, count: number, height: number, offset: number, overscan: number, parent = false) {
  const [range, setRange] = useState<[number, number]>([0, 0]);
  useLayoutEffect(() => {
    const el = parent ? ref.current?.closest<HTMLElement>('.stack-page,.page') : ref.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const [start, end] = visible_rows(count, height, el.scrollTop-offset, el.clientHeight, overscan);
      setRange(old => old[0] === start && old[1] === end ? old : [start,end]);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const ro = new ResizeObserver(schedule);
    ro.observe(el);
    el.addEventListener('scroll',schedule,{passive:true});
    update();
    return () => { ro.disconnect(); el.removeEventListener('scroll',schedule); cancelAnimationFrame(frame); };
  }, [ref,count,height,offset,overscan,parent]);
  const [first, last] = range;
  return Array.from({ length: Math.max(0, Math.min(count,last)-first) }, (_,i) => first+i);
}
