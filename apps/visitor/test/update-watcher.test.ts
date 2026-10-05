import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UPDATE_CHECK_MS, watchUpdates } from '../src/infopoint/update-watcher';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('watchUpdates', () => {
  it('memeriksa tiap 5 menit dan menyimpan versi baru sampai diambil', async () => {
    const load = vi.fn().mockResolvedValue({ version: 3 });
    const watcher = watchUpdates(load, 2);
    await vi.advanceTimersByTimeAsync(UPDATE_CHECK_MS - 1);
    expect(load).not.toHaveBeenCalled();
    expect(watcher.take()).toBeNull();
    await vi.advanceTimersByTimeAsync(1);
    expect(load).toHaveBeenCalledTimes(1);
    expect(watcher.take()).toEqual({ version: 3 });
    expect(watcher.take()).toBeNull();
    watcher.stop();
  });

  it('versi yang sama dan server tidak terjangkau tidak mengubah apa pun', async () => {
    const load = vi
      .fn()
      .mockResolvedValueOnce({ version: 2 })
      .mockRejectedValueOnce(new Error('offline'));
    const watcher = watchUpdates(load, 2);
    await vi.advanceTimersByTimeAsync(2 * UPDATE_CHECK_MS);
    expect(load).toHaveBeenCalledTimes(2);
    expect(watcher.take()).toBeNull();
    watcher.stop();
  });
});
