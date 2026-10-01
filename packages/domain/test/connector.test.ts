import { describe, expect, it } from 'vitest';
import {
  type ConnectorDraft,
  checkConnector,
  defaultConnectorAccessible,
  floorsBetween,
  type GraphPatch,
  type NavGraph,
  setEdgeAccessible,
} from '../src';

const FLOORS = [
  { id: 'out', buildingId: null, level: 0, isOutdoor: true },
  { id: 'gf', buildingId: 'g', level: 0, isOutdoor: false },
  { id: 'l1', buildingId: 'g', level: 1, isOutdoor: false },
  { id: 'l2', buildingId: 'g', level: 2, isOutdoor: false },
  { id: 'b1', buildingId: 'g', level: -1, isOutdoor: false },
  { id: 'h-gf', buildingId: 'h', level: 0, isOutdoor: false },
];
const draft = (patch: Partial<ConnectorDraft>): ConnectorDraft => ({
  kind: 'elevator',
  name: 'Lift 1',
  direction: null,
  accessible: true,
  floorIds: ['gf', 'l1'],
  ...patch,
});

describe('checkConnector', () => {
  it('keempat jenis konektor yang sah tidak bermasalah', () => {
    expect(checkConnector(draft({ floorIds: ['b1', 'gf', 'l1', 'l2'] }), FLOORS)).toEqual([]);
    expect(
      checkConnector(draft({ kind: 'escalator', direction: 'up', floorIds: ['gf', 'l1'] }), FLOORS),
    ).toEqual([]);
    expect(checkConnector(draft({ kind: 'stairs', floorIds: ['gf', 'l1', 'l2'] }), FLOORS)).toEqual(
      [],
    );
    expect(
      checkConnector(draft({ kind: 'building_door', floorIds: ['gf', 'out'] }), FLOORS),
    ).toEqual([]);
  });

  it('nama wajib dan dibatasi panjangnya', () => {
    expect(checkConnector(draft({ name: '  ' }), FLOORS)).toEqual(['name_required']);
    expect(checkConnector(draft({ name: 'x'.repeat(61) }), FLOORS)).toEqual(['name_too_long']);
  });

  it('minimal dua lantai berbeda yang dikenal', () => {
    expect(checkConnector(draft({ floorIds: ['gf'] }), FLOORS)).toEqual(['too_few_floors']);
    expect(checkConnector(draft({ floorIds: ['gf', 'gf'] }), FLOORS)).toEqual(['too_few_floors']);
    expect(checkConnector(draft({ floorIds: ['gf', 'lain'] }), FLOORS)).toEqual(['unknown_floor']);
  });

  it('eskalator tanpa arah ditolak; eskalator tepat dua lantai', () => {
    expect(checkConnector(draft({ kind: 'escalator', direction: null }), FLOORS)).toEqual([
      'direction_required',
    ]);
    expect(
      checkConnector(
        draft({ kind: 'escalator', direction: 'down', floorIds: ['gf', 'l1', 'l2'] }),
        FLOORS,
      ),
    ).toEqual(['escalator_two_floors']);
  });

  it('pintu gedung: satu lantai gedung dan Area Luar; konektor lain di satu gedung', () => {
    expect(
      checkConnector(draft({ kind: 'building_door', floorIds: ['gf', 'l1'] }), FLOORS),
    ).toEqual(['door_needs_outdoor']);
    expect(checkConnector(draft({ kind: 'stairs', floorIds: ['gf', 'h-gf'] }), FLOORS)).toEqual([
      'same_building',
    ]);
    expect(checkConnector(draft({ floorIds: ['gf', 'out'] }), FLOORS)).toEqual(['same_building']);
  });
});

describe('defaultConnectorAccessible dan floorsBetween', () => {
  it('lift dan pintu gedung aksesibel; eskalator dan tangga tidak', () => {
    expect(defaultConnectorAccessible('elevator')).toBe(true);
    expect(defaultConnectorAccessible('building_door')).toBe(true);
    expect(defaultConnectorAccessible('escalator')).toBe(false);
    expect(defaultConnectorAccessible('stairs')).toBe(false);
  });

  it('lantai di antara dua lantai satu gedung, termasuk keduanya, dari bawah ke atas', () => {
    expect(floorsBetween(FLOORS, 'l2', 'b1')).toEqual(['b1', 'gf', 'l1', 'l2']);
    expect(floorsBetween(FLOORS, 'gf', 'gf')).toEqual(['gf']);
    expect(floorsBetween(FLOORS, 'gf', 'h-gf')).toEqual([]);
  });
});

describe('setEdgeAccessible', () => {
  const graph: NavGraph = {
    nodes: {},
    edges: { e1: { id: 'e1', floorId: 'f', from: 'a', to: 'b', lengthM: 3, accessible: true } },
  };
  it('mengubah tanda aksesibel edge; nilai sama atau edge tak ada = patch kosong', () => {
    const patch: GraphPatch = setEdgeAccessible(graph, 'e1', false);
    expect(patch.edges).toEqual([
      { id: 'e1', before: graph.edges.e1, after: { ...graph.edges.e1, accessible: false } },
    ]);
    expect(setEdgeAccessible(graph, 'e1', true)).toEqual({ nodes: [], edges: [] });
    expect(setEdgeAccessible(graph, 'x', false)).toEqual({ nodes: [], edges: [] });
  });
});
