import { artwork_config, artwork_loaded, artwork_failed } from '../rust/generated/cyberstream';
import { isNative, isAndroidApp } from './platform';

/**
 * Image caching:
 * - Android: every remote image (provider logos/posters and TMDB) goes through the native proxy
 *   `/img` endpoint, which keeps a persistent LRU disk cache (96 MB) independent of the WebView cache.
 * - Web: a service worker (public/sw.js) serves images cache-first.
 */
export function setImageProxy(base: string | null) {
  const remote = isNative ? base || '' : '';
  const logos = remote || (!isNative && import.meta.env.DEV ? `${location.origin}/proxy?u=` : '');
  artwork_config(remote, logos, isAndroidApp && !!remote);
}

export function registerImageCache() {
  setImageProxy(null);
  document.addEventListener('load', e => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.dataset.art) return;
    const url = img.dataset.art;
    artwork_loaded(url);
    if (img.crossOrigin === 'anonymous') {
      const tone = knownTone(url) ?? analyseLogo(url, img);
      if (tone !== 'ok') img.classList.add('logo-' + tone);
      // radio tiles: their gradient takes the logo's colour
      const tile = img.closest<HTMLElement>('.radio-tile');
      const h = tile ? logoHue(url, img) : null;
      if (tile && h !== null) tile.style.setProperty('--tile-hue', `hsl(${h} 60% 45%)`);
      // and every logo the same size: its transparent margins cut off, the drawing fills the frame (app.css)
      const box = tile ? logoBox(url, img) : null;
      if (box) img.style.setProperty('object-view-box', box);
    }
    img.style.opacity = '1';
  }, true);
  document.addEventListener('error', e => {
    const img = e.target;
    if (img instanceof HTMLImageElement && img.dataset.art && img.dataset.fallback)
      img.outerHTML = artwork_failed(img.dataset.art, img.dataset.fallback);
  }, true);
  if (!isNative && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});
}

/** a hue for a name (tiles without a coloured logo): stable, spread around the colour wheel */
export function nameHue(name: string): number {
  let h = 7;
  for (const c of name.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 360;
}

const HUE_KEY = 'cybertv.logoHue.v1';
let hues: Record<string, number> | null = null;
let hueTimer = 0;
/**
 * The main colour of a logo (hue of its saturated pixels, averaged on the colour wheel), or null when
 * it has none (black, white, grey logos) or can't be read (no CORS). Kept per URL.
 */
export function logoHue(url: string, img: HTMLImageElement): number | null {
  if (!hues) {
    try { hues = JSON.parse(localStorage.getItem(HUE_KEY) || '{}'); } catch { hues = {}; }
  }
  const known = hues![url];
  if (known !== undefined) return known < 0 ? null : known;
  let hue = -1;
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, 32, 32);
    const d = ctx.getImageData(0, 0, 32, 32).data;
    let x = 0, y = 0, weight = 0, opaque = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 128) continue;
      opaque++;
      const r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const sat = max ? (max - min) / max : 0;
      if (sat < 0.35 || max < 0.25) continue;
      const h = max === r ? ((g - b) / (max - min)) % 6 : max === g ? (b - r) / (max - min) + 2 : (r - g) / (max - min) + 4;
      const a = (h * 60 * Math.PI) / 180;
      x += Math.cos(a) * sat;
      y += Math.sin(a) * sat;
      weight += sat;
    }
    // a few coloured pixels in a grey logo don't make it coloured
    if (opaque && weight > opaque * 0.04) hue = Math.round(((Math.atan2(y, x) * 180) / Math.PI + 360) % 360);
  } catch {
    return null; // tainted canvas: not kept, the name's colour stays
  }
  hues![url] = hue;
  clearTimeout(hueTimer);
  hueTimer = window.setTimeout(() => {
    try { localStorage.setItem(HUE_KEY, JSON.stringify(hues)); } catch { /* full */ }
  }, 1500);
  return hue < 0 ? null : hue;
}

const BOX_KEY = 'cybertv.logoBox.v1';
let boxes: Record<string, string> | null = null;
let boxTimer = 0;
/**
 * The part of a logo that is actually drawn, as `inset(top right bottom left)` in % (transparent
 * margins left out), or null when there is nothing to cut (or it can't be read). Kept per URL.
 */
export function logoBox(url: string, img: HTMLImageElement): string | null {
  if (!boxes) {
    try { boxes = JSON.parse(localStorage.getItem(BOX_KEY) || '{}'); } catch { boxes = {}; }
  }
  const known = boxes![url];
  if (known !== undefined) return known || null;
  let box = '';
  try {
    const n = 64;
    const c = document.createElement('canvas');
    c.width = c.height = n;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, n, n);
    const d = ctx.getImageData(0, 0, n, n).data;
    let top = n, left = n, bottom = -1, right = -1;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (d[(y * n + x) * 4 + 3] < 24) continue;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
    const pct = (v: number) => `${Math.max(0, (v / n) * 100).toFixed(1)}%`;
    // only worth it for a real margin (at least 6 % on a side)
    if (bottom >= 0 && (top > 3 || left > 3 || n - 1 - bottom > 3 || n - 1 - right > 3))
      box = `inset(${pct(top)} ${pct(n - 1 - right)} ${pct(n - 1 - bottom)} ${pct(left)})`;
  } catch {
    return null;
  }
  boxes![url] = box;
  clearTimeout(boxTimer);
  boxTimer = window.setTimeout(() => {
    try { localStorage.setItem(BOX_KEY, JSON.stringify(boxes)); } catch { /* full */ }
  }, 1500);
  return box || null;
}

export type LogoTone = 'ok' | 'dim' | 'dark';
const TONE_KEY = 'cybertv.logoTone.v2';
let tones: Record<string, LogoTone> | null = null;

function loadTones(): Record<string, LogoTone> {
  if (tones) return tones;
  try {
    tones = JSON.parse(localStorage.getItem(TONE_KEY) || '{}');
  } catch {
    tones = {};
  }
  return tones!;
}

export function knownTone(url: string): LogoTone | undefined {
  return loadTones()[url];
}

let saveTimer = 0;
/**
 * Average brightness of the visible pixels of a logo drawn on a transparent canvas.
 * Logos with their own opaque background are left alone; dark logos on transparency would vanish
 * on the dark theme ("France 2" in navy/black): 'dark' → shown as a white silhouette, 'dim' → brightened.
 */
export function analyseLogo(url: string, img: HTMLImageElement): LogoTone {
  let tone: LogoTone = 'ok';
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 40;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, 0, 40, 40);
    const d = ctx.getImageData(0, 0, 40, 40).data;
    let sum = 0;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 64) continue;
      sum += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]) / 255;
      n++;
    }
    const transparent = 1 - n / (d.length / 4);
    if (n && transparent > 0.08) {
      const lum = sum / n;
      tone = lum < 0.27 ? 'dark' : lum < 0.36 ? 'dim' : 'ok';
    }
  } catch {
    return 'ok'; // tainted canvas: no CORS, leave it
  }
  const t = loadTones();
  t[url] = tone;
  // bounded, persisted lazily
  const keys = Object.keys(t);
  if (keys.length > 3000) for (const k of keys.slice(0, keys.length - 3000)) delete t[k];
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    try {
      localStorage.setItem(TONE_KEY, JSON.stringify(t));
    } catch {
      /* ignore */
    }
  }, 1500);
  return tone;
}
