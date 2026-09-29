import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type SaveOp, SaveQueue, type SaveStatus } from './save-queue';

function deferred() {
  let resolve!: () => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('SaveQueue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    const calls: [string, SaveOp<number>][] = [];
    const runs: ReturnType<typeof deferred>[] = [];
    const statuses: SaveStatus[] = [];
    const queue = new SaveQueue<number>({
      run: (id, op) => {
        calls.push([id, op]);
        const d = deferred();
        runs.push(d);
        return d.promise;
      },
      onStatus: (s) => statuses.push(s),
      delayMs: 800,
    });
    return { queue, calls, runs, statuses };
  }

  it('menggabungkan perubahan beruntun dalam jeda 800 ms: yang terakhir menang', async () => {
    const { queue, calls, runs, statuses } = setup();
    queue.enqueue('a', { type: 'save', value: 1 });
    vi.advanceTimersByTime(500);
    queue.enqueue('a', { type: 'save', value: 2 });
    vi.advanceTimersByTime(799);
    expect(calls).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(calls).toEqual([['a', { type: 'save', value: 2 }]]);
    runs[0]?.resolve();
    await vi.runAllTimersAsync();
    expect(statuses.at(-1)).toBe('saved');
  });

  it('tidak ada dua penyimpanan paralel untuk fitur yang sama; fitur lain tetap jalan', async () => {
    const { queue, calls, runs } = setup();
    queue.enqueue('a', { type: 'save', value: 1 });
    vi.advanceTimersByTime(800);
    queue.enqueue('a', { type: 'save', value: 2 });
    queue.enqueue('b', { type: 'save', value: 9 });
    vi.advanceTimersByTime(800);
    expect(calls.map(([id]) => id)).toEqual(['a', 'b']);
    runs[0]?.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(calls.at(-1)).toEqual(['a', { type: 'save', value: 2 }]);
  });

  it('gagal → status error; coba lagi mengirim ulang operasi yang sama', async () => {
    const { queue, calls, runs, statuses } = setup();
    queue.enqueue('a', { type: 'remove' });
    vi.advanceTimersByTime(800);
    runs[0]?.reject(new Error('jaringan'));
    await vi.advanceTimersByTimeAsync(0);
    expect(statuses.at(-1)).toBe('error');
    expect(queue.hasUnsaved()).toBe(true);
    queue.retry();
    expect(calls.at(-1)).toEqual(['a', { type: 'remove' }]);
    runs[1]?.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(statuses.at(-1)).toBe('saved');
    expect(queue.hasUnsaved()).toBe(false);
  });

  it('flush mengirim yang tertunda tanpa menunggu jeda dan selesai setelah semua tersimpan', async () => {
    const { queue, calls, runs } = setup();
    queue.enqueue('a', { type: 'save', value: 1 });
    queue.enqueue('b', { type: 'save', value: 2 });
    let done = false;
    const flushed = queue.flush().then(() => {
      done = true;
    });
    expect(calls).toHaveLength(2);
    runs[0]?.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toBe(false);
    runs[1]?.resolve();
    await flushed;
    expect(done).toBe(true);
  });
});
