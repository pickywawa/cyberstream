import type { Person, TmdbListItem } from '../types';
import { tmdb_result } from '../../rust/generated/cyberstream';

export const TMDB_IMG = 'https://image.tmdb.org/t/p/';
export const img = (path: string | null | undefined, size: 'w92' | 'w185' | 'w300' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original') =>
  path ? `${TMDB_IMG}${size}${path}` : undefined;

/** Rewrites a stored TMDB image url to another size (we store w342 posters / w1280 backdrops) */
export function resizeTmdb(url: string | undefined, size: string): string | undefined {
  if (!url) return url;
  // the whole size segment: providers store "w600_and_h900_bestv2" style urls (not valid with another size prefix)
  return url.replace(/(image\.tmdb\.org\/t\/p\/)[^/]+/, `$1${size}`);
}

export interface TmdbDetails {
  tmdbId: number;
  title: string;
  year?: number;
  poster?: string;
  backdrop?: string;
  logo?: string;
  plot?: string;
  rating?: number;
  genres?: string[];
  cast?: string[];
  director?: string;
  trailer?: string;
  durationSec?: number;
  origLang?: string;
  imdbId?: string;
  cert?: string;
  certAge?: number;
  recos?: number[];
  people?: Person[];
  collection?: { id: number; name: string };
}

export interface TmdbCollection {
  id: number;
  name: string;
  overview?: string;
  backdrop?: string;
  parts: { tmdbId: number; title: string; year?: number; poster?: string }[];
}

export interface TmdbPerson {
  id: number;
  name: string;
  bio?: string;
  birthday?: string;
  deathday?: string;
  place?: string;
  photo?: string;
  knownFor?: string;
  credits: { kind: 'movie' | 'tv'; tmdbId: number; title: string; year?: number; character?: string; job?: string; popularity: number }[];
}

type Kind = 'movie' | 'tv';

/** Minimal TMDB v3 client: accepts either a v4 read token (JWT) or a v3 api key */
export class Tmdb {
  private queue: Promise<unknown> = Promise.resolve();
  private last = 0;
  constructor(private token: string, private lang = 'fr-FR', private minGapMs = 60) {}

  async get<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
    const q = new URLSearchParams();
    q.set('language', this.lang);
    for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, String(v));
    const isV3Key = /^[a-f0-9]{32}$/i.test(this.token.trim());
    if (isV3Key) q.set('api_key', this.token.trim());
    const headers: Record<string, string> = { accept: 'application/json' };
    if (!isV3Key) headers.authorization = `Bearer ${this.token.trim()}`;
    // simple global rate limiting (TMDB soft limit ≈ 40-50 req/s)
    const run = async () => {
      const wait = this.last + this.minGapMs - Date.now();
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
      this.last = Date.now();
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(`https://api.themoviedb.org/3${path}?${q}`, { headers });
        if (res.status === 429) {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
          continue;
        }
        if (!res.ok) throw new Error(`TMDB ${res.status}`);
        return res.json();
      }
      throw new Error('TMDB rate limited');
    };
    const p = this.queue.then(run, run);
    this.queue = p.catch(() => {});
    return p as Promise<T>;
  }

  async validate(): Promise<boolean> {
    try {
      await this.get('/configuration');
      return true;
    } catch {
      return false;
    }
  }

  private parse<T>(action: string, data: unknown, kind: Kind = 'movie'): T {
    return JSON.parse(tmdb_result(action, kind, this.lang, JSON.stringify(data)));
  }

  async list(kind: Kind, list: string, pages = 2): Promise<TmdbListItem[]> {
    const out: TmdbListItem[] = [];
    for (let page = 1; page <= pages; page++) {
      const path = list.startsWith('trending') ? `/trending/${kind}/${list.split(':')[1] || 'week'}` : `/${kind}/${list}`;
      const r = await this.get<any>(path, { page, region: 'FR' });
      out.push(...this.parse<TmdbListItem[]>('list', r, kind));
    }
    return out;
  }

  async search(kind: Kind, query: string, year?: number): Promise<TmdbListItem | null> {
    const r = await this.get<any>(`/search/${kind}`, {
      query,
      [kind === 'movie' ? 'year' : 'first_air_date_year']: year,
      include_adult: 'false',
    });
    let res = r.results || [];
    if (!res.length && year) {
      const r2 = await this.get<any>(`/search/${kind}`, { query, include_adult: 'false' });
      res = r2.results || [];
    }
    return res.length ? this.parse<TmdbListItem[]>('list', { results: [res[0]] }, kind)[0] : null;
  }

  async details(kind: Kind, id: number): Promise<TmdbDetails> {
    const langShort = this.lang.slice(0, 2);
    const r = await this.get<any>(`/${kind}/${id}`, {
      append_to_response: `images,credits,videos,external_ids,recommendations,${kind === 'movie' ? 'release_dates' : 'content_ratings'}`,
      include_image_language: `${langShort},en,null`,
      include_video_language: `${langShort},en`,
    });
    return this.parse('details', r, kind);
  }

  async collection(id: number): Promise<TmdbCollection> {
    const r = await this.get<any>(`/collection/${id}`);
    return this.parse('collection', r);
  }

  async person(id: number): Promise<TmdbPerson> {
    const r = await this.get<any>(`/person/${id}`, { append_to_response: 'combined_credits' });
    // biographies are often missing in French: fall back to English
    let bio: string | undefined = r.biography || undefined;
    if (!bio && !this.lang.startsWith('en')) {
      try {
        bio = (await new Tmdb(this.token, 'en-US', this.minGapMs).get<any>(`/person/${id}`)).biography || undefined;
      } catch {
        /* no bio */
      }
    }
    r.biography = bio;
    return this.parse('person', r);
  }

  async seasonStills(tvId: number, season: number): Promise<Record<number, { still?: string; plot?: string; title?: string }>> {
    const r = await this.get<any>(`/tv/${tvId}/season/${season}`);
    return this.parse('season', r);
  }
}
