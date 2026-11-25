import { useEffect, useMemo, useRef, useState } from 'react';
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
  // another sort / genre: the row keeps its cards until the new ones are read (no blank flash)
  const last = useRef(html);
  if (html !== undefined) last.current = html;
  return <RustView className="catalog-row" html={html ?? last.current ?? ''} onCommand={cmd => {
    const [action, id] = readCommand(cmd);
    if (action === 'movie') openMovie(id);
    if (action === 'series') openSeries(id);
  }} />;
}

/** `embedded`: under Home's categories (no back button / title, the chips only) */
export function Grid({ kind, title, filter, embedded }: { kind: Kind; title: string; filter: GridFilter; embedded?: boolean }) {
  const profile = useApp(s => s.profile)!;
  const hideAdult = useApp(s => s.settings.hideAdult);
  const [sort, setSort] = useState(filter.sort || 'added');
  const [sub, setSub] = useState(0);
  const mobile = useMediaQuery('(max-width: 760px)') && !isTvMode();
  const prefs = langPrefs(profile);
  const key = JSON.stringify([profile.id, kind, filter, sort, hideAdult, prefs, sub]);
  const fresh = useAsync(() => searchWorker().grid(profile.id, kind, { ...filter, sort }, hideAdult, prefs, sub),
    [key], { key: 'grid:' + key });
  // another sort / genre: the grid, its counts and its chips stay as they are until the new list
  // is there (they used to empty out for a moment: spinner, chips gone, the page jumping)
  const shown = useRef(fresh);
  if (fresh) shown.current = fresh;
  const result = fresh ?? shown.current;
  const ids = result?.[0];
  const toolbar = useMemo(() => grid_toolbar(title, profile.lang, ids?.length ?? -1,
    Uint32Array.from(filter.genre ? [] : result?.[1] || []), sub, sort, !embedded), [result, title, profile.lang, sub, sort, filter.genre, ids, embedded]);
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
        // Home's categories (embedded): cards half the size, as many on screen as in Home's shelves on a TV
        <VirtualGridRows className={embedded && !mobile ? 'vgrid small' : 'vgrid'} items={ids} minWidth={mobile ? 104 : embedded ? 85 : 170}
          aspect={2 / 3} extraHeight={embedded && !mobile ? 40 : 52} gap={mobile ? 10 : embedded ? 12 : 18} row={slice => <CatalogRow kind={kind} ids={slice} />} />}
    </div>
  </div>;
}
