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

/** Komponen terhubung graf: id node per komponen, terbesar lebih dulu. */
export function graphComponents(graph: NavGraph): string[][] {
  const neighbours = new Map<string, string[]>();
  for (const id of Object.keys(graph.nodes)) neighbours.set(id, []);
  for (const edge of Object.values(graph.edges)) {
    neighbours.get(edge.from)?.push(edge.to);
    neighbours.get(edge.to)?.push(edge.from);
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
