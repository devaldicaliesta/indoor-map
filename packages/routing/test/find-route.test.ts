import type { SnapshotGraph } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { buildGraph, findRoute } from '../src';

// Koridor lurus a — b — c (±11 m per ruas) dan cabang b — d, satu lantai.
const at = (id: string, lng: number, lat = -6.175) => ({
  id,
  floorId: 'f1',
  coordinates: [lng, lat] as [number, number],
  role: 'path' as const,
  featureId: null,
});
const source: SnapshotGraph = {
  nodes: [at('a', 106.8), at('b', 106.8001), at('c', 106.8002), at('d', 106.8001, -6.1751)],
  edges: [
    { id: 'ab', floorId: 'f1', from: 'a', to: 'b', lengthM: 11.06, accessible: true },
    { id: 'bc', floorId: 'f1', from: 'b', to: 'c', lengthM: 11.06, accessible: true },
    { id: 'bd', floorId: 'f1', from: 'b', to: 'd', lengthM: 11.06, accessible: true },
  ],
  connectors: [],
};
const graph = buildGraph(source, { floors: [{ id: 'f1', level: 0 }] });

describe('findRoute', () => {
  it('node ke node: jalur, satu bagian berjalan, jarak = biaya tanpa konektor', () => {
    const result = findRoute(graph, { kind: 'node', nodeId: 'a' }, { kind: 'node', nodeId: 'd' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.path).toEqual(['a', 'b', 'd']);
    expect(result.legs).toHaveLength(1);
    expect(result.legs[0]).toMatchObject({ kind: 'walk', floorId: 'f1', nodeIds: ['a', 'b', 'd'] });
    // a — b tercatat 11,06 m; b — d tercatat 11,06 m tetapi jarak lurusnya 11,12 m.
    expect(result.distanceM).toBeCloseTo(11.06 + 11.12, 1);
    expect(result.costM).toBeCloseTo(result.distanceM, 9);
  });

  it('asal sama dengan tujuan: rute nol meter', () => {
    const result = findRoute(graph, { kind: 'node', nodeId: 'b' }, { kind: 'node', nodeId: 'b' });
    expect(result).toMatchObject({ ok: true, path: ['b'], distanceM: 0 });
  });

  it('beberapa node tujuan: rute ke yang terdekat', () => {
    const result = findRoute(
      graph,
      { kind: 'node', nodeId: 'a' },
      { kind: 'nodes', nodeIds: ['c', 'd', 'tidak-ada'] },
    );
    expect(result.ok && result.path.at(-1)).toBe('c');
  });

  it('titik bebas ditempelkan ke edge terdekat dan potongannya ikut dihitung', () => {
    // Di tengah ruas b — c, ±2,2 m di selatannya.
    const result = findRoute(
      graph,
      { kind: 'point', lng: 106.80015, lat: -6.17502, floorId: 'f1' },
      { kind: 'node', nodeId: 'a' },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.path).toEqual(['b', 'a']);
    const leg = result.legs[0];
    expect(leg?.kind === 'walk' && leg.coordinates[0]).toEqual([106.80015, -6.17502]);
    expect(leg?.kind === 'walk' && leg.coordinates[1]?.[1]).toBeCloseTo(-6.175, 9);
    expect(result.distanceM).toBeCloseTo(2.22 + 5.53 + 11.06, 1);
  });

  it('asal dan tujuan di edge yang sama berjalan langsung di sepanjang edge', () => {
    const result = findRoute(
      graph,
      { kind: 'point', lng: 106.80012, lat: -6.175, floorId: 'f1' },
      { kind: 'point', lng: 106.80018, lat: -6.175, floorId: 'f1' },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.path).toEqual([]);
    expect(result.distanceM).toBeCloseTo(6.64, 1);
  });

  it('asal atau tujuan yang tidak ada di graf', () => {
    const node = (nodeId: string) => ({ kind: 'node' as const, nodeId });
    expect(findRoute(graph, node('x'), node('a'))).toEqual({ ok: false, reason: 'origin_invalid' });
    expect(findRoute(graph, node('a'), node('x'))).toEqual({
      ok: false,
      reason: 'destination_invalid',
    });
    expect(
      findRoute(graph, { kind: 'point', lng: 106.8, lat: -6.175, floorId: 'f9' }, node('a')),
    ).toEqual({ ok: false, reason: 'origin_invalid' });
  });
});
