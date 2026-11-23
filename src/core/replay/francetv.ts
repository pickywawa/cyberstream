import { replay_item } from '../../rust/generated/cyberstream';
import { replay } from './client';
import type { ReplayItem } from './types';

export const ftvItem = (item: unknown): ReplayItem | null => JSON.parse(replay_item('francetv', JSON.stringify(item ?? null), Date.now()));
export const ftvCatalog = () => replay('francetv','catalog');
export const ftvKids = () => replay('francetv','kids');
export const ftvShow = (id: string) => replay('francetv','show',id);
export const ftvStream = (id: string) => replay('francetv','stream',id);
export const ftvInfo = (id: string) => replay('francetv','info',id);
