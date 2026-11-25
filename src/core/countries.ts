
/**
 * Free content per country: public XMLTV guide, free live channels (iptv-org public streams),
 * catch-up services, competitions followed for live scores. A profile follows one or several
 * countries (France and Switzerland…): their content is merged, the main country first.
 *
 * YouTube channels per country live in replay/youtubeChannels.ts; radios come from the Radio
 * Browser directory, which covers every country.
 */
export type ReplayService = 'arte' | 'francetv' | 'ard';

export interface Country {
  code: string;
  flag: string;
  /** main broadcast language (ISO 639-1); the interface falls back to English when it has no translation */
  lang: string;
  /** free XMLTV guides (a week of programmes for the main channels) */
  epg?: string[];
  /** iptv-org playlist name, when not the lower-case code */
  iptv?: string;
  /** free catch-up services that work there */
  replay?: ReplayService[];
  /** ESPN competitions for live scores */
  leagues?: string[];
}

const EPG = (file: string) => `https://epgshare01.online/epgshare01/epg_ripper_${file}.xml.gz`;
const EURO = ['soccer/uefa.champions', 'soccer/uefa.europa'];

export const COUNTRY_LIST: Country[] = [
  // French-speaking
  {
    code: 'FR', flag: '🇫🇷', lang: 'fr', epg: ['https://xmltvfr.fr/xmltv/xmltv_tnt.xml.gz'], replay: ['francetv', 'arte'],
    leagues: [
      'soccer/fra.1', 'soccer/fra.2', 'soccer/fra.coupe_de_france', ...EURO, 'soccer/uefa.europa.conf',
      'soccer/eng.1', 'soccer/esp.1', 'soccer/ita.1', 'soccer/ger.1', 'soccer/fifa.world', 'soccer/uefa.nations', 'basketball/nba',
      // rugby: Top 14, Six Nations, European cups, test matches, World Cup
      'rugby/270559', 'rugby/180659', 'rugby/271937', 'rugby/272073', 'rugby/289234', 'rugby/164205',
    ],
  },
  { code: 'BE', flag: '🇧🇪', lang: 'fr', epg: [EPG('BE2')], replay: ['arte'], leagues: ['soccer/bel.1', 'soccer/fra.1', ...EURO, 'soccer/eng.1'] },
  { code: 'CH', flag: '🇨🇭', lang: 'fr', epg: [EPG('CH1')], replay: ['arte'], leagues: ['soccer/sui.1', 'soccer/fra.1', 'soccer/ger.1', ...EURO] },
  { code: 'LU', flag: '🇱🇺', lang: 'fr', epg: [EPG('LU1')], replay: ['arte'], leagues: ['soccer/fra.1', 'soccer/ger.1', ...EURO] },
  { code: 'CA', flag: '🇨🇦', lang: 'en', epg: [EPG('CA2')], leagues: ['hockey/nhl', 'basketball/nba', 'football/nfl', 'baseball/mlb', 'soccer/usa.1'] },
  { code: 'MA', flag: '🇲🇦', lang: 'ar', leagues: ['soccer/caf.nations', 'soccer/fra.1', 'soccer/esp.1', ...EURO] },
  { code: 'DZ', flag: '🇩🇿', lang: 'ar', leagues: ['soccer/caf.nations', 'soccer/fra.1', ...EURO] },
  { code: 'TN', flag: '🇹🇳', lang: 'ar', leagues: ['soccer/caf.nations', 'soccer/fra.1', ...EURO] },
  // English-speaking
  { code: 'GB', flag: '🇬🇧', lang: 'en', iptv: 'uk', epg: [EPG('UK1')], leagues: ['soccer/eng.1', 'soccer/eng.2', 'soccer/sco.1', ...EURO, 'soccer/eng.fa'] },
  { code: 'IE', flag: '🇮🇪', lang: 'en', epg: [EPG('IE1')], leagues: ['soccer/irl.1', 'soccer/eng.1', ...EURO] },
  { code: 'US', flag: '🇺🇸', lang: 'en', epg: [EPG('US2')], leagues: ['football/nfl', 'basketball/nba', 'hockey/nhl', 'baseball/mlb', 'soccer/usa.1'] },
  { code: 'AU', flag: '🇦🇺', lang: 'en', epg: [EPG('AU1')], leagues: ['australian-football/afl', 'soccer/aus.1', 'soccer/eng.1'] },
  { code: 'NZ', flag: '🇳🇿', lang: 'en', epg: [EPG('NZ1')], leagues: ['soccer/aus.1', 'soccer/eng.1'] },
  // German-speaking
  { code: 'DE', flag: '🇩🇪', lang: 'de', epg: [EPG('DE1')], replay: ['ard', 'arte'], leagues: ['soccer/ger.1', 'soccer/ger.2', 'soccer/ger.dfb_pokal', ...EURO] },
  { code: 'AT', flag: '🇦🇹', lang: 'de', epg: [EPG('AT1')], replay: ['ard', 'arte'], leagues: ['soccer/aut.1', 'soccer/ger.1', ...EURO] },
  // Spanish-speaking
  { code: 'ES', flag: '🇪🇸', lang: 'es', epg: [EPG('ES1')], replay: ['arte'], leagues: ['soccer/esp.1', 'soccer/esp.2', 'soccer/esp.copa_del_rey', ...EURO, 'basketball/nba'] },
  { code: 'MX', flag: '🇲🇽', lang: 'es', epg: [EPG('MX1')], leagues: ['soccer/mex.1', 'soccer/concacaf.champions', 'soccer/esp.1', 'football/nfl', 'baseball/mlb'] },
  { code: 'AR', flag: '🇦🇷', lang: 'es', epg: [EPG('AR1')], leagues: ['soccer/arg.1', 'soccer/conmebol.libertadores', 'soccer/esp.1'] },
  { code: 'CO', flag: '🇨🇴', lang: 'es', epg: [EPG('CO1')], leagues: ['soccer/col.1', 'soccer/conmebol.libertadores', 'soccer/esp.1'] },
  { code: 'CL', flag: '🇨🇱', lang: 'es', epg: [EPG('CL1')], leagues: ['soccer/chi.1', 'soccer/conmebol.libertadores', 'soccer/esp.1'] },
  // Italian, Portuguese
  { code: 'IT', flag: '🇮🇹', lang: 'it', epg: [EPG('IT1')], replay: ['arte'], leagues: ['soccer/ita.1', 'soccer/ita.2', 'soccer/ita.coppa_italia', ...EURO] },
  { code: 'PT', flag: '🇵🇹', lang: 'pt', epg: [EPG('PT1')], leagues: ['soccer/por.1', ...EURO] },
  { code: 'BR', flag: '🇧🇷', lang: 'pt', epg: [EPG('BR1')], leagues: ['soccer/bra.1', 'soccer/conmebol.libertadores', 'basketball/nba'] },
  // other European
  { code: 'NL', flag: '🇳🇱', lang: 'nl', epg: [EPG('NL1')], leagues: ['soccer/ned.1', ...EURO] },
  { code: 'TR', flag: '🇹🇷', lang: 'tr', epg: [EPG('TR1')], leagues: ['soccer/tur.1', ...EURO] },
  { code: 'PL', flag: '🇵🇱', lang: 'pl', epg: [EPG('PL1')], replay: ['arte'], leagues: [...EURO] },
  { code: 'RU', flag: '🇷🇺', lang: 'ru', leagues: ['soccer/rus.1'] },
  // Arabic-speaking
  { code: 'SA', flag: '🇸🇦', lang: 'ar', epg: [EPG('SA2')], leagues: ['soccer/ksa.1', 'soccer/afc.champions', 'soccer/eng.1', 'soccer/esp.1'] },
  { code: 'AE', flag: '🇦🇪', lang: 'ar', epg: [EPG('AE1')], leagues: ['soccer/afc.champions', 'soccer/eng.1', 'soccer/esp.1'] },
  { code: 'QA', flag: '🇶🇦', lang: 'ar', leagues: ['soccer/afc.champions', 'soccer/eng.1', 'soccer/esp.1'] },
  { code: 'EG', flag: '🇪🇬', lang: 'ar', leagues: ['soccer/caf.nations', 'soccer/eng.1', 'soccer/esp.1'] },
  // South and South-East Asia
  { code: 'IN', flag: '🇮🇳', lang: 'hi', epg: [EPG('IN1')], leagues: ['soccer/ind.1', 'soccer/eng.1'] },
  { code: 'PK', flag: '🇵🇰', lang: 'ur', leagues: ['soccer/eng.1'] },
  { code: 'BD', flag: '🇧🇩', lang: 'bn', leagues: ['soccer/eng.1'] },
  { code: 'ID', flag: '🇮🇩', lang: 'id', epg: [EPG('ID1')], leagues: ['soccer/idn.1', 'soccer/eng.1'] },
  { code: 'MY', flag: '🇲🇾', lang: 'ms', epg: [EPG('MY1')], leagues: ['soccer/mys.1', 'soccer/eng.1'] },
  { code: 'SG', flag: '🇸🇬', lang: 'en', epg: [EPG('SG1')], leagues: ['soccer/eng.1'] },
  // East Asia
  { code: 'CN', flag: '🇨🇳', lang: 'zh', leagues: ['soccer/chn.1', 'basketball/nba'] },
  { code: 'TW', flag: '🇹🇼', lang: 'zh', leagues: ['basketball/nba', 'baseball/mlb'] },
  { code: 'HK', flag: '🇭🇰', lang: 'zh', epg: [EPG('HK1')], leagues: ['soccer/eng.1', 'basketball/nba'] },
  { code: 'JP', flag: '🇯🇵', lang: 'ja', epg: [EPG('JP1')], leagues: ['soccer/jpn.1', 'baseball/mlb'] },
  { code: 'KR', flag: '🇰🇷', lang: 'ko', leagues: ['baseball/mlb', 'soccer/eng.1'] },
];

