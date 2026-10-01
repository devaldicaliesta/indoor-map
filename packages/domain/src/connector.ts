import type { GraphPatch } from './graph-draft';
import type { NavGraph } from './nav-graph';

/** Sama dengan enum `connector_kind` dan `escalator_direction` di migrasi 0001. */
export const CONNECTOR_KINDS = ['elevator', 'escalator', 'stairs', 'building_door'] as const;
export type ConnectorKind = (typeof CONNECTOR_KINDS)[number];

/** `up` = dari lantai berlevel lebih rendah ke yang lebih tinggi. */
export const ESCALATOR_DIRECTIONS = ['up', 'down', 'both'] as const;
export type EscalatorDirection = (typeof ESCALATOR_DIRECTIONS)[number];

export const CONNECTOR_NAME_MAX = 60;

export interface ConnectorStop {
  floorId: string;
  nodeId: string;
}

/** Konektor antar-lantai (tabel `connectors` dan `connector_stops`). */
export interface Connector {
  id: string;
  kind: ConnectorKind;
  name: string;
  direction: EscalatorDirection | null;
  accessible: boolean;
  stops: ConnectorStop[];
}

/** Isian formulir konektor. */
export interface ConnectorDraft {
  kind: ConnectorKind;
  name: string;
  direction: EscalatorDirection | null;
  accessible: boolean;
  floorIds: readonly string[];
}

export type ConnectorProblem =
  | 'name_required'
  | 'name_too_long'
  | 'too_few_floors'
  | 'unknown_floor'
  | 'direction_required'
  | 'escalator_two_floors'
  | 'door_needs_outdoor'
  | 'same_building';

interface ConnectorFloor {
  id: string;
  buildingId: string | null;
  level: number;
  isOutdoor: boolean;
}

/** Kursi roda bisa memakai lift dan pintu gedung, tidak eskalator dan tangga; bisa diubah per konektor. */
export function defaultConnectorAccessible(kind: ConnectorKind): boolean {
  return kind === 'elevator' || kind === 'building_door';
}

/**
 * Aturan konektor (juga dijaga `save_connector` di database): minimal dua lantai berbeda;
 * eskalator tepat dua lantai dengan arah; pintu gedung menghubungkan satu lantai gedung dengan
 * Area Luar; lift, eskalator, dan tangga hanya di lantai satu gedung.
 */
export function checkConnector(
  draft: ConnectorDraft,
  floors: readonly ConnectorFloor[],
): ConnectorProblem[] {
  const name = draft.name.trim();
  if (!name) return ['name_required'];
  if (name.length > CONNECTOR_NAME_MAX) return ['name_too_long'];
  const ids = [...new Set(draft.floorIds)];
  if (ids.length < 2) return ['too_few_floors'];
  const byId = new Map(floors.map((f) => [f.id, f]));
  const selected = ids.flatMap((id) => byId.get(id) ?? []);
  if (selected.length !== ids.length) return ['unknown_floor'];
  if (draft.kind === 'building_door') {
    const outdoor = selected.filter((f) => f.isOutdoor).length;
    return selected.length === 2 && outdoor === 1 ? [] : ['door_needs_outdoor'];
  }
  const buildings = new Set(selected.map((f) => (f.isOutdoor ? null : f.buildingId)));
  if (buildings.size !== 1 || buildings.has(null)) return ['same_building'];
  if (draft.kind === 'escalator') {
    if (selected.length !== 2) return ['escalator_two_floors'];
    if (!draft.direction) return ['direction_required'];
  }
  return [];
}

/**
 * Lantai satu gedung dari `a` sampai `b` (termasuk keduanya), urut dari level terendah: lantai
 * yang dilayani tangga di antara lantai teratas dan terbawahnya. Kosong bila beda gedung.
 */
export function floorsBetween(floors: readonly ConnectorFloor[], a: string, b: string): string[] {
  const from = floors.find((f) => f.id === a);
  const to = floors.find((f) => f.id === b);
  if (!from || !to || from.isOutdoor || to.isOutdoor || from.buildingId !== to.buildingId) {
    return [];
  }
  const low = Math.min(from.level, to.level);
  const high = Math.max(from.level, to.level);
  return floors
    .filter(
      (f) => !f.isOutdoor && f.buildingId === from.buildingId && f.level >= low && f.level <= high,
    )
    .sort((x, y) => x.level - y.level)
    .map((f) => f.id);
}

/** Ubah tanda aksesibel (kursi roda) satu edge jalur. */
export function setEdgeAccessible(
  graph: NavGraph,
  edgeId: string,
  accessible: boolean,
): GraphPatch {
  const before = graph.edges[edgeId];
  if (!before || before.accessible === accessible) return { nodes: [], edges: [] };
  return { nodes: [], edges: [{ id: edgeId, before, after: { ...before, accessible } }] };
}
