import { voice } from '../../rust/generated/cyberstream';
export { words_to_digits as wordsToDigits } from '../../rust/generated/cyberstream';
/**
 * Spoken commands (French and English) turned into app intents, with no external service:
 * "mets France 2", "accueil", "recherche Dune", "lance le film Dune", "recule de 30 secondes"…
 */
export type VoiceTab = 'home' | 'tv' | 'replay' | 'myvideos' | 'settings' | 'search';
export type PlayerAction = 'pause' | 'resume' | 'back' | 'forward' | 'live' | 'next' | 'prev' | 'stop';

export type VoiceIntent =
  | { type: 'tab'; tab: VoiceTab }
  | { type: 'search'; query: string }
  | { type: 'channel'; query: string; num?: number }
  | { type: 'movie'; query: string }
  | { type: 'series'; query: string }
  /** "mets X": a channel, else a movie or a series */
  | { type: 'play'; query: string }
  | { type: 'player'; action: PlayerAction; seconds?: number }
  | { type: 'unknown'; text: string };

export function parseVoice(raw: string, ctx: { inPlayer?: boolean } = {}): VoiceIntent {
  return JSON.parse(voice(raw, !!ctx.inPlayer));
}
