import { useEffect, useRef, useState } from 'react';
import { useApp } from '@/state/store';
import { t } from '@/core/i18n';
import { db } from '@/core/db';
import { dataWorker } from '@/core/workers';
import { wikiTrailers } from '@/core/enrich/people';
import type { Movie, Series } from '@/core/types';
import { IcVolume, IcVolumeOff } from '../icons';

/**
 * The trailers of a title, best first. Looked for when there is none, or when alternatives were
 * never looked for (YouTube refuses some videos in an embed): TMDB (with a key), then Wikidata
 * (no key needed: the provider gives the TMDB id). At most daily; saved on every copy of the title.
 */
export function useTrailers(kind: 'movie' | 'series', it: Movie | Series): string[] {
  const own = [it.trailer, ...(it.trailerAlts || [])].filter((u): u is string => !!u);
  const [found, setFound] = useState<{ id: string; list: string[] } | null>(null);
  const need = !!it.tmdbId && (!it.trailer || !it.trailerAlts) && Date.now() - (it.trailerLookupAt || 0) > 86400000;
  useEffect(() => {
    if (!need || !it.tmdbId) return;
    let off = false;
    void lookupTrailers(kind, it).then((list) => !off && setFound({ id: it.id, list }));
    return () => {
      off = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [need, it.id, it.tmdbId]);
  return found?.id === it.id && found.list.length ? found.list : own;
}

const looking = new Map<string, Promise<string[]>>();
function lookupTrailers(kind: 'movie' | 'series', it: Movie | Series): Promise<string[]> {
  const key = `${kind}:${it.id}`;
  const cur = looking.get(key);
  if (cur) return cur;
  const p = (async () => {
    const [tm, wd] = await Promise.all([
      dataWorker().tmdbTrailers(kind === 'movie' ? 'movie' : 'tv', it.tmdbId!).catch(() => [] as string[]),
      wikiTrailers(kind, it.tmdbId!).catch(() => [] as string[]),
    ]);
    const list = [...new Set([it.trailer, ...tm, ...wd].filter((u): u is string => !!u))];
    const table = (kind === 'movie' ? db.movies : db.series) as typeof db.movies;
    const keys = await table.where('groupKey').equals(it.groupKey).primaryKeys();
    const patch = list.length ? { trailer: list[0], trailerAlts: list.slice(1), trailerLookupAt: Date.now() } : { trailerLookupAt: Date.now() };
    for (const k of new Set([it.id, ...keys])) await table.update(k, patch);
    return list;
  })().finally(() => looking.delete(key));
  looking.set(key, p);
  return p;
}

function youtubeKey(url?: string): string | undefined {
  return url?.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];
}

/**
 * Trailer replacing the backdrop shortly after the page opens (YouTube embed, no controls).
 * Sound on by default; muting is remembered for the next trailers. If the browser refuses to
 * autoplay with sound, it plays muted instead (without changing the saved choice).
 */
/** how long the video plays hidden before it shows (YouTube's start overlay fades out meanwhile) */
const REVEAL_MS = 1600;

export function TrailerBg({ urls, delay = 300, active = true }: {
  urls: (string | undefined)[];
  /** time the image stays alone before the trailer loads (ms) */
  delay?: number;
  /** false while the screen is covered (a film page over Home): nothing plays behind */
  active?: boolean;
}) {
  const settings = useApp((s) => s.settings);
  const update = useApp((s) => s.updateSettings);
  const playing = useApp((s) => !!s.player);
  // YouTube refuses some videos in an embed (error 101 / 150): the next one is tried
  const keys = [...new Set(urls.map(youtubeKey).filter((k): k is string => !!k))];
  const [skip, setSkip] = useState(0);
  const keysId = keys.join();

  const key = keys[skip];
  const [mount, setMount] = useState(false);
  const [on, setOn] = useState(false);
  const [muted, setMuted] = useState(settings.trailerMuted);
  const ref = useRef<HTMLIFrameElement>(null);
  // like cybertv: "Animations réduites" (on by default on Android) no longer turns trailers off, only the setting does
  const enabled = !!key && settings.autoTrailer && !playing && active;
  const startMuted = useRef(settings.trailerMuted);
  // another title (banner slide): its image first, then its trailer
  useEffect(() => {
    setSkip(0);
    setOn(false);
  }, [keysId]);
  useEffect(() => {
    setMount(false);
    setOn(false);
    if (!enabled) return;
    startMuted.current = useApp.getState().settings.trailerMuted;
    setMuted(startMuted.current);
    const tm = setTimeout(() => setMount(true), delay);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, keysId]);

  const cmd = (func: string) => ref.current?.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*');

  /**
   * YouTube IFrame API messages. The video starts muted behind the image (muted autoplay is always
   * allowed) and shows once it has played long enough for YouTube's own buttons and title to fade
   * out; the sound comes on then (unless the user muted trailers). If unmuting without a tap pauses
   * it (browsers' autoplay rule), it goes on muted.
   */
  useEffect(() => {
    if (!mount || !key) return;
    let playingSeen = false;
    let failed = false;
    let talking = false;
    let shown = false;
    let reveal = 0;
    const onMsg = (e: MessageEvent) => {
      if (!/youtube(-nocookie)?\.com$/.test(new URL(e.origin).hostname) || e.source !== ref.current?.contentWindow) return;
      let d: any;
      try {
        d = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
      } catch {
        return;
      }
      talking = true;
      if (d?.event === 'onError') {
        failed = true;
        setOn(false);
        setSkip((n) => n + 1);
        return;
      }
      const state = d?.event === 'onStateChange' ? d.info : d?.info?.playerState;
      if (state === 1 && !playingSeen) {
        playingSeen = true;
        reveal = window.setTimeout(() => {
          shown = true;
          setOn(true);
          if (!startMuted.current) cmd('unMute');
        }, REVEAL_MS);
      }
      if (state === 2 && shown) {
        cmd('mute');
        cmd('playVideo');
        setMuted(true);
      }
    };
    window.addEventListener('message', onMsg);
    const fallback = setTimeout(() => {
      if (playingSeen || failed) return;
      cmd('playVideo');
      // no API message at all (blocked postMessage): no way to know, show it as before
      if (!talking) setTimeout(() => setOn(true), 1200);
    }, 3500);
    return () => {
      window.removeEventListener('message', onMsg);
      clearTimeout(fallback);
      clearTimeout(reveal);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mount, key]);

  if (!enabled || !mount) return null;
  const params = new URLSearchParams({
    autoplay: '1', mute: '1', controls: '0', loop: '1', playlist: key!, modestbranding: '1', playsinline: '1', rel: '0',
    iv_load_policy: '3', disablekb: '1', fs: '0', enablejsapi: '1', origin: location.origin,
  });
  return (
    <>
      <div className={`trailer ${on ? 'on' : ''}`}>
        <iframe
          ref={ref}
          src={`https://www.youtube-nocookie.com/embed/${key}?${params}`}
          title="trailer"
          tabIndex={-1}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => ref.current?.contentWindow?.postMessage(JSON.stringify({ event: 'listening', id: 'cyber-trailer' }), '*')}
        />
      </div>
      {on && (
        <button
          className="icon-btn trailer-mute"
          data-f
          onClick={() => {
            const next = !muted;
            cmd(next ? 'mute' : 'unMute');
            setMuted(next);
            // remembered for the next trailers
            update({ trailerMuted: next });
          }}
          aria-label={muted ? t('detail.unmute') : t('detail.mute')}
        >
          {muted ? <IcVolumeOff /> : <IcVolume />}
        </button>
      )}
    </>
  );
}
