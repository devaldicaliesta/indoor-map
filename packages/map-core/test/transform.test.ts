import type { Geometry } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { distanceM, type LngLat } from '../src/georef';
import {
  boundsCenter,
  positionsOf,
  rotateGeometry,
  roundGeometry,
  translateGeometry,
} from '../src/transform';

const O: LngLat = [106.8272, -6.1754];
const east: LngLat = [106.8273, -6.1754];
const square: Geometry = {
  type: 'Polygon',
  coordinates: [
    [
      [106.8272, -6.1754],
      [106.8273, -6.1754],
      [106.8273, -6.1753],
      [106.8272, -6.1753],
      [106.8272, -6.1754],
    ],
  ],
};

describe('translateGeometry', () => {
  it('menggeser semua titik sejauh vektor yang sama dan mempertahankan ukuran', () => {
    const moved = translateGeometry(square, O, east);
    const before = positionsOf(square) as LngLat[];
    const after = positionsOf(moved) as LngLat[];
    for (let i = 0; i < before.length; i++) {
      expect(distanceM(before[i] as LngLat, after[i] as LngLat)).toBeCloseTo(distanceM(O, east), 3);
    }
    expect(distanceM(after[0] as LngLat, after[1] as LngLat)).toBeCloseTo(
      distanceM(before[0] as LngLat, before[1] as LngLat),
      3,
    );
  });
});

describe('rotateGeometry', () => {
  it('90° searah jarum jam: titik di timur pindah ke selatan, jarak ke poros tetap', () => {
    const rotated = rotateGeometry({ type: 'Point', coordinates: east }, 90, O);
    const p = positionsOf(rotated)[0] as LngLat;
    expect(distanceM(O, p)).toBeCloseTo(distanceM(O, east), 3);
    expect(p[1]).toBeLessThan(O[1]);
    expect(p[0]).toBeCloseTo(O[0], 8);
  });

  it('360° kembali ke posisi semula', () => {
    const back = rotateGeometry(square, 360, boundsCenter([square]) as LngLat);
    const a = positionsOf(back) as LngLat[];
    positionsOf(square).forEach((p, i) => {
      expect(distanceM(p as LngLat, a[i] as LngLat)).toBeLessThan(1e-6);
    });
  });
});

describe('boundsCenter', () => {
  it('pusat kotak batas beberapa geometri', () => {
    const [x, y] = boundsCenter([square]) ?? [0, 0];
    expect(x).toBeCloseTo(106.82725, 9);
    expect(y).toBeCloseTo(-6.17535, 9);
    expect(boundsCenter([])).toBeNull();
  });
});

describe('presisi koordinat', () => {
  const decimals = (n: number) => (String(n).split('.')[1] ?? '').length;

  it('hasil geser dan putar paling banyak 9 desimal (batas terra-draw)', () => {
    const moved = translateGeometry(square, O, [106.82731234567891, -6.17541234567891]);
    const rotated = rotateGeometry(square, 17.3, O);
    for (const p of [...positionsOf(moved), ...positionsOf(rotated)]) {
      expect(decimals(p[0])).toBeLessThanOrEqual(9);
      expect(decimals(p[1])).toBeLessThanOrEqual(9);
    }
  });

  it('roundGeometry membulatkan semua titik', () => {
    const g = roundGeometry({
      type: 'Point',
      coordinates: [106.12345678912345, -6.98765432198765],
    });
    expect(g).toEqual({ type: 'Point', coordinates: [106.123456789, -6.987654322] });
  });
});
