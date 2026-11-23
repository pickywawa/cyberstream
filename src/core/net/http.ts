import { GzipReader } from '../../rust/generated/cyberstream';
/**
 * All provider traffic goes through a CORS proxy:
 *  - web dev:  Vite middleware  /proxy?u=
 *  - Android:  native local proxy http://127.0.0.1:<port>/proxy?u=  (started by the CyberNative plugin)
 *  - web prod: direct (best effort)
 * Workers receive the base via `setProxyBase`.
 */
// dev server and desktop app (Electron) serve the app and the proxy from the same origin
const sameOriginProxy =
  typeof location !== 'undefined' && (import.meta.env?.DEV || (typeof navigator !== 'undefined' && /\bElectron\//.test(navigator.userAgent)));
let proxyBase: string | null = sameOriginProxy ? `${location.origin}/proxy?u=` : null;

export function setProxyBase(base: string | null) {
  proxyBase = base;
}
export function getProxyBase() {
  return proxyBase;
}

/**
 * Live HLS through the local timeshift recorder (pause / rewind up to `maxSec`): the desktop app,
 * the dev server and the Android proxy have one; null elsewhere (iOS, plain web).
 */
/** ends the local live recording (player closed, catch-up or VOD instead) */
export function stopTimeshift(): void {
  const base = proxyBase?.startsWith('http') ? proxyBase.replace(/\/proxy\?u=$/, '') : '';
  if (base) void fetch(`${base}/tsh/stop`).catch(() => {});
}

export function timeshiftUrl(url: string, maxSec: number): string | null {
  let path = '';
  try {
    path = new URL(url).pathname;
  } catch {
    return null;
  }
  if (!proxyBase || maxSec <= 0 || !/\.m3u8$/i.test(path)) return null;
  const base = proxyBase.startsWith('http') ? proxyBase.replace(/\/proxy\?u=$/, '') : '';
  if (!base) return null;
  return `${base}/tsh/start/live.m3u8?max=${Math.round(maxSec)}&u=${encodeURIComponent(url)}`;
}

/** Hosts known to send CORS headers: never proxied */
const CORS_OK = /^(https:\/\/(api\.themoviedb\.org|image\.tmdb\.org|iptv-org\.github\.io|raw\.githubusercontent\.com))/;

export function proxify(url: string): string {
  if (!proxyBase || !/^https?:\/\//i.test(url) || CORS_OK.test(url)) return url;
  if (typeof location !== 'undefined' && url.startsWith(location.origin + '/')) return url;
  if (url.startsWith(proxyBase)) return url;
  return proxyBase + encodeURIComponent(url);
}

/** AbortSignal.timeout() is missing from older Android TV WebViews (Chrome < 103) and threw there */
export function timeoutSignal(ms: number): AbortSignal {
  const c = new AbortController();
  setTimeout(() => c.abort(), ms);
  return c.signal;
}

export class HttpError extends Error {
  constructor(public status: number, url: string) {
    super(`HTTP ${status} — ${url.replace(/(password|username)=[^&]+/g, '$1=***')}`);
  }
}

export async function fetchWithTimeout(url: string, init: RequestInit & { timeoutMs?: number } = {}): Promise<Response> {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), init.timeoutMs ?? 30000);
  if (init.signal?.aborted) ac.abort();
  else init.signal?.addEventListener('abort', () => ac.abort(), { once: true });
  try {
    const res = await fetch(proxify(url), { ...init, signal: ac.signal });
    if (!res.ok) throw new HttpError(res.status, url);
    return res;
  } finally {
    clearTimeout(t);
  }
}

// ─────────── background pre-download (Android PrefetchWorker) ───────────
let prefetchSince: number | null = null;
let prefetchHits = 0;

/**
 * While set, catalogue/EPG requests first ask the native proxy for a copy downloaded in the
 * background (WorkManager) that is newer than `since` (ms); otherwise they go to the network.
 */
export function setPrefetchSince(since: number | null) {
  prefetchSince = since;
}
export function takePrefetchHits(): number {
  const n = prefetchHits;
  prefetchHits = 0;
  return n;
}

export async function prefetched(url: string, since = prefetchSince, signal?: AbortSignal): Promise<Response | null> {
  if (since === null || !proxyBase || !proxyBase.startsWith('http://127.0.0.1:')) return null;
  // Only the native loopback service implements /cached. A web dev server may return its HTML shell.
  if (typeof location !== 'undefined' && new URL(proxyBase).origin === location.origin) return null;
  try {
    const res = await fetch(`${proxyBase.replace('/proxy?u=', '/cached?u=')}${encodeURIComponent(url)}&since=${since}`, { signal });
    if (res.status !== 200 || !res.body || res.headers.get('content-type')?.includes('text/html')) return null;
    prefetchHits++;
    return res;
  } catch {
    return null;
  }
}

export async function fetchJson<T>(url: string, timeoutMs = 45000): Promise<T> {
  const local = await prefetched(url);
  if (local) {
    // a pre-downloaded copy that doesn't parse (cut download, error page) is ignored
    try {
      return JSON.parse(await local.text()) as T;
    } catch {
      /* fall back to the network */
    }
  }
  const res = await fetchWithTimeout(url, { timeoutMs });
  const text = await res.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error('Réponse JSON invalide');
  }
}

