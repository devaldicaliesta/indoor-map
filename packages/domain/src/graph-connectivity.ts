import type { NavGraph } from './nav-graph';

/** Union-find berindeks; akar terkecil dipertahankan agar komponen urut kemunculan elemen. */
function unionFind(size: number) {
  const parent = Int32Array.from({ length: size }, (_, i) => i);
  const root = (start: number): number => {
    let i = start;
    while (parent[i] !== i) {
      const grand = parent[parent[i] ?? i] ?? i;
      parent[i] = grand;
      i = grand;
    }
    return i;
  };
  const union = (a: number, b: number) => {
    const ra = root(a);
    const rb = root(b);
    if (ra !== rb) parent[Math.max(ra, rb)] = Math.min(ra, rb);
  };
  return { root, union };
}

const smallestId = (ids: readonly string[]) => ids.reduce((min, id) => (id < min ? id : min));

/** Komponen terhubung graf: id node per komponen, terbesar lebih dulu. */
export function graphComponents(graph: NavGraph): string[][] {
  const ids = Object.keys(graph.nodes);
  const index = new Map(ids.map((id, i) => [id, i]));
  const sets = unionFind(ids.length);
  for (const { from, to } of Object.values(graph.edges)) {
    const a = index.get(from);
    const b = index.get(to);
    if (a !== undefined && b !== undefined) sets.union(a, b);
  }
  const groups = new Map<number, string[]>();
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i] as string;
    const root = sets.root(i);
    const group = groups.get(root);
    if (group) group.push(id);
    else groups.set(root, [id]);
  }
  return [...groups.values()].sort((a, b) => b.length - a.length);
}

/** Pemberhentian konektor; untuk keterhubungan cukup id node-nya. */
export interface ConnectorLinks {
  stops: readonly { nodeId: string }[];
}

/**
 * Keterhubungan bagian graf yang tidak sedang disunting (lantai lain), dihitung sekali lalu dipakai
 * ulang setiap graf lantai yang disunting berubah. Hanya node yang punya edge yang dicatat.
 */
export interface ComponentSummary {
  componentOf: ReadonlyMap<string, number>;
  /** Jumlah node dan id node terkecil per komponen. */
  components: readonly { size: number; smallest: string }[];
}

export function summarizeComponents(graph: NavGraph): ComponentSummary {
  const componentOf = new Map<string, number>();
  const components = graphComponents(graph)
    .filter((ids) => ids.length > 1)
    .map((ids, c) => {
      for (const id of ids) componentOf.set(id, c);
      return { size: ids.length, smallest: smallestId(ids) };
    });
  return { componentOf, components };
}

const NO_OTHERS: ComponentSummary = { componentOf: new Map(), components: [] };

/**
 * Node `graph` yang tidak terhubung ke komponen terbesar graf venue, yaitu `graph` ditambah lantai
 * lain yang sudah diringkas (`others`). Edge menyambung node di satu lantai; konektor menyambung
 * pemberhentiannya yang sudah punya edge di lantainya, sehingga pemberhentian yang belum disambung
 * ke jalur ikut terisolasi. Seri ukuran diputus id node terkecil agar hasilnya tidak bergantung
 * urutan data. Kosong selama graf venue belum punya edge.
 */
export function isolatedNodeIds(
  graph: NavGraph,
  connectors: readonly ConnectorLinks[],
  others: ComponentSummary = NO_OTHERS,
): Set<string> {
  // Elemen: komponen lantai lain lebih dulu, lalu setiap node `graph`.
  const offset = others.components.length;
  const ids = Object.keys(graph.nodes);
  const index = new Map(ids.map((id, i) => [id, offset + i]));
  const sets = unionFind(offset + ids.length);
  const linked = new Set<number>(others.components.keys());
  for (const { from, to } of Object.values(graph.edges)) {
    const a = index.get(from);
    const b = index.get(to);
    if (a === undefined || b === undefined) continue;
    sets.union(a, b);
    linked.add(a);
    linked.add(b);
  }
  if (linked.size === 0) return new Set();
  for (const connector of connectors) {
    const [first, ...rest] = connector.stops.flatMap((stop) => {
      const element = index.get(stop.nodeId) ?? others.componentOf.get(stop.nodeId);
      return element !== undefined && linked.has(element) ? [element] : [];
    });
    for (const element of rest) if (first !== undefined) sets.union(first, element);
  }

  const size = new Map<number, number>();
  const smallest = new Map<number, string>();
  const add = (element: number, weight: number, id: string) => {
    const root = sets.root(element);
    size.set(root, (size.get(root) ?? 0) + weight);
    const min = smallest.get(root);
    if (min === undefined || id < min) smallest.set(root, id);
  };
  for (const [c, component] of others.components.entries())
    add(c, component.size, component.smallest);
  for (const [i, id] of ids.entries()) add(offset + i, 1, id);
  let main = -1;
  for (const [root, n] of size) {
    const best = size.get(main) ?? 0;
    const tie = n === best && (smallest.get(root) ?? '') < (smallest.get(main) ?? '');
    if (n > best || tie) main = root;
  }
  return new Set(ids.filter((_, i) => sets.root(offset + i) !== main));
}
