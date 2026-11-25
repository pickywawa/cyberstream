import { settings_menu } from '../../rust/generated/cyberstream';
import { RustView } from '../components/RustView';
import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, getMeta, setMeta } from '@/core/db';
import { t, fmtDate, fmtTime, setLang, getLang } from '@/core/i18n';
import type { Category, Profile, ThemeId } from '@/core/types';
import { moveSource, removeSource, updateProfile } from '@/core/profiles';
import { secureGet, tmdbKey } from '@/core/secure';
import { dataWorker, proxyCb } from '@/core/workers';
import { loadSecrets } from '@/core/repo';
import { useApp, applyTheme, type SettingsSection } from '@/state/store';
import { runSync, runUpdateCheck, schedulePrefetch, startEnrichment } from '@/app/services';
import { APP_VERSION, hasUpdateChannel, RELEASES_URL } from '@/core/updater';
import { serverLabel } from '@/core/sources/servers';
import { canEnroll } from '@/core/enroll';
import { setSmoothScroll } from '../spatial';
import { isAndroidApp, isDesktop, isIOSApp, isTvMode } from '@/core/platform';
import { CyberNative } from '@/core/native';
import { Toggle } from '../components/Overlay';
import { TvInstall } from './TvInstall';
import { PageHeader } from '../components/BackButton';
import { PinPad } from '../components/PinPad';
import { IcChevronRight, IcDown, IcRefresh, IcTrash, IcUp } from '../icons';

export function Settings() {
  const profile = useApp(s => s.profile)!;
  const push = useApp(s => s.push);
  const profiles = useLiveQuery(() => db.profiles.toArray(), []);
  if (!profiles) return null;
  // the profile in use first, then the others
  const list = [...profiles].sort((a, b) => Number(b.id === profile.id) - Number(a.id === profile.id));
  const html = settings_menu(getLang(), JSON.stringify(list.map(p => ({ id: p.id, name: p.name, emoji: p.emoji, color: p.color, locked: !!p.pin }))), profile.id, isAndroidApp && !isTvMode());
  return <RustView className="settings" html={html} onCommand={id => {
    if (id.startsWith('edit:')) push({ name: 'profile-edit', profileId: id.slice(5) });
    else if (id === 'add-profile') useApp.setState({ screen: 'profiles', addingProfile: true });
    else push({ name: 'settings-section', section: id as SettingsSection });
  }} />;
}

export function SettingsSectionView({ section }: { section: SettingsSection }) {
  return (
    <div className="settings">
      <PageHeader title={t(`settings.${section}` as 'settings.sources')} />
      <div style={{ marginTop: 16 }}>
        {section === 'sources' && <SourcesSection />}
        {section === 'appearance' && <AppearanceSection />}
        {section === 'player' && <PlayerSection />}
        {section === 'parental' && <ParentalSection />}
        {section === 'sync' && <SyncSection />}
        {section === 'categories' && <CategoriesSection />}
        {section === 'about' && <AboutSection />}
        {section === 'tvinstall' && <TvInstall />}
      </div>
    </div>
  );
}

