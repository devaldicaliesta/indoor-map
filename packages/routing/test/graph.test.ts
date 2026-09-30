import { haversineM, type SnapshotGraph } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { ARC_ACCESSIBLE, buildGraph, nodeDistanceM } from '../src';

const node = (id: string, lng: number, floorId = 'f1') => ({
  id,
  floorId,
  coordinates: [lng, -6.175] as [number, number],
  role: 'path' as const,
  featureId: null,
});

const source: SnapshotGraph = {
  nodes: [node('a', 106.8), node('b', 106.8001), node('c', 106.8002), node('d', 106.8, 'f2')],
  edges: [
    { id: 'ab', floorId: 'f1', from: 'a', to: 'b', lengthM: 20, accessible: true },
    // Panjang tercatat lebih pendek dari jarak lurus (pembulatan/data lama): bobot dinaikkan.
    { id: 'bc', floorId: 'f1', from: 'b', to: 'c', lengthM: 1, accessible: false },
    // Tidak sah: node tidak ada, loop, dan lintas lantai tanpa konektor.
    { id: 'ax', floorId: 'f1', from: 'a', to: 'x', lengthM: 5, accessible: true },
    { id: 'aa', floorId: 'f1', from: 'a', to: 'a', lengthM: 5, accessible: true },
    { id: 'ad', floorId: 'f1', from: 'a', to: 'd', lengthM: 5, accessible: true },
  ],
  connectors: [],
};

describe('buildGraph', () => {
  const graph = buildGraph(source, {
    floors: [
      { id: 'f1', level: 0 },
      { id: 'f2', level: 1 },
    ],
  });

  it('node dalam array bertipe dengan lantai dan level', () => {
    expect(graph.nodeIds).toEqual(['a', 'b', 'c', 'd']);
    expect([...graph.floor]).toEqual([0, 0, 0, 1]);
    expect([...graph.level]).toEqual([0, 0, 0, 1]);
    expect(graph.lng).toBeInstanceOf(Float64Array);
  });

  it('edge yang sah menjadi dua arc; yang tidak sah dilewati', () => {
    expect(graph.edgeIds).toEqual(['ab', 'bc']);
    expect(graph.arcTo.length).toBe(4);
    expect([...graph.offsets]).toEqual([0, 1, 3, 4, 4]);
  });

  it('bobot = panjang tercatat, minimal jarak lurus; flag aksesibel ikut', () => {
    const straight = haversineM(106.8001, -6.175, 106.8002, -6.175);
    expect(graph.edgeCost[0]).toBe(20);
    expect(graph.edgeCost[1]).toBeCloseTo(straight, 9);
    expect(nodeDistanceM(graph, 1, 2)).toBeCloseTo(straight, 9);
    for (let a = 0; a < graph.arcTo.length; a++) {
      const accessible = graph.arcSource[a] === 0;
      expect(Boolean((graph.arcFlags[a] ?? 0) & ARC_ACCESSIBLE)).toBe(accessible);
      expect(graph.arcLength[a]).toBe(graph.arcCost[a]);
    }
  });

  it('lantai yang tidak disebut di opsi tetap dikenali dengan level 0', () => {
    const other = buildGraph(source, { floors: [] });
    expect(other.floorIds).toEqual(['f1', 'f2']);
    expect([...other.level]).toEqual([0, 0, 0, 0]);
  });
});
