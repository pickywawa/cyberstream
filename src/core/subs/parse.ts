import { CueTrack, parse_subtitles } from '../../rust/generated/cyberstream';
export { sanitize } from '../../rust/generated/cyberstream';
export interface Cue { start: number; end: number; text: string }
export const parseSubtitles = (raw: string): Cue[] => JSON.parse(parse_subtitles(raw));
export function cueTrack(cues: Cue[]): CueTrack {
  const times = new Float64Array(cues.length * 2);
  cues.forEach((cue, i) => { times[2*i] = cue.start; times[2*i+1] = cue.end; });
  return new CueTrack(times);
}
export function cuesAt(cues: Cue[], t: number): Cue[] {
  const track = cueTrack(cues);
  try { return Array.from(track.active(t), i => cues[i]); }
  finally { track.free(); }
}