function SourcesSection() {
  const profile = useApp((s) => s.profile)!;
  const push = useApp((s) => s.push);
  const toast = useApp((s) => s.toast);
  const sources = useLiveQuery(() => db.sources.where('profileId').equals(profile.id).sortBy('priority'), [profile.id]);
  const [busy, setBusy] = useState<string | null>(null);
  const syncOne = async (id: string) => {
    setBusy(id);
    const secrets = await loadSecrets(profile.id, true);
    const r = await dataWorker().syncSource(id, secrets[id], proxyCb(() => {}));
    setBusy(null);
    useApp.getState().bumpCatalog();
    toast(r?.status === 'ok' ? t('sync.done') : `${t('sync.error')} : ${r?.lastError || ''}`);
  };
  return (
    <div className="list">
      {(sources || []).map((s, i) => (
        <div key={s.id} className="card-box">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700 }} className="ellipsis">{s.label} <span className="dim small">· {s.type.toUpperCase()} · {t('settings.priority', { n: i + 1 })}</span></div>
              <div className={`status ${s.status}`}>{t(`settings.status.${s.status}` as 'settings.status.ok')}{s.lastSyncAt ? ` · ${fmtDate(s.lastSyncAt, { day: 'numeric', month: 'short' })} ${fmtTime(s.lastSyncAt)}` : ''}</div>
              {(s.servers?.length || 0) > 1 && (
                <div className="small muted">{t('sources.activeServer', { host: serverLabel(s.url) })} · {s.servers!.indexOf(s.url) + 1}/{s.servers!.length}</div>
              )}
              {s.counts && <div className="small muted">{s.counts.live} {t('sync.live').toLowerCase()} · {s.counts.vod} {t('sync.vod').toLowerCase()} · {s.counts.series} {t('sync.series').toLowerCase()}</div>}
              {s.account?.expiresAt && <div className="small muted">{t('onboard.expires', { date: fmtDate(s.account.expiresAt) })}{s.account.maxConn ? ` · ${s.account.maxConn} conn.` : ''}</div>}
              {s.lastError && <div className="small msg-ko clamp2">{s.lastError}</div>}
            </div>
          </div>
          <div className="btn-row" data-row style={{ marginTop: 12 }}>
            <button className="btn small" data-f onClick={() => push({ name: 'source-edit', sourceId: s.id })}>{t('common.edit')}</button>
            <button className="btn small" data-f disabled={busy === s.id} onClick={() => void syncOne(s.id)}>
              {busy === s.id ? <span className="spinner" /> : <IcRefresh />} {t('sync.now')}
            </button>
            <button className="icon-btn" data-f disabled={i === 0} onClick={() => void moveSource(profile.id, s.id, -1).then(() => useApp.getState().bumpCatalog())} aria-label={t('settings.moveUp')}><IcUp /></button>
            <button className="icon-btn" data-f disabled={i === (sources?.length || 0) - 1} onClick={() => void moveSource(profile.id, s.id, 1).then(() => useApp.getState().bumpCatalog())} aria-label={t('settings.moveDown')}><IcDown /></button>
            <button className="btn small" data-f onClick={() => void db.sources.update(s.id, { enabled: !s.enabled }).then(() => useApp.getState().bumpCatalog())}>
              {s.enabled ? '✓ ' : ''}{t('settings.enabled')}
            </button>
            <button className="icon-btn" data-f onClick={() => void removeSource(s.id).then(() => useApp.getState().bumpCatalog())} aria-label={t('common.delete')}><IcTrash /></button>
          </div>
        </div>
      ))}
      <div className="btn-row">
        <button className="btn primary" data-f onClick={() => push({ name: 'source-edit' })}>+ {t('settings.addSource')}</button>
        {canEnroll && <button className="btn" data-f onClick={() => push({ name: 'enroll' })}>📱 {t('enroll.fromPhone')}</button>}
        {!isTvMode() && (sources?.length || 0) > 0 && (
          <button className="btn" data-f onClick={() => push({ name: 'send-to-tv' })}>📺 {t('enroll.sendTitle')}</button>
        )}
      </div>
    </div>
  );
}

/** OpenSubtitles: free API key (opensubtitles.com → API consumers) + optional account for a higher quota */
const ACCENTS = ['#4fe3a8', '#ff2e4d', '#ff7a00', '#f5c518', '#00b3ff', '#4f8cff', '#a855f7', '#ff4fd8'];

function AppearanceSection() {
  const profile = useApp((s) => s.profile)!;
  const settings = useApp((s) => s.settings);
  const update = useApp((s) => s.updateSettings);
  const patch = async (x: Partial<Profile>) => {
    await updateProfile(profile.id, x);
    useApp.getState().patchProfile(x);
    const p = { ...profile, ...x };
    applyTheme(p.theme, p.accent, settings.performance);
    if (x.lang) {
      setLang(x.lang);
      void startEnrichment(p);
    }
  };
  return (
    <div className="form">
      <h2>{t('settings.theme')}</h2>
      <div className="seg" data-row style={{ flexWrap: 'wrap' }}>
        {(['night', 'oled', 'midnight', 'light'] as ThemeId[]).map((th) => (
          <button key={th} data-f className={profile.theme === th ? 'on' : ''} onClick={() => void patch({ theme: th })}>{t(`theme.${th}` as 'theme.night')}</button>
        ))}
      </div>
      <h2>{t('settings.accent')}</h2>
      <div className="swatches" data-row>
        {ACCENTS.map((c) => (
          <button key={c} data-f className={`swatch ${(profile.accent || '#4fe3a8') === c ? 'on' : ''}`} style={{ background: c }} onClick={() => void patch({ accent: c === '#4fe3a8' ? undefined : c })} aria-label={c} />
        ))}
      </div>
      <div style={{ height: 8 }} />
      <Toggle
        label={t('settings.performance')}
        on={settings.performance}
        onChange={(v) => {
          update({ performance: v });
          setSmoothScroll(!v);
          applyTheme(profile.theme, profile.accent, v);
        }}
      />
    </div>
  );
}

