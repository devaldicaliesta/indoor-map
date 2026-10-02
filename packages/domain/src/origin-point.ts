import { deepLinkUrl } from './deep-link';
import { attachAt, linkTargets, nearestOnGraph } from './entrance-links';
import type { Position } from './geometry';
import { Draft, type GraphPatch, planeAt } from './graph-draft';
import type { VenueId } from './ids';
import type { NavGraph } from './nav-graph';

/** QR titik asal (tabel `origin_points`). */
export interface OriginPoint {
  id: string;
  floorId: string;
  name: string;
  coordinates: Position;
  /** Arah hadap saat memindai, derajat dari utara searah jarum jam. */
  headingDeg: number;
  /** Node jalur tempat titik asal menempel; `null` bila belum menempel. */
  nodeId: string | null;
  /** Kode publik di URL QR (`public_code`). */
  code: string;
}

/** Titik asal lebih jauh dari ini ke jalur dianggap salah letak dan tidak ditempelkan. */
export const MAX_ORIGIN_SNAP_M = 15;

export interface OriginSnap {
  /** Posisi di jalur tempat titik asal diletakkan. */
  coordinates: Position;
  nodeId: string;
  /** Perubahan graf bila edge dipecah untuk node baru; kosong bila memakai node yang ada. */
  patch: GraphPatch;
  distanceM: number;
}

/**
 * Tempelkan titik asal ke jalur lantai `floorId`: titik terdekat di node atau edge (tanpa titik
 * masuk unit), memakai node yang ada bila < 0,5 m, atau memecah edge di sana. `null` bila lantai
 * belum punya jalur dalam `MAX_ORIGIN_SNAP_M`.
 */
export function snapOriginPoint(
  graph: NavGraph,
  floorId: string,
  position: Position,
  newId: () => string,
): OriginSnap | null {
  const draft = new Draft(graph);
  const plane = planeAt(position);
  const nearest = nearestOnGraph(linkTargets(draft, plane, floorId), plane.toXY(position));
  if (!nearest || nearest.d > MAX_ORIGIN_SNAP_M) return null;
  const nodeId = attachAt(draft, plane, floorId, nearest.point, newId);
  const node = nodeId ? draft.nodes.get(nodeId) : undefined;
  if (!nodeId || !node) return null;
  return {
    coordinates: node.coordinates,
    nodeId,
    patch: draft.patch(),
    distanceM: nearest.d,
  };
}

export interface OriginPointInput {
  floorId: string;
  name: string;
  coordinates: Position;
  headingDeg: number;
  nodeId: string | null;
}

/** Arah hadap 0–359,9° (kelipatan 0,1° seperti kolom `heading_deg`). */
export function normalizeHeading(deg: number): number {
  const value = Math.round((((deg % 360) + 360) % 360) * 10) / 10;
  return value >= 360 ? 0 : value;
}

/** URL di QR titik asal: deep link `?o=` di URL publik Visitor dari Pengaturan Sistem. */
export function originPointUrl(publicUrl: string, venueId: VenueId, code: string): string {
  return deepLinkUrl(publicUrl, { venueId, originCode: code });
}
