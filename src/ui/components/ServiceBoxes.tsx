import { useEffect, useState, type ReactNode } from 'react';
import { t } from '@/core/i18n';
import type { Profile } from '@/core/types';
import { setMeta } from '@/core/db';
import { setTmdbToken } from '@/core/profiles';
import { secureRemove, secureSet, osKey, osPassKey, osUserKey } from '@/core/secure';
import { hasOsKey, validateOs } from '@/core/subs/opensubtitles';
import { traktPollLink, traktSaveApp, traktStartLink, traktStatus, traktUnlink, traktLists, type DeviceCode } from '@/core/trakt';
import { dataWorker } from '@/core/workers';
import { useApp } from '@/state/store';
import { startEnrichment } from '@/app/services';
import { isTvMode } from '@/core/platform';
import { ServiceGuide } from './ServiceGuide';
import { QrCode } from './EnrollPanel';
import { IcChevronRight, IcRefresh } from '../icons';

/** a title line that opens its content below (remote friendly: the whole line is one button) */
export function Collapse({ title, sub, ok, children }: { title: ReactNode; sub?: ReactNode; ok?: boolean; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`collapse ${open ? 'open' : ''}`}>
      <button className="list-item collapse-head" data-f aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="grow">
          <div style={{ fontWeight: 700 }}>{title}</div>
          {sub && <div className={`small ${ok ? 'msg-ok' : 'muted'}`}>{sub}</div>}
        </span>
        <IcChevronRight className="chev" />
      </button>
      {open && <div className="collapse-body form">{children}</div>}
    </div>
  );
}

/** the profile being edited is the one in use: the app state follows (enrichment, catalogue) */
const isCurrent = (p: Profile) => useApp.getState().profile?.id === p.id;

/** TMDB: one line (state of the token and what it brings) that opens the field, like the other services */
export function TmdbLine({ profile }: { profile: Profile }) {
  const [token, setToken] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'ko'>('idle');
  const has = profile.hasTmdb;
  const save = async () => {
    setState('busy');
    const ok = await dataWorker().validateTmdb(token.trim());
    setState(ok ? 'ok' : 'ko');
    if (!ok) return;
    await setTmdbToken(profile.id, token.trim());
    if (isCurrent(profile)) {
      useApp.getState().patchProfile({ hasTmdb: true });
      await startEnrichment({ ...profile, hasTmdb: true });
    }
    setToken('');
  };
  const remove = async () => {
    setState('idle');
    await setTmdbToken(profile.id, null);
    if (isCurrent(profile)) {
      useApp.getState().patchProfile({ hasTmdb: false });
      await startEnrichment({ ...profile, hasTmdb: false });
    }
  };
  const title = (
    <>
      TMDB <span className={`small ${has ? 'msg-ok' : 'dim'}`} style={{ fontWeight: 400, marginInlineStart: 8 }}>{has ? t('settings.tmdbSet') : t('settings.tmdbMissing')}</span>
    </>
  );
  return (
    <Collapse title={title} sub={t('profiles.tmdbHelp')}>
      <p className="muted" style={{ lineHeight: 1.5 }}>{t('onboard.tmdbText')}</p>
      <div className="field">
        <label>{t('onboard.tmdbToken')}</label>
        <input className="input" data-f type="password" value={token} onChange={(e) => (setToken(e.target.value), setState('idle'))} placeholder={has ? '••••••••••••' : ''} autoComplete="off" spellCheck={false} />
        <ServiceGuide site="themoviedb.org" url="https://www.themoviedb.org/settings/api" steps={['help.tmdb1', 'help.tmdb2', 'help.tmdb3']} />
      </div>
      <div className="btn-row">
        <button className="btn primary" data-f disabled={!token.trim() || state === 'busy'} onClick={() => void save()}>{state === 'busy' ? t('common.testing') : t('common.save')}</button>
        {has && <button className="btn danger" data-f onClick={() => void remove()}>{t('settings.tmdbRemove')}</button>}
        {state === 'ok' && <span className="msg-ok">{t('onboard.tmdbOk')}</span>}
        {state === 'ko' && <span className="msg-ko">{t('onboard.tmdbKo')}</span>}
      </div>
    </Collapse>
  );
}

/** OpenSubtitles: a key saved means subtitles are fetched when a video has none in the profile's languages */
export function OpenSubtitlesBox({ profile }: { profile: Profile }) {
  const [has, setHas] = useState<boolean | null>(null);
  const [key, setKey] = useState('');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'ok' | 'key' | 'account'>('idle');
  useEffect(() => void hasOsKey(profile.id).then(setHas), [profile.id]);
  const save = async () => {
    setState('busy');
    const r = await validateOs(key.trim(), user.trim() || undefined, pass || undefined);
    setState(r);
    if (r !== 'ok') return;
    await secureSet(osKey(profile.id), key.trim());
    await secureSet(osUserKey(profile.id), user.trim() || null);
    await secureSet(osPassKey(profile.id), pass || null);
    await setMeta(`os:token:${profile.id}`, null);
    setKey('');
    setPass('');
    setHas(true);
  };
  const remove = async () => {
    for (const k of [osKey, osUserKey, osPassKey]) await secureRemove(k(profile.id));
    setHas(false);
  };
  return (
    <Collapse title="OpenSubtitles" sub={has ? t('os.set') : t('os.missing')} ok={!!has}>
      <p className="muted" style={{ lineHeight: 1.5 }}>{t('os.text')}</p>
      <div className="field">
        <label>{t('os.key')}</label>
        <input className="input" data-f type="password" value={key} onChange={(e) => (setKey(e.target.value), setState('idle'))} placeholder={has ? '••••••••••••' : ''} autoComplete="off" />
        <ServiceGuide site="opensubtitles.com" url="https://www.opensubtitles.com/consumers" steps={['help.os1', 'help.os2', 'help.os3']} />
      </div>
      <div className="field">
        <label>{t('os.user')}</label>
        <input className="input" data-f value={user} onChange={(e) => setUser(e.target.value)} autoComplete="off" autoCapitalize="off" />
      </div>
      <div className="field">
        <label>{t('os.pass')}</label>
        <input className="input" data-f type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" />
        <span className="small dim">{t('os.accountHelp')}</span>
      </div>
      <div className="btn-row">
        <button className="btn primary" data-f disabled={!key.trim() || state === 'busy'} onClick={() => void save()}>{state === 'busy' ? t('common.testing') : t('common.save')}</button>
        {has && <button className="btn danger" data-f onClick={() => void remove()}>{t('settings.tmdbRemove')}</button>}
        {state === 'ok' && <span className="msg-ok">{t('os.ok')}</span>}
        {state === 'key' && <span className="msg-ko">{t('os.badKey')}</span>}
        {state === 'account' && <span className="msg-ko">{t('os.badAccount')}</span>}
      </div>
    </Collapse>
  );
}