function PlayerSection() {
  const settings = useApp((s) => s.settings);
  const update = useApp((s) => s.updateSettings);
  const hh = Math.floor(settings.tonightStartMin / 60);
  const mm = settings.tonightStartMin % 60;
  return (
    <div className="form">
      <button className="list-item" data-f onClick={() => useApp.getState().push({ name: 'profile-edit' })}>
        <span className="grow">
          <div>{t('profiles.audio')} · {t('profiles.subtitles')}</div>
          <div className="small muted">{t('profiles.langHelp')}</div>
        </span>
        <IcChevronRight className="chev" />
      </button>
      <Toggle label={t('settings.autoTrailer')} on={settings.autoTrailer} onChange={(v) => update({ autoTrailer: v })} />
      {!isIOSApp && (
        <div className="field">
          <label>{t('settings.liveBuffer')}</label>
          <div className="seg" data-row style={{ flexWrap: 'wrap' }}>
            {[0, 30, 60].map((m) => (
              <button key={m} data-f className={(settings.liveBuffer ?? 30) === m ? 'on' : ''} onClick={() => update({ liveBuffer: m })}>
                {m ? t('settings.liveBufferMin', { n: m }) : t('settings.liveBufferOff')}
              </button>
            ))}
          </div>
          <span className="small dim">{t('settings.liveBufferHelp')}</span>
        </div>
      )}
      {!isIOSApp && (settings.liveBuffer ?? 30) > 0 && (
        <Toggle label={t('settings.liveBufferIptv')} sub={t('settings.liveBufferIptvHint')} on={!!settings.liveBufferIptv} onChange={(v) => update({ liveBufferIptv: v })} />
      )}
      <div className="field">
        <label>{t('settings.tonightStart')}</label>
        <input className="input" data-f type="time" value={`${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`} onChange={(e) => {
          const [h, m] = e.target.value.split(':').map(Number);
          if (!isNaN(h)) update({ tonightStartMin: h * 60 + (m || 0) });
        }} />
      </div>
    </div>
  );
}

function ParentalSection() {
  const profile = useApp((s) => s.profile)!;
  const settings = useApp((s) => s.settings);
  const update = useApp((s) => s.updateSettings);
  const [pinFor, setPinFor] = useState<'set' | 'disable' | null>(null);
  const patch = async (x: Partial<Profile>) => {
    await updateProfile(profile.id, x);
    useApp.getState().patchProfile(x);
  };
  return (
    <div className="form">
      <Toggle
        label={t('settings.parentalOn')}
        on={profile.parental.enabled}
        onChange={(v) => setPinFor(v ? 'set' : 'disable')}
      />
      <Toggle label={t('settings.hideAdult')} on={settings.hideAdult} onChange={(v) => (profile.parental.enabled && !v ? setPinFor('disable') : update({ hideAdult: v }))} />
      {profile.parental.enabled && (
        <div className="field">
          <label>{t('settings.maxAge')}</label>
          <div className="seg" data-row style={{ flexWrap: 'wrap' }}>
            {[undefined, 10, 12, 16].map((a) => (
              <button key={a ?? 'none'} data-f className={profile.parental.maxAge === a ? 'on' : ''} onClick={() => void patch({ parental: { ...profile.parental, maxAge: a } })}>
                {a === undefined ? t('settings.maxAgeNone') : `-${a}`}
              </button>
            ))}
          </div>
          <span className="small dim">{t('settings.maxAgeHelp')}</span>
        </div>
      )}
      {pinFor === 'set' && (
        <PinPad setMode title={t('settings.parentalPin')} onClose={() => setPinFor(null)} onOk={(pin) => (void patch({ parental: { enabled: true, pin } }), setPinFor(null))} />
      )}
      {pinFor === 'disable' && (
        <PinPad
          expected={profile.parental.pin}
          onClose={() => setPinFor(null)}
          onOk={() => {
            void patch({ parental: { enabled: false } });
            update({ hideAdult: false });
            setPinFor(null);
          }}
        />
      )}
    </div>
  );
}

