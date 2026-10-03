import type { SnapshotPosition as Position } from '../snapshot.ts';
import { EARTH_RADIUS_M } from '../units.ts';

/**
 * Geometri bidang datar dalam meter untuk validasi. Koordinat WGS84 diproyeksikan
 * ekuirektangular di sekitar satu titik acuan; pada skala gedung galatnya < 0,01%.
 */
export type Pt = readonly [number, number];
export type Ring = readonly Pt[];

const RAD = Math.PI / 180;
/** Toleransi numerik dalam meter / m² (jauh di bawah presisi gambar). */
const EPS = 1e-9;

export function projector(origin: Position): (p: Position) => Pt {
  const kx = RAD * EARTH_RADIUS_M * Math.cos(origin[1] * RAD);
  const ky = RAD * EARTH_RADIUS_M;
  return (p) => [(p[0] - origin[0]) * kx, (p[1] - origin[1]) * ky];
}

const cross = (o: Pt, a: Pt, b: Pt) =>
  (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
const same = (a: Pt, b: Pt) => Math.abs(a[0] - b[0]) < EPS && Math.abs(a[1] - b[1]) < EPS;

/** Cincin terbuka (titik penutup dibuang) tanpa titik kembar berurutan. */
export function openRing(ring: readonly Pt[]): Pt[] {
  const out: Pt[] = [];
  for (const p of ring) if (!out.length || !same(out.at(-1) as Pt, p)) out.push(p);
  if (out.length > 1 && same(out[0] as Pt, out.at(-1) as Pt)) out.pop();
  return out;
}

/** Luas bertanda: positif bila berlawanan arah jarum jam. */
export function signedArea(ring: Ring): number {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i] as Pt;
    const b = ring[(i + 1) % ring.length] as Pt;
    sum += a[0] * b[1] - b[0] * a[1];
  }
  return sum / 2;
}

/** Dua ruas saling memotong (termasuk bersinggungan di ujung atau berimpit). */
export function segmentsIntersect(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  if (
    ((d1 > EPS && d2 < -EPS) || (d1 < -EPS && d2 > EPS)) &&
    ((d3 > EPS && d4 < -EPS) || (d3 < -EPS && d4 > EPS))
  ) {
    return true;
  }
  const onSegment = (p: Pt, q: Pt, r: Pt) =>
    Math.min(p[0], q[0]) - EPS <= r[0] &&
    r[0] <= Math.max(p[0], q[0]) + EPS &&
    Math.min(p[1], q[1]) - EPS <= r[1] &&
    r[1] <= Math.max(p[1], q[1]) + EPS;
  return (
    (Math.abs(d1) <= EPS && onSegment(c, d, a)) ||
    (Math.abs(d2) <= EPS && onSegment(c, d, b)) ||
    (Math.abs(d3) <= EPS && onSegment(a, b, c)) ||
    (Math.abs(d4) <= EPS && onSegment(a, b, d))
  );
}

/** Dua ruas bersilangan tegas di bagian dalam keduanya (bukan hanya bersinggungan). */
export function segmentsCross(a: Pt, b: Pt, c: Pt, d: Pt): boolean {
  const d1 = cross(c, d, a);
  const d2 = cross(c, d, b);
  const d3 = cross(a, b, c);
  const d4 = cross(a, b, d);
  return d1 * d2 < -EPS && d3 * d4 < -EPS;
}

/** Tepi yang tidak bertetangga saling memotong, atau cincin terlipat balik di satu titik. */
export function ringSelfIntersects(ring: Ring): boolean {
  const n = ring.length;
  for (let i = 0; i < n; i++) {
    const a = ring[i] as Pt;
    const b = ring[(i + 1) % n] as Pt;
    for (let j = i + 1; j < n; j++) {
      const adjacent = j === i + 1 || (i === 0 && j === n - 1);
      const c = ring[j] as Pt;
      const d = ring[(j + 1) % n] as Pt;
      if (adjacent) {
        // Tepi bertetangga hanya boleh berbagi satu titik; berimpit berbalik arah = paku.
        const shared = j === i + 1 ? b : a;
        const other1 = j === i + 1 ? a : b;
        const other2 = j === i + 1 ? d : c;
        if (Math.abs(cross(shared, other1, other2)) <= EPS && dot(shared, other1, other2) > EPS)
          return true;
        continue;
      }
      if (segmentsIntersect(a, b, c, d)) return true;
    }
  }
  return false;
}

const dot = (o: Pt, a: Pt, b: Pt) => (a[0] - o[0]) * (b[0] - o[0]) + (a[1] - o[1]) * (b[1] - o[1]);

/** Titik di dalam segitiga CCW; `inclusive` juga menghitung titik tepat di tepinya. */
function insideTriangle(p: Pt, a: Pt, b: Pt, c: Pt, inclusive: boolean): boolean {
  const limit = inclusive ? -EPS : EPS;
  return cross(a, b, p) > limit && cross(b, c, p) > limit && cross(c, a, p) > limit;
}

/** Satu "telinga" yang bisa dipotong: sudut cembung tanpa titik lain di dalamnya. */
function findEar(pts: readonly Pt[], idx: readonly number[], inclusive: boolean): number {
  for (let k = 0; k < idx.length; k++) {
    const a = pts[idx[(k + idx.length - 1) % idx.length] as number] as Pt;
    const b = pts[idx[k] as number] as Pt;
    const c = pts[idx[(k + 1) % idx.length] as number] as Pt;
    if (cross(a, b, c) <= EPS) continue;
    const blocked = idx.some((j) => {
      const p = pts[j] as Pt;
      return !same(p, a) && !same(p, b) && !same(p, c) && insideTriangle(p, a, b, c, inclusive);
    });
    if (!blocked) return k;
  }
  return -1;
}

