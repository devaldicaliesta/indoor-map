import { haversineM } from '@indoor/domain';

/** Bit `arcFlags`. */
export const ARC_ACCESSIBLE = 1;
export const ARC_CONNECTOR = 2;

/** Arc sebelum disusun ke CSR. */
export interface ArcDraft {
  from: number;
  to: number;
  cost: number;
  length: number;
  flags: number;
  source: number;
}

/** Arc konektor dan biaya tetap per level terkecilnya. */
export interface ConnectorArcs {
  arcs: ArcDraft[];
  costPerLevel: number;
}

/** Jarak lurus antara dua node graf (m). */
export function nodeDistanceM(
  graph: { readonly lng: Float64Array; readonly lat: Float64Array },
  a: number,
  b: number,
): number {
  return haversineM(graph.lng[a] ?? 0, graph.lat[a] ?? 0, graph.lng[b] ?? 0, graph.lat[b] ?? 0);
}
