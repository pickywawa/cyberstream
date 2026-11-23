import { normalize_server as normalizeServer, xtream_endpoint, xtream_account } from '../../rust/generated/cyberstream';
export { normalizeServer };
import { fetchJson } from '../net/http';
import type { XtreamAccount } from '../types';

export interface XtreamCreds {
  server: string;
  username: string;
  password: string;
}

/** Parses "http://host:port/get.php?username=x&password=y&type=m3u_plus" into Xtream creds */
export function credsFromM3uUrl(url: string): XtreamCreds | null {
  try {
    const u = new URL(url);
    if (!/get\.php$/i.test(u.pathname)) return null;
    const username = u.searchParams.get('username');
    const password = u.searchParams.get('password');
    if (!username || !password) return null;
    return { server: u.origin, username, password };
  } catch {
    return null;
  }
}

export class XtreamClient {
  constructor(private c: XtreamCreds) {}

  /** every URL the catalogue sync reads (handed to the background pre-download) */
  syncUrls(): string[] {
    return [undefined, 'get_live_categories', 'get_live_streams', 'get_vod_categories', 'get_vod_streams', 'get_series_categories', 'get_series'].map((a) => this.api(a));
  }

  private api(action?: string, extra: Record<string, string> = {}) {
    return xtream_endpoint(this.c.server, this.c.username, this.c.password, false, action || '', Object.entries(extra).flat());
  }

  async account(): Promise<XtreamAccount & { auth: boolean }> {
    const payload = await fetchJson<unknown>(this.api(), 20000);
    return JSON.parse(xtream_account(JSON.stringify(payload)));
  }

  categories(kind: 'live' | 'vod' | 'series') { return fetchJson<unknown>(this.api(`get_${kind}_categories`)); }
  listUrl(kind: 'live' | 'vod' | 'series', categoryId?:string) { return this.api(kind === 'series' ? 'get_series' : `get_${kind}_streams`, categoryId ? {category_id:categoryId} : {}); }
  vodInfo(id: string) { return fetchJson<any>(this.api('get_vod_info', { vod_id: id })); }
  seriesInfo(id: string) { return fetchJson<any>(this.api('get_series_info', { series_id: id })); }
  shortEpg(streamId: string, limit = 10) {
    return fetchJson<any>(this.api('get_short_epg', { stream_id: streamId, limit: String(limit) }));
  }
  xmltvUrl() {
    return xtream_endpoint(this.c.server, this.c.username, this.c.password, true, '', []);
  }
}

export const asArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : v && typeof v === 'object' ? (Object.values(v) as T[]) : []);
export const num = (v: unknown): number | undefined => {
  const n = typeof v === 'number' ? v : parseFloat(String(v ?? ''));
  return Number.isFinite(n) ? n : undefined;
};
