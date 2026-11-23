import type { Channel, Program } from './types';
import type { LangPrefs } from './util/lang';
import { channel_rank, program_boost, channel_score } from '../rust/generated/cyberstream';

export const channelRank = (ch: Pick<Channel,'name'|'epgId'> & {groupKey?:string}, country:string) =>
  channel_rank(ch.name, ch.epgId || '', country, ch.groupKey || '');
export function programBoost(p: Program | undefined, at = Date.now()): number {
  return p ? program_boost(p.title, p.subTitle || '', p.category || '', p.stop-at, new Date(at).getHours()) : 0;
}
export interface RankCtx {
  country: string;
  prefs: LangPrefs;
  /** program on air (or tonight's main program) per epgId */
  programs?: Map<string, Program | undefined>;
  at?: number;
}

export function channelScore(c: Channel, ctx: RankCtx): number {
  const r = channelRank(c, ctx.country);
  const [primary, secondary] = ctx.prefs.audio;
  const guide = c.epgId && (r === undefined || r >= 12) ? ctx.programs?.get(c.epgId) : undefined;
  return channel_score(r, !!c.langs?.includes(primary), !!c.langs?.includes(secondary), !c.langs?.length,
    !!primary, c.country === ctx.country, !!c.epgId, programBoost(guide, ctx.at));
}

/** "Best" channels first: national ranking × user languages × what's on now */
export function rankChannels(list: Channel[], ctx: RankCtx): Channel[] {
  return list
    .map((c) => ({ c, s: channelScore(c, ctx) }))
    .sort((a, b) => b.s - a.s || a.c.num - b.c.num)
    .map((x) => x.c);
}

export function matchesLangs(c: Pick<Channel, 'langs'>, prefs: LangPrefs): boolean {
  return !c.langs?.length || c.langs.some((l) => prefs.audio.includes(l));
}
