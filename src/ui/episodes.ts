import { db } from '@/core/db';
import { dataWorker } from '@/core/workers';
import { loadSecrets } from '@/core/repo';

const inflight = new Map<string, Promise<void>>();

/** Xtream series episodes are fetched on demand and cached for 12 h */
export function loadXtreamEpisodesIfNeeded(seriesId: string, force = false): Promise<void> {
  const cur = inflight.get(seriesId);
  if (cur) return cur;
  const p = (async () => {
    const s = await db.series.get(seriesId);
    if (!s) return;
    const src = await db.sources.get(s.sourceId);
    if (!src || src.type !== 'xtream') return;
    if (!force && s.episodesLoadedAt && Date.now() - s.episodesLoadedAt < 12 * 3600000) return;
    const secrets = await loadSecrets(s.profileId);
    await dataWorker().loadEpisodes(seriesId, secrets[src.id] || '');
  })().finally(() => inflight.delete(seriesId));
  inflight.set(seriesId, p);
  return p;
}

/** provider details of an Xtream film TMDB hasn't enriched (once a week) */
export function loadVodInfoIfNeeded(movieId: string): Promise<void> {
  const key = `vod:${movieId}`;
  const cur = inflight.get(key);
  if (cur) return cur;
  const p = (async () => {
    const m = await db.movies.get(movieId);
    if (!m || (m.providerInfoAt && Date.now() - m.providerInfoAt < 7 * 86400000)) return;
    // TMDB already gave the essentials
    if ((m.enrichedAt || 0) > 0 && m.durationSec && m.genres?.length && m.certAge !== undefined) return;
    const src = await db.sources.get(m.sourceId);
    if (!src || src.type !== 'xtream') return;
    const secrets = await loadSecrets(m.profileId);
    await dataWorker().loadVodInfo(movieId, secrets[src.id] || '').catch(() => false);
  })().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
