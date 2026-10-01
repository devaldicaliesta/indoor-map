import { EARTH_RADIUS_M, type SnapshotPosition } from '@indoor/domain';

const RAD = Math.PI / 180;

/** Titik di bidang datar lokal dalam meter: `x` ke timur, `y` ke utara. */
export type PlanarPoint = readonly [number, number];

/**
 * Proyeksi ekuirektangular di sekitar titik pertama. Pada skala gedung galatnya terabaikan untuk
 * sudut dan simpangan, jadi tidak perlu rumus bola di setiap ruas.
 */
export function toPlanar(points: readonly SnapshotPosition[]): PlanarPoint[] {
  const [lng0, lat0] = points[0] ?? [0, 0];
  const kx = RAD * EARTH_RADIUS_M * Math.cos(lat0 * RAD);
  const ky = RAD * EARTH_RADIUS_M;
  return points.map(([lng, lat]) => [(lng - lng0) * kx, (lat - lat0) * ky]);
}

function segmentDistance(p: PlanarPoint, a: PlanarPoint, b: PlanarPoint): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length2 = dx * dx + dy * dy;
  const t =
    length2 > 0 ? Math.min(1, Math.max(0, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length2)) : 0;
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

/**
 * Indeks titik yang tersisa setelah penyederhanaan Douglas–Peucker: titik yang menyimpang kurang
 * dari `toleranceM` dari garis hasil penyederhanaan dibuang, kedua ujung selalu tersisa. Iteratif
 * agar jalur dengan ratusan node tidak bergantung pada kedalaman rekursi.
 */
export function simplify(points: readonly PlanarPoint[], toleranceM: number): number[] {
  const last = points.length - 1;
  if (last < 1) return points.length ? [0] : [];
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[last] = 1;
  const pending: [number, number][] = [[0, last]];
  for (let range = pending.pop(); range; range = pending.pop()) {
    const [first, end] = range;
    const a = points[first] ?? [0, 0];
    const b = points[end] ?? [0, 0];
    let farthest = -1;
    let farthestM = toleranceM;
    for (let i = first + 1; i < end; i++) {
      const d = segmentDistance(points[i] ?? a, a, b);
      if (d >= farthestM) {
        farthest = i;
        farthestM = d;
      }
    }
    if (farthest < 0) continue;
    keep[farthest] = 1;
    pending.push([first, farthest], [farthest, end]);
  }
  return points.flatMap((_, i) => (keep[i] ? [i] : []));
}

/** Arah ruas a → b dalam derajat searah jarum jam dari utara. */
export function bearingDeg(a: PlanarPoint, b: PlanarPoint): number {
  return Math.atan2(b[0] - a[0], b[1] - a[1]) / RAD;
}

/** Perubahan arah dari `from` ke `to` dalam derajat (-180…180); positif = ke kanan. */
export function turnDeg(from: number, to: number): number {
  return ((((to - from) % 360) + 540) % 360) - 180;
}
