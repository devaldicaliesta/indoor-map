import { haversineM } from '@indoor/domain';
import type { RouteGraph } from './graph';

/** Node awal pencarian beserta biaya untuk mencapainya (0, atau dari titik bebas ke node). */
export interface Seed {
  node: number;
  cost: number;
}

/** Node akhir yang diterima beserta biaya tambahan setelahnya (misalnya node → titik bebas). */
export interface Goal {
  node: number;
  cost: number;
}

export interface SearchOptions {
  /** Arc yang tidak boleh dilewati (1 = diblokir): tidak aksesibel atau tertutup. */
  blockedArcs?: Uint8Array;
}

export interface SearchResult {
  /** Total biaya dari seed sampai goal, termasuk biaya seed dan goal. */
  cost: number;
  /** Arc yang dilewati, berurutan. */
  arcs: number[];
  seed: number;
  goal: number;
}

/** Antrean prioritas biner di atas array biasa; entri usang dilewati saat diambil. */
class MinHeap {
  private readonly keys: number[] = [];
  private readonly values: number[] = [];

  get size() {
    return this.keys.length;
  }

  push(key: number, value: number) {
    const keys = this.keys;
    const values = this.values;
    let i = keys.length;
    keys.push(key);
    values.push(value);
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if ((keys[parent] ?? 0) <= key) break;
      keys[i] = keys[parent] ?? 0;
      values[i] = values[parent] ?? 0;
      i = parent;
    }
    keys[i] = key;
    values[i] = value;
  }

  /** Mengembalikan [key, value] terkecil. */
  pop(): [number, number] {
    const keys = this.keys;
    const values = this.values;
    const top: [number, number] = [keys[0] ?? 0, values[0] ?? 0];
    const lastKey = keys.pop() ?? 0;
    const lastValue = values.pop() ?? 0;
    const n = keys.length;
    if (n > 0) {
      let i = 0;
      for (;;) {
        const left = 2 * i + 1;
        if (left >= n) break;
        const right = left + 1;
        const child = right < n && (keys[right] ?? 0) < (keys[left] ?? 0) ? right : left;
        if ((keys[child] ?? 0) >= lastKey) break;
        keys[i] = keys[child] ?? 0;
        values[i] = values[child] ?? 0;
        i = child;
      }
      keys[i] = lastKey;
      values[i] = lastValue;
    }
    return top;
  }
}

/**
 * A* dari beberapa seed ke beberapa goal (node super-sumber dan super-tujuan virtual). Heuristik:
 * jarak lurus terkecil ke goal ditambah `costPerLevel × selisih level`, keduanya tidak pernah
 * melebihi biaya sebenarnya, jadi hasilnya sama dengan Dijkstra. `null` bila tidak ada jalur.
 */
export function aStar(
  graph: RouteGraph,
  seeds: readonly Seed[],
  goals: readonly Goal[],
  options: SearchOptions = {},
): SearchResult | null {
  const n = graph.nodeIds.length;
  const target = n;
  const g = new Float64Array(n + 1).fill(Number.POSITIVE_INFINITY);
  const prevArc = new Int32Array(n).fill(-1);
  const seedOf = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n + 1);
  const goalCost = new Float64Array(n).fill(Number.POSITIVE_INFINITY);
  const goalIndex = new Int32Array(n).fill(-1);
  goals.forEach((goal, i) => {
    if (goal.cost < (goalCost[goal.node] ?? Number.POSITIVE_INFINITY)) {
      goalCost[goal.node] = goal.cost;
      goalIndex[goal.node] = i;
    }
  });
  const goalNodes = [...new Set(goals.map((goal) => goal.node))];
  const { lng, lat, level, offsets, arcTo, arcCost } = graph;
  const perLevel = graph.costPerLevel;
  const heuristic = new Float64Array(n).fill(Number.NaN);
  const h = (u: number) => {
    const cached = heuristic[u] ?? Number.NaN;
    if (!Number.isNaN(cached)) return cached;
    let best = Number.POSITIVE_INFINITY;
    for (const t of goalNodes) {
      const d =
        haversineM(lng[u] ?? 0, lat[u] ?? 0, lng[t] ?? 0, lat[t] ?? 0) +
        perLevel * Math.abs((level[u] ?? 0) - (level[t] ?? 0));
      if (d < best) best = d;
    }
    heuristic[u] = best;
    return best;
  };

  const heap = new MinHeap();
  seeds.forEach((seed, i) => {
    if (seed.cost < (g[seed.node] ?? Number.POSITIVE_INFINITY)) {
      g[seed.node] = seed.cost;
      seedOf[seed.node] = i;
      heap.push(seed.cost + h(seed.node), seed.node);
    }
  });

  const blocked = options.blockedArcs;
  let reachedFrom = -1;
  while (heap.size > 0) {
    const [, u] = heap.pop();
    if (closed[u]) continue;
    closed[u] = 1;
    if (u === target) break;
    const gu = g[u] ?? Number.POSITIVE_INFINITY;
    const toGoal = goalCost[u] ?? Number.POSITIVE_INFINITY;
    if (gu + toGoal < (g[target] ?? Number.POSITIVE_INFINITY)) {
      g[target] = gu + toGoal;
      reachedFrom = u;
      heap.push(gu + toGoal, target);
    }
    const end = offsets[u + 1] ?? 0;
    for (let a = offsets[u] ?? 0; a < end; a++) {
      if (blocked?.[a]) continue;
      const v = arcTo[a] ?? 0;
      if (closed[v]) continue;
      const candidate = gu + (arcCost[a] ?? 0);
      if (candidate < (g[v] ?? Number.POSITIVE_INFINITY)) {
        g[v] = candidate;
        prevArc[v] = a;
        seedOf[v] = seedOf[u] ?? -1;
        heap.push(candidate + h(v), v);
      }
    }
  }

  if (reachedFrom < 0 || !closed[target]) return null;
  const arcs: number[] = [];
  for (let u = reachedFrom; (prevArc[u] ?? -1) >= 0; u = graph.arcFrom[prevArc[u] ?? 0] ?? 0) {
    arcs.push(prevArc[u] ?? 0);
  }
  arcs.reverse();
  return {
    cost: g[target] ?? Number.POSITIVE_INFINITY,
    arcs,
    seed: seedOf[reachedFrom] ?? -1,
    goal: goalIndex[reachedFrom] ?? -1,
  };
}
