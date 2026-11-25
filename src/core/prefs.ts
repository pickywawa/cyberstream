import type { Profile } from './types';
import type { LangPrefs } from './util/lang';
import { langInfo } from './i18n/langs';

/** Profile language/country preferences with defaults (app language, device region) */
export function langPrefs(p: Pick<Profile, 'lang' | 'audioLangs' | 'subLangs'>): LangPrefs {
  const audio = (p.audioLangs?.length ? p.audioLangs : [p.lang]).filter(Boolean);
  const subs = (p.subLangs?.length ? p.subLangs : [p.lang]).filter(Boolean);
  return { audio, subs };
}

/** the device's region when its language is the profile's ("de-AT" for a German profile → AT) */
function deviceCountry(lang: string): string | undefined {
  const tag = typeof navigator !== 'undefined' ? navigator.language : '';
  const region = tag.split('-')[1]?.toUpperCase();
  return region && /^[A-Z]{2}$/.test(region) && tag.toLowerCase().startsWith(lang) ? region : undefined;
}

/** main country: the first followed one, else the device's region, else the language's country */
export function profileCountry(p: Pick<Profile, 'lang' | 'country' | 'countries'>): string {
  return p.countries?.[0] || p.country || deviceCountry(p.lang) || langInfo(p.lang).country;
}

/** every followed country, main one first (at least one) */
export function profileCountries(p: Pick<Profile, 'lang' | 'country' | 'countries'>): string[] {
  const list = p.countries?.length ? p.countries : [profileCountry(p)];
  return [...new Set(list.filter((c) => /^[A-Z]{2}$/.test(c)))];
}

export function subMode(p: Pick<Profile, 'subMode'>): 'off' | 'auto' | 'always' {
  return p.subMode || 'auto';
}