/**
 * Triangulasi ear clipping untuk cincin sederhana (tidak memotong diri). Titik segaris
 * dibuang karena tidak menambah luas. Sudut cekung yang tepat berada di tepi calon
 * telinga ikut menghalangi (bentuk L); bila macet, dicoba lagi dengan uji ketat.
 * `null` bila cincin terlalu rusak untuk dipecah.
 */
export function triangulate(ring: Ring): [Pt, Pt, Pt][] | null {
  const pts = openRing(ring);
  if (signedArea(pts) < 0) pts.reverse();
  const idx = pts.map((_, i) => i);
  const triangles: [Pt, Pt, Pt][] = [];
  const at = (k: number) => pts[idx[(k + idx.length) % idx.length] as number] as Pt;
  while (idx.length > 3) {
    const collinear = idx.findIndex((_, k) => Math.abs(cross(at(k - 1), at(k), at(k + 1))) <= EPS);
    if (collinear >= 0) {
      idx.splice(collinear, 1);
      continue;
    }
    let k = findEar(pts, idx, true);
    if (k < 0) k = findEar(pts, idx, false);
    if (k < 0) return null;
    triangles.push([at(k - 1), at(k), at(k + 1)]);
    idx.splice(k, 1);
  }
  if (idx.length === 3 && Math.abs(cross(at(0), at(1), at(2))) > EPS)
    triangles.push([at(0), at(1), at(2)]);
  return triangles;
}

/** Sutherland–Hodgman: irisan poligon cembung `subject` dengan cembung `clip` (keduanya CCW). */
function clipConvex(subject: readonly Pt[], clip: readonly Pt[]): Pt[] {
  let output: Pt[] = [...subject];
  for (let i = 0; i < clip.length && output.length; i++) {
    const a = clip[i] as Pt;
    const b = clip[(i + 1) % clip.length] as Pt;
    const input = output;
    output = [];
    for (let j = 0; j < input.length; j++) {
      const p = input[j] as Pt;
      const q = input[(j + 1) % input.length] as Pt;
      const pIn = cross(a, b, p) >= -EPS;
      const qIn = cross(a, b, q) >= -EPS;
      if (pIn) output.push(p);
      if (pIn !== qIn) {
        const t = cross(a, b, p) / (cross(a, b, p) - cross(a, b, q));
        output.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
      }
    }
  }
  return output;
}

type Box = [number, number, number, number];
function boxOf(points: readonly Pt[]): Box {
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
}
export const boxesOverlap = (a: Box, b: Box) =>
  a[0] <= b[2] && b[0] <= a[2] && a[1] <= b[3] && b[1] <= a[3];

/** Poligon siap dihitung: cincin terbuka + segitiga; lubang disimpan terpisah. */
export interface PreparedRing {
  ring: Pt[];
  triangles: [Pt, Pt, Pt][];
  box: Box;
  area: number;
}

export function prepareRing(ring: Ring): PreparedRing | null {
  const open = openRing(ring);
  if (open.length < 3) return null;
  const triangles = triangulate(open);
  if (!triangles) return null;
  return { ring: open, triangles, box: boxOf(open), area: Math.abs(signedArea(open)) };
}

/** Luas irisan dua cincin sederhana (bisa cekung): jumlah irisan segitiga-segitiganya. */
export function ringIntersectionArea(a: PreparedRing, b: PreparedRing): number {
  if (!boxesOverlap(a.box, b.box)) return 0;
  let area = 0;
  for (const ta of a.triangles) {
    const boxA = boxOf(ta);
    for (const tb of b.triangles) {
      if (!boxesOverlap(boxA, boxOf(tb))) continue;
      const piece = clipConvex(ta, tb);
      if (piece.length >= 3) area += Math.abs(signedArea(piece));
    }
  }
  return area;
}

/** Poligon dengan lubang: cincin luar lalu lubang-lubang yang saling lepas di dalamnya. */
export type PreparedPolygon = { outer: PreparedRing; holes: PreparedRing[] };

/**
 * Luas irisan dua poligon berlubang lewat inklusi–eksklusi: (A∖∪Hᴬ)∩(B∖∪Hᴮ)
 * = A∩B − ΣHᴬ∩B − ΣA∩Hᴮ + ΣHᴬ∩Hᴮ, karena lubang berada di dalam cincin luarnya.
 */
export function polygonIntersectionArea(a: PreparedPolygon, b: PreparedPolygon): number {
  if (!boxesOverlap(a.outer.box, b.outer.box)) return 0;
  let area = ringIntersectionArea(a.outer, b.outer);
  for (const h of a.holes) area -= ringIntersectionArea(h, b.outer);
  for (const h of b.holes) area -= ringIntersectionArea(a.outer, h);
  for (const ha of a.holes) for (const hb of b.holes) area += ringIntersectionArea(ha, hb);
  return Math.max(0, area);
}

export const polygonArea = (p: PreparedPolygon) =>
  Math.max(0, p.outer.area - p.holes.reduce((s, h) => s + h.area, 0));

/** Titik di dalam cincin (ray casting). */
export function pointInRing(p: Pt, ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] as Pt;
    const [xj, yj] = ring[j] as Pt;
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

/** Jarak titik ke ruas dalam meter. */
export function distanceToSegment(p: Pt, a: Pt, b: Pt): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length2 = dx * dx + dy * dy;
  const t = length2
    ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length2))
    : 0;
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

export function distanceToRing(p: Pt, ring: Ring): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < ring.length; i++)
    best = Math.min(best, distanceToSegment(p, ring[i] as Pt, ring[(i + 1) % ring.length] as Pt));
  return best;
}
