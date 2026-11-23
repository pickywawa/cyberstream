import { CatalogSearch } from '../rust/generated/cyberstream';
export interface SearchDoc {
  kind: 'live' | 'movie' | 'series';
  id: string;
  groupKey: string;
  title: string;
  extra?: string;
  /** precomputed normalized text */
  n?: string;
}

export interface SearchHit extends SearchDoc {
  score: number;
}


export class SearchIndex {
  private core = new CatalogSearch();
  append(docs: SearchDoc[]) { this.core.append(JSON.stringify(docs)); }
  finish() { this.core.finish(); }
  snapshot(): Uint8Array[] {
    const pages = [];
    for (let i = 0; i < this.size; i += 1000) pages.push(this.core.snapshot(i, 1000));
    return pages;
  }
  restore(pages: Uint8Array[]) {
    for (const page of pages) this.core.restore_page(page);
  }
  free() { this.core.free(); }
  get size() { return this.core.size(); }
  load(docs: SearchDoc[]) {
    const next = new CatalogSearch();
    try {
      for (let i = 0; i < docs.length; i += 1500) next.append(JSON.stringify(docs.slice(i,i+1500)));
      next.finish();
    } catch (e) { next.free(); throw e; }
    this.core.free();
    this.core = next;
  }
  search(q: string, limit = 120): SearchHit[] {
    return JSON.parse(this.core.query(q, Math.max(0, limit)));
  }
}
