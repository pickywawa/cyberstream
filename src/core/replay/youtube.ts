import { youtube_feed } from '../../rust/generated/cyberstream';
import { fetchWithTimeout } from '../net/http';
import type { ReplayItem, ReplayRail } from './types';
import { YT_CHANNELS, type YtChannel } from './youtubeChannels';
import { countryInfo } from '../countries';

/**
 * Free YouTube channels of well-known broadcasters and media, by theme, read from YouTube's public
 * RSS feeds (latest videos of a channel, no API key). Videos play in YouTube's own embedded player.
 * Channels of the profile's countries (replay/youtubeChannels.ts).
 */
export type YtSection = 'docs' | 'sport' | 'news' | 'radio' | 'humor' | 'media';

export const YT_SECTIONS: YtSection[] = ['docs', 'news', 'sport', 'humor', 'media', 'radio'];

/**
 * Channels of the followed countries, by theme, the main country first. A country without its own
 * list borrows the one of the main country of its language ("SN" → France's).
 */
export function ytChannels(lang: string, countries: string[]): Record<YtSection, YtChannel[]> {
  const byLang: Record<string, string> = { fr: 'FR', en: 'US', de: 'DE', es: 'ES', it: 'IT', pt: 'BR', ar: 'SA', hi: 'IN', zh: 'TW', bn: 'BD', id: 'ID', ur: 'PK', ru: 'RU', ja: 'JP' };
  const codes = countries.map((c) => (YT_CHANNELS[c] ? c : byLang[countryInfo(c)?.lang || lang])).filter((c): c is string => !!c && !!YT_CHANNELS[c]);
  if (!codes.length) codes.push(byLang[lang] || 'US');
  // international channels in English after the national ones
  if (lang === 'en' || codes.some((c) => countryInfo(c)?.lang === 'en')) codes.push('INT_EN');
  const out = {} as Record<YtSection, YtChannel[]>;
  for (const sec of YT_SECTIONS) {
    const seen = new Set<string>();
    out[sec] = [...new Set(codes)].flatMap((c) => YT_CHANNELS[c]?.[sec] || []).filter((ch) => !seen.has(ch.id) && !!seen.add(ch.id));
  }
  return out;
}

/** one channel's latest videos (Shorts left out) from its RSS feed */
export function parseYtFeed(xml: string, channelName: string): ReplayItem[] {
  return JSON.parse(youtube_feed(xml,channelName));
}

async function feed(ch: YtChannel): Promise<ReplayItem[]> {
  const res = await fetchWithTimeout(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`, { timeoutMs: 15000 });
  return parseYtFeed(await res.text(), ch.name);
}

/** one rail per theme: the newest videos of its channels, a few per channel at most */
export async function youtubeRails(lang: string, countries: string[], titles: Record<YtSection, string>): Promise<ReplayRail[]> {
  const conf = ytChannels(lang, countries);
  const rails: ReplayRail[] = [];
  await Promise.all(
    YT_SECTIONS.map(async (sec) => {
      const lists = await Promise.all(conf[sec].map((ch) => feed(ch).catch(() => [] as ReplayItem[])));
      // the latest videos first, mixing channels (at most 8 per channel)
      const items = lists.flatMap((l) => l.slice(0, 8)).sort((a, b) => (b.published || 0) - (a.published || 0)).slice(0, 30);
      if (items.length >= 4) rails.push({ id: `yt:${sec}`, provider: 'youtube', title: titles[sec], items });
    }),
  );
  return YT_SECTIONS.map((s) => rails.find((r) => r.id === `yt:${s}`)).filter((r): r is ReplayRail => !!r);
}