function SyncSection() {
  const profile = useApp((s) => s.profile)!;
  const settings = useApp((s) => s.settings);
  const update = useApp((s) => s.updateSettings);
  const sync = useApp((s) => s.sync);
  const [epgAt, setEpgAt] = useState<number | undefined>();
  useEffect(() => void getMeta<number>(`epg:last:${profile.id}`).then(setEpgAt), [profile.id, sync.running]);
  const counts = useLiveQuery(async () => ({
    ch: await db.channels.where('profileId').equals(profile.id).count(),
    mv: await db.movies.where('profileId').equals(profile.id).count(),
    sr: await db.series.where('profileId').equals(profile.id).count(),
    pg: await db.programs.count(),
  }), [profile.id, sync.running]);
  return (
    <div className="form">
      <div className="card-box">
        <div>{t('sync.last', { date: profile.lastSyncAt ? `${fmtDate(profile.lastSyncAt)} ${fmtTime(profile.lastSyncAt)}` : t('time.never') })}</div>
        {epgAt && <div className="small muted">{t('sync.epg')} : {fmtDate(epgAt)} {fmtTime(epgAt)}</div>}
        {counts && <div className="small muted" style={{ marginTop: 6 }}>{counts.ch} · {counts.mv} · {counts.sr} · {counts.pg} EPG</div>}
        {sync.running && <div className="small" style={{ marginTop: 6 }}><span className="spinner" style={{ display: 'inline-block', verticalAlign: -4, marginRight: 8 }} />{sync.progress?.message || t('sync.running')}</div>}
        {sync.lastError && <div className="small msg-ko">{sync.lastError}</div>}
      </div>
      <div className="btn-row">
        <button className="btn primary" data-f disabled={sync.running} onClick={() => void runSync(profile.id)}><IcRefresh /> {t('sync.now')}</button>
      </div>
      <h2>{t('settings.syncInterval')}</h2>
      <div className="seg" data-row>
        {[6, 12, 24, 48].map((h) => (
          <button key={h} data-f className={settings.syncIntervalH === h ? 'on' : ''} onClick={() => (update({ syncIntervalH: h }), void schedulePrefetch(profile.id))}>{t('settings.every', { n: h })}</button>
        ))}
      </div>
      {isAndroidApp && <PrefetchBox />}
    </div>
  );
}

