import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { GuidePrograms, useGuideWindow } from '../components/GuidePrograms';
import { useRows } from '../hooks/useRows';
import { useApp } from '@/state/store';
import { t, fmtTime, fmtDate, getLang } from '@/core/i18n';
import { liveChannels, programsForMany } from '@/core/repo';
import { db } from '@/core/db';
import { getGuideList } from '../guideList';
import type { Channel, Program } from '@/core/types';
import { canCatchup } from '@/core/sources/urls';
import { useAsync, useNow } from '../hooks';
import { Img } from '../components/Img';
import { BackButton } from '../components/BackButton';
import { Sheet } from '../components/Overlay';
import { playChannel } from '../actions';
import { focusEl } from '../spatial';
import { program_html } from '@/rust/generated/cyberstream';
import { RustView } from '../components/RustView';
import { langPrefs, profileCountry } from '@/core/prefs';
import { matchesLangs, rankChannels } from '@/core/channelRank';

const ROW_H = 64;
/** last programmes per day, so the guide reopens at once */
const GUIDE_CACHE = new Map<string, Map<string, Program[]>>();
const CH_W = 120;
const PX_PER_MIN = 4.2;

export function Guide({ channelId }: { channelId?: string }) {
  const profile = useApp((s) => s.profile)!;
  const settings = useApp((s) => s.settings);
  const now = useNow(60000);
  const [dayOffset, setDayOffset] = useState(0);
  const [selected, setSelected] = useState<{ ch: Channel; p: Program } | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  const today = new Date(now).toDateString();
  const day0 = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    return d.getTime();
  }, [today, dayOffset]);
  const end = new Date(day0);
  end.setDate(end.getDate() + 1);
  end.setHours(3);
  const dayEnd = end.getTime();

  // channels: the TV tab's current list (same category, same order); otherwise the ranked ones
  const epgVersion = useApp((st) => st.epgVersion);
  const channels = useAsync(
    async () => {
      const ids = getGuideList();
      if (ids?.length) return (await db.channels.bulkGet(ids)).filter(Boolean) as Channel[];
      const all = await liveChannels(profile.id, { hideAdult: settings.hideAdult });
      const prefs = langPrefs(profile);
      const mine = all.filter((c) => c.epgId && matchesLangs(c, prefs));
      return rankChannels(mine.length >= 5 ? mine : all.filter((c) => c.epgId), { country: profileCountry(profile), prefs });
    },
    [profile.id],
    { key: `guide:ch:${profile.id}:${settings.hideAdult}:${getGuideList()?.length ?? 0}:${getGuideList()?.[0] ?? ''}` },
  );
  // programmes: the first rows at once, the others in the background, chunk by chunk
  const [progs, setProgs] = useState<Map<string, Program[]> | null>(() => GUIDE_CACHE.get(`${day0}`) || null);
  const shownDay = useRef(day0);
  useEffect(() => {
    if (!channels) return;
    let off = false;
    const ids = [...new Set(channels.map((c) => c.epgId).filter(Boolean) as string[])];
    // another day: its own data; same day (list or guide refreshed): keep showing what we have,
    // never swap the grid back for the loader (the scroll to "now" would be lost)
    if (shownDay.current !== day0) {
      shownDay.current = day0;
      setProgs(GUIDE_CACHE.get(`${day0}`) || null);
    }
    void (async () => {
      const acc = new Map<string, Program[]>(GUIDE_CACHE.get(`${day0}`) || []);
      for (let i = 0; i < ids.length && !off; i += i === 0 ? 40 : 250) {
        const part = await programsForMany(ids.slice(i, i + (i === 0 ? 40 : 250)), day0, dayEnd);
        if (off) return;
        for (const id of ids.slice(i, i + (i === 0 ? 40 : 250))) acc.delete(id);
        for (const [k, v] of part) acc.set(k, v);
        setProgs(new Map(acc));
      }
      if (!off) {
        if (ids.length === 0) setProgs(new Map());
        GUIDE_CACHE.delete(`${day0}`);
        GUIDE_CACHE.set(`${day0}`, acc);
        if (GUIDE_CACHE.size > 2) GUIDE_CACHE.delete(GUIDE_CACHE.keys().next().value!);
      }
    })();
    return () => {
      off = true;
    };
  }, [channels, day0, dayEnd, epgVersion]);
  const rows = useMemo(() => {
    const seen = new Set<string>();
    // the TV tab's list as is (channels without programmes too, so both screens match);
    // in long lists ("All channels"), only the first ones without programmes
    return (channels || []).filter((c, i) => {
      const key = c.epgId || c.groupKey;
      if (seen.has(key)) return false;
      const keep = progs?.has(c.epgId!) || (!!getGuideList() && i < 120);
      if (keep) seen.add(key);
      return keep;
    });
  }, [channels, progs]);
  const totalW = CH_W + ((dayEnd - day0) / 60000) * PX_PER_MIN;
  const x = (ts: number) => CH_W + ((ts - day0) / 60000) * PX_PER_MIN;

  const horizontal = useGuideWindow(bodyRef);
  const visible = useRows(bodyRef, rows.length, ROW_H, 34, 6);

  // scroll to "now" (or the requested channel) once
  const did = useRef(false);
  useLayoutEffect(() => {
    // only once the grid itself is on screen (not the loader), else the scroll is lost
    if (did.current || !rows.length || !progs?.size || !bodyRef.current) return;
    did.current = true;
    const target = Math.max(0, x(Date.now()) - CH_W - 120);
    bodyRef.current.scrollLeft = target;
    // the grid may get its full width a frame later
    requestAnimationFrame(() => {
      if (bodyRef.current && Math.abs(bodyRef.current.scrollLeft - target) > 2) bodyRef.current.scrollLeft = target;
    });
    if (channelId) {
      const i = rows.findIndex((r) => r.id === channelId);
      if (i > 0) bodyRef.current.scrollTop = 34 + i * ROW_H - (bodyRef.current.clientHeight - ROW_H) / 2;
    }
    requestAnimationFrame(() => {
      const el = bodyRef.current?.querySelector<HTMLElement>('.guide-prog.now');
      focusEl(el, false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.length, !!progs?.size]);

  useEffect(() => {
    if (dayOffset !== 0 && bodyRef.current) bodyRef.current.scrollLeft = x(day0 + 18 * 3600000) - CH_W - 60;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayOffset]);

  const hours = [];
  for (let h = day0; h < dayEnd; h += 1800000) hours.push(h);
  const days = [-2, -1, 0, 1, 2];
  const dayLabel = (o: number) => {
    if (o === 0) return t('tv.today');
    if (o === -1) return t('tv.yesterday');
    if (o === 1) return t('tv.tomorrow');
    const d = new Date(today);
    d.setDate(d.getDate() + o);
    return fmtDate(d.getTime(), { weekday: 'long', day: 'numeric' });
  };

  return (
    <div className="guide">
      <div className="guide-top">
        <BackButton floating={false} />
        <h1 className="section-title">{t('tv.guide')}</h1>
        <div className="guide-days chips" data-row style={{ padding: 0 }}>
          {days.map((o) => (
            <button
              key={o}
              data-f
              className={`chip ${dayOffset === o ? 'active' : ''}`}
              onClick={() => setDayOffset(o)}
              // start the day strip on the selected day (today) rather than on past days
              ref={dayOffset === o ? (el) => el?.scrollIntoView({ inline: 'center', block: 'nearest' }) : undefined}
            >
              {dayLabel(o)}
            </button>
          ))}
        </div>
      </div>
      <div className="guide-body" ref={bodyRef}>
        {!channels || !progs ? (
          <div className="spinner big" style={{ margin: '60px auto' }} />
        ) : rows.length === 0 ? (
          <div className="empty">{t('tv.noProgram')}</div>
        ) : (
          <div style={{ position: 'relative', width: totalW, height: 34 + rows.length * ROW_H }}>
            <div className="guide-timebar" style={{ width: totalW }}>
              {hours.map((h) => (
                <span key={h} className="guide-time" style={{ left: x(h) }}>
                  {fmtTime(h)}
                </span>
              ))}
            </div>
            {now >= day0 && now < dayEnd && <div className="guide-now" style={{ left: x(now) }} />}
            {visible.map((index) => {
              const ch = rows[index];
              const list = (ch.epgId && progs.get(ch.epgId)) || [];
              return (
                <div key={ch.id} className="guide-row" data-row style={{ top: (34 + index * ROW_H), width: totalW }}>
                  <div className="guide-ch" title={ch.name} onClick={() => void playChannel(ch)}>
                    <Img srcs={[ch.logoAlt, ch.logo]} contain label={ch.name} alt={ch.name} />
                  </div>
                  {!list.length && (
                    <div className="guide-empty" style={{ left: CH_W }}>
                      {t('tv.noProgram')}
                    </div>
                  )}
                  {!!list.length && <GuidePrograms list={list} day={day0} end={dayEnd} now={now} range={horizontal}
                    channelWidth={CH_W} scale={PX_PER_MIN} catchup={canCatchup(ch)} fr={profile.lang === 'fr'}
                    select={p => setSelected({ ch, p })} />}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {selected && <ProgramSheet ch={selected.ch} p={selected.p} onClose={() => setSelected(null)} />}
    </div>
  );
}

export function displayProgram(p: Program) {
  return { ...p, from: fmtTime(p.start), to: fmtTime(p.stop), day: fmtDate(p.start, { weekday: 'long', day: 'numeric', month: 'long' }) };
}
export function ProgramSheet({ ch, p, onClose }: { ch: Channel; p: Program; onClose: () => void }) {
  const html = program_html(JSON.stringify(ch, ['name','catchupDays','catchupMode']), JSON.stringify(displayProgram(p)), getLang(), Date.now());
  return <Sheet title={p.title} onClose={onClose}><RustView className="program-details" html={html} onCommand={cmd => {
    onClose();
    if (cmd === 'play' || cmd === 'restart') void playChannel(ch, { program: p, fromStart: cmd === 'restart' });
  }} /></Sheet>;
}
