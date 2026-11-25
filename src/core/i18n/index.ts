import type { Lang } from '../types';
import type fr from '../../../rust/locales/fr.json';
import { translation } from '../../rust/generated/cyberstream';
import { langInfo } from './langs';
export { LANGS, langInfo, isLang, deviceLang, tmdbLang } from './langs';
export type I18nKey = keyof typeof fr;
const cache = new Map<I18nKey,string>();
let current: Lang = 'fr';

export function setLang(l: Lang) {
  if (current !== l) cache.clear();
  current = l;
  if (typeof document !== 'undefined') {
    document.documentElement.lang = l;
    document.documentElement.dir = langInfo(l).rtl ? 'rtl' : 'ltr';
  }
}
export function getLang(): Lang {
  return current;
}
export const locale = () => langInfo(current).locale;

export function t(key: I18nKey, vars?: Record<string, string | number>): string {
  let s = cache.get(key);
  if (s === undefined) { s = translation(current,key); cache.set(key,s); }
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

const dates = new Map<string, Intl.DateTimeFormat>();
const clockOptions: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
const dateOptions: Intl.DateTimeFormatOptions = {day: 'numeric', month: 'long', year: 'numeric'};
function formatted(ts: number, options: Intl.DateTimeFormatOptions) {
  if (!Number.isFinite(ts)) return 'Invalid Date';
  const key = current + JSON.stringify(options);
  let format = dates.get(key);
  if (!format) { format = new Intl.DateTimeFormat(locale(), options); dates.set(key, format); }
  return format.format(ts);
}
export function fmtTime(ts: number): string {
  return formatted(ts, clockOptions).replace(':', current === 'fr' ? 'h' : ':');
}
export function fmtDate(ts: number, opts: Intl.DateTimeFormatOptions = dateOptions): string {
  return formatted(ts, opts);
}
export function fmtDuration(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}
export function fmtRuntime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`;
}
