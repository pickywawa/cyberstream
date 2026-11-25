import { enrollment_payload, enrollment_target } from '../rust/generated/cyberstream';
import { CapacitorHttp } from '@capacitor/core';
import { isAndroidApp, isDesktop, isNative } from './platform';
import { CyberNative } from './native';
import { db, setMeta } from './db';
import type { Profile, Source } from './types';
import { loadSecrets } from './repo';
import { osKey, osPassKey, osUserKey, secureGet, secureSet, tmdbKey } from './secure';
import { traktApp, traktSaveApp } from './trakt';
import { normalizeServer } from './sources/xtream';
import { createProfile, saveSource, setTmdbToken, updateProfile, type SourceInput } from './profiles';

/**
 * QR-code enrolment.
 * TV: starts a local HTTP server (Android EnrollServer, Vite middleware in dev) and shows its url as a QR code.
 * Phone without the app: the page served by the TV (public/enroll.html) posts a form.
 * Phone with the app: the page opens cyberstream://enroll?target=<tv url>, the app posts its own settings.
 */
export interface EnrollSource {
  type: 'xtream' | 'm3u';
  label: string;
  url: string;
  backups?: string[];
  username?: string;
  password?: string;
  epgUrls?: string[];
}

export interface EnrollPayload {
  v: 1;
  from: 'form' | 'app';
  sources: EnrollSource[];
  tmdb?: string;
  /** OpenSubtitles API key (+ optional account) */
  os?: { key: string; user?: string; pass?: string };
  /** the user's Trakt API app (the account is then linked on the TV with a code) */
  trakt?: { id: string; secret: string };
  prefs?: Pick<Profile, 'lang' | 'country' | 'countries' | 'countryFilter' | 'freeTv' | 'audioLangs' | 'subLangs' | 'subMode' | 'subsOnline' | 'catalogAllLangs'>;
  /** the phone's profile itself (name, emoji, colour), so the TV gets the same one */
  profile?: Pick<Profile, 'name' | 'emoji' | 'color'>;
}

export function parsePayload(raw: string): EnrollPayload | null {
  const json = enrollment_payload(raw);
  return json ? JSON.parse(json) : null;
}

// ─────────── settings handed to a TV right after "Install on a TV" ───────────

const b64url = (s: string) => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64url = (s: string) => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));

/** the link the phone opens on the TV through adb (the payload travels in the path) */
export function importLink(p: EnrollPayload): string {
  return `cyberstream://import/${b64url(JSON.stringify(p))}`;
}

export function parseImportLink(url: string): EnrollPayload | null {
  const m = url.match(/^(?:cyberstream|cyberiptv):\/\/import\/([A-Za-z0-9_-]+)$/);
  if (!m) return null;
  try {
    return parsePayload(unb64url(m[1]));
  } catch {
    return null;
  }
}

/** the TV takes the phone's profile: the same one when it exists (same name), a new one otherwise */
export async function importAsProfile(p: EnrollPayload): Promise<Profile> {
  const name = p.profile?.name || 'Cyberstream';
  const existing = (await db.profiles.toArray()).find((x) => x.name.toLowerCase() === name.toLowerCase());
  const prof =
    existing ||
    (await createProfile({ name, emoji: p.profile?.emoji || '🍿', color: p.profile?.color || '#e50914', lang: p.prefs?.lang || 'fr' }));
  // Update the same account on import, even if it is currently using a backup server.
  const have = await db.sources.where('profileId').equals(prof.id).toArray();
  for (const source of p.sources) {
    const url = source.type === 'xtream' ? normalizeServer(source.url) : source.url.trim();
    const same = have.find(s => s.type === source.type && (s.username || '') === (source.username || '') &&
      (s.servers?.[0] || s.url) === url);
    const saved = await saveSource(prof.id, toSourceInput(source), same?.id);
    if (!same) have.push(saved);
  }
  await applyEnroll(prof.id, { ...p, sources: [] }, { prefs: true });
  return (await db.profiles.get(prof.id))!;
}

export function toSourceInput(s: EnrollSource): SourceInput {
  return { type: s.type, label: s.label, url: s.url, backups: s.backups, username: s.username, password: s.password, epgUrls: s.epgUrls || [] };
}

// ─────────── TV side ───────────

/** a local server can be opened: Android (EnrollServer), desktop app and dev server (Node) */
export const canEnroll = isAndroidApp || isDesktop || !!import.meta.env.DEV;

