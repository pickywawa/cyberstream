import { subtitle_query, subtitle_rank, subtitle_results } from '../../rust/generated/cyberstream';
import { request } from '../net/request';
import { getMeta, setMeta } from '../db';
import { secureGet, osKey, osPassKey, osUserKey } from '../secure';
import { APP_VERSION } from '../updater';
import { parseSubtitles, type Cue } from './parse';

const API = 'https://api.opensubtitles.com/api/v1';
const UA = `CyberIPTV v${APP_VERSION}`;

export interface SubResult {
  fileId: number;
  lang: string;
  release: string;
  downloads: number;
  /** timed on this exact file (moviehash), so in sync */
  hashMatch: boolean;
  fps?: number;
  hearingImpaired: boolean;
  machine: boolean;
}

export interface SubQuery {
  kind: 'movie' | 'episode';
  tmdbId?: number;
  /** series TMDB id + numbers for episodes */
  parentTmdbId?: number;
  season?: number;
  episode?: number;
  query?: string;
  year?: number;
  langs: string[];
  moviehash?: string;
}

export class OsError extends Error {
  constructor(public code: 'nokey' | 'auth' | 'quota' | 'network' | 'notfound', msg?: string) {
    super(msg || code);
  }
}

export async function hasOsKey(profileId: string): Promise<boolean> {
  return !!(await secureGet(osKey(profileId)));
}

async function creds(profileId: string) {
  const [key, user, pass] = await Promise.all([secureGet(osKey(profileId)), secureGet(osUserKey(profileId)), secureGet(osPassKey(profileId))]);
  if (!key) throw new OsError('nokey');
  return { key, user, pass };
}

const headers = (key: string, token?: string): Record<string, string> => ({
  'Api-Key': key,
  'User-Agent': UA,
  'Content-Type': 'application/json',
  Accept: 'application/json',
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

/** logged-in token (raises the download quota), cached 12 h */
async function token(profileId: string, key: string, user?: string | null, pass?: string | null): Promise<{ token?: string; base: string }> {
  if (!user || !pass) return { base: API };
  const cached = await getMeta<{ token: string; base: string; at: number }>(`os:token:${profileId}`);
  if (cached && Date.now() - cached.at < 12 * 3600000) return cached;
  const r = await request({ url: `${API}/login`, method: 'POST', headers: headers(key), body: { username: user, password: pass } });
  if (r.status === 401) throw new OsError('auth');
  if (r.status !== 200 || !r.data?.token) return { base: API };
  const base = r.data.base_url ? `https://${String(r.data.base_url).replace(/^https?:\/\//, '')}/api/v1` : API;
  const out = { token: r.data.token as string, base, at: Date.now() };
  await setMeta(`os:token:${profileId}`, out);
  return out;
}

/**
 * Checks a key (and the account when given) without spending a download:
 * /login answers 403 to an unknown key and 401 to a known key with wrong credentials.
 * Searching works without a valid key; downloading needs one.
 */
export async function validateOs(key: string, user?: string, pass?: string): Promise<'ok' | 'key' | 'account'> {
  try {
    const r = await request({
      url: `${API}/login`,
      method: 'POST',
      headers: headers(key),
      body: { username: user || 'cyberiptv-key-check', password: pass || '-' },
    });
    if (r.status === 403) return 'key';
    if (user && pass) return r.status === 200 ? 'ok' : 'account';
    return r.status === 401 || r.status === 400 || r.status === 200 ? 'ok' : 'key';
  } catch {
    return 'key';
  }
}

/** query string as the API wants it: lowercase, alphabetical (otherwise it answers with a redirect) */
export function buildQuery(q: SubQuery): string {
  return subtitle_query(JSON.stringify(q));
}

export async function searchSubs(profileId: string, q: SubQuery): Promise<SubResult[]> {
  const { key } = await creds(profileId);
  let r;
  try {
    r = await request({ url: `${API}/subtitles?${buildQuery(q)}`, headers: headers(key) });
  } catch {
    throw new OsError('network');
  }
  if (r.status === 401 || r.status === 403) throw new OsError('auth');
  if (r.status === 429) throw new OsError('quota');
  if (r.status !== 200) throw new OsError('network', `HTTP ${r.status}`);
  return JSON.parse(subtitle_results(JSON.stringify(r.data || {})));
}

/**
 * Best candidates first: the user's language order, then exact file match, human translations,
 * no hearing-impaired annotations, release name close to the provider's, then popularity.
 */
export function rankSubs(list: SubResult[], langs: string[], releaseHint?: string): SubResult[] {
  return Array.from(subtitle_rank(JSON.stringify(list), langs, releaseHint || ''), i => list[i]);
}

/** downloads (or reuses the cached copy: the daily quota is small) and parses a subtitle file */
export async function downloadSub(profileId: string, fileId: number): Promise<Cue[]> {
  const cacheKey = `os:file:${fileId}`;
  const cached = await getMeta<string>(cacheKey);
  if (cached) return parseSubtitles(cached);
  const { key, user, pass } = await creds(profileId);
  const auth = await token(profileId, key, user, pass);
  const r = await request({ url: `${auth.base}/download`, method: 'POST', headers: headers(key, auth.token), body: { file_id: fileId, sub_format: 'srt' } });
  if (r.status === 406 || r.status === 429) throw new OsError('quota');
  if (r.status === 401 || r.status === 403) throw new OsError('auth');
  if (r.status !== 200 || !r.data?.link) throw new OsError('network', `HTTP ${r.status}`);
  const file = await request<string>({ url: r.data.link, headers: { 'User-Agent': UA } });
  const text = typeof file.data === 'string' ? file.data : '';
  const cues = parseSubtitles(text);
  if (!cues.length) throw new OsError('notfound');
  await setMeta(cacheKey, text);
  return cues;
}
