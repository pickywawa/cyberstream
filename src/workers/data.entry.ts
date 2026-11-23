import { exposeAfterInit } from './entry';
exposeAfterInit(() => import('./data.worker'));
