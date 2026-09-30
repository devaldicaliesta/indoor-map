import { buildSnapshot } from '@indoor/domain';
import { sampleSnapshotSource } from '@indoor/domain/fixtures/snapshot-source.ts';
import { describe, expect, it } from 'vitest';
import { aStar, buildGraph, findRoute } from '../src';
import { graphCost, random, randomGraph, referenceCost } from './helpers';

describe('A* sama dengan Dijkstra rujukan', () => {
  it('200 pasang node acak di tiga graf acak (termasuk bagian yang terputus)', () => {
    const cases = [
      { seed: 1, nodes: 120, neighbours: 3, floors: ['f1'], pairs: 60 },
      { seed: 2, nodes: 200, neighbours: 4, floors: ['f1', 'f2'], pairs: 80 },
      { seed: 3, nodes: 80, neighbours: 2, floors: ['f1'], pairs: 60 },
    ];
    let compared = 0;
    let unreachable = 0;
    for (const { seed, floors, pairs, ...options } of cases) {
      const source = randomGraph(seed, { ...options, floors });
      const graph = buildGraph(source, { floors: floors.map((id, level) => ({ id, level })) });
      const pick = random(seed * 97);
      for (let i = 0; i < pairs; i++) {
        const a = source.nodes[Math.floor(pick() * source.nodes.length)]?.id ?? '';
        const b = source.nodes[Math.floor(pick() * source.nodes.length)]?.id ?? '';
        const expected = referenceCost(source, a, b);
        const result = findRoute(graph, { kind: 'node', nodeId: a }, { kind: 'node', nodeId: b });
        compared++;
        if (expected === null) {
          unreachable++;
          expect(result).toEqual({ ok: false, reason: 'no_path' });
        } else {
          expect(result.ok).toBe(true);
          if (result.ok) {
            expect(result.costM).toBeCloseTo(expected, 6);
            expect(result.path[0]).toBe(a);
            expect(result.path.at(-1)).toBe(b);
          }
        }
      }
    }
    expect(compared).toBe(200);
    // Graf dua lantai tanpa konektor pasti punya pasangan yang tidak terhubung.
    expect(unreachable).toBeGreaterThan(0);
  });

  it('biaya jalur yang dikembalikan sama dengan jumlah bobot arc-nya', () => {
    const source = randomGraph(7, { nodes: 150, neighbours: 3 });
    const graph = buildGraph(source, { floors: [{ id: 'f1', level: 0 }] });
    const search = aStar(graph, [{ node: 0, cost: 0 }], [{ node: 149, cost: 0 }]);
    expect(search).not.toBeNull();
    const sum = (search?.arcs ?? []).reduce((s, arc) => s + (graph.arcCost[arc] ?? 0), 0);
    expect(search?.cost).toBeCloseTo(sum, 9);
    for (let i = 1; i < (search?.arcs.length ?? 0); i++) {
      const previous = search?.arcs[i - 1] ?? 0;
      const arc = search?.arcs[i] ?? 0;
      expect(graph.arcFrom[arc]).toBe(graph.arcTo[previous]);
    }
  });

  it('beberapa seed dan goal: memilih pasangan termurah termasuk biaya tambahannya', () => {
    const source = randomGraph(11, { nodes: 60, neighbours: 3 });
    const graph = buildGraph(source, { floors: [{ id: 'f1', level: 0 }] });
    const single = (from: number, to: number) =>
      aStar(graph, [{ node: from, cost: 0 }], [{ node: to, cost: 0 }])?.cost ??
      Number.POSITIVE_INFINITY;
    const seeds = [
      { node: 1, cost: 5 },
      { node: 2, cost: 0 },
    ];
    const goals = [
      { node: 40, cost: 3 },
      { node: 50, cost: 0 },
    ];
    const expected = Math.min(
      ...seeds.flatMap((s) => goals.map((g) => s.cost + single(s.node, g.node) + g.cost)),
    );
    expect(aStar(graph, seeds, goals)?.cost).toBeCloseTo(expected, 9);
  });

  it('arc yang diblokir tidak pernah dilewati', () => {
    const source = randomGraph(5, { nodes: 100, neighbours: 3 });
    const graph = buildGraph(source, { floors: [{ id: 'f1', level: 0 }] });
    const free = aStar(graph, [{ node: 0, cost: 0 }], [{ node: 99, cost: 0 }]);
    const blocked = new Uint8Array(graph.arcTo.length);
    for (const arc of free?.arcs ?? []) blocked[arc] = 1;
    const detour = aStar(graph, [{ node: 0, cost: 0 }], [{ node: 99, cost: 0 }], {
      blockedArcs: blocked,
    });
    for (const arc of detour?.arcs ?? []) expect(blocked[arc]).toBe(0);
    if (detour) expect(detour.cost).toBeGreaterThanOrEqual(free?.cost ?? 0);
  });

  it('graf berkonektor (venue contoh): penalti lantai heuristik tidak mengubah hasil', () => {
    const snapshot = buildSnapshot(sampleSnapshotSource());
    const graph = buildGraph(snapshot.graph, { floors: snapshot.floors });
    const pick = random(2026);
    for (let i = 0; i < 60; i++) {
      const a = Math.floor(pick() * graph.nodeIds.length);
      const b = Math.floor(pick() * graph.nodeIds.length);
      const expected = graphCost(graph, a, b);
      const search = aStar(graph, [{ node: a, cost: 0 }], [{ node: b, cost: 0 }]);
      if (expected === null) expect(search).toBeNull();
      else expect(search?.cost).toBeCloseTo(expected, 6);
    }
  });
});
