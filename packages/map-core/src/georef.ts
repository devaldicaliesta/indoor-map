import { EARTH_RADIUS_M } from '@indoor/domain';

/** [lng, lat] dalam WGS84. */
export type LngLat = [number, number];
/** Urutan sudut MapLibre image source: kiri-atas, kanan-atas, kanan-bawah, kiri-bawah. */
export type Corners = [LngLat, LngLat, LngLat, LngLat];
export type CornerIndex = 0 | 1 | 2 | 3;

/**
 * Posisi denah sebagai persegi panjang yang diputar. Semua perubahan (tarik sudut,
 * rotasi, skala, kalibrasi) bekerja di model ini, sehingga gambar tidak pernah
 * terdistorsi non-affine: keempat sudut selalu membentuk persegi panjang.
 */
export interface Placement {
  center: LngLat;
  widthM: number;
  heightM: number;
  /** Searah jarum jam dari utara; 0 = sisi atas gambar menghadap utara. */
  rotationDeg: number;
}

/** Sisi terpendek denah; mencegah persegi panjang terbalik saat sudut ditarik melewati lawannya. */
export const MIN_PLAN_SIDE_M = 1;

const RAD = Math.PI / 180;

/**
 * Proyeksi ekuirektangular lokal (meter timur, meter utara) di sekitar `origin`.
 * Galatnya jauh di bawah 0,1% untuk jarak skala gedung (< 2 km), cukup untuk batas 2%.
 */
export function toLocal(origin: LngLat, point: LngLat): [number, number] {
  const k = EARTH_RADIUS_M * RAD;
  return [(point[0] - origin[0]) * k * Math.cos(origin[1] * RAD), (point[1] - origin[1]) * k];
}

export function fromLocal(origin: LngLat, [x, y]: [number, number]): LngLat {
  const k = EARTH_RADIUS_M * RAD;
  return [origin[0] + x / (k * Math.cos(origin[1] * RAD)), origin[1] + y / k];
}