/** Trakt: the user's own API app (Client ID + Secret), then the account linked with a code */
export function TraktBox({ profile }: { profile: Profile }) {
  const toast = useApp((s) => s.toast);
  const [st, setSt] = useState<{ hasApp: boolean; linked: boolean; user?: string } | null>(null);
  const [id, setId] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState<DeviceCode | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const refresh = () => void traktStatus(profile.id).then(setSt);
  useEffect(refresh, [profile.id]);
  const changed = () => isCurrent(profile) && useApp.getState().bumpCatalog();

  // poll until the code is entered on trakt.tv/activate
  useEffect(() => {
    if (!code) return;
    let off = false;
    let wait = code.interval * 1000;
    const until = Date.now() + code.expires_in * 1000;
    const tick = async () => {
      if (off) return;
      if (Date.now() > until) return setCode(null), setErr(t('trakt.expired'));
      const r = await traktPollLink(profile.id, code.device_code);
      if (off) return;
      if (r === 'ok') {
        setCode(null);
        toast(t('trakt.linked'));
        await traktLists(profile.id, true);
        changed();
        return refresh();
      }
      if (r === 'denied' || r === 'expired' || r === 'app') return setCode(null), setErr(t(r === 'app' ? 'trakt.badApp' : 'trakt.expired'));
      if (r === 'slow') wait += 1000;
      timer = window.setTimeout(() => void tick(), wait);
    };
    let timer = window.setTimeout(() => void tick(), wait);
    return () => {
      off = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const link = async () => {
    setErr(null);
    try {
      if (id.trim() && secret.trim()) await traktSaveApp(profile.id, id, secret);
      setCode(await traktStartLink(profile.id));
      setId('');
      setSecret('');
      refresh();
    } catch (e) {
      setErr(String((e as Error).message) === 'app' ? t('trakt.badApp') : t('trakt.network'));
    }
  };
  return (
    <Collapse title="Trakt" sub={st?.linked ? t('trakt.on', { user: st.user || 'Trakt' }) : t('trakt.off')} ok={!!st?.linked}>
      <p className="muted" style={{ lineHeight: 1.5 }}>{t('trakt.text')}</p>
      {!st?.linked && !code && (
        <>
          <div className="field">
            <label>Client ID</label>
            <input className="input" data-f value={id} onChange={(e) => setId(e.target.value)} placeholder={st?.hasApp ? '••••••••••••' : ''} autoComplete="off" autoCapitalize="off" />
          </div>
          <div className="field">
            <label>Client Secret</label>
            <input className="input" data-f type="password" value={secret} onChange={(e) => setSecret(e.target.value)} placeholder={st?.hasApp ? '••••••••••••' : ''} autoComplete="off" />
            <span className="small dim">{t('trakt.help')}</span>
            <ServiceGuide site="trakt.tv" url="https://trakt.tv/oauth/applications/new" copy="urn:ietf:wg:oauth:2.0:oob" steps={['help.trakt1', 'help.trakt2', 'help.trakt3']} />
          </div>
        </>
      )}
      {code && (
        <div className="trakt-code">
          <div>{t('trakt.goTo', { url: code.verification_url })}</div>
          <strong>{code.user_code}</strong>
          <span className="small dim">{t('trakt.waiting')}</span>
          {isTvMode() && (
            <div className="guide-qr">
              <span className="small dim">{t('trakt.scan')}</span>
              <QrCode text={code.verification_url} size={150} />
            </div>
          )}
        </div>
      )}
      <div className="btn-row">
        {!st?.linked && !code && (
          <button className="btn primary" data-f disabled={!st?.hasApp && !(id.trim() && secret.trim())} onClick={() => void link()}>{t('trakt.link')}</button>
        )}
        {code && <button className="btn" data-f onClick={() => setCode(null)}>{t('common.cancel')}</button>}
        {st?.linked && (
          <button className="btn" data-f onClick={() => void traktLists(profile.id, true).then(() => (changed(), toast(t('trakt.refreshed'))))}>
            <IcRefresh /> {t('trakt.refresh')}
          </button>
        )}
        {(st?.linked || st?.hasApp) && (
          <button className="btn danger" data-f onClick={() => void traktUnlink(profile.id, !st?.linked).then(() => (changed(), refresh()))}>
            {st?.linked ? t('trakt.unlink') : t('settings.tmdbRemove')}
          </button>
        )}
        {err && <span className="msg-ko">{err}</span>}
      </div>
    </Collapse>
  );
}
