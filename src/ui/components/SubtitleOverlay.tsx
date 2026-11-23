import { useEffect, useRef, useState } from 'react';
import { cueTrack, type Cue } from '@/core/subs/parse';

/**
 * Renders external subtitles above the video, for both engines.
 * `getTime` returns the playhead in seconds (video.currentTime on the web; on Android the native
 * position, interpolated between its 500 ms updates). `offset` shifts every cue.
 */
export function SubtitleOverlay({ cues, offset, getTime, raised, rate }: { cues: Cue[]; offset: number; getTime: () => number; raised: boolean; rate: number }) {
  const [html, setHtml] = useState('');
  const last = useRef('');
  useEffect(() => {
    const track = cueTrack(cues);
    let timer = 0;
    const tick = () => {
      const time = getTime() - offset;
      const active = track.active(time);
      const next = Array.from(active, i => cues[i].text.replace(/\n/g, '<br/>')).join('<br/>');
      if (next !== last.current) {
        last.current = next;
        setHtml(next);
      }
      const until = 1000 * (track.next_change(time, active) - time) / rate;
      timer = window.setTimeout(tick, Math.max(16, Math.min(250, until)));
    };
    tick();
    return () => { clearTimeout(timer); track.free(); };
  }, [cues, offset, getTime, rate]);
  if (!html) return null;
  // cue text is sanitised by the parser (only <i>, <b>, <u> survive)
  return (
    <div className={`ext-subs ${raised ? 'raised' : ''}`} aria-live="off">
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
