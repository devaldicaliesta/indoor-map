import { describe, expect, it } from 'vitest';
import { areaM2, roundAreaM2 } from './area';
import type { Polygon } from './geometry';
import { EARTH_RADIUS_M } from './units';

/** Persegi `sideM` meter berpusat di (lng, lat), dibentuk dengan proyeksi lokal. */
function square(lng: number, lat: number, sideM: number): Polygon {
  const dLat = sideM / 2 / ((EARTH_RADIUS_M * Math.PI) / 180);
  const dLng = dLat / Math.cos((lat * Math.PI) / 180);
  return {
    type: 'Polygon',
    coordinates: [
      [
        [lng - dLng, lat - dLat],
        [lng + dLng, lat - dLat],
        [lng + dLng, lat + dLat],
        [lng - dLng, lat + dLat],
        [lng - dLng, lat - dLat],
      ],
    ],
  };
}

describe('areaM2', () => {
  it('persegi 20 × 20 m di Jakarta ≈ 400 m² (selisih < 0,1%)', () => {
    expect(Math.abs(areaM2(square(106.8272, -6.1754, 20)) / 400 - 1)).toBeLessThan(0.001);
  });

  it('tidak bergantung arah putaran dan lintang', () => {
    const polygon = square(10, 60, 50);
    const reversed: Polygon = {
      type: 'Polygon',
      coordinates: [[...(polygon.coordinates[0] ?? [])].reverse()],
    };
    expect(areaM2(reversed)).toBeCloseTo(areaM2(polygon), 6);
    expect(Math.abs(areaM2(polygon) / 2500 - 1)).toBeLessThan(0.001);
  });

  it('lubang dikurangkan; multipolygon dijumlahkan; titik/garis 0', () => {
    const outer = square(0, 0, 30).coordinates[0] ?? [];
    const hole = square(0, 0, 10).coordinates[0] ?? [];
    expect(areaM2({ type: 'Polygon', coordinates: [outer, hole] })).toBeCloseTo(800, 0);
    expect(
      areaM2({
        type: 'MultiPolygon',
        coordinates: [square(0, 0, 10).coordinates, square(1, 0, 10).coordinates],
      }),
    ).toBeCloseTo(200, 0);
    expect(areaM2({ type: 'Point', coordinates: [0, 0] })).toBe(0);
  });

  it('dibulatkan dua desimal', () => {
    expect(roundAreaM2(84.456)).toBe(84.46);
  });
});
