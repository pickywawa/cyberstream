import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '@/state/store';
import { youtube_html } from '@/rust/generated/cyberstream';
import { CyberNative } from '@/core/native';
import { isAndroidApp, isTvMode } from '@/core/platform';
import { RustView } from '../components/RustView';

/**
 * A YouTube video in YouTube's own embedded player (full screen, landscape on phones like the
 * app's player). "Open in YouTube" hands it to the YouTube app / site when embedding is refused
 * or on a TV remote.
 */
export function YouTubePage({ id, title }: { id: string; title?: string }) {
  const pop = useApp((s) => s.pop);
  const lang = useApp((s) => s.profile?.lang || 'fr');
  useEffect(() => {
    if (!isAndroidApp || isTvMode()) return;
    void CyberNative.setOrientation({ mode: 'landscape' }).catch(() => {});
    void CyberNative.setImmersive({ on: true }).catch(() => {});
    return () => {
      void CyberNative.setOrientation({ mode: 'auto' }).catch(() => {});
      void CyberNative.setImmersive({ on: false }).catch(() => {});
    };
  }, []);
  return createPortal(<RustView className="yt-page" scope html={youtube_html(id, title || '', lang, isTvMode())} onCommand={cmd => {
    if (cmd === 'back') pop();
    if (cmd === 'open') window.open(`https://www.youtube.com/watch?v=${encodeURIComponent(id)}`, '_blank');
  }} />, document.body);
}
