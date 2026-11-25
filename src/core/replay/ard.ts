import { replay } from './client';

/** ARD Mediathek (Germany): home rails, shows, videos and their streams */
export const ardCatalog = () => replay('ard', 'catalog');
export const ardShow = (id: string) => replay('ard', 'show', id);
export const ardStream = (id: string) => replay('ard', 'stream', id);
export const ardInfo = (id: string) => replay('ard', 'info', id);
