import { describe, expect, it } from 'vitest';
import {
  addPath,
  applyEntrances,
  applyGraphPatch,
  EARTH_RADIUS_M,
  type EntranceFeature,
  graphComponents,
  linkEntrance,
  type NavGraph,
  type Position,
  removeEntrancesOf,
  suggestEntrances,
  unlinkedFeatures,
} from '../src';

const RAD = Math.PI / 180;
const BASE: Position = [106.8, -6.175];
const KX = RAD * EARTH_RADIUS_M * Math.cos(BASE[1] * RAD);
const KY = RAD * EARTH_RADIUS_M;
const m = (x: number, y: number): Position => [BASE[0] + x / KX, BASE[1] + y / KY];
const xy = (p: Position): [number, number] => [(p[0] - BASE[0]) * KX, (p[1] - BASE[1]) * KY];

function ids(prefix = 'id') {
  let n = 0;
  return () => `${prefix}${++n}`;
}
const unit = (id: string, x0: number, y0: number, x1: number, y1: number): EntranceFeature => ({
  geometry: {
    type: 'Polygon',
    coordinates: [[m(x0, y0), m(x1, y0), m(x1, y1), m(x0, y1), m(x0, y0)]],
  },
  properties: { id, kind: 'unit', floorId: 'f1' },
});
const point = (id: string, kind: 'door' | 'facility', x: number, y: number): EntranceFeature => ({
  geometry: { type: 'Point', coordinates: m(x, y) },
  properties: { id, kind, floorId: 'f1' },
});

// Koridor y = 0 dari x = 0 sampai 60; unit di utaranya, satu unit jauh di utara.
const FEATURES: EntranceFeature[] = [
  unit('A', 0, 3, 10, 13),
  point('door-a', 'door', 5, 3),
  unit('B', 12, 3, 22, 13),
  point('door-b1', 'door', 14, 3.4),
  point('door-b2', 'door', 20, 3),
  unit('C', 24, 3, 34, 13),
  unit('D', 0, 40, 10, 50),
  point('door-d', 'door', 5, 40),
  point('door-lepas', 'door', 30, 1.5),
  point('toilet', 'facility', 7, 8),
  point('apar', 'facility', 40, -2),
];
const EMPTY: NavGraph = { nodes: {}, edges: {} };
const corridor = applyGraphPatch(
  EMPTY,
  addPath(EMPTY, [m(0, 0), m(60, 0)], { floorId: 'f1', newId: ids('c') }),
);
const near = (p: Position, x: number, y: number, tolerance = 0.05) => {
  const [px, py] = xy(p);
  return Math.hypot(px - x, py - y) <= tolerance;
};

describe('suggestEntrances', () => {
  const plan = suggestEntrances(FEATURES, corridor, 'f1');
  const of = (id: string) => plan.suggestions.filter((s) => s.featureId === id);

  it('unit berpintu mendapat saran dari setiap pintunya ke titik jalur terdekat', () => {
    expect(of('A')).toHaveLength(1);
    expect(of('A')[0]).toMatchObject({ source: 'door', doorId: 'door-a', position: m(5, 3) });
    expect(near(of('A')[0]?.attach ?? m(0, 0), 5, 0)).toBe(true);
    expect(of('A')[0]?.lengthM).toBeCloseTo(3, 1);
    // Pintu 0,4 m di dalam tepi unit tetap milik unit itu; pintu 1,5 m dari tepi tidak.
    expect(of('B').map((s) => s.doorId)).toEqual(['door-b1', 'door-b2']);
    expect(plan.suggestions.some((s) => s.doorId === 'door-lepas')).toBe(false);
  });

  it('unit tanpa pintu disambung dari tepinya yang terdekat ke jalur', () => {
    const [c] = of('C');
    expect(c?.source).toBe('edge');
    // Sisi yang sejajar jalur: titik tengahnya, bukan sudut unit.
    const [x, y] = xy(c?.position ?? m(0, 0));
    expect(y).toBeCloseTo(3, 3);
    expect(x).toBeCloseTo(29, 2);
    expect(c?.lengthM).toBeCloseTo(3, 1);
  });

  it('fasilitas di dalam unit memakai pintu unit itu; di luar unit memakai titiknya sendiri', () => {
    expect(of('toilet')).toMatchObject([{ source: 'door', doorId: 'door-a', position: m(5, 3) }]);
    expect(of('apar')).toMatchObject([{ source: 'point', doorId: null, position: m(40, -2) }]);
    expect(near(of('apar')[0]?.attach ?? m(0, 0), 40, 0)).toBe(true);
  });

  it('unit yang jalur terdekatnya lebih dari 15 m tidak disarankan', () => {
    expect(of('D')).toEqual([]);
    expect(plan.unreachable).toEqual([{ featureId: 'D', reason: 'too_far' }]);
  });

  it('tanpa jalur di lantai: semua belum bisa disarankan', () => {
    const other = applyGraphPatch(
      EMPTY,
      addPath(EMPTY, [m(0, 0), m(60, 0)], { floorId: 'f2', newId: ids('o') }),
    );
    const none = suggestEntrances(FEATURES, other, 'f1');
    expect(none.suggestions).toEqual([]);
    expect(none.unreachable.map((u) => u.reason)).toEqual(Array(6).fill('no_path'));
  });

  it('unit yang sudah punya titik masuk tidak disarankan lagi', () => {
    const linked = applyGraphPatch(corridor, applyEntrances(corridor, 'f1', of('A'), ids('e')));
    expect(
      suggestEntrances(FEATURES, linked, 'f1').suggestions.map((s) => s.featureId),
    ).not.toContain('A');
  });
});

