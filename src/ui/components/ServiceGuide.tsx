import { useState } from 'react';
import { useApp } from '@/state/store';
import { t, type I18nKey } from '@/core/i18n';
import { isTvMode } from '@/core/platform';
import { canEnroll } from '@/core/enroll';
import { QrCode } from './EnrollPanel';

/**
 * "How to get it" under a service key field (TMDB, OpenSubtitles, Trakt): the steps, the page to
 * open (a button, or a QR code on a TV where there is no browser to speak of), a value to copy,
 * and on a TV the shortcut to type everything on the phone instead.
 */
export function ServiceGuide({ site, url, steps, copy, open: openAtFirst = false }: {
  site: string; url: string; steps: I18nKey[]; copy?: string; open?: boolean;
}) {
  const [open, setOpen] = useState(openAtFirst);
  const [copied, setCopied] = useState(false);
  const push = useApp((s) => s.push);
  const tv = isTvMode();
  return (
    <div className="service-guide">
      <button className="btn small ghost" data-f aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? '▾' : '▸'} {t('help.how')}
      </button>
      {open && (
        <div className="guide-body">
          <div className="guide-text">
            <ol>{steps.map((k) => <li key={k}>{t(k)}</li>)}</ol>
            <div className="btn-row" data-row>
              {!tv && <button className="btn small primary" data-f onClick={() => window.open(url, '_blank')}>{t('help.open', { site })}</button>}
              {copy && !tv && (
                <button className="btn small" data-f onClick={() => void navigator.clipboard?.writeText(copy).then(() => setCopied(true), () => {})}>
                  {copied ? t('help.copied') : `${t('help.copy')} ${copy}`}
                </button>
              )}
              {tv && canEnroll && <button className="btn small primary" data-f onClick={() => push({ name: 'enroll' })}>📱 {t('help.fromPhone')}</button>}
            </div>
            <p className="small dim">{t('help.noAuto')}</p>
          </div>
          {tv && (
            <div className="guide-qr">
              <QrCode text={url} size={150} />
              <span className="small dim">{t('help.scan')}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
