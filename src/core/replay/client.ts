import { replay_request } from '../../rust/generated/cyberstream';
import { fetchWithTimeout } from '../net/http';
import type { ReplayItem, ReplayRail, ReplayShow, ResolvedStream } from './types';

interface Result {
  catalog: { rails: ReplayRail[]; hero: ReplayItem[] };
  kids: Result['catalog'];
  show: ReplayShow;
  stream: ResolvedStream;
  info: ReplayItem;
}
const read = async (url: string, timeoutMs: number) => (await fetchWithTimeout(url, { timeoutMs })).text();

export async function replay<T extends keyof Result>(provider: string, action: T, id = '', lang = 'fr'): Promise<Result[T]> {
  return JSON.parse(await replay_request(provider, action, id, lang, Date.now(), read));
}
