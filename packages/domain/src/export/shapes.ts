import type { SnapshotPosition as Position, SnapshotGeometry } from '../snapshot.ts';
import { EARTH_RADIUS_M } from '../units.ts';
import { pointInRing, signedArea } from '../validation/planar.ts';

export type Polygonal = Extract<SnapshotGeometry, { type: 'Polygon' | 'MultiPolygon' }>;
type Rings = Position[][];

const cross = (o: Position, a: Position, b: Position) =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

/** Semua posisi sebuah geometri. */
export function positionsOf(geometry: SnapshotGeometry): Position[] {
  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates];
    case 'LineString':
      return geometry.coordinates;
    case 'Polygon':
      return geometry.coordinates.flat();
    case 'MultiPolygon':
      return geometry.coordinates.flat(2);
  }
}

/**
 * Selubung cembung (monotone chain) sebagai Polygon tertutup berlawanan arah jarum jam;
 * `null` bila titiknya kurang dari tiga atau segaris. Dipakai untuk batas venue dan lantai yang
 * tidak punya garis luar sendiri.
 */
export function convexHull(points: readonly Position[]): Polygonal | null {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const half = (input: Position[]) => {
    const out: Position[] = [];
    for (const p of input) {
      while (out.length >= 2 && cross(out.at(-2) as Position, out.at(-1) as Position, p) <= 0)
        out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  const ring = [...half(sorted), ...half([...sorted].reverse())];
  if (ring.length < 3) return null;
  return { type: 'Polygon', coordinates: [[...ring, ring[0] as Position]] };
}

const orientRings = (rings: Rings): Rings =>
  rings.map((ring, i) => {
    const ccw = signedArea(ring) > 0;
    // RFC 7946 §3.1.6: cincin luar berlawanan arah jarum jam, lubang searah jarum jam.
    return ccw === (i === 0) ? ring : [...ring].reverse();
  });

export function orientPolygon(polygon: Polygonal): Polygonal {
  return polygon.type === 'Polygon'
    ? { type: 'Polygon', coordinates: orientRings(polygon.coordinates) }
    : { type: 'MultiPolygon', coordinates: polygon.coordinates.map(orientRings) };
}

const polygonsOf = (polygon: Polygonal): Rings[] =>
  polygon.type === 'Polygon' ? [polygon.coordinates] : polygon.coordinates;

export function containsPoint(polygon: Polygonal, point: Position): boolean {
  return polygonsOf(polygon).some(
    ([outer, ...holes]) =>
      outer !== undefined &&
      pointInRing(point, outer) &&
      !holes.some((hole) => pointInRing(point, hole)),
  );
}

const RAD = Math.PI / 180;
const round = (value: number) => Math.round(value * 1e7) / 1e7;

/**
 * Pintu di peta berupa titik, sedangkan bukaan IMDF berupa garis. Garisnya dibuat sepanjang
 * `lengthM` searah tepi poligon terdekat (dinding ruang tempat pintu itu), berpusat di proyeksi
 * titik ke tepi tersebut. Tepi yang lebih jauh dari `maxDistanceM` bukan dinding pintu itu, jadi
 * garisnya dibuat melalui titik pintu arah barat–timur.
 */
export function doorSegment(
  point: Position,
  polygons: readonly Polygonal[],
  lengthM = 1,
  maxDistanceM = 1,
): [Position, Position] {
  const kx = RAD * EARTH_RADIUS_M * Math.cos(point[1] * RAD);
  const ky = RAD * EARTH_RADIUS_M;
  const toM = (p: Position): Position => [(p[0] - point[0]) * kx, (p[1] - point[1]) * ky];
  const toDeg = (p: Position): Position => [
    round(point[0] + p[0] / kx),
    round(point[1] + p[1] / ky),
  ];

  let best = { distance: Number.POSITIVE_INFINITY, center: [0, 0] as Position, dir: [1, 0] };
  for (const rings of polygons.flatMap(polygonsOf)) {
    for (const ring of rings) {
      for (let i = 0; i + 1 < ring.length; i++) {
        const a = toM(ring[i] as Position);
        const b = toM(ring[i + 1] as Position);
        const dx = b[0] - a[0];
        const dy = b[1] - a[1];
        const length = Math.hypot(dx, dy);
        if (length === 0) continue;
        const t = Math.max(0, Math.min(1, -(a[0] * dx + a[1] * dy) / (length * length)));
        const center: Position = [a[0] + t * dx, a[1] + t * dy];
        const distance = Math.hypot(center[0], center[1]);
        if (distance < best.distance) best = { distance, center, dir: [dx / length, dy / length] };
      }
    }
  }
  const near = best.distance <= maxDistanceM;
  const [cx, cy] = near ? best.center : [0, 0];
  const [ux = 1, uy = 0] = near ? best.dir : [1, 0];
  const h = lengthM / 2;
  return [toDeg([cx - ux * h, cy - uy * h]), toDeg([cx + ux * h, cy + uy * h])];
}
