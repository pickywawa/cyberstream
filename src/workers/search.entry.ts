import { exposeAfterInit } from './entry';
exposeAfterInit(() => import('./search.worker'));
