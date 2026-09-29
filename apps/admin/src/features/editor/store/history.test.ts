import { describe, expect, it } from 'vitest';
import {
  applyPatch,
  type Change,
  emptyHistory,
  HISTORY_LIMIT,
  type History,
  type Patch,
  record,
  redo,
  undo,
} from './history';

interface Item {
  id: string;
  x: number;
  tags?: string[];
}
type State = Record<string, Item>;

/** Aksi acak tapi deterministik: buat, ubah, hapus, dan aksi massal. */
function randomPatch(state: State, step: number): Patch<Item> {
  const ids = Object.keys(state).sort();
  const pick = (k: number) => ids[(step * 7 + k) % ids.length] as string;
  const kind = ids.length < 3 ? 0 : step % 4;
  if (kind === 0) {
    const id = `f${step}`;
    return [{ id, before: null, after: { id, x: step, tags: [`t${step}`] } }];
  }
  if (kind === 1) {
    const id = pick(0);
    const before = state[id] as Item;
    return [{ id, before, after: { ...before, x: before.x + 1 } }];
  }
  if (kind === 2) {
    const id = pick(1);
    return [{ id, before: state[id] as Item, after: null }];
  }
  const batch: Change<Item>[] = [];
  for (const id of new Set([pick(0), pick(2), pick(3)])) {
    const before = state[id] as Item;
    batch.push({ id, before, after: { ...before, x: before.x * 2 } });
  }
  return batch;
}

function run(steps: number) {
  let state: State = {};
  let history: History<Item> = emptyHistory();
  const snapshots: State[] = [state];
  for (let i = 0; i < steps; i++) {
    const patch = randomPatch(state, i);
    state = applyPatch(state, patch, 'do');
    history = record(history, patch);
    snapshots.push(state);
  }
  return { state, history, snapshots };
}

describe('riwayat undo/redo', () => {
  it('50 langkah undo lalu 50 redo mengembalikan keadaan yang sama persis', () => {
    const { state: final, history: start, snapshots } = run(50);
    let state = final;
    let history = start;
    for (let i = 49; i >= 0; i--) {
      const step = undo(history);
      if (!step) throw new Error('riwayat habis terlalu cepat');
      state = applyPatch(state, step.patch, 'undo');
      history = step.history;
      expect(state).toEqual(snapshots[i]);
    }
    expect(state).toEqual({});
    expect(undo(history)).toBeNull();
    for (let i = 1; i <= 50; i++) {
      const step = redo(history);
      if (!step) throw new Error('redo habis terlalu cepat');
      state = applyPatch(state, step.patch, 'do');
      history = step.history;
      expect(state).toEqual(snapshots[i]);
    }
    expect(state).toEqual(final);
    expect(redo(history)).toBeNull();
  });

  it('undo penghapusan memulihkan fitur lengkap dengan propertinya', () => {
    const item: Item = { id: 'a', x: 3, tags: ['toilet', 'difabel'] };
    const patch: Patch<Item> = [{ id: 'a', before: item, after: null }];
    const removed = applyPatch({ a: item }, patch, 'do');
    expect(removed).toEqual({});
    expect(applyPatch(removed, patch, 'undo')).toEqual({ a: item });
  });

  it('aksi baru menghapus riwayat redo; batas riwayat dijaga', () => {
    let history = record(emptyHistory<Item>(), [
      { id: 'a', before: null, after: { id: 'a', x: 1 } },
    ]);
    history = (undo(history) as { history: History<Item> }).history;
    expect(history.future).toHaveLength(1);
    history = record(history, [{ id: 'b', before: null, after: { id: 'b', x: 1 } }]);
    expect(history.future).toEqual([]);
    for (let i = 0; i < HISTORY_LIMIT + 20; i++) {
      history = record(history, [{ id: `x${i}`, before: null, after: { id: `x${i}`, x: i } }]);
    }
    expect(history.past).toHaveLength(HISTORY_LIMIT);
    expect(record(history, [])).toBe(history);
  });

  it('perubahan berantai pada fitur yang sama dalam satu patch pulih ke nilai awal', () => {
    const a0: Item = { id: 'a', x: 0 };
    const a1: Item = { id: 'a', x: 1 };
    const a2: Item = { id: 'a', x: 2 };
    const patch: Patch<Item> = [
      { id: 'a', before: a0, after: a1 },
      { id: 'a', before: a1, after: a2 },
    ];
    const done = applyPatch({ a: a0 }, patch, 'do');
    expect(done.a).toEqual(a2);
    expect(applyPatch(done, patch, 'undo').a).toEqual(a0);
  });
});
