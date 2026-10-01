import { describe, expect, it } from 'vitest';
import {
  addPath,
  applyGraphPatch,
  EARTH_RADIUS_M,
  edgeLengthM,
  type GraphPatch,
  graphComponents,
  mergeNodes,
  moveNode,
  type NavEdge,
  type NavGraph,
  type NavNode,
  type NavNodeRole,
  type Position,
  removeEdge,
  removeNode,
  splitEdge,
} from '../src';

const RAD = Math.PI / 180;
const BASE: Position = [106.8, -6.175];
const KX = RAD * EARTH_RADIUS_M * Math.cos(BASE[1] * RAD);
const KY = RAD * EARTH_RADIUS_M;
/** Posisi dari meter di sekitar titik acuan: `x` ke timur, `y` ke utara. */
const m = (x: number, y: number): Position => [BASE[0] + x / KX, BASE[1] + y / KY];
/** Kebalikan `m`, untuk memeriksa posisi node dalam meter. */
const xy = (p: Position): [number, number] => [(p[0] - BASE[0]) * KX, (p[1] - BASE[1]) * KY];

const EMPTY: NavGraph = { nodes: {}, edges: {} };
function ids(prefix = 'id') {
  let n = 0;
  return () => `${prefix}${++n}`;
}

function draw(graph: NavGraph, line: Position[], newId = ids(), floorId = 'f1'): NavGraph {
  return applyGraphPatch(graph, addPath(graph, line, { floorId, newId }));
}
const nodeList = (graph: NavGraph) => Object.values(graph.nodes);
const edgeList = (graph: NavGraph) => Object.values(graph.edges);
const degree = (graph: NavGraph, id: string) =>
  edgeList(graph).filter((e) => e.from === id || e.to === id).length;
const nodeNear = (graph: NavGraph, x: number, y: number, tolerance = 0.05) =>
  nodeList(graph).find((n) => {
    const [nx, ny] = xy(n.coordinates);
    return Math.hypot(nx - x, ny - y) <= tolerance;
  });

/** Graf sah: edge menunjuk node di lantai yang sama, tanpa loop, tanpa pasangan kembar, panjang sesuai posisi. */
function expectValid(graph: NavGraph) {
  const pairs = new Set<string>();
  for (const edge of edgeList(graph)) {
    const a = graph.nodes[edge.from];
    const b = graph.nodes[edge.to];
    expect(a && b, `edge ${edge.id} menunjuk node yang ada`).toBeTruthy();
    if (!a || !b) continue;
    expect(edge.from).not.toBe(edge.to);
    expect(a.floorId).toBe(edge.floorId);
    expect(b.floorId).toBe(edge.floorId);
    const pair = [edge.from, edge.to].sort().join('|');
    expect(pairs.has(pair), `pasangan ${pair} kembar`).toBe(false);
    pairs.add(pair);
    expect(edge.lengthM).toBeCloseTo(edgeLengthM(a.coordinates, b.coordinates), 2);
  }
}

