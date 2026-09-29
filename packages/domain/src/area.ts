import type { Geometry, Position } from './geometry';
import { EARTH_RADIUS_M } from './units';

const RAD = Math.PI / 180;

/**
 * Luas cincin di permukaan bola (rumus yang sama dengan turf `area`), dalam m².
 * Arah putaran tidak berpengaruh karena nilainya dimutlakkan.
 */
function ringAreaM2(ring: readonly Position[]): number {
  const n = ring.length;
  if (n < 4) return 0;
  let sum = 0;
  for (let i = 0; i < n - 1; i++) {
    const prev = ring[i === 0 ? n - 2 : i - 1] as Position;
    const next = ring[i + 1] as Position;
    const current = ring[i] as Position;
    sum += (next[0] - prev[0]) * RAD * Math.sin(current[1] * RAD);
  }
  return Math.abs((sum * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
}

function polygonAreaM2(rings: readonly (readonly Position[])[]): number {
  const [outer, ...holes] = rings;
  if (!outer) return 0;
  return Math.max(0, ringAreaM2(outer) - holes.reduce((s, h) => s + ringAreaM2(h), 0));
}

/** Luas geometri dalam m²; titik dan garis bernilai 0. Lubang poligon dikurangkan. */
export function areaM2(geometry: Geometry): number {
  switch (geometry.type) {
    case 'Polygon':
      return polygonAreaM2(geometry.coordinates);
    case 'MultiPolygon':
      return geometry.coordinates.reduce((s, p) => s + polygonAreaM2(p), 0);
    default:
      return 0;
  }
}

/** Dibulatkan 2 desimal sesuai kolom `features.area_m2 numeric(10, 2)`. */
export const roundAreaM2 = (value: number) => Math.round(value * 100) / 100;
