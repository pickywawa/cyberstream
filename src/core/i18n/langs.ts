import type { Lang } from '../types';

/**
 * Interface languages: native name, formats (dates, TMDB, speech recognition), writing direction
 * and the country assumed when the profile names none.
 */
export interface LangInfo {
  code: Lang;
  name: string;
  /** flag shown next to the name */
  flag: string;
  /** BCP 47 tag for dates and sorting */
  locale: string;
  /** TMDB `language` parameter */
  tmdb: string;
  /** speech recognition tag */
  speech: string;
  rtl?: boolean;
  country: string;
  /** Wikipedia / Wikidata language code */
  wiki: string;
}

export const LANGS: LangInfo[] = [
  { code: 'fr', flag: '🇫🇷', name: 'Français', locale: 'fr-FR', tmdb: 'fr-FR', speech: 'fr-FR', country: 'FR', wiki: 'fr' },
  { code: 'en', flag: '🇬🇧', name: 'English', locale: 'en-GB', tmdb: 'en-US', speech: 'en-US', country: 'GB', wiki: 'en' },
  { code: 'de', flag: '🇩🇪', name: 'Deutsch', locale: 'de-DE', tmdb: 'de-DE', speech: 'de-DE', country: 'DE', wiki: 'de' },
  { code: 'es', flag: '🇪🇸', name: 'Español', locale: 'es-ES', tmdb: 'es-ES', speech: 'es-ES', country: 'ES', wiki: 'es' },
  { code: 'it', flag: '🇮🇹', name: 'Italiano', locale: 'it-IT', tmdb: 'it-IT', speech: 'it-IT', country: 'IT', wiki: 'it' },
  { code: 'pt', flag: '🇵🇹', name: 'Português', locale: 'pt-PT', tmdb: 'pt-PT', speech: 'pt-PT', country: 'PT', wiki: 'pt' },
  { code: 'ar', flag: '🇸🇦', name: 'العربية', locale: 'ar', tmdb: 'ar-SA', speech: 'ar-SA', rtl: true, country: 'SA', wiki: 'ar' },
  { code: 'hi', flag: '🇮🇳', name: 'हिन्दी', locale: 'hi-IN', tmdb: 'hi-IN', speech: 'hi-IN', country: 'IN', wiki: 'hi' },
  { code: 'zh', flag: '🇨🇳', name: '中文', locale: 'zh-CN', tmdb: 'zh-CN', speech: 'zh-CN', country: 'CN', wiki: 'zh' },
  { code: 'bn', flag: '🇧🇩', name: 'বাংলা', locale: 'bn-BD', tmdb: 'bn-BD', speech: 'bn-BD', country: 'BD', wiki: 'bn' },
  { code: 'id', flag: '🇮🇩', name: 'Bahasa Indonesia', locale: 'id-ID', tmdb: 'id-ID', speech: 'id-ID', country: 'ID', wiki: 'id' },
  { code: 'ur', flag: '🇵🇰', name: 'اردو', locale: 'ur-PK', tmdb: 'ur-PK', speech: 'ur-PK', rtl: true, country: 'PK', wiki: 'ur' },
  { code: 'ru', flag: '🇷🇺', name: 'Русский', locale: 'ru-RU', tmdb: 'ru-RU', speech: 'ru-RU', country: 'RU', wiki: 'ru' },
  { code: 'ja', flag: '🇯🇵', name: '日本語', locale: 'ja-JP', tmdb: 'ja-JP', speech: 'ja-JP', country: 'JP', wiki: 'ja' },
];

const BY_CODE = new Map(LANGS.map((l) => [l.code, l]));
export const langInfo = (l: string): LangInfo => BY_CODE.get(l as Lang) || BY_CODE.get('en')!;
export const isLang = (l: unknown): l is Lang => typeof l === 'string' && BY_CODE.has(l as Lang);

/** the interface language that best fits the device ("pt-BR" → pt, "zh-TW" → zh, else English) */
export function deviceLang(tag = typeof navigator !== 'undefined' ? navigator.language : 'en'): Lang {
  const base = (tag || 'en').toLowerCase().split('-')[0];
  return isLang(base) ? base : 'en';
}

/** TMDB language for a profile: the country variant when TMDB knows it (pt-BR, es-MX, en-GB, zh-TW…) */
export function tmdbLang(lang: string, country?: string): string {
  const variants: Record<string, string[]> = {
    pt: ['BR', 'PT'], es: ['MX', 'AR', 'CO', 'ES'], en: ['GB', 'US', 'CA', 'AU'], zh: ['TW', 'HK', 'CN'], fr: ['CA', 'FR'],
  };
  if (country && variants[lang]?.includes(country)) return `${lang}-${country}`;
  return langInfo(lang).tmdb;
}