describe('addPath', () => {
  it('garis baru: node di ujung dan titik belok, edge di antaranya dengan panjang dalam meter', () => {
    const graph = draw(EMPTY, [m(0, 0), m(30, 0), m(30, 40)]);
    expectValid(graph);
    expect(nodeList(graph)).toHaveLength(3);
    expect(nodeList(graph).every((n) => n.role === 'path' && n.featureId === null)).toBe(true);
    const lengths = edgeList(graph)
      .map((e) => e.lengthM)
      .sort((a, b) => a - b);
    // Selisih terhadap ukuran nyata jauh di bawah 2%.
    expect(Math.abs((lengths[0] ?? 0) - 30) / 30).toBeLessThan(0.002);
    expect(Math.abs((lengths[1] ?? 0) - 40) / 40).toBeLessThan(0.002);
    expect(edgeList(graph).every((e) => e.accessible && e.floorId === 'f1')).toBe(true);
  });

  it('dua garis bersilangan menghasilkan node di persimpangan', () => {
    const first = draw(EMPTY, [m(0, 0), m(40, 0)], ids('a'));
    const [original] = edgeList(first);
    const graph = draw(first, [m(20, -20), m(20, 20)], ids('b'));
    expectValid(graph);
    expect(nodeList(graph)).toHaveLength(5);
    expect(edgeList(graph)).toHaveLength(4);
    const crossing = nodeNear(graph, 20, 0);
    expect(crossing).toBeDefined();
    expect(degree(graph, crossing?.id ?? '')).toBe(4);
    // Edge yang terpotong tetap memakai id lamanya untuk bagian pertama.
    expect(graph.edges[original?.id ?? '']).toMatchObject({ from: original?.from });
    expect(graphComponents(graph)).toHaveLength(1);
  });

  it('beberapa persimpangan di satu ruas diurutkan sepanjang ruas', () => {
    let graph = draw(EMPTY, [m(10, -10), m(10, 10)], ids('a'));
    graph = draw(graph, [m(30, -10), m(30, 10)], ids('b'));
    graph = draw(graph, [m(0, 0), m(40, 0)], ids('c'));
    expectValid(graph);
    const west = nodeNear(graph, 10, 0);
    const east = nodeNear(graph, 30, 0);
    const start = nodeNear(graph, 0, 0);
    const end = nodeNear(graph, 40, 0);
    const linked = (a?: NavNode, b?: NavNode) =>
      edgeList(graph).some(
        (e) => (e.from === a?.id && e.to === b?.id) || (e.from === b?.id && e.to === a?.id),
      );
    expect(linked(start, west) && linked(west, east) && linked(east, end)).toBe(true);
    expect(edgeList(graph)).toHaveLength(7);
  });

  it('ujung di dekat node atau edge yang ada (< 0,5 m) menyambung ke sana', () => {
    const base = draw(EMPTY, [m(0, 0), m(40, 0)], ids('a'));
    const toNode = draw(base, [m(40.3, 0.2), m(40, 20)], ids('b'));
    expectValid(toNode);
    expect(nodeList(toNode)).toHaveLength(3);
    expect(graphComponents(toNode)).toHaveLength(1);

    const toEdge = draw(base, [m(10, 0.4), m(10, 20)], ids('c'));
    expectValid(toEdge);
    const junction = nodeNear(toEdge, 10, 0);
    expect(junction).toBeDefined();
    expect(degree(toEdge, junction?.id ?? '')).toBe(3);
    expect(graphComponents(toEdge)).toHaveLength(1);
  });

  it('garis yang melewati node yang ada tersambung lewat node itu', () => {
    const base = draw(EMPTY, [m(20, 0), m(20, 20)], ids('a'));
    const graph = draw(base, [m(0, 0), m(40, 0)], ids('b'));
    expectValid(graph);
    const corner = nodeNear(graph, 20, 0);
    expect(degree(graph, corner?.id ?? '')).toBe(3);
    expect(nodeList(graph)).toHaveLength(4);
  });

  it('menyusuri edge yang ada tidak membuat node atau edge kembar', () => {
    const base = draw(EMPTY, [m(0, 0), m(40, 0)], ids('a'));
    const again = draw(base, [m(0, 0), m(40, 0)], ids('b'));
    expect(again).toEqual(base);
    const partial = draw(base, [m(10, 0), m(40, 0), m(40, 10)], ids('c'));
    expectValid(partial);
    expect(nodeList(partial)).toHaveLength(4);
    expect(edgeList(partial)).toHaveLength(3);
  });

  it('garis yang memotong dirinya sendiri mendapat node persimpangan', () => {
    const graph = draw(EMPTY, [m(0, 0), m(20, 0), m(20, 10), m(10, 10), m(10, -10)]);
    expectValid(graph);
    const crossing = nodeNear(graph, 10, 0);
    expect(degree(graph, crossing?.id ?? '')).toBe(4);
  });

  it('node dan edge lantai lain diabaikan; edge selalu di satu lantai', () => {
    const other = draw(EMPTY, [m(0, 0), m(40, 0)], ids('a'), 'f2');
    const graph = draw(other, [m(20, -20), m(20, 20)], ids('b'), 'f1');
    expectValid(graph);
    expect(nodeList(graph)).toHaveLength(4);
    expect(edgeList(graph).filter((e) => e.floorId === 'f1')).toHaveLength(1);
  });

  it('garis yang menyusut ke satu titik tidak mengubah apa pun', () => {
    expect(addPath(EMPTY, [m(0, 0), m(0.1, 0.1)], { floorId: 'f1', newId: ids() })).toEqual({
      nodes: [],
      edges: [],
    });
  });
});

function node(id: string, x: number, y: number, role: NavNodeRole = 'path', featureId = null) {
  return { id, floorId: 'f1', coordinates: m(x, y), role, featureId } as NavNode;
}
function graphOf(nodes: NavNode[], pairs: [string, string][]): NavGraph {
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const edges: Record<string, NavEdge> = {};
  for (const [from, to] of pairs) {
    const id = `${from}-${to}`;
    edges[id] = {
      id,
      floorId: 'f1',
      from,
      to,
      lengthM: edgeLengthM(byId[from]?.coordinates ?? m(0, 0), byId[to]?.coordinates ?? m(0, 0)),
      accessible: true,
    };
  }
  return { nodes: byId, edges };
}
const apply = (graph: NavGraph, patch: GraphPatch | null) =>
  patch ? applyGraphPatch(graph, patch) : graph;

