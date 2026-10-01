import { describe, expect, it } from 'vitest';
import { isolatedNodeIds, type NavEdge, type NavGraph, type NavNode } from '../src';
import { FLOORS, GRAPH, sampleGraph } from './fixtures/venue-graph';

const node = (id: string, floorId = 'L1', role: NavNode['role'] = 'path'): NavNode => ({
  id,
  floorId,
  coordinates: [106.8, -6.175],
  role,
  featureId: null,
});
const stop = (id: string, floorId: string) => node(id, floorId, 'connector');
const connector = (...nodeIds: string[]) => ({ stops: nodeIds.map((nodeId) => ({ nodeId })) });

/** Graf dari node dan pasangan edge `'a:b'`; lantai edge mengikuti node asalnya. */
function graphOf(nodes: NavNode[], pairs: string[]): NavGraph {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edges = pairs.map((pair): NavEdge => {
    const [from = '', to = ''] = pair.split(':');
    const floorId = byId[from]?.floorId ?? 'L1';
    return { id: pair, floorId, from, to, lengthM: 1, accessible: true };
  });
  return { nodes: byId, edges: Object.fromEntries(edges.map((e) => [e.id, e])) };
}
const sorted = (ids: ReadonlySet<string>) => [...ids].sort();

describe('isolatedNodeIds', () => {
  it('menandai node di luar komponen terbesar, termasuk node tanpa edge', () => {
    const graph = graphOf(
      ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => node(id)),
      ['a:b', 'b:c', 'd:e'],
    );
    expect(sorted(isolatedNodeIds(graph, []))).toEqual(['d', 'e', 'f']);
  });

  it('konektor menyambung jaringan di lantai lain; tanpa konektor yang muncul lebih dulu menang seri', () => {
    const graph = graphOf(
      [
        node('a'),
        node('b'),
        stop('lift1', 'L1'),
        stop('lift2', 'L2'),
        node('x', 'L2'),
        node('y', 'L2'),
      ],
      ['a:b', 'b:lift1', 'lift2:x', 'x:y'],
    );
    expect(sorted(isolatedNodeIds(graph, []))).toEqual(['lift2', 'x', 'y']);
    expect(isolatedNodeIds(graph, [connector('lift1', 'lift2')]).size).toBe(0);
  });

  it('dua sayap satu lantai yang tersambung lewat lantai lain tidak terisolasi', () => {
    const graph = graphOf(
      [
        node('a1'),
        stop('liftA1', 'L1'),
        node('b1'),
        node('b2'),
        stop('liftB1', 'L1'),
        stop('liftA2', 'L2'),
        node('m', 'L2'),
        stop('liftB2', 'L2'),
      ],
      ['a1:liftA1', 'b1:b2', 'b2:liftB1', 'liftA2:m', 'm:liftB2'],
    );
    const lifts = [connector('liftA1', 'liftA2'), connector('liftB1', 'liftB2')];
    expect(isolatedNodeIds(graph, lifts).size).toBe(0);
    expect(sorted(isolatedNodeIds(graph, lifts.slice(1)))).toEqual(['a1', 'liftA1']);
  });

  it('pemberhentian yang belum disambung ke jalur terisolasi walau pemberhentian lain sudah', () => {
    const graph = graphOf(
      [
        node('a'),
        stop('lift1', 'L1'),
        stop('lift2', 'L2'),
        node('p', 'L2'),
        stop('lift3', 'L3'),
        node('q', 'L3'),
        node('r', 'L3'),
      ],
      ['a:lift1', 'lift2:p', 'q:r'],
    );
    expect(sorted(isolatedNodeIds(graph, [connector('lift1', 'lift2', 'lift3')]))).toEqual([
      'lift3',
      'q',
      'r',
    ]);
  });

  it('kosong selama graf belum punya edge', () => {
    const graph = graphOf([node('a'), stop('lift1', 'L1'), stop('lift2', 'L2')], []);
    expect(isolatedNodeIds(graph, [connector('lift1', 'lift2')]).size).toBe(0);
  });

  it('edge dan pemberhentian yang menunjuk node yang tidak ada diabaikan', () => {
    const graph = graphOf([node('a'), node('b'), node('c')], ['a:b', 'c:hilang']);
    expect(sorted(isolatedNodeIds(graph, [connector('c', 'hilang')]))).toEqual(['c']);
  });

  it('graf venue contoh terhubung penuh; tanpa pintu gedung Area Luar dan Gedung Timur terputus', () => {
    const sample = sampleGraph();
    const graph: NavGraph = {
      nodes: Object.fromEntries(sample.nodes.map((n) => [n.id, n])),
      edges: Object.fromEntries(sample.edges.map((e) => [e.id, e])),
    };
    expect(isolatedNodeIds(graph, sample.connectors).size).toBe(0);

    const doors = new Set<string>([GRAPH.connectors.guDoor, GRAPH.connectors.gtDoor]);
    const isolated = isolatedNodeIds(
      graph,
      sample.connectors.filter((c) => !doors.has(c.id)),
    );
    const cutOff = sample.nodes.filter(
      (n) => n.floorId === FLOORS.outdoor || n.floorId === FLOORS.gtGf,
    );
    expect(sorted(isolated)).toEqual(cutOff.map((n) => n.id).sort());
  });
});
