import type { SnapshotConnectorKind, SnapshotPosition } from '@indoor/domain';

/**
 * Ujung rute. `nodes`: beberapa node sekaligus (titik masuk unit-unit sebuah lokasi); rute
 * otomatis ke yang terdekat. `point`: titik bebas di lantai (ketuk peta), ditempelkan ke edge
 * jalur terdekat di lantai itu.
 */
export type RoutePoint =
  | { kind: 'node'; nodeId: string }
  | { kind: 'nodes'; nodeIds: readonly string[] }
  | { kind: 'point'; lng: number; lat: number; floorId: string };

/**
 * Alasan rute gagal: tidak ada jalur sama sekali, asal atau tujuan tidak ada di graf, hanya ada
 * jalur yang tidak aksesibel, atau jalur tertutup penutupan yang sedang berlaku.
 */
export type RouteFailureReason =
  | 'no_path'
  | 'origin_invalid'
  | 'destination_invalid'
  | 'accessible_blocked'
  | 'closed';

/** Bagian rute di satu lantai. */
export interface WalkLeg {
  kind: 'walk';
  floorId: string;
  /** Titik berurutan, termasuk titik bebas dan proyeksinya ke edge di ujung rute. */
  coordinates: SnapshotPosition[];
  /** Node graf yang dilewati, berurutan. */
  nodeIds: string[];
  distanceM: number;
}

/** Perpindahan lewat konektor (lift, eskalator, tangga, pintu gedung). */
export interface ConnectorLeg {
  kind: 'connector';
  connectorId: string;
  connectorKind: SnapshotConnectorKind;
  fromFloorId: string;
  toFloorId: string;
  fromNodeId: string;
  toNodeId: string;
  /** Bobot konektor dalam meter ekuivalen (bukan jarak tempuh). */
  costM: number;
}

export type RouteLeg = WalkLeg | ConnectorLeg;

export interface RouteSuccess {
  ok: true;
  /** Node graf dari asal ke tujuan. */
  path: string[];
  legs: RouteLeg[];
  /** Jarak berjalan dalam meter; konektor tidak menambah jarak. */
  distanceM: number;
  /** Total bobot yang diminimalkan (jarak + bobot konektor). */
  costM: number;
  /**
   * Penutupan yang membuat rute ini memutar: rute tanpa penutupan lebih pendek dan melewatinya.
   * Kosong bila rute tidak terdampak.
   */
  avoidedClosureIds: string[];
}

export interface RouteFailure {
  ok: false;
  reason: RouteFailureReason;
  /**
   * Penutupan yang menghalangi rute yang seharusnya ada (misalnya lift aksesibel yang ditutup),
   * untuk pesan "tidak tersedia sementara" beserta lokasinya. Kosong bila bukan karena penutupan.
   */
  blockingClosureIds: string[];
}

export type RouteResult = RouteSuccess | RouteFailure;