describe('moveNode dan mergeNodes', () => {
  const line = graphOf(
    [node('a', 0, 0), node('b', 10, 0), node('c', 20, 0), node('d', 10, 10)],
    [
      ['a', 'b'],
      ['b', 'c'],
      ['b', 'd'],
    ],
  );

  it('memindah node: edge ikut dan panjangnya dihitung ulang', () => {
    const moved = apply(line, moveNode(line, 'b', m(10, 5)));
    expectValid(moved);
    expect(xy(moved.nodes.b?.coordinates ?? m(0, 0))[1]).toBeCloseTo(5, 4);
    expect(moved.edges['b-d']?.lengthM).toBeCloseTo(5, 1);
    expect(moved.edges['a-b']?.lengthM).toBeCloseTo(Math.hypot(10, 5), 1);
  });

  it('dilepas < 0,5 m dari node lain: digabung, loop dan edge kembar dibuang', () => {
    const merged = apply(line, moveNode(line, 'd', m(20.3, 0.2)));
    expectValid(merged);
    expect(merged.nodes.d).toBeUndefined();
    expect(Object.keys(merged.edges).sort()).toEqual(['a-b', 'b-c']);
    const triangle = apply(line, moveNode(line, 'c', m(10, 10.4)));
    expectValid(triangle);
    expect(triangle.nodes.c).toBeUndefined();
    expect(degree(triangle, 'd')).toBe(1);
    expect(graphComponents(triangle)).toHaveLength(1);
  });

  it('gabung langsung: node sasaran tetap di tempat, edge sumber dipindah ke sana', () => {
    const merged = apply(line, mergeNodes(line, 'd', 'c'));
    expectValid(merged);
    expect(merged.nodes.c).toBeUndefined();
    expect(merged.nodes.d?.coordinates).toEqual(line.nodes.d?.coordinates);
    expect(degree(merged, 'd')).toBe(1);
  });

  it('titik masuk dipertahankan saat digabung dengan node jalur; dua node berjangkar tidak digabung', () => {
    const graph = graphOf(
      [
        node('p', 0, 0),
        { ...node('e', 5, 0, 'entrance'), featureId: 'unit-1' },
        node('c', 10, 0, 'connector'),
        node('o', 15, 0, 'origin'),
      ],
      [
        ['p', 'e'],
        ['e', 'c'],
        ['c', 'o'],
      ],
    );
    const kept = apply(graph, mergeNodes(graph, 'p', 'e'));
    expect(kept.nodes.p).toBeUndefined();
    expect(kept.nodes.e).toMatchObject({ role: 'entrance', featureId: 'unit-1' });
    expect(kept.nodes.e?.coordinates).toEqual(graph.nodes.p?.coordinates);
    expectValid(kept);
    expect(mergeNodes(graph, 'c', 'o')).toBeNull();
    // Dilepas di atas node berjangkar lain: hanya dipindah, tidak digabung.
    const moved = apply(graph, moveNode(graph, 'o', m(10.2, 0)));
    expect(moved.nodes.o).toBeDefined();
    expect(moved.nodes.c).toBeDefined();
  });

  it('graf tetap terhubung setelah pindah dan gabung acak', () => {
    let seed = 7;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const nodes: NavNode[] = [];
    const pairs: [string, string][] = [];
    const roles: NavNodeRole[] = ['path', 'path', 'path', 'entrance', 'connector', 'origin'];
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        const role = roles[(i * 6 + j) % roles.length] ?? 'path';
        const n = node(`n${i}-${j}`, i * 10, j * 10, role);
        nodes.push(role === 'entrance' ? { ...n, featureId: `unit-${i}-${j}` } : n);
        if (i > 0) pairs.push([`n${i - 1}-${j}`, `n${i}-${j}`]);
        if (j > 0) pairs.push([`n${i}-${j - 1}`, `n${i}-${j}`]);
      }
    }
    let graph = graphOf(nodes, pairs);
    for (let step = 0; step < 300; step++) {
      const all = nodeList(graph);
      const pick = all[Math.floor(random() * all.length)];
      if (!pick) break;
      if (random() < 0.5) {
        const [x, y] = xy(pick.coordinates);
        const target = random() < 0.3 ? all[Math.floor(random() * all.length)] : undefined;
        const to = target
          ? target.coordinates
          : m(x + (random() - 0.5) * 8, y + (random() - 0.5) * 8);
        graph = apply(graph, moveNode(graph, pick.id, to));
      } else {
        const neighbour = edgeList(graph).find((e) => e.from === pick.id || e.to === pick.id);
        const other = neighbour
          ? neighbour.from === pick.id
            ? neighbour.to
            : neighbour.from
          : null;
        if (other) graph = apply(graph, mergeNodes(graph, other, pick.id));
      }
      expectValid(graph);
      expect(graphComponents(graph)).toHaveLength(1);
    }
    expect(nodeList(graph).length).toBeLessThan(36);
  });
});

