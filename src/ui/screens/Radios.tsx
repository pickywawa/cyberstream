import { memo, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { nameHue } from '@/core/images';
import { useApp } from '@/state/store';
import { t } from '@/core/i18n';
import { profileCountries } from '@/core/prefs';
import { addCustomRadio, countriesRadios, orderRadios, radioPlayRequest, radioPrefs, rememberRadio, removeCustomRadio, toggleRadioFav, type Radio, type RadioPrefs } from '@/core/radio';
import { useLongPress } from '../hooks';
import { Img } from '../components/Img';
import { Rail } from '../components/Rail';
import { Menu, Sheet } from '../components/Overlay';
import { IcHeart, IcHeartFill, IcPlay, IcPlus, IcStar, IcClose } from '../icons';

const DIR_MEM = new Map<string, Radio[]>();
const PREFS_MEM = new Map<string, RadioPrefs>();

/** at profile start: the saved directory and preferences in memory before the tab opens */
export async function preloadRadios(profileId: string, country: string) {
  const [list, prefs] = await Promise.all([countriesRadios(country).catch(() => [] as Radio[]), radioPrefs(profileId)]);
  if (list.length) DIR_MEM.set(country, list);
  PREFS_MEM.set(profileId, prefs);
}

/** "Radios" rail at the top of the Contenus tab: favourites first, long press for the menu */
export function Radios() {
  const profile = useApp((s) => s.profile)!;
  const toast = useApp((s) => s.toast);
  const country = profileCountries(profile).join();
  // last lists shown, kept in memory: the rail is there at once when coming back to the tab
  const [directory, setDirectory] = useState<Radio[]>(() => DIR_MEM.get(country) || []);
  const [prefs, setPrefsState] = useState<RadioPrefs>(() => PREFS_MEM.get(profile.id) || { fav: [], custom: [], recent: [] });
  // a list read again but unchanged keeps the one shown: the 50 tiles aren't drawn a second time
  const setPrefs = (p: RadioPrefs) => {
    const cur = PREFS_MEM.get(profile.id);
    if (cur && JSON.stringify(cur) === JSON.stringify(p)) return;
    PREFS_MEM.set(profile.id, p);
    setPrefsState(p);
  };
  const [menu, setMenu] = useState<Radio | null>(null);
  const [adding, setAdding] = useState(false);
  const reloadPrefs = () => void radioPrefs(profile.id).then(setPrefs);
  useEffect(reloadPrefs, [profile.id]);
  useEffect(() => {
    let off = false;
    void countriesRadios(country).then((l) => {
      const cur = DIR_MEM.get(country);
      if (cur && JSON.stringify(cur) === JSON.stringify(l)) return;
      DIR_MEM.set(country, l);
      if (!off) setDirectory(l);
    }, () => {});
    return () => { off = true; };
  }, [country]);
  const list = useMemo(() => orderRadios(directory, prefs.custom, prefs.fav, prefs.recent), [directory, prefs]);
  const play = (r: Radio) => {
    useApp.getState().play(radioPlayRequest(r));
    // shown right after the favourites next time
    void rememberRadio(profile.id, r.id).then((recent) => setPrefs({ ...(PREFS_MEM.get(profile.id) || prefs), recent }));
  };
  const fav = async (r: Radio) => {
    const on = await toggleRadioFav(profile.id, r.id);
    toast(on ? t('radio.favAdded') : t('radio.favRemoved'));
    reloadPrefs();
  };
  return (
    <>
      <Rail title={t('radio.title')} className="radio-rail">
        {list.map((r) => (
          <RadioTile key={r.id} r={r} fav={prefs.fav.includes(r.id)} onPlay={() => play(r)} onMenu={() => setMenu(r)} />
        ))}
        <button className="card logo-tile radio-add" data-f onClick={() => setAdding(true)}>
          <IcPlus />
          {t('radio.add')}
        </button>
      </Rail>
      {menu && (
        <Sheet title={menu.name} onClose={() => setMenu(null)}>
          <Menu
            items={[
              { label: t('radio.listen'), icon: <IcPlay />, onSelect: () => (setMenu(null), play(menu)) },
              {
                label: prefs.fav.includes(menu.id) ? t('radio.removeFav') : t('radio.addFav'),
                icon: prefs.fav.includes(menu.id) ? <IcHeartFill /> : <IcHeart />,
                onSelect: () => (setMenu(null), void fav(menu)),
              },
              ...(menu.custom
                ? [{ label: t('radio.remove'), icon: <IcClose />, onSelect: () => (setMenu(null), void removeCustomRadio(profile.id, menu.id).then(reloadPrefs)) }]
                : []),
            ]}
          />
        </Sheet>
      )}
      {adding && <AddRadio onClose={() => setAdding(false)} onAdded={() => (setAdding(false), reloadPrefs(), toast(t('radio.added')))} />}
    </>
  );
}

const RadioTile = memo(function RadioTile({ r, fav, onPlay, onMenu }: { r: Radio; fav: boolean; onPlay: () => void; onMenu: () => void }) {
  const ref = useLongPress<HTMLButtonElement>(onMenu);
  return (
    // the gradient of the tiles without a logo, for all: the logo's colour once it is read, the name's until then
    <button ref={ref} className="card logo-tile radio-tile" data-f data-lp onClick={onPlay} aria-label={r.name} title={r.name}
      style={{ '--tile-hue': `hsl(${nameHue(r.name)} 55% 42%)` } as CSSProperties}>
      <Img srcs={[r.logo]} contain label={r.name} alt="" />
      {fav && <IcStar className="fav" />}
      <span className="nm">{r.name}</span>
    </button>
  );
});

function AddRadio({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const profile = useApp((s) => s.profile)!;
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);
  const save = async () => {
    const u = url.trim();
    if (!/^https?:\/\/\S+$/i.test(u)) return setError(true);
    await addCustomRadio(profile.id, name, u);
    onAdded();
  };
  return (
    <Sheet title={t('radio.add')} onClose={onClose}>
      <div className="radio-form">
        <div className="field">
          <label>{t('radio.name')}</label>
          <input className="input" data-f value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        </div>
        <div className="field">
          <label>{t('radio.url')}</label>
          <input className="input" data-f value={url} inputMode="url" placeholder="https://…" autoComplete="off" autoCapitalize="off"
            onChange={(e) => (setUrl(e.target.value), setError(false))} onKeyDown={(e) => e.key === 'Enter' && void save()} />
        </div>
        {error && <span className="msg-ko">{t('radio.invalid')}</span>}
        <button className="btn primary" data-f onClick={() => void save()}>{t('radio.save')}</button>
      </div>
    </Sheet>
  );
}
