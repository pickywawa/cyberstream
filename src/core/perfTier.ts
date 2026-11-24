/**
 * Low-end device detection (weak TV boxes / sticks). Decided once per launch, before the first render:
 *  - override: `?perf=low` / `?perf=high` in the URL, or localStorage `cyber.perf` = 'low' | 'high'
 *  - little memory or few cores reported by the browser
 *  - otherwise a short CPU benchmark (~1–2 ms on a recent computer, ~15–40 ms on a TV box or with
 *    DevTools' CPU throttling at 20×: reload the page once the throttling is on)
 * A low-end device gets the light Home: trailer only while the banner has the focus, Home refreshed
 * only when coming back to it, Up / Down looking at the neighbouring shelves only, no costly effects.
 */
const THRESHOLD_MS = 8;

function bench(): number {
  let best = Infinity;
  for (let r = 0; r < 3; r++) {
    const t = performance.now();
    const a: { k: string; v: number }[] = new Array(4000);
    let x = 0;
    for (let i = 0; i < 4000; i++) a[i] = { k: 'k' + ((i * 7919) % 4000), v: Math.sqrt(i) * Math.sin(i) };
    a.sort((p, q) => (p.k < q.k ? -1 : p.k > q.k ? 1 : 0));
    for (let i = 0; i < a.length; i++) x += a[i].v;
    best = Math.min(best, performance.now() - t);
    if (x === 42) console.debug(x);
  }
  return best;
}

function override(): boolean | null {
  let v: string | null = null;
  try {
    v = new URLSearchParams(location.search).get('perf') || localStorage.getItem('cyber.perf');
  } catch { /* private mode */ }
  return v === 'low' ? true : v === 'high' ? false : null;
}

let lowEnd: boolean | null = null;
export function isLowEnd(): boolean {
  if (lowEnd !== null) return lowEnd;
  const forced = override();
  if (forced !== null) {
    lowEnd = forced;
    console.info('[perf] low-end (forced):', lowEnd);
  } else {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const ms = bench();
    lowEnd = (!!nav.deviceMemory && nav.deviceMemory <= 2) || (!!nav.hardwareConcurrency && nav.hardwareConcurrency <= 2) || ms > THRESHOLD_MS;
    console.info(`[perf] benchmark ${ms.toFixed(1)} ms, memory ${nav.deviceMemory ?? '?'} GB, ${nav.hardwareConcurrency ?? '?'} cores → low-end: ${lowEnd}`);
  }
  if (typeof document !== 'undefined') document.documentElement.classList.toggle('low-end', lowEnd);
  return lowEnd;
}
