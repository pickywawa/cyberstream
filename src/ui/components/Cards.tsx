import { memo, useMemo } from 'react';
import { card_html } from '../../rust/generated/cyberstream';
import { useViewMarkup } from './RustView';
import { useLongPress } from '../hooks';

type Sources = string | (string | undefined)[];
const list = (urls?: Sources) => typeof urls === 'string' ? [urls] : urls;
interface Actions { onClick?: () => void; onLongPress?: () => void; autoFocus?: boolean }
interface Poster extends Actions { title: string; sub?: string; image?: string; fallback?: string; badge?: string; progress?: number; hideMeta?: boolean; imdb?: number }
interface Landscape extends Actions {
  title: string; sub?: string; sub2?: string; image?: string; fallbacks?: (string | undefined)[]; logo?: Sources; centerLogo?: Sources;
  progress?: number; progressLight?: boolean; badge?: string; badgeLive?: boolean; onRemove?: () => void;
  menu?: 'restart' | 'info'; menuTitle?: string; onMenu?: () => void;
}
function useCard(kind: string, data: object) {
  const raw = JSON.stringify(data);
  return useMemo(() => ({ __html: card_html(kind, raw) }), [kind, raw]);
}
export const PosterCard = memo(function PosterCard(p: Poster) {
  const ref = useLongPress<HTMLButtonElement>(() => p.onLongPress?.());
  const html = useCard('poster', p);
  return <button ref={ref} className="card poster" data-f data-lp={p.onLongPress ? '' : undefined} data-autofocus={p.autoFocus || undefined}
    onClick={p.onClick} aria-label={p.title} dangerouslySetInnerHTML={html} />;
});
export const LandCard = memo(function LandCard(p: Landscape) {
  const ref = useLongPress<HTMLDivElement>(() => p.onLongPress?.());
  const html = useCard('land', { ...p, logo: list(p.logo), centerLogo: list(p.centerLogo), remove: !!p.onRemove, longPress: !!p.onLongPress });
  useViewMarkup(ref, html.__html);
  return <div ref={ref} className="card land" style={{ padding: 0 }}
    onClick={e => {
      const cmd = (e.target as Element).closest('[data-cmd]')?.getAttribute('data-cmd');
      if (cmd === 'play') p.onClick?.();
      if (cmd === 'menu') p.onMenu?.();
      if (cmd === 'remove') p.onRemove?.();
    }} />;
});
export const Top10Card = memo(function Top10Card(p: Actions & { rank: number; title: string; image?: string }) {
  const html = useCard('top10', p);
  return <button className="card top10" data-f onClick={p.onClick} aria-label={`${p.rank}. ${p.title}`} dangerouslySetInnerHTML={html} />;
});
export const Tile = memo(function Tile(p: Actions & { label: string; sub?: string; icon: string }) {
  const html = useCard('tile', { title: p.label, sub: p.sub, icon: p.icon });
  return <button className="card cat-card" data-f onClick={p.onClick} dangerouslySetInnerHTML={html} />;
});
export const LogoTile = memo(function LogoTile(p: Actions & { name: string; logo?: Sources }) {
  const ref = useLongPress<HTMLButtonElement>(() => p.onLongPress?.());
  const html = useCard('logo', { title: p.name, logo: list(p.logo) });
  return <button ref={ref} className="card logo-tile" data-f data-lp={p.onLongPress ? '' : undefined}
    onClick={p.onClick} aria-label={p.name} title={p.name} dangerouslySetInnerHTML={html} />;
});
export function ImdbBadge({ rating, votes, inline }: { rating: number; votes?: number; inline?: boolean }) {
  return <span className={`imdb ${inline ? 'inline' : ''}`} title={votes ? `${votes.toLocaleString()} votes` : undefined}><b>IMDb</b>{rating.toFixed(1)}</span>;
}
