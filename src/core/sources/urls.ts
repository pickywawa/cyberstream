import type { Channel, Source } from '../types';
import { live_extension, media_url, xtream_catchup, playlist_catchup } from '../../rust/generated/cyberstream';

export interface Secrets {
  /** sourceId -> password */
  [sourceId: string]: string | undefined;
}

export type Engine = 'native' | 'web';

function liveExt(src: Source, engine: Engine, preferHls: boolean): string {
  return live_extension(src.account?.formats?.join(','), engine === 'web' || preferHls);
}

/** `preferHls`: the local live buffer only records HLS, so ask Xtream for its m3u8 output */
export function liveUrl(ch: Channel, src: Source, pass: string | undefined, engine: Engine, preferHls = false): string {
  if (src.type === 'm3u') return ch.url!;
  return media_url(src.url, 'live', src.username || '', pass || '', ch.extId, liveExt(src, engine, preferHls));
}

export function movieUrl(extId: string, ext: string, src: Source, pass?: string, direct?: string): string {
  if (src.type === 'm3u') return direct!;
  return media_url(src.url, 'movie', src.username || '', pass || '', extId, ext || 'mp4');
}

export function episodeUrl(extId: string, ext: string, src: Source, pass?: string, direct?: string): string {
  if (src.type === 'm3u') return direct!;
  return media_url(src.url, 'series', src.username || '', pass || '', extId, ext || 'mp4');
}

/** Wall-clock parts of `ts` in `timeZone` (server tz for Xtream timeshift) */
function partsInTz(ts: number, timeZone?: string) {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: timeZone || 'UTC', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  const p: Record<string, string> = {};
  for (const x of fmt.formatToParts(new Date(ts))) p[x.type] = x.value;
  return { Y: p.year, m: p.month, d: p.day, H: p.hour, M: p.minute, S: p.second };
}

export function canCatchup(ch: Channel): boolean {
  return ch.catchupDays > 0 && !!ch.catchupMode;
}

/**
 * Build a catch-up url for [start, stop] (ms). Returns null if unsupported.
 */
export function catchupUrl(ch: Channel, src: Source, pass: string | undefined, start: number, stop: number): string | null {
  if (!canCatchup(ch)) return null;
  const durMin = Math.max(1, Math.ceil((stop - start) / 60000));
  if (src.type === 'xtream') {
    const p = partsInTz(start,src.account?.timezone);
    return xtream_catchup(src.url, src.username || '', pass || '', ch.extId, `${p.Y}-${p.m}-${p.d}:${p.H}-${p.M}`, durMin);
  }
  return playlist_catchup(ch.catchupMode || '', ch.url || '', ch.catchupSource || '', start / 1000, stop / 1000, Date.now() / 1000) ?? null;
}
