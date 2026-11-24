import { afterEach, expect, it, vi } from 'vitest';
import { giveWay, setQuietLowEnd, userActive } from '../src/core/quiet';

afterEach(() => {
  setQuietLowEnd(false);
  vi.useRealTimers();
});

it('lets background work run straight on a normal device', async () => {
  userActive(5000);
  let done = false;
  void giveWay(300).then(() => (done = true));
  await Promise.resolve();
  await Promise.resolve();
  expect(done).toBe(true);
});

it('holds background work while the remote is in use on a weak device', async () => {
  vi.useFakeTimers();
  setQuietLowEnd(true);
  userActive(4000);
  let done = false;
  void giveWay().then(() => (done = true));
  await vi.advanceTimersByTimeAsync(3000);
  expect(done).toBe(false);
  await vi.advanceTimersByTimeAsync(1200);
  expect(done).toBe(true);
});

it('never holds one step longer than 10 s', async () => {
  vi.useFakeTimers();
  setQuietLowEnd(true);
  userActive(60000);
  let done = false;
  void giveWay().then(() => (done = true));
  await vi.advanceTimersByTimeAsync(10200);
  expect(done).toBe(true);
});