let webToken = '';

export async function startEnroll(): Promise<string> {
  if (isAndroidApp) return (await CyberNative.enrollStart()).url;
  const r = await (await fetch('/enroll-api/start')).json();
  webToken = r.token;
  return r.url;
}

export async function pollEnroll(): Promise<EnrollPayload | null> {
  const raw = isAndroidApp
    ? (await CyberNative.enrollPoll()).payload
    : (await (await fetch(`/enroll-api/poll?token=${webToken}`)).json()).payload;
  return raw ? parsePayload(raw) : null;
}

export async function stopEnroll() {
  if (isAndroidApp) await CyberNative.enrollStop().catch(() => {});
}

/** imports received settings into an existing profile */
export async function applyEnroll(profileId: string, p: EnrollPayload, opts: { prefs: boolean }) {
  for (const s of p.sources) await saveSource(profileId, toSourceInput(s));
  if (p.tmdb) await setTmdbToken(profileId, p.tmdb);
  if (p.os) {
    await secureSet(osKey(profileId), p.os.key);
    await secureSet(osUserKey(profileId), p.os.user || null);
    await secureSet(osPassKey(profileId), p.os.pass || null);
    await setMeta(`os:token:${profileId}`, null);
  }
  if (p.trakt) await traktSaveApp(profileId, p.trakt.id, p.trakt.secret);
  if (opts.prefs && p.prefs) {
    const patch = Object.fromEntries(Object.entries(p.prefs).filter(([, v]) => v !== undefined)) as Partial<Profile>;
    if (Object.keys(patch).length) await updateProfile(profileId, patch);
  }
}

// ─────────── phone side (CyberIPTV app) ───────────

/** "cyberstream://enroll?target=http://192.168.1.20:41234/e/<token>" → the TV url (LAN only) */
export function enrollTarget(deepLink: string): string | null {
  return enrollment_target(deepLink) ?? null;
}

export async function buildPhonePayload(profile: Profile, sourceIds: string[], withTmdb: boolean, withPrefs: boolean): Promise<EnrollPayload> {
  const secrets = await loadSecrets(profile.id, true);
  const sources = (await db.sources.bulkGet(sourceIds)).filter(Boolean) as Source[];
  const tmdb = withTmdb && profile.hasTmdb ? await secureGet(tmdbKey(profile.id)) : null;
  // the other services' keys travel with the TMDB one ("Envoyer les clés des services")
  const osk = withTmdb ? await secureGet(osKey(profile.id)) : null;
  const tr = withTmdb ? await traktApp(profile.id) : null;
  return {
    v: 1,
    from: 'app',
    sources: sources.map((s) => {
      const servers = s.servers?.length ? s.servers : [s.url];
      return {
        type: s.type, label: s.label, url: servers[0], backups: servers.slice(1),
        username: s.username, password: s.type === 'xtream' ? secrets[s.id] : undefined, epgUrls: s.epgUrls,
      };
    }),
    tmdb: tmdb || undefined,
    os: osk ? { key: osk, user: (await secureGet(osUserKey(profile.id))) || undefined, pass: (await secureGet(osPassKey(profile.id))) || undefined } : undefined,
    trakt: tr || undefined,
    prefs: withPrefs
      ? { lang: profile.lang, country: profile.country, countries: profile.countries, countryFilter: profile.countryFilter, freeTv: profile.freeTv, audioLangs: profile.audioLangs, subLangs: profile.subLangs, subMode: profile.subMode, subsOnline: profile.subsOnline, catalogAllLangs: profile.catalogAllLangs }
      : undefined,
    profile: withPrefs ? { name: profile.name, emoji: profile.emoji, color: profile.color } : undefined,
  };
}

async function request(method: 'GET' | 'POST', url: string, body?: unknown): Promise<number> {
  if (isNative) {
    const r = await CapacitorHttp.request({ method, url, headers: { 'content-type': 'application/json' }, data: body, connectTimeout: 8000, readTimeout: 8000 });
    return r.status;
  }
  const r = await fetch(url, { method, headers: body ? { 'content-type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  return r.status;
}

export async function pingTv(target: string): Promise<boolean> {
  try {
    return (await request('GET', `${target}/ping`)) === 200;
  } catch {
    return false;
  }
}

export async function sendToTv(target: string, payload: EnrollPayload): Promise<boolean> {
  return (await request('POST', target, payload)) === 200;
}
