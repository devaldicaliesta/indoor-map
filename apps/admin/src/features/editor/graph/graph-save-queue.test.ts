import type { NavGraphChanges } from '@indoor/data';
import type { NavEdge, NavNode, VenueId } from '@indoor/domain';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveStatus } from '../store/save-queue';
import { GraphSaveQueue } from './graph-save-queue';

const venue = '10000000-0000-4000-8000-000000000001' as VenueId;
const node = (id: string, x = 0): NavNode => ({
  id,
  floorId: 'f1',
  coordinates: [106.8 + x, -6.17],
  role: 'path',
  featureId: null,
});
const edge = (id: string, from: string, to: string): NavEdge => ({
  id,
  floorId: 'f1',
  from,
  to,
  lengthM: 1,
  accessible: true,
});

function deferred() {
  let resolve!: () => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('GraphSaveQueue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function setup() {
    const calls: NavGraphChanges[] = [];
    const runs: ReturnType<typeof deferred>[] = [];
    const statuses: SaveStatus[] = [];
    const queue = new GraphSaveQueue({
      run: (_venue, changes) => {
        calls.push(changes);
        const d = deferred();
        runs.push(d);
        return d.promise;
      },
      onStatus: (s) => statuses.push(s),
      delayMs: 800,
    });
    return { queue, calls, runs, statuses };
  }

  it('perubahan dalam 800 ms sejak yang pertama dikirim sekaligus; yang terakhir per id menang', () => {
    const { queue, calls } = setup();
    queue.enqueue(venue, { nodes: [{ id: 'a', value: node('a') }], edges: [] });
    vi.advanceTimersByTime(500);
    queue.enqueue(venue, {
      nodes: [
        { id: 'a', value: node('a', 1) },
        { id: 'b', value: node('b') },
        { id: 'c', value: null },
      ],
      edges: [
        { id: 'ab', value: edge('ab', 'a', 'b') },
        { id: 'old', value: null },
      ],
    });
    vi.advanceTimersByTime(299);
    expect(calls).toEqual([]);
    vi.advanceTimersByTime(1);
    expect(calls).toEqual([
      {
        saveNodes: [node('a', 1), node('b')],
        removeNodeIds: ['c'],
        saveEdges: [edge('ab', 'a', 'b')],
        removeEdgeIds: ['old'],
      },
    ]);
  });

  it('satu kiriman pada satu waktu: perubahan selama kiriman berjalan menunggu giliran', async () => {
    const { queue, calls, runs } = setup();
    queue.enqueue(venue, { nodes: [{ id: 'a', value: node('a') }], edges: [] });
    vi.advanceTimersByTime(800);
    queue.enqueue(venue, { nodes: [{ id: 'b', value: node('b') }], edges: [] });
    vi.advanceTimersByTime(800);
    expect(calls).toHaveLength(1);
    runs[0]?.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toHaveLength(2);
    expect(calls[1]?.saveNodes).toEqual([node('b')]);
  });

  it('gagal → status error; perubahan baru tidak ditimpa kiriman lama saat coba lagi', async () => {
    const { queue, calls, runs, statuses } = setup();
    queue.enqueue(venue, {
      nodes: [
        { id: 'a', value: node('a') },
        { id: 'b', value: node('b') },
      ],
      edges: [],
    });
    vi.advanceTimersByTime(800);
    queue.enqueue(venue, { nodes: [{ id: 'a', value: null }], edges: [] });
    runs[0]?.reject(new Error('jaringan'));
    await vi.advanceTimersByTimeAsync(0);
    // Kiriman kedua (hapus a) langsung jalan; b menunggu dicoba lagi.
    expect(calls[1]).toMatchObject({ removeNodeIds: ['a'], saveNodes: [] });
    runs[1]?.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(statuses.at(-1)).toBe('error');
    expect(queue.hasUnsaved()).toBe(true);
    queue.retry();
    expect(calls[2]).toMatchObject({ saveNodes: [node('b')], removeNodeIds: [] });
    runs[2]?.resolve();
    await vi.advanceTimersByTimeAsync(0);
    expect(statuses.at(-1)).toBe('saved');
    expect(queue.hasUnsaved()).toBe(false);
  });

  it('flush mengirim tanpa menunggu jeda dan selesai setelah tersimpan', async () => {
    const { queue, calls, runs } = setup();
    queue.enqueue(venue, { nodes: [{ id: 'a', value: node('a') }], edges: [] });
    let done = false;
    const flushed = queue.flush().then(() => {
      done = true;
    });
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(0);
    expect(done).toBe(false);
    runs[0]?.resolve();
    await flushed;
    expect(done).toBe(true);
    await expect(queue.flush()).resolves.toBeUndefined();
  });
});
