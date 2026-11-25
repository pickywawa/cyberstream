import { useMemo } from 'react';
import { COUNTRY_LIST, countryName } from '@/core/countries';
import { locale, t } from '@/core/i18n';

/**
 * Several countries can be followed (France and Switzerland…): their free channels, guides,
 * catch-up, radios and scores are merged. The first one chosen is the main country (marked ★);
 * the others follow in the order they were added.
 */
export function CountryPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const loc = locale();
  const sorted = useMemo(
    () => [...COUNTRY_LIST].map((c) => ({ ...c, name: countryName(c.code, loc) })).sort((a, b) => a.name.localeCompare(b.name, loc)),
    [loc],
  );
  const toggle = (code: string) => {
    if (value.includes(code)) {
      if (value.length > 1) onChange(value.filter((c) => c !== code));
    } else onChange([...value, code]);
  };
  const chosen = value.map((code) => sorted.find((c) => c.code === code)).filter((c): c is (typeof sorted)[number] => !!c);
  return (
    <div className="country-picker">
      <div className="small dim country-chosen">
        {chosen.map((c, i) => (
          <span key={c.code}>{i ? ' · ' : ''}{c.flag} {c.name}{i === 0 ? ` ★ ${t('profiles.mainCountry')}` : ''}</span>
        ))}
      </div>
      <div className="country-grid" data-row>
        {sorted.map((c) => (
          <button key={c.code} data-f className={value.includes(c.code) ? 'on' : ''} aria-pressed={value.includes(c.code)} onClick={() => toggle(c.code)}>
            <span aria-hidden="true">{c.flag}</span> {c.name}{value[0] === c.code ? ' ★' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}
