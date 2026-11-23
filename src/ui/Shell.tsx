import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useApp, useRoute, type TabId } from '@/state/store';
import { t, getLang } from '@/core/i18n';
import { isTvMode } from '@/core/platform';
import { navigation } from '../rust/generated/cyberstream';
import { RustView } from './components/RustView';
import { ScreenActive, useMediaQuery } from './hooks';
import { focusFirst } from './spatial';
import { Home } from './screens/Home';
import { PinPad } from './components/PinPad';
import { UpdateBanner } from './components/UpdateBanner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LiveTv } from './screens/LiveTv';
import { startVoice, voiceAvailable } from './voice/VoiceControl';

const Search = lazy(() => import('./screens/Search').then((m) => ({ default: m.Search })));
const Replay = lazy(() => import('./screens/Replay').then((m) => ({ default: m.Replay })));
const MyVideos = lazy(() => import('./screens/MyVideos').then((m) => ({ default: m.MyVideos })));
const Settings = lazy(() => import('./screens/Settings').then((m) => ({ default: m.Settings })));
const StackView = lazy(() => import('./StackView').then((m) => ({ default: m.StackView })));

export function Shell() {
  const tab = useApp((s) => s.tab);
  const setTab = useApp((s) => s.setTab);
  const route = useRoute();
  const player = useApp((s) => s.player);
  const sync = useApp((s) => s.sync);
  const narrow = useMediaQuery('(max-width: 760px)');
  const mobile = narrow && !isTvMode();
  const [solid, setSolid] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  const [shownTab, setShownTab] = useState(tab);
  useEffect(() => {
    if (shownTab === tab) return;
    let f2 = 0;
    const f1 = requestAnimationFrame(() => (f2 = requestAnimationFrame(() => setShownTab(tab))));
    return () => (cancelAnimationFrame(f1), cancelAnimationFrame(f2));
  }, [tab, shownTab]);
  const switching = shownTab !== tab;

  useEffect(() => {
    document.documentElement.classList.toggle('mobile', mobile);
  }, [mobile]);

  // focus management on navigation (remote users)
  useEffect(() => {
    if (player) return;
    // only remote/keyboard users need an initial focus (avoids scroll jumps on touch)
    if (!document.documentElement.classList.contains('kbd')) return;
    // lazy screens mount a bit later: retry until something focusable exists
    let tries = 0;
    const tick = () => {
      const scope = document.querySelector<HTMLElement>('.stack-page:last-of-type') || pageRef.current;
      if (!scope) return;
      if (scope.contains(document.activeElement) || (!route && document.activeElement?.closest('.topnav'))) return;
      if (scope.querySelector('[data-f]')) focusFirst(scope);
      else if (tries++ < 30) timer = window.setTimeout(tick, 50);
    };
    let timer = window.setTimeout(tick, 16);
    return () => clearTimeout(timer);
  }, [shownTab, route, player]);

  useEffect(() => {
    const el = pageRef.current;
    if (!el) return;
    const h = () => setSolid(el.scrollTop > 40);
    el.addEventListener('scroll', h, { passive: true });
    return () => el.removeEventListener('scroll', h);
  }, [shownTab]);

  return (
    <div className="app-shell" aria-hidden={!!player} inert={player ? true : undefined}>
      {!mobile && <Navigation kind="desktop" tab={tab} solid={solid || !!route || tab !== 'home'} />}
      <div className={`page page-${shownTab}`} ref={pageRef} key={shownTab} inert={route ? true : undefined}>
        {mobile && <Navigation kind="mobile" tab={shownTab} />}
        <ErrorBoundary onReset={() => setTab('home')}>
        <ScreenActive.Provider value={!route && !player}>
        <Suspense fallback={<div className="empty"><div className="spinner big" style={{ margin: 'auto' }} /></div>}>
          {switching ? (
            <div className="tab-loading"><div className="spinner big" /></div>
          ) : (
            <>
              {shownTab === 'home' && <Home />}
              {shownTab === 'search' && <Search />}
              {shownTab === 'tv' && <LiveTv />}
              {shownTab === 'replay' && <Replay />}
              {shownTab === 'myvideos' && <MyVideos />}
              {shownTab === 'settings' && <Settings />}
            </>
          )}
        </Suspense>
        </ScreenActive.Provider>
        </ErrorBoundary>
      </div>
      {route && (
        <ScreenActive.Provider value={!player}>
          <Suspense fallback={null}>
            <StackView />
          </Suspense>
        </ScreenActive.Provider>
      )}
      {mobile && <Navigation kind="bottom" tab={tab} />}
      <PinGate />
      <UpdateBanner />
      {sync.running && !sync.quiet && (
        <div className="sync-pill">
          <span className="spinner" />
          {sync.progress?.step && sync.progress.step !== 'start' && sync.progress.step !== 'done' && sync.progress.step !== 'error'
            ? t(`sync.${sync.progress.step}` as 'sync.live')
            : t('sync.running')}
        </div>
      )}
    </div>
  );
}

function Navigation({ kind, tab, solid }: { kind: 'desktop' | 'mobile' | 'bottom'; tab: TabId; solid?: boolean }) {
  const profile = useApp(s => s.profile)!;
  const setTab = useApp(s => s.setTab);
  return <RustView tag={kind === 'desktop' ? 'header' : kind === 'bottom' ? 'nav' : 'div'}
    className={kind === 'desktop' ? `topnav ${solid ? 'solid' : ''}` : kind === 'bottom' ? 'bottomnav' : `mtop ${tab === 'home' ? 'over' : ''}`}
    html={navigation(kind,tab,getLang(),profile.emoji,profile.color,voiceAvailable)}
    onCommand={id => id === 'voice' ? void startVoice() : setTab(id as TabId)} />;
}

/** Parental PIN prompt, opened by `cyber:pin` events (adult channels) */
function PinGate() {
  const profile = useApp((s) => s.profile)!;
  const [pending, setPending] = useState<null | (() => void)>(null);
  useEffect(() => {
    const h = (e: Event) => setPending(() => (e as CustomEvent<() => void>).detail);
    window.addEventListener('cyber:pin', h);
    return () => window.removeEventListener('cyber:pin', h);
  }, []);
  if (!pending) return null;
  return (
    <PinPad
      expected={profile.parental.pin}
      onClose={() => setPending(null)}
      onOk={() => {
        useApp.getState().setUnlockedAdult(true);
        const cb = pending;
        setPending(null);
        cb();
      }}
    />
  );
}
