import type { Geometry, Position } from '@indoor/domain';
import { fromLocal, type LngLat, toLocal } from './georef';

function mapPositions(geometry: Geometry, fn: (p: Position) => Position): Geometry {
  switch (geometry.type) {
    case 'Point':
      return { type: 'Point', coordinates: fn(geometry.coordinates) };
    case 'LineString':
      return { type: 'LineString', coordinates: geometry.coordinates.map(fn) };
    case 'Polygon':
      return { type: 'Polygon', coordinates: geometry.coordinates.map((r) => r.map(fn)) };
    case 'MultiPolygon':
      return {
        type: 'MultiPolygon',
        coordinates: geometry.coordinates.map((poly) => poly.map((r) => r.map(fn))),
      };
  }
}

/** Semua posisi geometri (untuk pusat dan kotak batas). */
export function positionsOf(geometry: Geometry): Position[] {
  const out: Position[] = [];
  mapPositions(geometry, (p) => {
    out.push(p);
    return p;
  });
  return out;
}

/** Menggeser geometri sejauh vektor dari `from` ke `to` (meter lokal, bukan derajat mentah). */
export function translateGeometry(geometry: Geometry, from: LngLat, to: LngLat): Geometry {
  const offset = toLocal(from, to);
  return mapPositions(geometry, (p) => {
    const moved = fromLocal(p as LngLat, offset);
    return [moved[0], moved[1]];
  });
}

/** Memutar geometri searah jarum jam sebesar `degrees` terhadap `origin`. */
export function rotateGeometry(geometry: Geometry, degrees: number, origin: LngLat): Geometry {
  const t = (degrees * Math.PI) / 180;
  const cos = Math.cos(t);
  const sin = Math.sin(t);
  return mapPositions(geometry, (p) => {
    const [x, y] = toLocal(origin, p as LngLat);
    const rotated = fromLocal(origin, [x * cos + y * sin, -x * sin + y * cos]);
    return [rotated[0], rotated[1]];
  });
}

/** Pusat kotak batas beberapa geometri (poros putar kelompok). */
export function boundsCenter(geometries: readonly Geometry[]): LngLat | null {
  const all = geometries.flatMap(positionsOf);
  if (all.length === 0) return null;
  const xs = all.map((p) => p[0]);
  const ys = all.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
}
