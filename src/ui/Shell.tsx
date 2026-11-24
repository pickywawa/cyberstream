import { lazy, Suspense, useEffect, useRef, useState, type ComponentType } from 'react';
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

/**
 * A screen loaded on first use. Once its code is there it renders straight away: React.lazy suspends
 * on the first render even when the module is already loaded, and React then keeps the spinner for
 * ~300 ms (fallback throttling) — what made Contenus slow to open after each launch.
 */
function screen<P extends object>(load: () => Promise<ComponentType<P>>) {
  let Loaded: ComponentType<P> | null = null;
  let pending: Promise<{ default: ComponentType<P> }> | null = null;
  const preload = () => (pending ??= load().then((C) => ((Loaded = C), { default: C })));
  const Lazy = lazy(preload);
  const Screen = (props: P) => (Loaded ? <Loaded {...props} /> : <Lazy {...props} />);
  return Object.assign(Screen, { preload });
}
const Search = screen(() => import('./screens/Search').then((m) => m.Search));
const Replay = screen(() => import('./screens/Replay').then((m) => m.Replay));
const MyVideos = screen(() => import('./screens/MyVideos').then((m) => m.MyVideos));
const Settings = screen(() => import('./screens/Settings').then((m) => m.Settings));
const StackView = screen(() => import('./StackView').then((m) => m.StackView));
/** after the start, while idle: every tab and the film / series page open without waiting */
const preloadScreens = () => [Search, MyVideos, StackView, Settings].forEach((s) => void s.preload().catch(() => {}));

/** the first focus after the app's start has been given (TV: the Accueil tab) */
let launchFocused = false;

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

  useEffect(() => {
    // Contenus' code is fetched at the profile's start anyway (its saved shelves are prepared then)
    void Replay.preload().catch(() => {});
    // requestIdleCallback is missing from older TV web engines
    const w = window as Window & { requestIdleCallback?: typeof requestIdleCallback; cancelIdleCallback?: typeof cancelIdleCallback };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(preloadScreens, { timeout: 5000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = setTimeout(preloadScreens, 2000);
    return () => clearTimeout(id);
  }, []);
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

  // a film page / the player opening over a tab: where the remote was (and how far the tab was
  // scrolled) is noted at that moment, before the tab goes inert and loses the focus…
  const back = useRef<{ el: HTMLElement; cmd?: string; block?: string; scroll: number } | null>(null);
  useEffect(() => useApp.subscribe((s, prev) => {
    const opening = (!prev.stack.length && s.stack.length > 0) || (!prev.player && !!s.player && !s.stack.length);
    const page = pageRef.current;
    const el = document.activeElement as HTMLElement | null;
    if (!opening || !page) return;
    back.current = el && page.contains(el) && el.hasAttribute('data-f')
      ? { el, cmd: el.dataset.cmd, block: el.closest<HTMLElement>('[data-block]')?.dataset.block, scroll: page.scrollTop }
      : null;
  }), []);
  /** …and given back when it closes: the same card (or the one with the same action if its shelf was redrawn), the same scroll */
  const restore = (page: HTMLElement): boolean => {
    const b = back.current;
    back.current = null;
    if (!b) return false;
    let el: HTMLElement | null = b.el.isConnected && page.contains(b.el) ? b.el : null;
    if (!el && b.cmd) {
      const scope = (b.block && page.querySelector(`[data-block="${CSS.escape(b.block)}"]`)) || page;
      el = scope.querySelector<HTMLElement>(`[data-f][data-cmd="${CSS.escape(b.cmd)}"]`);
    }
    if (!el) return false;
    page.scrollTop = b.scroll;
    el.focus({ preventScroll: true });
    return true;
  };

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
      // back from a film page / the player: the remote where it was
      if (!route && scope === pageRef.current && restore(scope)) return;
      // TV, app just started: the remote starts on the Accueil tab of the top bar, not on the banner
      if (!launchFocused && isTvMode() && !route && shownTab === 'home') {
        const homeTab = document.querySelector<HTMLElement>('.topnav [data-tabs] [data-f][data-cmd="home"]');
        if (homeTab) {
          launchFocused = true;
          homeTab.focus({ preventScroll: true });
          return;
        }
      }
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

  // a film / series / replay page: the tab bar stays see-through over its image (no black band)
  // until the page scrolls, like Home
  const overImage = !!route && ['movie', 'series', 'replay'].includes(route.name);
  const [routeSolid, setRouteSolid] = useState(false);
  useEffect(() => {
    setRouteSolid(false);
    if (!overImage) return;
    const h = (e: Event) => {
      const t = e.target as HTMLElement;
      if (t instanceof HTMLElement && t.classList.contains('stack-page')) setRouteSolid(t.scrollTop > 40);
    };
    document.addEventListener('scroll', h, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', h, { capture: true });
  }, [overImage, route]);

  return (
    <div className="app-shell" aria-hidden={!!player} inert={player ? true : undefined}>
      {!mobile && <Navigation kind="desktop" tab={tab} solid={route ? !overImage || routeSolid : solid || tab !== 'home'} />}
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
