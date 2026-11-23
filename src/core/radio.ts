import { getMeta, setMeta } from './db';
import { timeoutSignal } from './net/http';
import type { PlayRequest } from './types';

/**
 * Web radios: the most listened stations of the profile's country from the public Radio Browser
 * directory (radio-browser.info, no key), the user's own stream addresses, and favourites first.
 */
export interface Radio {
  id: string;
  name: string;
  url: string;
  logo?: string;
  custom?: boolean;
}

const DIRECTORY = 'https://de1.api.radio-browser.info/json/stations/bycountrycodeexact/';
const favKey = (pid: string) => `radio:fav:${pid}`;
const customKey = (pid: string) => `radio:custom:${pid}`;

/** directory stations for a country, cached a day (the saved copy is used offline) */
export async function directoryRadios(country: string): Promise<Radio[]> {
  const key = `radio:list:${country}`;
  const cached = await getMeta<{ at: number; list: Radio[] }>(key).catch(() => undefined);
  if (cached && Date.now() - cached.at < 86400000) return cached.list;
  try {
    const res = await fetch(`${DIRECTORY}${encodeURIComponent(country)}?order=clickcount&reverse=true&limit=80&hidebroken=true`, { signal: timeoutSignal(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows: { stationuuid: string; name: string; url_resolved?: string; url: string; favicon?: string }[] = await res.json();
    const seen = new Set<string>();
    const list: Radio[] = [];
    for (const r of rows) {
      const name = (r.name || '').replace(/\s+/g, ' ').trim();
      const url = r.url_resolved || r.url;
      const k = name.toLowerCase();
      if (!name || !/^https?:\/\//.test(url) || seen.has(k)) continue;
      seen.add(k);
      list.push({ id: r.stationuuid, name, url, logo: /^https?:\/\//.test(r.favicon || '') ? r.favicon : undefined });
      if (list.length >= 50) break;
    }
    await setMeta(key, { at: Date.now(), list }).catch(() => {});
    return list;
  } catch (e) {
    if (cached) return cached.list;
    throw e;
  }
}

export async function radioPrefs(profileId: string) {
  const [fav, custom] = await Promise.all([getMeta<string[]>(favKey(profileId)), getMeta<Radio[]>(customKey(profileId))]);
  return { fav: fav || [], custom: custom || [] };
}

/** favourites first (in the order they were added), then the user's stations, then the directory */
export function orderRadios(directory: Radio[], custom: Radio[], fav: string[]): Radio[] {
  const all = [...custom, ...directory.filter((d) => !custom.some((c) => c.url === d.url))];
  const byId = new Map(all.map((r) => [r.id, r]));
  const favs = fav.map((id) => byId.get(id)).filter(Boolean) as Radio[];
  return [...favs, ...all.filter((r) => !fav.includes(r.id))];
}

export async function toggleRadioFav(profileId: string, id: string): Promise<boolean> {
  const fav = (await getMeta<string[]>(favKey(profileId))) || [];
  const on = !fav.includes(id);
  await setMeta(favKey(profileId), on ? [...fav, id] : fav.filter((x) => x !== id));
  return on;
}

export async function addCustomRadio(profileId: string, name: string, url: string): Promise<Radio> {
  const custom = (await getMeta<Radio[]>(customKey(profileId))) || [];
  const r: Radio = { id: `custom:${Date.now().toString(36)}`, name: name.trim() || new URL(url).hostname, url: url.trim(), custom: true };
  await setMeta(customKey(profileId), [...custom, r]);
  return r;
}

export async function removeCustomRadio(profileId: string, id: string) {
  const custom = (await getMeta<Radio[]>(customKey(profileId))) || [];
  await setMeta(customKey(profileId), custom.filter((r) => r.id !== id));
  const fav = (await getMeta<string[]>(favKey(profileId))) || [];
  if (fav.includes(id)) await setMeta(favKey(profileId), fav.filter((x) => x !== id));
}

export function radioPlayRequest(r: Radio): PlayRequest {
  return {
    kind: 'live',
    itemId: `radio:${r.id}`,
    title: r.name,
    image: r.logo,
    logo: r.logo,
    candidates: [{ url: r.url, label: 'Radio', quality: null, sourceId: 'radio' }],
    live: true,
    audio: true,
  };
}
