import * as Comlink from 'comlink';
import { startRust } from '../rust/runtime';

/** Register the listener before fetching WASM so the first call cannot be lost. */
export function exposeAfterInit<T extends object>(load: () => Promise<{ api: T }>) {
  const ready = startRust().then(load);
  Comlink.expose(new Proxy({}, {
    get: (_target, key) => async (...args: unknown[]) => {
      const { api } = await ready;
      const method = Reflect.get(api, key);
      if (typeof method !== 'function') throw new Error('Unknown worker method');
      return Reflect.apply(method, api, args);
    },
  }));
}
