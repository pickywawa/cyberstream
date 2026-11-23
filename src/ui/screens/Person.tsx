import { useMemo, useState } from 'react';
import { t, fmtDate } from '@/core/i18n';
import { useApp } from '@/state/store';
import { dataWorker } from '@/core/workers';
import { availableByTmdb } from '@/core/repo';
import { langPrefs } from '@/core/prefs';
import type { Movie, Series } from '@/core/types';
import { useAsync } from '../hooks';
import { person_html } from '@/rust/generated/cyberstream';
import { RustView, readCommand } from '../components/RustView';
import { openMovie, openSeries } from '../actions';
import { wikiPerson } from '@/core/enrich/people';
import { db } from '@/core/db';
import { movieGroupKey } from '@/core/util/text';
import type { LangPrefs } from '@/core/util/lang';

type Item = { kind: 'movie'; it: Movie; role?: string } | { kind: 'series'; it: Series; role?: string };

/** Actor / director page: TMDB biography + their films and series that are in the catalogue */
export function PersonPage({ id, title }: { id: number; title: string }) {
  const profile = useApp((s) => s.profile)!;
  const [fullBio, setFullBio] = useState(false);
  const data = useAsync(async () => {
    if (id <= 0) return byName(title, profile.id, profile.lang, langPrefs(profile));
    const p = await dataWorker().tmdbPerson(id);
    if (!p) return { p: null, items: [] as Item[] };
    const prefs = langPrefs(profile);
    const credits = [...p.credits].sort((a, b) => b.popularity - a.popularity);
    const role = new Map(credits.map((c) => [`${c.kind}:${c.tmdbId}`, c.job === 'Director' ? t('person.director') : c.character]));
    const movieIds = [...new Set(credits.filter((c) => c.kind === 'movie').map((c) => c.tmdbId))];
    const tvIds = [...new Set(credits.filter((c) => c.kind === 'tv').map((c) => c.tmdbId))];
    const [movies, series] = await Promise.all([
      availableByTmdb(profile.id, 'movie', movieIds, prefs),
      availableByTmdb(profile.id, 'series', tvIds, prefs),
    ]);
    const items: Item[] = [
      ...movies.map((it) => ({ kind: 'movie' as const, it, role: role.get(`movie:${it.tmdbId}`) })),
      ...series.map((it) => ({ kind: 'series' as const, it, role: role.get(`tv:${it.tmdbId}`) })),
    ];
    return { p: { ...p, birthday: p.birthday && fmtDate(Date.parse(p.birthday)), deathday: p.deathday && fmtDate(Date.parse(p.deathday)) }, items };
  }, [id, title, profile.id, profile.lang], { key: `person:${id > 0 ? id : title}:${profile.id}:${profile.lang}` });
  const raw = useMemo(() => JSON.stringify(data || null, ['p','name','photo','birthday','deathday','place','knownFor','bio',
    'items','kind','role','it','id','title','poster','year','imdbRating']), [data]);
  const html = useMemo(() => person_html(raw, title, profile.lang, fullBio), [raw, title, profile.lang, fullBio]);
  return <RustView className="settings person-page" html={html} onCommand={cmd => {
    const [action, target] = readCommand(cmd);
    if (action === 'back') useApp.getState().pop();
    if (action === 'bio') setFullBio(true);
    if (action === 'movie') openMovie(target);
    if (action === 'series') openSeries(target);
  }} />;
}

/** No TMDB id (provider cast names): Wikipedia / Wikidata page, films found by TMDB id, then by title + year */
async function byName(name: string, profileId: string, lang: string, prefs: LangPrefs) {
  const p = await wikiPerson(name, lang);
  if (!p) return { p: { name }, items: [] as Item[] };
  const role = new Map(p.credits.map((c) => [`${c.kind}:${c.tmdbId ?? c.title}`, c.director ? t('person.director') : undefined]));
  const ids = (k: 'movie' | 'series') => [...new Set(p.credits.filter((c) => c.kind === k && c.tmdbId).map((c) => c.tmdbId!))];
  const [movies, series] = await Promise.all([availableByTmdb(profileId, 'movie', ids('movie'), prefs), availableByTmdb(profileId, 'series', ids('series'), prefs)]);
  // titles without a TMDB id at the provider: same title and year
  const found = new Set(movies.map((m) => m.tmdbId));
  const keys = p.credits.filter((c) => c.kind === 'movie' && c.title && !(c.tmdbId && found.has(c.tmdbId))).map((c) => movieGroupKey(c.title!, c.year));
  const byTitle = keys.length ? (await db.movies.where('groupKey').anyOf(keys).toArray()).filter((m) => m.profileId === profileId) : [];
  const seen = new Set(movies.map((m) => m.groupKey));
  const extra = byTitle.filter((m) => !seen.has(m.groupKey) && (seen.add(m.groupKey), true));
  const items: Item[] = [
    ...[...movies, ...extra].map((it) => ({ kind: 'movie' as const, it, role: role.get(`movie:${it.tmdbId}`) })),
    ...series.map((it) => ({ kind: 'series' as const, it, role: role.get(`series:${it.tmdbId}`) })),
  ];
  const date = (d?: string) => (d ? fmtDate(Date.parse(d)) : undefined);
  return {
    p: { name: p.name, photo: p.photo, bio: p.bio, birthday: date(p.birthday), deathday: date(p.deathday),
      place: [p.description, p.place].filter(Boolean).join(' · ') || undefined },
    items,
  };
}
