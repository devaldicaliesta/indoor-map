import { haversineM, type SnapshotGraph, type SnapshotNavNode } from '@indoor/domain';

/** PRNG kecil ber-seed (mulberry32) agar graf acak selalu sama di setiap run. */
export function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const id = (prefix: string, n: number) => `${prefix}${n}`;

export interface RandomGraphOptions {
  nodes: number;
  /** Tetangga terdekat yang disambung per node. */
  neighbours: number;
  /** Sisi area (m). */
  sizeM?: number;
  floors?: readonly string[];
}

/**
 * Graf jalur acak di sekitar Jakarta: node tersebar di beberapa lantai (tanpa konektor), setiap
 * node disambung ke tetangga terdekatnya dengan panjang ≥ jarak lurus.
 */
export function randomGraph(seed: number, options: RandomGraphOptions): SnapshotGraph {
  const next = random(seed);
  const floors = options.floors ?? ['f1'];
  const size = (options.sizeM ?? 200) / 111_000;
  const nodes: SnapshotNavNode[] = Array.from({ length: options.nodes }, (_, i) => ({
    id: id('n', i),
    floorId: floors[Math.floor(next() * floors.length)] ?? 'f1',
    coordinates: [106.8 + next() * size, -6.17 - next() * size],
    role: 'path',
    featureId: null,
  }));
  const edges: SnapshotGraph['edges'] = [];
  const seen = new Set<string>();
  for (const a of nodes) {
    const nearest = nodes
      .filter((b) => b !== a && b.floorId === a.floorId)
      .map((b) => ({ b, d: distance(a, b) }))
      .sort((x, y) => x.d - y.d)
      .slice(0, options.neighbours);
    for (const { b, d } of nearest) {
      const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({
        id: id('e', edges.length),
        floorId: a.floorId,
        from: a.id,
        to: b.id,
        lengthM: Math.round(d * (1 + next() * 0.3) * 100) / 100,
        accessible: next() > 0.2,
      });
    }
  }
  return { nodes, edges, connectors: [] };
}

function distance(a: SnapshotNavNode, b: SnapshotNavNode): number {
  return haversineM(a.coordinates[0], a.coordinates[1], b.coordinates[0], b.coordinates[1]);
}

/**
 * Dijkstra rujukan langsung di atas graf snapshot (tanpa CSR, tanpa heuristik), dengan aturan
 * bobot yang sama: panjang tercatat, minimal jarak lurus.
 */
export function referenceCost(graph: SnapshotGraph, from: string, to: string): number | null {
  const byId = new Map(graph.nodes.map((n) => [n.id, n]));
  const adjacent = new Map<string, { to: string; cost: number }[]>();
  for (const e of graph.edges) {
    const a = byId.get(e.from);
    const b = byId.get(e.to);
    if (!a || !b || a.floorId !== b.floorId) continue;
    const cost = Math.max(e.lengthM, distance(a, b));
    adjacent.set(e.from, [...(adjacent.get(e.from) ?? []), { to: e.to, cost }]);
    adjacent.set(e.to, [...(adjacent.get(e.to) ?? []), { to: e.from, cost }]);
  }
  const dist = new Map<string, number>([[from, 0]]);
  const done = new Set<string>();
  for (;;) {
    let u: string | null = null;
    for (const [node, d] of dist) {
      if (!done.has(node) && (u === null || d < (dist.get(u) ?? Number.POSITIVE_INFINITY)))
        u = node;
    }
    if (u === null) return null;
    if (u === to) return dist.get(u) ?? null;
    done.add(u);
    for (const { to: v, cost } of adjacent.get(u) ?? []) {
      const candidate = (dist.get(u) ?? 0) + cost;
      if (candidate < (dist.get(v) ?? Number.POSITIVE_INFINITY)) dist.set(v, candidate);
    }
  }
}

/** Dijkstra polos di atas arc graf yang sudah dibangun (tanpa heuristik), untuk graf berkonektor. */
export function graphCost(
  graph: {
    offsets: Int32Array;
    arcTo: Int32Array;
    arcCost: Float64Array;
    nodeIds: readonly string[];
  },
  from: number,
  to: number,
): number | null {
  const n = graph.nodeIds.length;
  const dist = new Float64Array(n).fill(Number.POSITIVE_INFINITY);
  const done = new Uint8Array(n);
  dist[from] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) {
      if (!done[i] && (u < 0 || (dist[i] ?? 0) < (dist[u] ?? 0))) u = i;
    }
    if (u < 0 || !Number.isFinite(dist[u] ?? Number.POSITIVE_INFINITY)) return null;
    if (u === to) return dist[u] ?? null;
    done[u] = 1;
    for (let a = graph.offsets[u] ?? 0; a < (graph.offsets[u + 1] ?? 0); a++) {
      const v = graph.arcTo[a] ?? 0;
      const candidate = (dist[u] ?? 0) + (graph.arcCost[a] ?? 0);
      if (candidate < (dist[v] ?? Number.POSITIVE_INFINITY)) dist[v] = candidate;
    }
  }
}
