import { EARTH_RADIUS_M, type SnapshotConnectorKind, type SnapshotPosition } from '@indoor/domain';
import type { ConnectorLeg, WalkLeg } from '../../src';

/** Lantai dua gedung dan Area Luar untuk rute buatan. */
export const FLOORS = [
  { id: 'out', buildingId: null, level: 0, name: 'Area Luar' },
  { id: 'a-gf', buildingId: 'a', level: 0, name: 'GF' },
  { id: 'a-l1', buildingId: 'a', level: 1, name: 'L1' },
  { id: 'a-l2', buildingId: 'a', level: 2, name: 'L2' },
  { id: 'b-gf', buildingId: 'b', level: 0, name: 'GF' },
];
export const BUILDINGS = [
  { id: 'a', name: 'Gedung A' },
  { id: 'b', name: 'Gedung B' },
];

export const RAD = Math.PI / 180;
const BASE: SnapshotPosition = [106.8, -6.175];
const KX = RAD * EARTH_RADIUS_M * Math.cos(BASE[1] * RAD);
const KY = RAD * EARTH_RADIUS_M;
/** Posisi dari meter di sekitar titik acuan: `x` ke timur, `y` ke utara. */
export const m = (x: number, y: number): SnapshotPosition => [BASE[0] + x / KX, BASE[1] + y / KY];

export const walk = (floorId: string, coordinates: SnapshotPosition[]): WalkLeg => ({
  kind: 'walk',
  floorId,
  coordinates,
  nodeIds: [],
  distanceM: 0,
});

export const connector = (
  connectorKind: SnapshotConnectorKind,
  fromFloorId: string,
  toFloorId: string,
): ConnectorLeg => ({
  kind: 'connector',
  connectorId: `${connectorKind}-1`,
  connectorKind,
  fromFloorId,
  toFloorId,
  fromNodeId: 'u',
  toNodeId: 'v',
  costM: 0,
});
