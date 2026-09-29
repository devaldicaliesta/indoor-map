import type { Geometry, Position } from '@indoor/domain';
import type { LngLat } from './georef';

/** [minLng, minLat, maxLng, maxLat] */
export type BBox = [number, number, number, number];

interface Segment {
  id: string;
  a: LngLat;
  b: LngLat;
}

export interface SnapCandidates {
  vertices: LngLat[];
  segments: [LngLat, LngLat][];
}

export interface SnapIndex {
  /** Vertex dan ruas di dalam kotak, tanpa milik fitur `excludeId` (yang sedang disunting). */
  query(bbox: BBox, excludeId?: string | null): SnapCandidates;
}

function linesOf(geometry: Geometry): Position[][] {
  switch (geometry.type) {
    case 'Point':
      return [[geometry.coordinates]];
    case 'LineString':
      return [geometry.coordinates];
    case 'Polygon':
      return geometry.coordinates;
    case 'MultiPolygon':
      return geometry.coordinates.flat();
  }
}

const inside = (p: LngLat, [x0, y0, x1, y1]: BBox) =>
  p[0] >= x0 && p[0] <= x1 && p[1] >= y0 && p[1] <= y1;

const touches = (s: Segment, [x0, y0, x1, y1]: BBox) =>
  Math.max(s.a[0], s.b[0]) >= x0 &&
  Math.min(s.a[0], s.b[0]) <= x1 &&
  Math.max(s.a[1], s.b[1]) >= y0 &&
  Math.min(s.a[1], s.b[1]) <= y1;

/**
 * Indeks sederhana untuk snapping: daftar datar vertex dan ruas semua fitur lantai.
 * Pencarian linear cukup cepat untuk 1.000 fitur (± 5.000 ruas) per gerakan mouse.
 */
export function buildSnapIndex(
  features: readonly { geometry: Geometry; properties: { id: string } }[],
): SnapIndex {
  const vertices: { id: string; p: LngLat }[] = [];
  const segments: Segment[] = [];
  for (const f of features) {
    const id = f.properties.id;
    for (const line of linesOf(f.geometry)) {
      const closed =
        line.length > 3 && line[0]?.[0] === line.at(-1)?.[0] && line[0]?.[1] === line.at(-1)?.[1];
      const points = (closed ? line.slice(0, -1) : line) as LngLat[];
      for (const p of points) vertices.push({ id, p });
      for (let i = 0; i < line.length - 1; i++) {
        segments.push({ id, a: line[i] as LngLat, b: line[i + 1] as LngLat });
      }
    }
  }
  return {
    query(bbox, excludeId) {
      return {
        vertices: vertices.filter((v) => v.id !== excludeId && inside(v.p, bbox)).map((v) => v.p),
        segments: segments
          .filter((s) => s.id !== excludeId && touches(s, bbox))
          .map((s) => [s.a, s.b] as [LngLat, LngLat]),
      };
    },
  };
}