describe('applyEntrances dan unlinkedFeatures', () => {
  it('menyetujui semua saran: setiap titik masuk satu edge ke jalur, graf tetap satu komponen', () => {
    const plan = suggestEntrances(FEATURES, corridor, 'f1');
    expect(unlinkedFeatures(FEATURES, corridor).map((f) => f.properties.id)).toEqual([
      'A',
      'B',
      'C',
      'D',
      'toilet',
      'apar',
    ]);
    const graph = applyGraphPatch(
      corridor,
      applyEntrances(corridor, 'f1', plan.suggestions, ids('e')),
    );
    expect(unlinkedFeatures(FEATURES, graph).map((f) => f.properties.id)).toEqual(['D']);
    const entrances = Object.values(graph.nodes).filter((n) => n.role === 'entrance');
    expect(entrances).toHaveLength(plan.suggestions.length);
    for (const node of entrances) {
      const edges = Object.values(graph.edges).filter(
        (e) => e.from === node.id || e.to === node.id,
      );
      expect(edges).toHaveLength(1);
      expect(edges[0]?.lengthM).toBeGreaterThan(0);
    }
    expect(graphComponents(graph)).toHaveLength(1);
    // Beberapa sambungan di satu edge koridor memecahnya di setiap titik sambung.
    const corridorNodes = Object.values(graph.nodes).filter((n) => n.role === 'path');
    expect(corridorNodes.length).toBeGreaterThan(2);
  });

  it('saran yang titik sambungnya sudah hilang dari graf dilewati', () => {
    const [first] = suggestEntrances(FEATURES, corridor, 'f1').suggestions;
    if (!first) throw new Error('tidak ada saran');
    const moved = { ...first, attach: m(5, 30) };
    expect(applyEntrances(corridor, 'f1', [moved], ids('x'))).toEqual({ nodes: [], edges: [] });
  });
});

describe('linkEntrance (manual: pilih unit, klik jalur)', () => {
  it('unit disambung dari tepinya yang terdekat ke titik jalur yang diklik', () => {
    const d = FEATURES.find((f) => f.properties.id === 'D');
    if (!d) throw new Error('unit D tidak ada');
    const patch = linkEntrance(corridor, 'f1', d, m(5, 0.2), ids('l'));
    expect(patch).not.toBeNull();
    const graph = applyGraphPatch(corridor, patch ?? { nodes: [], edges: [] });
    const entrance = Object.values(graph.nodes).find((n) => n.featureId === 'D');
    expect(entrance?.role).toBe('entrance');
    expect(near(entrance?.coordinates ?? m(0, 0), 5, 40)).toBe(true);
    const link = Object.values(graph.edges).find(
      (e) => e.from === entrance?.id || e.to === entrance?.id,
    );
    expect(link?.lengthM).toBeCloseTo(40, 0);
    expect(graphComponents(graph)).toHaveLength(1);
  });

  it('fasilitas disambung dari titiknya; tanpa jalur di lantai tidak ada yang dibuat', () => {
    const apar = FEATURES.find((f) => f.properties.id === 'apar');
    if (!apar) throw new Error('fasilitas tidak ada');
    const graph = applyGraphPatch(
      corridor,
      linkEntrance(corridor, 'f1', apar, m(50, 0), ids('l')) ?? { nodes: [], edges: [] },
    );
    const entrance = Object.values(graph.nodes).find((n) => n.featureId === 'apar');
    expect(entrance?.coordinates).toEqual(m(40, -2));
    expect(linkEntrance(EMPTY, 'f1', apar, m(50, 0), ids('l'))).toBeNull();
  });
});

describe('removeEntrancesOf', () => {
  it('menghapus unit ikut menghapus titik masuk dan edge sambungnya, jalur tetap utuh', () => {
    const plan = suggestEntrances(FEATURES, corridor, 'f1');
    const graph = applyGraphPatch(
      corridor,
      applyEntrances(corridor, 'f1', plan.suggestions, ids('e')),
    );
    const patch = removeEntrancesOf(graph, ['B']);
    expect(patch.nodes.filter((c) => c.after === null)).toHaveLength(2);
    const after = applyGraphPatch(graph, patch);
    expect(Object.values(after.nodes).some((n) => n.featureId === 'B')).toBe(false);
    expect(Object.values(after.nodes).some((n) => n.featureId === 'A')).toBe(true);
    expect(graphComponents(after)).toHaveLength(1);
    expect(removeEntrancesOf(graph, ['tidak-ada'])).toEqual({ nodes: [], edges: [] });
  });
});
