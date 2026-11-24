/**
 * Background work (TMDB enrichment, sync, guide) giving way to the remote on a weak device.
 * The UI tells the data worker the user is navigating (`userActive`); the long loops call
 * `giveWay()` between steps: it waits until no key was pressed for a few seconds, then (weak device)
 * leaves a short breather so the few slow cores stay free for the screen.
 * Never waits more than MAX_WAIT_MS in one call: a download being read can't be held forever.
 */
const MAX_WAIT_MS = 10000;
let lowEnd = false;
let quietUntil = 0;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function setQuietLowEnd(v: boolean) {
  lowEnd = v;
  quietUntil = 0;
}

/** the user pressed a key: background work holds for `ms` */
export function userActive(ms: number) {
  quietUntil = Math.max(quietUntil, Date.now() + ms);
}

/** between two steps of a long background job; `breather`: pause a little even when idle (weak device) */
export async function giveWay(breather = 0) {
  if (!lowEnd) return;
  const start = Date.now();
  while (Date.now() < quietUntil && Date.now() - start < MAX_WAIT_MS) await sleep(Math.min(quietUntil - Date.now(), MAX_WAIT_MS) + 50);
  if (breather) await sleep(breather);
}
