import type { SnapshotGraph, SnapshotNavNode } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { buildGraph, findRoute } from '../src';
import { random } from './helpers';

// Paket ini hanya memakai lib ES2023 (tanpa DOM/Node); `performance` tetap ada di runtime test.
const { performance } = globalThis as unknown as { performance: { now(): number } };

/** Grid 100 × 100 node berjarak ±5 m ditambah diagonal acak: tepat 20.000 edge. */
function gridGraph(): SnapshotGraph {
  const size = 100;
  const step = 5 / 111_000;
  const next = random(42);
  const id = (x: number, y: number) => `n${x}-${y}`;
  const nodes: SnapshotNavNode[] = [];
  const edges: SnapshotGraph['edges'] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      nodes.push({
        id: id(x, y),
        floorId: 'f1',
        coordinates: [106.8 + x * step, -6.17 - y * step],
        role: 'path',
        featureId: null,
      });
    }
  }
  const add = (a: string, b: string, lengthM: number) =>
    edges.push({
      id: `e${edges.length}`,
      floorId: 'f1',
      from: a,
      to: b,
      lengthM,
      accessible: true,
    });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x + 1 < size) add(id(x, y), id(x + 1, y), 5 + next());
      if (y + 1 < size) add(id(x, y), id(x, y + 1), 5 + next());
    }
  }
  while (edges.length < 20_000) {
    const x = Math.floor(next() * (size - 1));
    const y = Math.floor(next() * (size - 1));
    add(id(x, y), id(x + 1, y + 1), 7.1 + next());
  }
  return { nodes, edges, connectors: [] };
}

describe('benchmark', () => {
  it('rute terjauh di graf 20.000 edge < 50 ms', () => {
    const source = gridGraph();
    expect(source.edges).toHaveLength(20_000);
    const graph = buildGraph(source, { floors: [{ id: 'f1', level: 0 }] });
    const from = { kind: 'node' as const, nodeId: 'n0-0' };
    const to = { kind: 'node' as const, nodeId: 'n99-99' };
    let best = Number.POSITIVE_INFINITY;
    for (let run = 0; run < 5; run++) {
      const started = performance.now();
      const result = findRoute(graph, from, to);
      best = Math.min(best, performance.now() - started);
      expect(result.ok).toBe(true);
    }
    expect(best).toBeLessThan(50);
  });
});