/** Jarak haversine dalam meter. */
export function distanceM(a: LngLat, b: LngLat): number {
  const dLat = (b[1] - a[1]) * RAD;
  const dLng = (b[0] - a[0]) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Memutar vektor searah jarum jam (arah kompas). */
function rotateCw([x, y]: [number, number], deg: number): [number, number] {
  const t = deg * RAD;
  return [x * Math.cos(t) + y * Math.sin(t), -x * Math.sin(t) + y * Math.cos(t)];
}

/** Arah sudut relatif terhadap pusat, dalam koordinat gambar (x ke kanan, y ke atas). */
const CORNER_SIGNS: readonly [number, number][] = [
  [-1, 1],
  [1, 1],
  [1, -1],
  [-1, -1],
];

export function placementCorners(p: Placement): Corners {
  const at = ([sx, sy]: [number, number]) =>
    fromLocal(p.center, rotateCw([(sx * p.widthM) / 2, (sy * p.heightM) / 2], p.rotationDeg));
  return CORNER_SIGNS.map(at) as Corners;
}

const average = (points: [number, number][]): [number, number] => [
  points.reduce((s, p) => s + p[0], 0) / points.length,
  points.reduce((s, p) => s + p[1], 0) / points.length,
];
const length = ([x, y]: [number, number]) => Math.hypot(x, y);
const sub = (a: [number, number], b: [number, number]): [number, number] => [
  a[0] - b[0],
  a[1] - b[1],
];

/** Kebalikan `placementCorners`; sudut tersimpan dianggap persegi panjang. */
export function placementFromCorners(corners: Corners): Placement {
  const origin = average(corners) as LngLat;
  const [tl, tr, br, bl] = corners.map((c) => toLocal(origin, c)) as [
    [number, number],
    [number, number],
    [number, number],
    [number, number],
  ];
  const top = sub(tr, tl);
  return {
    center: fromLocal(origin, average([tl, tr, br, bl])),
    widthM: (length(top) + length(sub(br, bl))) / 2,
    heightM: (length(sub(bl, tl)) + length(sub(br, tr))) / 2,
    rotationDeg: normalizeDeg(Math.atan2(-top[1], top[0]) / RAD),
  };
}

/** Sudut ke rentang (−180, 180]. */
export function normalizeDeg(deg: number): number {
  const d = ((((deg + 180) % 360) + 360) % 360) - 180;
  return d === -180 ? 180 : d;
}

/**
 * Menarik satu sudut ke `pointer` dengan sudut seberangnya tetap. Rotasi tidak berubah;
 * dengan `lockAspect` lebar dan tinggi berubah dengan faktor yang sama.
 */
export function dragCorner(
  p: Placement,
  index: CornerIndex,
  pointer: LngLat,
  lockAspect: boolean,
): Placement {
  const opposite = placementCorners(p)[(index + 2) % 4] as LngLat;
  const [sx, sy] = CORNER_SIGNS[index] as [number, number];
  // Posisi pointer dalam sumbu gambar, diukur dari sudut seberang.
  const [u, v] = rotateCw(toLocal(opposite, pointer), -p.rotationDeg);
  let width = Math.max(MIN_PLAN_SIDE_M, u * sx);
  let height = Math.max(MIN_PLAN_SIDE_M, v * sy);
  if (lockAspect) {
    // Proyeksi pointer ke diagonal: skala mengikuti gerakan tangan di kedua sumbu.
    const s = (u * sx * p.widthM + v * sy * p.heightM) / (p.widthM ** 2 + p.heightM ** 2);
    const minScale = MIN_PLAN_SIDE_M / Math.min(p.widthM, p.heightM);
    const scale = Math.max(minScale, s);
    width = p.widthM * scale;
    height = p.heightM * scale;
  }
  const center = fromLocal(
    opposite,
    rotateCw([(sx * width) / 2, (sy * height) / 2], p.rotationDeg),
  );
  return { ...p, center, widthM: width, heightM: height };
}

/** Menggeser denah sejauh gerakan pointer dari `from` ke `to`. */
export function movePlacement(p: Placement, from: LngLat, to: LngLat): Placement {
  const [dx, dy] = toLocal(from, to);
  return { ...p, center: fromLocal(p.center, [dx, dy]) };
}

/** Skala seragam terhadap titik tetap `anchor` (default: pusat denah). */
export function scalePlacement(p: Placement, factor: number, anchor: LngLat = p.center): Placement {
  if (!(factor > 0)) return p;
  const offset = toLocal(anchor, p.center);
  return {
    ...p,
    center: fromLocal(anchor, [offset[0] * factor, offset[1] * factor]),
    widthM: p.widthM * factor,
    heightM: p.heightM * factor,
  };
}

/** Rotasi mutlak terhadap pusat denah. */
export function rotatePlacement(p: Placement, rotationDeg: number): Placement {
  return { ...p, rotationDeg: normalizeDeg(rotationDeg) };
}

/** Memindahkan titik yang menempel di gambar mengikuti perubahan posisi denah. */
export function carryPoint(before: Placement, after: Placement, point: LngLat): LngLat {
  const [u, v] = rotateCw(toLocal(before.center, point), -before.rotationDeg);
  const scaled: [number, number] = [
    (u * after.widthM) / before.widthM,
    (v * after.heightM) / before.heightM,
  ];
  return fromLocal(after.center, rotateCw(scaled, after.rotationDeg));
}

/**
 * Kalibrasi dengan alat ukur: dua titik yang diklik di denah dan jarak nyatanya.
 * Denah diskalakan terhadap titik pertama sehingga titik itu tetap di tempat.
 */
export function calibratePlacement(
  p: Placement,
  a: LngLat,
  b: LngLat,
  realDistanceM: number,
): { placement: Placement; a: LngLat; b: LngLat } {
  const measured = distanceM(a, b);
  if (!(measured > 0 && realDistanceM > 0)) return { placement: p, a, b };
  const placement = scalePlacement(p, realDistanceM / measured, a);
  return { placement, a, b: carryPoint(p, placement, b) };
}

/**
 * Posisi awal denah yang belum pernah ditempatkan: di tengah `center`, selebar
 * `widthM`, tinggi mengikuti rasio gambar, sisi atas menghadap utara.
 */
export function initialPlacement(
  center: LngLat,
  widthM: number,
  imageWidthPx: number,
  imageHeightPx: number,
): Placement {
  const aspect = imageWidthPx > 0 && imageHeightPx > 0 ? imageHeightPx / imageWidthPx : 1;
  return { center, widthM, heightM: widthM * aspect, rotationDeg: 0 };
}
