import { describe, expect, it } from 'vitest';
import { categoryCountry, keepCountry } from '../src/core/util/lang';
import { countryGuides, countryLeagues, freeTvUrl, replayServices } from '../src/core/countries';
import { profileCountries, profileCountry } from '../src/core/prefs';
import { deviceLang, langInfo, tmdbLang } from '../src/core/i18n/langs';

describe('countries of a category', () => {
  it('reads prefixes, tags and names', () => {
    expect(categoryCountry('FR| SPORTS')).toBe('FR');
    expect(categoryCountry('UK: NEWS')).toBe('GB');
    expect(categoryCountry('[BE] INFO')).toBe('BE');
    expect(categoryCountry('|CH| RTS')).toBe('CH');
    expect(categoryCountry('SUISSE')).toBe('CH');
    expect(categoryCountry('Deutschland HD')).toBe('DE');
    expect(categoryCountry('USA ENTERTAINMENT')).toBe('US');
    expect(categoryCountry('SPORTS')).toBeUndefined();
    // "AR" names Arabic, not Argentina
    expect(categoryCountry('AR| BEIN SPORTS')).toBeUndefined();
  });
  it('keeps the followed countries and the categories without one', () => {
    const fr = ['FR', 'CH'];
    expect(keepCountry('FR| CINEMA', fr)).toBe(true);
    expect(keepCountry('CH| SRF', fr)).toBe(true);
    expect(keepCountry('BE| RTBF', fr)).toBe(false);
    expect(keepCountry('DE: SPORT', fr)).toBe(false);
    expect(keepCountry('DOCUMENTAIRES', fr)).toBe(true);
    expect(keepCountry('DE: SPORT', [])).toBe(true);
  });
});

describe('content per country', () => {
  it('merges the guides of several countries', () => {
    expect(countryGuides(['FR'])).toEqual(['https://xmltvfr.fr/xmltv/xmltv_tnt.xml.gz']);
    expect(countryGuides(['FR', 'CH'])).toHaveLength(2);
    expect(countryGuides(['GB'])[0]).toMatch(/UK1/);
    expect(countryGuides(['XX'])).toEqual([]);
  });
  it('follows the competitions of each country', () => {
    expect(countryLeagues(['DE'])).toContain('soccer/ger.1');
    const frch = countryLeagues(['FR', 'CH']);
    expect(frch).toContain('soccer/fra.1');
    expect(frch).toContain('soccer/sui.1');
    expect(new Set(frch).size).toBe(frch.length);
  });
  it('picks the catch-up services', () => {
    expect(replayServices(['FR'], 'fr')).toEqual(['francetv', 'arte']);
    expect(replayServices(['DE'], 'de')).toEqual(['ard', 'arte']);
    expect(replayServices(['ES'], 'es')).toEqual(['arte']);
    expect(replayServices(['US'], 'en')).toEqual([]);
    expect(replayServices(['GB'], 'en')).toEqual(['arte']);
  });
  it('points to the iptv-org playlist', () => {
    expect(freeTvUrl('DE')).toBe('https://iptv-org.github.io/iptv/countries/de.m3u');
    expect(freeTvUrl('GB')).toBe('https://iptv-org.github.io/iptv/countries/uk.m3u');
  });
});

describe('profile languages and countries', () => {
  it('uses the followed countries, else the language', () => {
    expect(profileCountries({ lang: 'fr', countries: ['FR', 'CH'] })).toEqual(['FR', 'CH']);
    expect(profileCountry({ lang: 'fr', countries: ['CH', 'FR'] })).toBe('CH');
    expect(profileCountry({ lang: 'de', country: 'AT' })).toBe('AT');
  });
  it('maps languages to formats', () => {
    expect(langInfo('ar').rtl).toBe(true);
    expect(langInfo('xx').code).toBe('en');
    expect(deviceLang('pt-BR')).toBe('pt');
    expect(deviceLang('nl-NL')).toBe('en');
    expect(tmdbLang('pt', 'BR')).toBe('pt-BR');
    expect(tmdbLang('de', 'AT')).toBe('de-DE');
  });
});
