import { Playlist, media_kind } from '../../rust/generated/cyberstream';
export interface M3uEntry {
  name: string;
  url: string;
  attrs: Record<string, string>;
  duration: number;
}

export interface M3uHeader {
  epgUrls: string[];
  attrs: Record<string, string>;
}


export class M3uParser {
  private core = new Playlist();
  count = 0;
  constructor(private onEntry: (e: M3uEntry) => void) {}
  get header(): M3uHeader { return JSON.parse(this.core.header()); }
  push(raw: string) { this.feed(raw + '\n'); }
  feed(chunk: string, end = false) {
    const batch: M3uEntry[] = JSON.parse(this.core.feed(chunk,end));
    for (const row of batch) this.onEntry(row);
    this.count += batch.length;
  }
  free() { this.core.free(); }
}
export type M3uKind = 'live' | 'movie' | 'episode';
export const classifyEntry = (e:M3uEntry) => media_kind(e.url,e.name) as M3uKind;

/** "http://h:p/live/u/p/123.ts" -> Xtream-style parts (for catch-up on M3U from Xtream panels) */
export function xtreamPartsFromUrl(url: string): { server: string; user: string; pass: string; id: string } | null {
  const m = url.match(/^(https?:\/\/[^/]+)\/(?:live\/)?([^/]+)\/([^/]+)\/(\d+)(?:\.\w+)?$/);
  return m ? { server: m[1], user: m[2], pass: m[3], id: m[4] } : null;
}