/** Android WorkManager pre-download: catalogues and guides fetched while the app is closed */
function PrefetchBox() {
  const profile = useApp((s) => s.profile)!;
  const settings = useApp((s) => s.settings);
  const update = useApp((s) => s.updateSettings);
  const [st, setSt] = useState<Awaited<ReturnType<typeof CyberNative.prefetchStatus>> | null>(null);
  const refresh = () => void CyberNative.prefetchStatus().then(setSt).catch(() => {});
  useEffect(refresh, []);
  const set = (p: Partial<typeof settings>) => {
    update(p);
    void schedulePrefetch(profile.id).then(refresh);
  };
  return (
    <>
      <h2>{t('prefetch.title')}</h2>
      <Toggle label={t('prefetch.on')} sub={t('prefetch.sub')} on={settings.prefetch} onChange={(v) => set({ prefetch: v })} />
      {settings.prefetch && <Toggle label={t('prefetch.wifi')} on={settings.prefetchWifiOnly} onChange={(v) => set({ prefetchWifiOnly: v })} />}
      {settings.prefetch && (
        <div className="card-box">
          <div className="small">
            {st?.lastOkAt ? t('prefetch.last', { date: `${fmtDate(st.lastOkAt, { day: 'numeric', month: 'short' })} ${fmtTime(st.lastOkAt)}`, n: st.files }) : t('prefetch.never')}
            {st?.errors ? <span className="msg-ko"> · {t('prefetch.errors', { n: st.errors })}</span> : null}
          </div>
          <div className="btn-row" style={{ marginTop: 10 }}>
            <button className="btn small" data-f onClick={() => void schedulePrefetch(profile.id, true).then(() => setTimeout(refresh, 4000))}>
              <IcRefresh /> {t('prefetch.now')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function CategoriesSection() {
  const profile = useApp((s) => s.profile)!;
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [kind, setKind] = useState<Category['kind']>('live');
  useEffect(() => void getMeta<string[]>(`hiddenCats:${profile.id}`).then((l) => setHidden(new Set(l || []))), [profile.id]);
  const cats = useLiveQuery(() => db.categories.where('[profileId+kind]').equals([profile.id, kind]).sortBy('order'), [profile.id, kind]);
  const toggle = async (id: string) => {
    const n = new Set(hidden);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    setHidden(n);
    await setMeta(`hiddenCats:${profile.id}`, [...n]);
    useApp.getState().bumpCatalog();
  };
  return (
    <div className="form">
      <p className="muted">{t('settings.categoriesHelp')}</p>
      <div className="seg" data-row>
        {(['live', 'vod', 'series'] as const).map((k) => (
          <button key={k} data-f className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{k === 'live' ? t('sync.live') : k === 'vod' ? t('sync.vod') : t('sync.series')}</button>
        ))}
      </div>
      <div className="list">
        {(cats || []).map((c) => (
          <Toggle key={c.id} label={c.name} sub={t(`universe.${c.universe}` as 'universe.sport')} on={!hidden.has(c.id)} onChange={() => void toggle(c.id)} />
        ))}
      </div>
    </div>
  );
}

function AboutSection() {
  const update = useApp((s) => s.update);
  const toast = useApp((s) => s.toast);
  const [info, setInfo] = useState<{ versionCode: number; versionName: string; webVersion?: string } | null>(null);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    if (isAndroidApp) void CyberNative.updateInfo().then(setInfo).catch(() => {});
  }, []);
  const check = async () => {
    setChecking(true);
    try {
      const result = await runUpdateCheck(true);
      if (result?.status === 'unconfigured') toast(t('update.channelMissing'));
      else if (result?.status === 'unavailable') toast(t('update.checkUnavailable'));
      else if (useApp.getState().update.kind === 'none') toast(t('update.upToDate'));
      else useApp.setState({ updateDismissed: false });
    } finally {
      setChecking(false);
    }
  };
  return (
    <div className="form">
      <p style={{ lineHeight: 1.6 }}>{t('settings.aboutText')}</p>
      <p className="small muted">
        Cyberstream {info?.webVersion || APP_VERSION}
        {info ? ` · app ${info.versionName} (${info.versionCode})` : ''} · Media3 / hls.js / mpegts.js · TMDB
      </p>
      {/* no update channel (F-Droid build, dev): the store updates the app, no check here */}
      {!hasUpdateChannel ? null : isAndroidApp || isDesktop ? (
        <div className="btn-row">
          <button className="btn" data-f disabled={checking} onClick={() => void check()}>
            {checking ? <span className="spinner" /> : <IcRefresh />} {t('update.check')}
          </button>
          {update.kind !== 'none' && <span className="small">{update.kind === 'apk' || update.kind === 'desktop' ? t('update.available', { v: update.version }) : t('update.webReady', { v: update.version })}</span>}
        </div>
      ) : (
        <p className="small dim">{t('update.webOnly')}</p>
      )}
      {(isAndroidApp || isDesktop) && <div className="btn-row">
        <a className="btn" data-f href={RELEASES_URL} target="_blank" rel="noreferrer">{t('update.releases')}</a>
      </div>}
      <button className="btn" data-f onClick={async () => {
        if ('caches' in window) for (const k of await caches.keys()) await caches.delete(k);
        if (isAndroidApp) await CyberNative.clearImageCache().catch(() => {});
        useApp.getState().toast('OK');
      }}>{t('settings.clearCache')}</button>
    </div>
  );
}

export async function hasTmdb(profileId: string) {
  return !!(await secureGet(tmdbKey(profileId)));
}
