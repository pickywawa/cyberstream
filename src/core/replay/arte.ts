import { replay_item } from '../../rust/generated/cyberstream';
import { replay } from './client';
import type { ReplayItem } from './types';

export const arteItem = (item: unknown): ReplayItem | null => JSON.parse(replay_item('arte', JSON.stringify(item ?? null), Date.now()));
export const arteCatalog = (lang: string) => replay('arte','catalog','',lang);
export const arteShow = (id: string, lang: string) => replay('arte','show',id,lang);
export const arteStream = (id: string, lang: string) => replay('arte','stream',id,lang);
export const arteInfo = (id: string, lang: string) => replay('arte','info',id,lang);
