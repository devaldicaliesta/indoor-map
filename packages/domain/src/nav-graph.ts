import { haversineM } from './distance';
import type { Position } from './geometry';

/** Sama dengan enum `node_role` di migrasi 0001. */
export const NAV_NODE_ROLES = ['path', 'entrance', 'origin', 'info_point', 'connector'] as const;
export type NavNodeRole = (typeof NAV_NODE_ROLES)[number];

/** Node graf jalur di satu lantai (tabel `nav_nodes`). */
export interface NavNode {
  id: string;
  floorId: string;
  coordinates: Position;
  role: NavNodeRole;
  /** Unit atau fasilitas yang dilayani titik masuk; `null` untuk node lain. */
  featureId: string | null;
}

/** Edge jalur dua arah antar-node di lantai yang sama (tabel `nav_edges`). */
export interface NavEdge {
  id: string;
  floorId: string;
  from: string;
  to: string;
  lengthM: number;
  accessible: boolean;
}

/** Graf satu lantai, berkunci id. */
export interface NavGraph {
  nodes: Readonly<Record<string, NavNode>>;
  edges: Readonly<Record<string, NavEdge>>;
}

/** Panjang edge (m) dari posisi kedua node; dua desimal seperti kolom `nav_edges.length_m`. */
export function edgeLengthM(a: Position, b: Position): number {
  return Math.round(haversineM(a[0], a[1], b[0], b[1]) * 100) / 100;
}

type Link = readonly [string, string];

const edgeLinks = (graph: NavGraph): Link[] =>
  Object.values(graph.edges).map((edge) => [edge.from, edge.to]);

/** Komponen terhubung graf: id node per komponen, terbesar lebih dulu. */
export function graphComponents(graph: NavGraph): string[][] {
  return connectedComponents(Object.keys(graph.nodes), edgeLinks(graph));
}

/** Pemberhentian konektor; untuk keterhubungan cukup id node-nya. */
export interface ConnectorLinks {
  stops: readonly { nodeId: string }[];
}

/**
 * Node yang tidak terhubung ke komponen terbesar graf venue (semua lantai). Edge menyambung node
 * di satu lantai; konektor menyambung pemberhentiannya yang sudah punya edge di lantainya, sehingga
 * pemberhentian yang belum disambung ke jalur ikut terisolasi. Kosong selama graf belum punya edge.
 */
export function isolatedNodeIds(
  graph: NavGraph,
  connectors: readonly ConnectorLinks[],
): Set<string> {
  const links = edgeLinks(graph).filter(([a, b]) => graph.nodes[a] && graph.nodes[b]);
  const linked = new Set(links.flat());
  if (linked.size === 0) return new Set();
  for (const connector of connectors) {
    const [first, ...rest] = connector.stops.filter((stop) => linked.has(stop.nodeId));
    for (const stop of rest) if (first) links.push([first.nodeId, stop.nodeId]);
  }
  const [, ...others] = connectedComponents(Object.keys(graph.nodes), links);
  return new Set(others.flat());
}

/** Komponen dari pasangan node yang tersambung; seri ukuran tetap urut kemunculan node. */
function connectedComponents(ids: readonly string[], links: readonly Link[]): string[][] {
  const neighbours = new Map<string, string[]>();
  for (const id of ids) neighbours.set(id, []);
  for (const [a, b] of links) {
    neighbours.get(a)?.push(b);
    neighbours.get(b)?.push(a);
  }
  const seen = new Set<string>();
  const components: string[][] = [];
  for (const start of neighbours.keys()) {
    if (seen.has(start)) continue;
    seen.add(start);
    const component = [start];
    for (let i = 0; i < component.length; i++) {
      for (const next of neighbours.get(component[i] ?? '') ?? []) {
        if (seen.has(next) || !neighbours.has(next)) continue;
        seen.add(next);
        component.push(next);
      }
    }
    components.push(component);
  }
  return components.sort((a, b) => b.length - a.length);
}
