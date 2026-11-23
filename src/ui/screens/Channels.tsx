import { useMemo, useState } from 'react';
import { useApp } from '@/state/store';
import { getLang } from '@/core/i18n';
import { db } from '@/core/db';
import { programsFor } from '@/core/repo';
import type { Program } from '@/core/types';
import { channel_html } from '@/rust/generated/cyberstream';
import { useAsync, useNow } from '../hooks';
import { RustView, readCommand } from '../components/RustView';
import { ProgramSheet, displayProgram } from './Guide';
import { playChannel } from '../actions';
import { setGuideList } from '../guideList';

export function ChannelPage({ id }: { id: string }) {
  const push = useApp((s) => s.push);
  const now = useNow(60000);
  const [sel, setSel] = useState<Program | null>(null);
  const ch = useAsync(() => db.channels.get(id), [id]);
  const progs = useAsync(
    async () => (ch?.epgId ? programsFor(ch.epgId, Date.now() - Math.min(7, Math.max(1, ch.catchupDays)) * 86400000, Date.now() + 2 * 86400000) : []),
    [ch, Math.floor(now / 60000)],
    { epg: true },
  );
  const lang = getLang();
  const raw = useMemo(() => JSON.stringify((progs || []).map(displayProgram)), [progs, lang]);
  const html = useMemo(() => ch && channel_html(JSON.stringify(ch, ['name','logoAlt','logo','catchupDays','catchupMode']), raw, lang, now), [ch, raw, lang, now]);
  if (!ch || !html) return null;
  const select = (cmd: string, held = false) => {
    const [action, i] = readCommand(cmd);
    const program = i ? progs?.[Number(i)] : undefined;
    if (held || action === 'sheet') return setSel(program || null);
    if (action === 'back') return useApp.getState().pop();
    if (action === 'guide') { setGuideList(null); push({ name: 'guide', channelId: ch.id }); }
    if (action === 'restart' || action === 'watch') void playChannel(ch, { program, fromStart: action === 'restart' });
  };
  return <div style={{ paddingBottom: 40 }}>
    <RustView className="channel-details" html={html} onCommand={select} onHold={cmd => select(cmd, true)} />
    {sel && <ProgramSheet ch={ch} p={sel} onClose={() => setSel(null)} />}
  </div>;
}