/** Returns a decoded text stream, transparently gunzipping `.gz` payloads */
export async function fetchTextStream(url: string, timeoutMs = 120000): Promise<ReadableStream<string>> {
  const res = (await prefetched(url)) || (await fetchWithTimeout(url, { timeoutMs }));
  if (!res.body) throw new Error('Corps de réponse vide');
  return decodeTextBody(res.body);
}

/** Works on WebViews predating TextDecoderStream and DecompressionStream. */
export function decodeTextBody(body: ReadableStream<Uint8Array>): ReadableStream<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let gzip: GzipReader | undefined;
  let bytes: Uint8Array = new Uint8Array(0);
  let offset = 0, inspected = false, ended = false;
  let released = false;
  const release = () => {
    if (released) return;
    released = true; gzip?.free(); reader.releaseLock();
  };
  return new ReadableStream<string>({
    async pull(controller) {
      try {
        while (!ended) {
          if (offset === bytes.length) {
            const part = await reader.read();
            if (released) return;
            bytes = part.value || new Uint8Array(0);
            offset = 0;
            ended = part.done;
            if (!inspected && !ended) {
              while (bytes.length < 2) {
                const next = await reader.read();
                if (released) return;
                if (next.done) { ended = true; break; }
                const prefix = new Uint8Array(bytes.length + next.value.length);
                prefix.set(bytes); prefix.set(next.value, bytes.length); bytes = prefix;
              }
              inspected = true;
              if (bytes[0] === 0x1f && bytes[1] === 0x8b) gzip = new GzipReader();
            }
          }
          const stop = Math.min(bytes.length, offset + (gzip ? 8192 : 65536));
          const slice = bytes.subarray(offset, stop);
          const text = decoder.decode(gzip ? gzip.feed(slice, ended) : slice, { stream: !ended });
          offset = stop;
          if (text) controller.enqueue(text);
          if (ended) { release(); controller.close(); return; }
          if (text) return;
        }
      } catch (error) {
        await reader.cancel(error).catch(() => {});
        release(); controller.error(error);
      }
    },
    async cancel(reason) { const done = reader.cancel(reason); release(); await done; },
  });

}

/** Split a text stream into lines without buffering the whole payload */
export async function* lines(stream: ReadableStream<string>): AsyncGenerator<string> {
  const reader = stream.getReader();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    let i: number;
    while ((i = buf.indexOf('\n')) >= 0) {
      yield buf.slice(0, i).replace(/\r$/, '');
      buf = buf.slice(i + 1);
    }
  }
  if (buf) yield buf;
}
