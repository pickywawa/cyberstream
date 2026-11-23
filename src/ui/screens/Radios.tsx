import { memo, useEffect, useState } from 'react';
import { useApp } from '@/state/store';
import { t } from '@/core/i18n';
import { profileCountry } from '@/core/prefs';
import { addCustomRadio, directoryRadios, orderRadios, radioPlayRequest, radioPrefs, removeCustomRadio, toggleRadioFav, type Radio } from '@/core/radio';
import { useLongPress } from '../hooks';
import { Img } from '../components/Img';
import { Rail } from '../components/Rail';
import { Menu, Sheet } from '../components/Overlay';
import { IcHeart, IcHeartFill, IcPlay, IcPlus, IcStar, IcClose } from '../icons';

/** "Radios" rail at the top of the Contenus tab: favourites first, long press for the menu */
export function Radios() {
  const profile = useApp((s) => s.profile)!;
  const toast = useApp((s) => s.toast);
  const country = profileCountry(profile);
  const [directory, setDirectory] = useState<Radio[]>([]);
  const [prefs, setPrefs] = useState<{ fav: string[]; custom: Radio[] }>({ fav: [], custom: [] });
  const [menu, setMenu] = useState<Radio | null>(null);
  const [adding, setAdding] = useState(false);
  const reloadPrefs = () => void radioPrefs(profile.id).then(setPrefs);
  useEffect(reloadPrefs, [profile.id]);
  useEffect(() => {
    let off = false;
    void directoryRadios(country).then((l) => !off && setDirectory(l), () => {});
    return () => { off = true; };
  }, [country]);
  const list = orderRadios(directory, prefs.custom, prefs.fav);
  const play = (r: Radio) => useApp.getState().play(radioPlayRequest(r));
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
    <button ref={ref} className="card logo-tile radio-tile" data-f data-lp onClick={onPlay} aria-label={r.name} title={r.name}>
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
