import { useEffect, useMemo, useState } from 'react';
import { useApp, type GridFilter } from '@/state/store';
import { t } from '@/core/i18n';
import { langPrefs } from '@/core/prefs';
import { searchWorker } from '@/core/workers';
import { db } from '@/core/db';
import { grid_row, grid_toolbar } from '@/rust/generated/cyberstream';
import { useAsync, useMediaQuery } from '../hooks';
import { VirtualGridRows } from '../components/VirtualGrid';
import { RustView, readCommand } from '../components/RustView';
import { openMovie, openSeries, prioritizeEnrichment } from '../actions';
import { isTvMode } from '@/core/platform';

type Kind = 'movie' | 'series';

function CatalogRow({ kind, ids }: { kind: Kind; ids: string[] }) {
  const key = JSON.stringify(ids);
  const html = useAsync(async () => {
    const items = await (kind === 'movie' ? db.movies : db.series).bulkGet(ids);
    return grid_row(JSON.stringify(items, ['id','title','genres','year','poster','imdbRating']), kind);
  }, [kind, key], { key: `grid-row:${kind}:${key}` });
  return <RustView className="catalog-row" html={html || ''} onCommand={cmd => {
    const [action, id] = readCommand(cmd);
    if (action === 'movie') openMovie(id);
    if (action === 'series') openSeries(id);
  }} />;
}

export function Grid({ kind, title, filter }: { kind: Kind; title: string; filter: GridFilter }) {
  const profile = useApp(s => s.profile)!;
  const hideAdult = useApp(s => s.settings.hideAdult);
  const [sort, setSort] = useState(filter.sort || 'added');
  const [sub, setSub] = useState(0);
  const mobile = useMediaQuery('(max-width: 760px)') && !isTvMode();
  const prefs = langPrefs(profile);
  const key = JSON.stringify([profile.id, kind, filter, sort, hideAdult, prefs, sub]);
  const result = useAsync(() => searchWorker().grid(profile.id, kind, { ...filter, sort }, hideAdult, prefs, sub),
    [key], { key: 'grid:' + key });
  const ids = result?.[0];
  const toolbar = useMemo(() => grid_toolbar(title, profile.lang, ids?.length ?? -1,
    Uint32Array.from(filter.genre ? [] : result?.[1] || []), sub, sort), [result, title, profile.lang, sub, sort, filter.genre, ids]);
  useEffect(() => {
    if (!ids?.length) return;
    let active = true;
    void (kind === 'movie' ? db.movies : db.series).bulkGet(ids.slice(0, 40)).then(rows => {
      if (active) prioritizeEnrichment(kind, rows.flatMap(x => x ? [x] : []));
    });
    return () => { active = false; };
  }, [ids, kind]);
  return <div style={{ paddingBottom: 40 }}>
    <RustView className="grid-tools" html={toolbar} onCommand={cmd => {
      const [action, value] = readCommand(cmd);
      if (action === 'back') useApp.getState().pop();
      if (action === 'sub') setSub(Number(value));
      if (action === 'sort' && (value === 'year' || value === 'title' || value === 'rating' || value === 'added')) setSort(value);
    }} />
    <div className="container" style={{ paddingTop: 12 }}>
      {!ids ? <div className="spinner big" style={{ margin: '60px auto' }} /> : !ids.length ? <div className="empty">{t('common.empty')}</div> :
        <VirtualGridRows className="vgrid" items={ids} minWidth={mobile ? 104 : 170} aspect={2 / 3} extraHeight={52}
          gap={mobile ? 10 : 18} row={slice => <CatalogRow kind={kind} ids={slice} />} />}
    </div>
  </div>;
}
