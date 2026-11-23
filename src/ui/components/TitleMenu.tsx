import { useLiveQuery } from 'dexie-react-hooks';
import { useApp } from '@/state/store';
import { t } from '@/core/i18n';
import { db, getMeta, setMeta } from '@/core/db';
import { continueWatching, episodesOf, getProgress, toggleFavorite } from '@/core/repo';
import type { ReplayItem } from '@/core/replay';
import type { Movie, Series } from '@/core/types';
import { Menu, Sheet } from './Overlay';
import { IcHeart, IcHeartFill, IcInfo, IcPlay } from '../icons';
import { openMovie, openSeries, playEpisode, playMovie, playReplay, resume } from '../actions';
import { loadXtreamEpisodesIfNeeded } from '../episodes';

/** "Regarder": a film from where it was left, a series from its last episode (or the first one) */
async function watchTitle(kind: 'movie' | 'series', id: string) {
  const profileId = useApp.getState().profile!.id;
  if (kind === 'movie') {
    const w = await getProgress(profileId, `movie:${id}`);
    return playMovie(id, w && !w.completed ? w.positionSec : undefined);
  }
  const w = (await continueWatching(profileId)).find((x) => x.seriesId === id);
  if (w) return resume(w);
  await loadXtreamEpisodesIfNeeded(id);
  const eps = (await episodesOf(id)).sort((a, b) => a.season - b.season || a.episode - b.episode);
  if (eps[0]) return playEpisode(id, eps[0].id);
  return openSeries(id);
}

/** Long press on a film / series card (Home, Search): watch, favourite, its page */
export function TitleMenu({ kind, id, onClose }: { kind: 'movie' | 'series'; id: string; onClose: () => void }) {
  const profileId = useApp((s) => s.profile)!.id;
  const toast = useApp((s) => s.toast);
  const it = useLiveQuery(() => (kind === 'movie' ? db.movies.get(id) : db.series.get(id)), [kind, id]) as Movie | Series | undefined;
  const fav = useLiveQuery(() => (it ? db.favorites.get([profileId, `${kind}:${it.groupKey}`]) : undefined), [profileId, kind, it?.groupKey]);
  if (!it) return null;
  return (
    <Sheet title={it.title} onClose={onClose}>
      <Menu
        autoFocusChecked={false}
        items={[
          { label: t('channels.watch'), icon: <IcPlay />, onSelect: () => (onClose(), void watchTitle(kind, id)) },
          {
            label: fav ? t('tv.removeFav') : t('tv.addFav'),
            icon: fav ? <IcHeartFill /> : <IcHeart />,
            onSelect: async () => {
              const on = await toggleFavorite(profileId, kind, it.groupKey, it.id);
              toast(on ? t('tv.addFav') : t('tv.removeFav'));
              onClose();
            },
          },
          { label: t('home.info'), icon: <IcInfo />, onSelect: () => (onClose(), kind === 'movie' ? openMovie(id) : openSeries(id)) },
        ]}
      />
    </Sheet>
  );
}

/** a replay title kept in favourites: its details (titles only exist in the broadcasters' catalogues) */
export const replayFavKey = (profileId: string, id: string) => `replay:fav:${profileId}:${id}`;
export async function replayFavorites(profileId: string): Promise<ReplayItem[]> {
  const favs = (await db.favorites.where('profileId').equals(profileId).toArray()).filter((f) => f.kind === 'replay').sort((a, b) => a.order - b.order);
  const items = await Promise.all(favs.map((f) => getMeta<ReplayItem>(replayFavKey(profileId, f.itemId))));
  return items.filter((x): x is ReplayItem => !!x);
}

/** Long press on a "Contenus" title: watch (a video) or open (a show), favourite */
export function ReplayMenu({ item, onClose, onOpen }: { item: ReplayItem; onClose: () => void; onOpen: () => void }) {
  const profileId = useApp((s) => s.profile)!.id;
  const toast = useApp((s) => s.toast);
  const fav = useLiveQuery(() => db.favorites.get([profileId, `replay:${item.id}`]), [profileId, item.id]);
  return (
    <Sheet title={item.title} onClose={onClose}>
      <Menu
        autoFocusChecked={false}
        items={[
          {
            label: item.kind === 'show' ? t('home.info') : t('channels.watch'),
            icon: item.kind === 'show' ? <IcInfo /> : <IcPlay />,
            onSelect: () => (onClose(), item.kind === 'show' ? onOpen() : void playReplay(item)),
          },
          {
            label: fav ? t('tv.removeFav') : t('tv.addFav'),
            icon: fav ? <IcHeartFill /> : <IcHeart />,
            onSelect: async () => {
              const { id, provider, kind, title, subtitle, image, channel } = item;
              await setMeta(replayFavKey(profileId, item.id), { id, provider, kind, title, subtitle, image, channel });
              const on = await toggleFavorite(profileId, 'replay', item.id, item.id);
              toast(on ? t('tv.addFav') : t('tv.removeFav'));
              onClose();
            },
          },
        ]}
      />
    </Sheet>
  );
}
