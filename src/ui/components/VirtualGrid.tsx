import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { useRows } from '../hooks/useRows';

/**
 * Row-virtualized responsive grid. Scrolls with the nearest `.page` / `.stack-page` container,
 * so thousands of channels / movies stay smooth on low-end TV boxes.
 */
interface Geometry<T> {
  items: T[]; minWidth: number; aspect: number; extraHeight: number; gap?: number; className?: string;
}
export function VirtualGrid<T>({ render, getKey, ...props }: Geometry<T> & {
  render: (item: T, i: number) => ReactNode; getKey: (item: T) => string;
}) {
  return <VirtualGridRows {...props} row={(items, start) => items.map((item, i) =>
    <div key={getKey(item)} style={{ minWidth: 0 }}>{render(item, start + i)}</div>)} />;
}
export function VirtualGridRows<T>({ items, minWidth, aspect, extraHeight, gap = 16, className = '', row }: Geometry<T> & {
  row: (items: T[], start: number) => ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  const [offset, setOffset] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current!;
    setScrollEl(el.closest<HTMLElement>('.stack-page, .page'));
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!scrollEl || !ref.current) return;
    const a = ref.current.getBoundingClientRect().top;
    const b = scrollEl.getBoundingClientRect().top;
    setOffset(a - b + scrollEl.scrollTop);
  }, [scrollEl, width, items.length]);

  const cols = Math.max(1, Math.floor((width + gap) / (minWidth + gap)));
  const colW = width ? (width - gap * (cols - 1)) / cols : minWidth;
  const rowH = colW / aspect + extraHeight + gap;
  const rows = Math.ceil(items.length / cols);

  const visible = useRows(ref, rows, rowH, offset, 3, true);

  return (
    <div ref={ref} className={className} style={{ position: 'relative', height: rows * rowH }}>
      {width > 0 &&
        visible.map((index) => (
          <div
            key={index}
            data-row
            style={{
              position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${index * rowH}px)`,
              display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap,
            }}
          >
            {row(items.slice(index * cols, index * cols + cols), index * cols)}
          </div>
        ))}
    </div>
  );
}
