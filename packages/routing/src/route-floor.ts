import type { SnapshotPosition } from '@indoor/domain';
import type { RouteSuccess, WalkLeg } from './types';

/** Bagian rute di satu lantai, untuk digambar di peta lantai itu. */
export interface FloorRoute {
  /** Garis bagian berjalan di lantai ini; bisa lebih dari satu bila rute kembali ke lantai ini. */
  lines: SnapshotPosition[][];
  /** Titik awal rute, bila rute dimulai di lantai ini. */
  origin: SnapshotPosition | null;
  /** Titik akhir rute, bila rute berakhir di lantai ini. */
  destination: SnapshotPosition | null;
  /** Titik naik/turun konektor atau keluar/masuk pintu gedung di lantai ini. */
  transfers: SnapshotPosition[];
}

const isWalk = (leg: RouteSuccess['legs'][number] | undefined): leg is WalkLeg =>
  leg?.kind === 'walk';

/** Potongan rute di `floorId`: garis, penanda asal/tujuan, dan titik perpindahan lantai. */
export function routeOnFloor(route: Pick<RouteSuccess, 'legs'>, floorId: string): FloorRoute {
  const walks = route.legs.filter(isWalk);
  const first = walks[0];
  const last = walks.at(-1);
  const transfers: SnapshotPosition[] = [];
  route.legs.forEach((leg, i) => {
    if (leg.kind !== 'connector') return;
    const before = route.legs[i - 1];
    const after = route.legs[i + 1];
    const out = isWalk(before) && before.floorId === floorId ? before.coordinates.at(-1) : null;
    const into = isWalk(after) && after.floorId === floorId ? after.coordinates[0] : null;
    for (const point of [out, into]) if (point) transfers.push(point);
  });
  return {
    lines: walks
      .filter((leg) => leg.floorId === floorId && leg.coordinates.length > 1)
      .map((leg) => leg.coordinates),
    origin: first?.floorId === floorId ? (first.coordinates[0] ?? null) : null,
    destination: last?.floorId === floorId ? (last.coordinates.at(-1) ?? null) : null,
    transfers,
  };
}
