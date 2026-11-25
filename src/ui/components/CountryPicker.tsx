import { useMemo, useState } from 'react';
import { COUNTRY_LIST, countryName } from '@/core/countries';
import { locale, t } from '@/core/i18n';
import { IcCheck, IcChevronRight } from '../icons';

/**
 * Multiple-choice drop-down of the followed countries (France and Switzerland…): their free
 * channels, guides, catch-up, radios and scores are merged. The first one chosen is the main
 * country (★). The list opens under the field, so the remote moves through it like any list.
 */
export function CountryPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [open, setOpen] = useState(false);
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
    <div className={`multi-select ${open ? 'open' : ''}`}>
      <button className="select input multi-select-head" data-f aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="grow ellipsis">
          {chosen.map((c, i) => `${c.flag} ${c.name}${i === 0 && chosen.length > 1 ? ' ★' : ''}`).join(', ')}
        </span>
        <IcChevronRight className="chev" />
      </button>
      {open && (
        <div className="multi-select-list" role="listbox" aria-multiselectable="true">
          {sorted.map((c, i) => {
            const on = value.includes(c.code);
            return (
              <button key={c.code} className={`multi-select-option ${on ? 'on' : ''}`} data-f role="option" aria-selected={on} data-autofocus={i === 0 || undefined} onClick={() => toggle(c.code)}>
                <span className="box">{on && <IcCheck />}</span>
                <span aria-hidden="true">{c.flag}</span>
                <span className="grow">{c.name}</span>
                {value[0] === c.code && <span className="small dim">★ {t('profiles.mainCountry')}</span>}
              </button>
            );
          })}
          <button className="btn small multi-select-done" data-f onClick={() => setOpen(false)}>{t('common.ok')}</button>
        </div>
      )}
    </div>
  );
}
