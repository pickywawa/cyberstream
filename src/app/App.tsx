import { lazy, Suspense } from 'react';
import { useApp } from '@/state/store';
import { ProfilePicker } from '@/ui/screens/Profiles';
import { Onboarding } from '@/ui/screens/Onboarding';
import { Shell } from '@/ui/Shell';
import { VoiceControl } from '@/ui/voice/VoiceControl';
import { Sheet } from '@/ui/components/Overlay';
import { t } from '@/core/i18n';
import { quitApp } from './services';

const Player = lazy(() => import('@/ui/screens/Player').then((m) => ({ default: m.Player })));

export function App() {
  const screen = useApp((s) => s.screen);
  const player = useApp((s) => s.player);
  const toasts = useApp((s) => s.toasts);
  const launching = useApp((s) => s.launching);
  const exitAsk = useApp((s) => s.exitAsk);
  return (
    <>
      {screen === 'boot' && (
        <div className="center-screen">
          <Logo />
          <div className="spinner big" style={{ marginTop: 24 }} />
        </div>
      )}
      {screen === 'profiles' && <ProfilePicker />}
      {screen === 'onboarding' && <Onboarding />}
      {screen === 'app' && <Shell />}
      {player && (
        <Suspense fallback={null}>
          <Player req={player} />
        </Suspense>
      )}
      {launching && !player && (
        <div className="launching" role="status" aria-label="…">
          <div className="spinner big" />
        </div>
      )}
      {exitAsk && <ExitConfirm />}
      <VoiceControl />
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.text}
          </div>
        ))}
      </div>
    </>
  );
}

/** Back at the root of a tab (Android): leave the app? "Annuler" is focused so a second Back / OK stays */
function ExitConfirm() {
  const close = () => useApp.setState({ exitAsk: false });
  return (
    <Sheet title={t('app.exitTitle')} onClose={close} bottom={false}>
      <div className="btn-row" data-row>
        <button className="btn" data-f data-autofocus onClick={close}>{t('common.cancel')}</button>
        <button className="btn primary" data-f onClick={() => void quitApp()}>{t('app.exit')}</button>
      </div>
    </Sheet>
  );
}

export function Logo({ size = 1 }: { size?: number }) {
  return (
    <div className="logo" style={{ fontSize: `${1.55 * size}rem` }} aria-label="Cyberstream">
      <LogoMark />
      <span>
        <span className="w1">Cyber</span>
        <span className="w2">stream</span>
      </span>
    </div>
  );
}

/** Brand mark: green rounded square with a dark play triangle */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" fill="var(--accent, #4fe3a8)" />
      <path d="M22.58 20.75c0-2 2.2-3.2 3.9-2.1l17.4 11.2c1.5 1 1.5 3.3 0 4.3L26.48 45.35c-1.7 1.1-3.9-.1-3.9-2.1z" fill="#0d1f19" />
    </svg>
  );
}
