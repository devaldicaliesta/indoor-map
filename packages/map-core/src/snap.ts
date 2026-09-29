/** Titik layar dalam piksel. */
export type Px = [number, number];

export type SnapKind = 'vertex' | 'edge' | 'angle';

export interface SnapInput {
  pointer: Px;
  vertices: readonly Px[];
  segments: readonly (readonly [Px, Px])[];
  /** Titik yang sudah ditempatkan pada geometri yang sedang digambar, urut. */
  previous?: readonly Px[];
  tolerancePx?: number;
}

/** FR-MAP-04: toleransi snapping 8 px layar. */
export const SNAP_TOLERANCE_PX = 8;

const dist = (a: Px, b: Px) => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** Titik terdekat pada ruas a–b. */
export function closestOnSegment(p: Px, a: Px, b: Px): Px {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len2 = dx * dx + dy * dy;
  if (len2 === 0) return a;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2));
  return [a[0] + t * dx, a[1] + t * dy];
}

/** Proyeksi p ke garis tak hingga melalui `origin` searah `dir`. */
function projectOnLine(p: Px, origin: Px, dir: Px): Px {
  const len2 = dir[0] ** 2 + dir[1] ** 2;
  if (len2 === 0) return origin;
  const t = ((p[0] - origin[0]) * dir[0] + (p[1] - origin[1]) * dir[1]) / len2;
  return [origin[0] + t * dir[0], origin[1] + t * dir[1]];
}

/**
 * Snapping di ruang layar dengan prioritas vertex → tepi → sudut siku. Sudut siku
 * mengacu ke ruas terakhir yang sudah digambar: titik baru ditarik ke garis lurus
 * atau tegak lurus dari titik terakhir.
 */
export function snapPoint(input: SnapInput): { point: Px; kind: SnapKind } | null {
  const { pointer, tolerancePx = SNAP_TOLERANCE_PX } = input;

  let best: { point: Px; d: number } | null = null;
  for (const v of input.vertices) {
    const d = dist(pointer, v);
    if (d <= tolerancePx && (!best || d < best.d)) best = { point: v, d };
  }
  if (best) return { point: best.point, kind: 'vertex' };

  for (const [a, b] of input.segments) {
    const q = closestOnSegment(pointer, a, b);
    const d = dist(pointer, q);
    if (d <= tolerancePx && (!best || d < best.d)) best = { point: q, d };
  }
  if (best) return { point: best.point, kind: 'edge' };

  const previous = input.previous ?? [];
  const last = previous.at(-1);
  const beforeLast = previous.at(-2);
  if (last && beforeLast) {
    const dir: Px = [last[0] - beforeLast[0], last[1] - beforeLast[1]];
    const perpendicular: Px = [-dir[1], dir[0]];
    for (const line of [perpendicular, dir]) {
      const q = projectOnLine(pointer, last, line);
      const d = dist(pointer, q);
      if (d <= tolerancePx && (!best || d < best.d)) best = { point: q, d };
    }
    if (best) return { point: best.point, kind: 'angle' };
  }
  return null;
}
