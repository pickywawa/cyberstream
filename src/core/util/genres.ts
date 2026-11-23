import { genre_mask } from '../../rust/generated/cyberstream';
/**
 * Sub-categories of the movie / series screens ("Drame", "Comédie", "Action"…). A title belongs to
 * one through its TMDB genres (once enriched) or its provider category name ("COMEDIE [FR]",
 * "ACTION [EN]", "KOMEDIE [NL]"…), so they work before enrichment too.
 */
export interface GenreDef {
  key: string;
  fr: string;
  en: string;
}

export const GENRES: GenreDef[] = [
  { key: 'action', fr: 'Action', en: 'Action' },
  { key: 'comedy', fr: 'Comédie', en: 'Comedy' },
  { key: 'drama', fr: 'Drame', en: 'Drama' },
  { key: 'thriller', fr: 'Thriller & policier', en: 'Thriller & crime' },
  { key: 'horror', fr: 'Horreur', en: 'Horror' },
  { key: 'scifi', fr: 'Science-fiction', en: 'Sci-fi' },
  { key: 'fantasy', fr: 'Fantastique', en: 'Fantasy' },
  { key: 'adventure', fr: 'Aventure', en: 'Adventure' },
  { key: 'animation', fr: 'Animation', en: 'Animation' },
  { key: 'family', fr: 'Famille & jeunesse', en: 'Family & kids' },
  { key: 'romance', fr: 'Romance', en: 'Romance' },
  { key: 'docs', fr: 'Documentaire', en: 'Documentary' },
  { key: 'war', fr: 'Guerre & histoire', en: 'War & history' },
  { key: 'western', fr: 'Western', en: 'Western' },
  { key: 'music', fr: 'Musique', en: 'Music' },
  { key: 'christmas', fr: 'Noël', en: 'Christmas' },
];

const cache = new Map<string, string[]>();
export function genreKeys(item: { genres?: string[] }, categoryName?: string): string[] {
  const text = [...(item.genres || []), categoryName || ''].join(' | ');
  const cached = cache.get(text);
  if (cached) return cached;
  const mask = genre_mask(text);
  const keys = GENRES.filter((_, i) => (mask & (1 << i)) !== 0).map(g => g.key);
  if (cache.size >= 1024) cache.delete(cache.keys().next().value!);
  cache.set(text, keys);
  return keys;
}
