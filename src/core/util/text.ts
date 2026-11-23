import type { Quality, Universe } from '../types';
import * as rust from '../../rust/generated/cyberstream';
export { norm, clean_name as cleanName } from '../../rust/generated/cyberstream';
const { norm, clean_name: cleanName } = rust;

export function detectQuality(s: string): Quality { return rust.quality(s) as Quality ?? null; }
export const QUALITY_RANK: Record<string, number> = { '4K': 5, HEVC: 4, FHD: 3, HD: 2, SD: 1, null: 2.5 };
/** live channels: Full HD first; 4K / UHD / HDR feeds are heavy for phones and often unreliable at providers */
export const LIVE_QUALITY_RANK: Record<string, number> = { FHD: 5, HD: 4, null: 3.5, '4K': 3, HEVC: 2, SD: 1 };


export function parseTitleYear(raw: string): { title: string; year?: number } {
  const result = JSON.parse(rust.parse_title(raw));
  return { title: result.title, year: result.year ?? undefined };
}
export function channelGroupKey(rawName: string): string {
  return 'ch:' + norm(cleanName(rawName)).replace(/\s+/g, '');
}

export function movieGroupKey(title: string, year: number | undefined, tmdbId?: number): string {
  return tmdbId ? `mv:t${tmdbId}` : `mv:${norm(title).replace(/\s+/g, '')}:${year ?? ''}`;
}

export function seriesGroupKey(title: string, tmdbId?: number): string {
  return tmdbId ? `sr:t${tmdbId}` : `sr:${norm(title).replace(/\s+/g, '')}`;
}


export function parseEpisode(raw: string): {show:string; season:number; episode:number} | null {
  const value = rust.episode(raw);
  return value ? JSON.parse(value) : null;
}
export function detectUniverse(...texts: (string | undefined)[]): Universe {
  for (const text of texts) {
    if (!text) continue;
    const u = rust.universe(text) as Universe;
    if (u !== 'other') return u;
  }
  return 'other';
}
export function hashColor(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return `hsl(${Math.abs(h) % 360} 45% 32%)`;
}

export function initials(s: string): string {
  const w = cleanName(s).split(/\s+/).filter(Boolean);
  return (w.length > 1 ? w[0][0] + w[1][0] : (w[0] || '?').slice(0, 2)).toUpperCase();
}

export const uid = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));


export const isGenericEpisodeTitle = (title?: string) => rust.generic_episode(title || '');
export const cleanEpisodeTitle = (title?:string) => rust.episode_title(title || '');
