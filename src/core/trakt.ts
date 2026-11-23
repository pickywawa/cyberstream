import { trakt_action, trakt_lists } from '../rust/generated/cyberstream';
import { request } from './net/request';
import { getMeta, setMeta } from './db';
import { secureGet, secureRemove, secureSet } from './secure';
import type { TmdbListItem } from './types';

/**
 * Trakt (trakt.tv): the user's own API app (Client ID + Secret, free at trakt.tv/oauth/applications),
 * linked to the account with the device flow (a code typed on trakt.tv/activate — works on a TV).
 * Gives "For you" recommendations, the watchlist and personal lists (matched against the catalogue),
 * and scrobbles what is watched in the app.
 */
const send = async (spec: string) => JSON.stringify(await request(JSON.parse(spec)));
const action = async (name: string, args: unknown) => JSON.parse(await trakt_action(name, JSON.stringify(args), Date.now(), send));

const idKey = (p: string) => `trakt:${p}:id`;
const secretKey = (p: string) => `trakt:${p}:secret`;
const tokenKey = (p: string) => `trakt:${p}:token`;
const listsMeta = (p: string) => `trakt:lists:${p}`;

interface Token {
  access: string;
  refresh: string;
  exp: number;
}

export interface TraktLists {
  at: number;
  user?: string;
  forYouMovies: TmdbListItem[];
  forYouShows: TmdbListItem[];
  watchlistMovies: TmdbListItem[];
  watchlistShows: TmdbListItem[];
  lists: { name: string; movies: TmdbListItem[]; shows: TmdbListItem[] }[];
}

async function creds(profileId: string) {
  const [id, secret, tok] = await Promise.all([secureGet(idKey(profileId)), secureGet(secretKey(profileId)), secureGet(tokenKey(profileId))]);
  let token: Token | null = null;
  try {
    token = tok ? (JSON.parse(tok) as Token) : null;
  } catch {
    token = null;
  }
  return { id, secret, token };
}

export async function traktStatus(profileId: string): Promise<{ hasApp: boolean; linked: boolean; user?: string }> {
  const c = await creds(profileId);
  const lists = await getMeta<TraktLists>(listsMeta(profileId));
  return { hasApp: !!(c.id && c.secret), linked: !!c.token, user: lists?.user };
}

export interface DeviceCode {
  device_code: string;
  user_code: string;
  verification_url: string;
  expires_in: number;
  interval: number;
}

export async function traktSaveApp(profileId: string, clientId: string, secret: string) {
  await secureSet(idKey(profileId), clientId.trim());
  await secureSet(secretKey(profileId), secret.trim());
}

export async function traktStartLink(profileId: string): Promise<DeviceCode> {
  const { id } = await creds(profileId);
  if (!id) throw new Error('app');
  return action('code', { id });
}

/** 'ok' once the code was entered, 'wait' while pending, 'expired' / 'denied' / 'app' otherwise */
export async function traktPollLink(profileId: string, deviceCode: string): Promise<'ok' | 'wait' | 'slow' | 'expired' | 'denied' | 'app'> {
  const { id, secret } = await creds(profileId);
  if (!id || !secret) return 'app';
  const r = await action('poll', { id, secret, code: deviceCode });
  if (r.token) {
    await secureSet(tokenKey(profileId), JSON.stringify(r.token));
    void traktLists(profileId, true).catch(() => {});
  }
  return r.status;
}

export async function traktUnlink(profileId: string, forgetApp = false) {
  await secureRemove(tokenKey(profileId));
  await setMeta(listsMeta(profileId), null);
  if (forgetApp) {
    await secureRemove(idKey(profileId));
    await secureRemove(secretKey(profileId));
  }
}

/** a valid access token (refreshed a day before it expires) */
async function session(profileId: string): Promise<{ id: string; access: string } | null> {
  const { id, secret, token } = await creds(profileId);
  if (!id || !secret || !token) return null;
  const r = await action('session', { id, secret, token });
  if (r?.token) await secureSet(tokenKey(profileId), JSON.stringify(r.token));
  return r?.access ? { id, access: r.access } : null;
}

async function fetchLists(profileId: string): Promise<TraktLists | null> {
  const s = await session(profileId);
  return s ? JSON.parse(await trakt_lists(s.id, s.access, Date.now(), send)) : null;
}
const loadingLists = new Map<string, Promise<TraktLists | null>>();

/** saved lists at once; refreshed in the background when older than an hour */
export async function traktLists(profileId: string, force = false): Promise<TraktLists | null> {
  const saved = await getMeta<TraktLists>(listsMeta(profileId));
  if (saved && !force && Date.now() - saved.at < 3600000) return saved;
  const inflight = loadingLists.get(profileId) ?? fetchLists(profileId)
    .then(async (l) => {
      if (l) await setMeta(listsMeta(profileId), l);
      return l;
    })
    .catch(() => null)
    .finally(() => loadingLists.delete(profileId));
  loadingLists.set(profileId, inflight);
  if (saved && !force) {
    void inflight;
    return saved;
  }
  return (await inflight) || saved || null;
}

// ─────────── scrobbling ───────────

export interface ScrobbleTarget {
  movie?: { tmdb: number };
  episode?: { showTmdb: number; season: number; number: number };
}

/** start / pause / stop: Trakt marks the title watched when stopped past 80 % */
export async function traktScrobble(profileId: string, action: 'start' | 'pause' | 'stop', t: ScrobbleTarget, progress: number): Promise<void> {
  const s = await session(profileId).catch(() => null);
  if (!s) return;
  await trakt_action('scrobble', JSON.stringify({ ...s, event: action, target: t, progress }), Date.now(), send).catch(() => {});
}