describe('removeNode, removeEdge, splitEdge', () => {
  const tee = graphOf(
    [node('a', 0, 0), node('b', 10, 0), node('c', 20, 0), node('d', 10, 10), node('e', 30, 0)],
    [
      ['a', 'b'],
      ['b', 'c'],
      ['b', 'd'],
      ['c', 'e'],
    ],
  );

  it('hapus node berderajat 2 menyambung kedua tetangganya dengan id edge pertama', () => {
    const graph = apply(tee, removeNode(tee, 'c'));
    expectValid(graph);
    expect(graph.nodes.c).toBeUndefined();
    expect(Object.keys(graph.edges).sort()).toEqual(['a-b', 'b-c', 'b-d']);
    expect(graph.edges['b-c']).toMatchObject({ from: 'b', to: 'e' });
    expect(graph.edges['b-c']?.lengthM).toBeCloseTo(20, 1);
  });

  it('hapus node persimpangan menghapus edge-nya dan node jalur yang jadi terpencil', () => {
    const graph = apply(tee, removeNode(tee, 'b'));
    expectValid(graph);
    expect(Object.keys(graph.nodes).sort()).toEqual(['c', 'e']);
    expect(Object.keys(graph.edges)).toEqual(['c-e']);
  });

  it('node yang dirujuk konektor, titik asal, atau Info Point tidak dihapus lewat graf', () => {
    for (const role of ['connector', 'origin', 'info_point'] as const) {
      const graph = graphOf([node('a', 0, 0), node('x', 10, 0, role)], [['a', 'x']]);
      expect(removeNode(graph, 'x')).toBeNull();
      // Menghapus edge-nya tidak ikut menghapus node itu.
      const cut = apply(graph, removeEdge(graph, 'a-x'));
      expect(Object.keys(cut.nodes)).toEqual(['x']);
    }
  });

  it('hapus edge membuang node jalur yang terpencil tetapi mempertahankan titik masuk', () => {
    const graph = graphOf(
      [node('a', 0, 0), { ...node('u', 10, 0, 'entrance'), featureId: 'unit-1' }],
      [['a', 'u']],
    );
    const cut = apply(graph, removeEdge(graph, 'a-u'));
    expect(Object.keys(cut.nodes)).toEqual(['u']);
    expect(cut.edges).toEqual({});
  });

  it('pisah edge di titik terdekat (atau di tengah): dua edge, id lama untuk bagian pertama', () => {
    const atPoint = apply(tee, splitEdge(tee, 'c-e', m(24, 3), ids('s')));
    expectValid(atPoint);
    const middle = nodeNear(atPoint, 24, 0);
    expect(middle).toMatchObject({ id: 's1', role: 'path' });
    expect(atPoint.edges['c-e']).toMatchObject({ from: 'c', to: 's1' });
    expect(atPoint.edges.s2).toMatchObject({ from: 's1', to: 'e' });
    const half = apply(tee, splitEdge(tee, 'a-b', null, ids('h')));
    expect(nodeNear(half, 5, 0)).toBeDefined();
    expect(splitEdge(tee, 'a-b', m(0.2, 0), ids('x'))).toBeNull();
  });
});

describe('graphComponents dan edgeLengthM', () => {
  it('komponen terbesar lebih dulu; node tanpa edge berdiri sendiri', () => {
    const graph = graphOf(
      [node('a', 0, 0), node('b', 10, 0), node('c', 20, 0), node('d', 50, 0)],
      [
        ['a', 'b'],
        ['b', 'c'],
      ],
    );
    expect(graphComponents(graph)).toEqual([['a', 'b', 'c'], ['d']]);
  });

  it('panjang dua desimal', () => {
    expect(edgeLengthM(m(0, 0), m(3, 4))).toBe(5);
    expect(Number.isInteger(edgeLengthM(m(0, 0), m(1.234567, 0)) * 100)).toBe(true);
  });
});
