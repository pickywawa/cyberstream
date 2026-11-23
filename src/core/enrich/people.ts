import { getMeta, setMeta } from '../db';
import { timeoutSignal } from '../net/http';

/**
 * Photo of a cast member known only by name (no TMDB key): the thumbnail of their Wikipedia page
 * (public REST API, no key). Only pages describing a performer/filmmaker are kept, so a namesake's
 * photo isn't shown. Cached a month (misses too).
 */
const PERFORMER = /act(eur|rice|or|ress)|com[ée]dien|r[ée]alisat|director|humorist|chanteu|singer|animat|présentat|presenter|mannequin|model|scénariste|screenwriter|cascadeu|stunt|danseu|dancer|doubl/i;
const mem = new Map<string, Promise<string | undefined>>();

async function lookup(name: string, lang: string): Promise<string | undefined> {
  const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.trim().replace(/ /g, '_'))}`, { signal: timeoutSignal(8000) });
  if (!res.ok) return undefined;
  const j = await res.json();
  if (j?.type !== 'standard' || !PERFORMER.test(`${j.description || ''} ${String(j.extract || '').slice(0, 200)}`)) return undefined;
  return j.thumbnail?.source || undefined;
}

export function actorPhoto(name: string, lang: string): Promise<string | undefined> {
  const key = `wiki:photo:${name.toLowerCase()}`;
  let p = mem.get(key);
  if (!p) {
    p = (async () => {
      const cached = await getMeta<{ at: number; url?: string }>(key).catch(() => undefined);
      if (cached && Date.now() - cached.at < 30 * 86400000) return cached.url;
      let url: string | undefined;
      for (const l of [...new Set([lang, 'en'])]) {
        url = await lookup(name, l).catch(() => undefined);
        if (url) break;
      }
      await setMeta(key, { at: Date.now(), url }).catch(() => {});
      return url;
    })();
    mem.set(key, p);
  }
  return p;
}