const BY_CODE = new Map(COUNTRY_LIST.map((c) => [c.code, c]));
export const countryInfo = (code: string): Country | undefined => BY_CODE.get(code);

const names = new Map<string, Intl.DisplayNames | null>();
/** the country's name in the interface language ("Allemagne", "Germany", "ドイツ") */
export function countryName(code: string, locale: string): string {
  if (!names.has(locale)) {
    try {
      names.set(locale, new Intl.DisplayNames([locale], { type: 'region' }));
    } catch {
      names.set(locale, null);
    }
  }
  return names.get(locale)?.of(code) || code;
}

/** iptv-org playlist of the free channels of a country */
export const freeTvUrl = (code: string) => `https://iptv-org.github.io/iptv/countries/${countryInfo(code)?.iptv || code.toLowerCase()}.m3u`;

/** free guides of the followed countries, main one first, without duplicates */
export const countryGuides = (codes: string[]) => [...new Set(codes.flatMap((c) => countryInfo(c)?.epg || []))];

/** competitions followed by these countries (a country without a list: the French one) */
export function countryLeagues(codes: string[]): string[] {
  const lists = codes.map((c) => countryInfo(c)?.leagues).filter((l): l is string[] => !!l?.length);
  return [...new Set((lists.length ? lists : [countryInfo('FR')!.leagues!]).flat())];
}

/** ARTE's catalogue languages (it streams in these languages everywhere in Europe) */
export const ARTE_LANGS = ['fr', 'de', 'en', 'es', 'it', 'pl'];

/** catch-up services for a profile: those of its countries, ARTE also for its languages */
export function replayServices(codes: string[], lang: string): ReplayService[] {
  const set = new Set(codes.flatMap((c) => countryInfo(c)?.replay || []));
  if (ARTE_LANGS.includes(lang) && codes.some((c) => EUROPE.has(c))) set.add('arte');
  return (['francetv', 'ard', 'arte'] as const).filter((s) => set.has(s));
}
const EUROPE = new Set(['FR', 'BE', 'CH', 'LU', 'GB', 'IE', 'DE', 'AT', 'ES', 'IT', 'PT', 'NL', 'PL']);
