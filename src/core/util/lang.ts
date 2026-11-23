import * as rust from '../../rust/generated/cyberstream';
/** ISO 639-1 languages offered in the profile + their display flag */
export const LANGUAGES: { code: string; name: string; flag: string }[] = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
];

export const COUNTRIES: { code: string; name: string; flag: string; lang: string }[] = [
  { code: 'FR', name: 'France', flag: '🇫🇷', lang: 'fr' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪', lang: 'fr' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭', lang: 'fr' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', lang: 'fr' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', lang: 'fr' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦', lang: 'ar' },
  { code: 'DZ', name: 'Algérie', flag: '🇩🇿', lang: 'ar' },
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳', lang: 'ar' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', lang: 'en' },
  { code: 'US', name: 'United States', flag: '🇺🇸', lang: 'en' },
  { code: 'DE', name: 'Deutschland', flag: '🇩🇪', lang: 'de' },
  { code: 'ES', name: 'España', flag: '🇪🇸', lang: 'es' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹', lang: 'it' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', lang: 'pt' },
  { code: 'NL', name: 'Nederland', flag: '🇳🇱', lang: 'nl' },
  { code: 'TR', name: 'Türkiye', flag: '🇹🇷', lang: 'tr' },
  { code: 'PL', name: 'Polska', flag: '🇵🇱', lang: 'pl' },
];

export function flagOf(lang: string): string {
  return LANGUAGES.find((l) => l.code === lang)?.flag || '🏳️';
}
export function langName(lang: string): string {
  return LANGUAGES.find((l) => l.code === lang)?.name || lang.toUpperCase();
}

export interface LangInfo {
  /** audio languages (most likely first) */
  audio: string[];
  /** subtitle languages */
  subs: string[];
  /** MULTI tag: provider's local dub + original version */
  multi?: boolean;
}


export const toLang = (tag?: string | null) => rust.to_lang(tag || '');
export const detectLangs = (...texts:(string|undefined)[]): LangInfo => JSON.parse(rust.detect_languages(texts.join('\0')));
export const langFromEpgId = (epg?:string) => rust.epg_lang(epg || '');
export const countryFromEpgId = (epg?:string) => rust.epg_country(epg || '');
export const channelCountry = (name:string, category?:string, epg?:string, country?:string) =>
  rust.channel_country(name, category || '', epg || '', country || '');
export const channelLangs = (name:string, category?:string, epg?:string, lang?:string, country?:string): string[] =>
  JSON.parse(rust.channel_langs(name, category || '', epg || '', lang || '', country || ''));

export interface LangPrefs {
  audio: string[];
  subs: string[];
}

export interface HasLangs {
  langs?: string[];
  subs?: string[];
  origLang?: string;
}

/**
 * 0 = primary audio language, 1 = secondary, 2 = subtitled in a preferred language,
 * 3 = unknown, 4 = another language. Lower is better.
 */
export function langScore(it: HasLangs, p: LangPrefs): number {
  const audio = it.langs?.length ? it.langs : [];
  if (p.audio[0] && audio.includes(p.audio[0])) return 0;
  if (p.audio[1] && audio.includes(p.audio[1])) return 1;
  if (it.subs?.some((s) => p.subs.includes(s))) return 2;
  if (!audio.length) {
    // untagged: an original version in a preferred language is still a match
    if (it.origLang && it.origLang === p.audio[0]) return 0.5;
    if (it.origLang && it.origLang === p.audio[1]) return 1.5;
    return 3;
  }
  return 4;
}

/** stable sort by language preference (keeps the incoming order inside each bucket) */
export function sortByLang<T extends HasLangs>(rows: T[], p: LangPrefs): T[] {
  return rows
    .map((r, i) => ({ r, i, s: langScore(r, p) }))
    .sort((a, b) => a.s - b.s || a.i - b.i)
    .map((x) => x.r);
}

export const COUNTRY_DEFAULT_LANG: Record<string, string> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c.lang]));


export const categoryLangs = (name:string):string[] => rust.category_languages(name);
export function keepCategory(name:string, langs:string[]) {
  const tags=categoryLangs(name);
  return !tags.length || tags.some(l => l==='multi' || langs.includes(l));
}
