import { ARC_ACCESSIBLE, ARC_CONNECTOR } from './arcs';
import type { RouteGraph } from './graph';

/**
 * Penutupan sementara (tabel `closures`): tepat satu sasaran, yaitu area/fitur, edge jalur, atau
 * konektor. Berlaku sejak `startsAt` sampai sebelum `endsAt` (`null` = sampai diakhiri).
 */
export interface RouteClosure {
  id: string;
  featureId: string | null;
  edgeId: string | null;
  connectorId: string | null;
  startsAt: string;
  endsAt: string | null;
}

export interface RouteOptions {
  /** Rute kursi roda: hanya edge dan konektor yang ditandai aksesibel. */
  accessible?: boolean;
  closures?: readonly RouteClosure[];
  /**
   * Waktu acuan penutupan, disuntikkan pemanggil (bukan jam sistem) agar hasilnya bisa dites.
   * Tanpa `now`, semua penutupan yang diberikan dianggap berlaku.
   */
  now?: Date | number;
}

/** Penutupan yang berlaku pada `now`. */
export function activeClosures(
  closures: readonly RouteClosure[],
  now: Date | number | undefined,
): RouteClosure[] {
  if (now === undefined) return [...closures];
  const at = typeof now === 'number' ? now : now.getTime();
  return closures.filter((closure) => {
    const starts = Date.parse(closure.startsAt);
    const ends = closure.endsAt === null ? Number.POSITIVE_INFINITY : Date.parse(closure.endsAt);
    return !(starts > at) && at < ends;
  });
}

/** Titik di dalam poligon (aturan ray casting pada lng/lat; cukup untuk skala gedung). */
function insideRing(ring: readonly (readonly number[])[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi = 0, yi = 0] = ring[i] ?? [];
    const [xj = 0, yj = 0] = ring[j] ?? [];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function insidePolygon(
  rings: readonly (readonly (readonly number[])[])[],
  x: number,
  y: number,
): boolean {
  const [outer, ...holes] = rings;
  return Boolean(outer && insideRing(outer, x, y)) && !holes.some((hole) => insideRing(hole, x, y));
}

/**
 * Node yang ditutup penutupan fitur: titik masuk fitur itu, dan node di dalam poligonnya (area,
 * koridor, lift) pada lantai yang sama.
 */
export function closedFeatureNodes(graph: RouteGraph, featureId: string): number[] {
  const area = graph.areas.get(featureId);
  const nodes: number[] = [];
  for (let node = 0; node < graph.nodeIds.length; node++) {
    if (graph.featureIds[node] === featureId) {
      nodes.push(node);
      continue;
    }
    if (!area || graph.floor[node] !== area.floor) continue;
    const x = graph.lng[node] ?? 0;
    const y = graph.lat[node] ?? 0;
    if (area.polygons.some((rings) => insidePolygon(rings, x, y))) nodes.push(node);
  }
  return nodes;
}

export interface Restrictions {
  /** Arc yang tidak boleh dilewati (1 = diblokir). */
  arcs: Uint8Array;
  /** Edge jalur terlarang, untuk menempelkan titik bebas hanya ke edge yang boleh dilewati. */
  edges: Uint8Array;
  /** Node yang tidak boleh dipakai, termasuk sebagai asal atau tujuan. */
  nodes: Uint8Array;
}

/** Arc dan node terlarang untuk mode aksesibel dan penutupan yang berlaku; `null` bila tidak ada. */
export function restrictionsFor(
  graph: RouteGraph,
  accessible: boolean,
  closures: readonly RouteClosure[],
): Restrictions | null {
  if (!accessible && closures.length === 0) return null;
  const nodes = new Uint8Array(graph.nodeIds.length);
  const edges = new Set<string>();
  const connectors = new Set<string>();
  for (const closure of closures) {
    if (closure.edgeId) edges.add(closure.edgeId);
    if (closure.connectorId) connectors.add(closure.connectorId);
    if (closure.featureId) {
      for (const node of closedFeatureNodes(graph, closure.featureId)) nodes[node] = 1;
    }
  }
  const arcs = new Uint8Array(graph.arcTo.length);
  const blockedEdges = new Uint8Array(graph.edgeIds.length);
  for (let a = 0; a < arcs.length; a++) {
    const flags = graph.arcFlags[a] ?? 0;
    const source = graph.arcSource[a] ?? 0;
    const isConnector = (flags & ARC_CONNECTOR) !== 0;
    arcs[a] = Number(
      (accessible && !(flags & ARC_ACCESSIBLE)) ||
        (isConnector
          ? connectors.has(graph.connectorIds[source] ?? '')
          : edges.has(graph.edgeIds[source] ?? '')) ||
        nodes[graph.arcFrom[a] ?? 0] === 1 ||
        nodes[graph.arcTo[a] ?? 0] === 1,
    );
    if (!isConnector && arcs[a]) blockedEdges[source] = 1;
  }
  return { arcs, edges: blockedEdges, nodes };
}

/**
 * Penutupan yang mengenai rute (arc dan node yang dilewatinya), untuk menyebut penutupan mana yang
 * membuat rute memutar atau gagal.
 */
export function closuresOnRoute(
  graph: RouteGraph,
  arcs: readonly number[],
  nodes: readonly number[],
  closures: readonly RouteClosure[],
): string[] {
  const used = new Set<string>();
  for (const a of arcs) {
    const source = graph.arcSource[a] ?? 0;
    used.add(
      (graph.arcFlags[a] ?? 0) & ARC_CONNECTOR
        ? `c:${graph.connectorIds[source]}`
        : `e:${graph.edgeIds[source]}`,
    );
  }
  const onRoute = new Set(nodes);
  return closures
    .filter((closure) => {
      if (closure.edgeId) return used.has(`e:${closure.edgeId}`);
      if (closure.connectorId) return used.has(`c:${closure.connectorId}`);
      if (closure.featureId) {
        return closedFeatureNodes(graph, closure.featureId).some((node) => onRoute.has(node));
      }
      return false;
    })
    .map((closure) => closure.id);
}
