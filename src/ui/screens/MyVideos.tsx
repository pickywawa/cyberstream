import { useApp } from '@/state/store';
import { useMemo } from 'react';
import { library_html } from '@/rust/generated/cyberstream';
import { db } from '@/core/db';
import { continueWatching, favoritesOf, history } from '@/core/repo';
import type { Movie, Series } from '@/core/types';
import { useAsync } from '../hooks';
import { RustView, readCommand } from '../components/RustView';
import { openMovie, openSeries, resume } from '../actions';

export function MyVideos() {
  const profile = useApp((s) => s.profile)!;
  const data = useAsync(async () => {
    const [cont, favs, hist] = await Promise.all([continueWatching(profile.id), favoritesOf(profile.id), history(profile.id)]);
    const movies = (await db.movies.bulkGet(favs.filter((f) => f.kind === 'movie').map((f) => f.itemId))).filter(Boolean) as Movie[];
    const series = (await db.series.bulkGet(favs.filter((f) => f.kind === 'series').map((f) => f.itemId))).filter(Boolean) as Series[];
    return { cont, movies, series, hist };
  }, [profile.id], { key: `myvideos:${profile.id}` });
  const html = useMemo(() => data ? library_html(JSON.stringify(data, [
    'cont','hist','movies','series','id','key','kind','itemId','seriesId','subtitle','title','image','poster','imdbRating','positionSec','durationSec','completed'
  ]), profile.lang) : '', [data, profile.lang]);
  if (!data) return null;
  return <RustView className="tab-myvideos" html={html} onCommand={cmd => {
    const [kind, id] = readCommand(cmd);
    if (kind === 'movie') openMovie(id);
    if (kind === 'series') openSeries(id);
    if (kind === 'resume') {
      const w = data.cont.find(w => w.key === id) || data.hist.find(w => w.key === id);
      if (w) void resume(w);
    }
  }} />;
}
