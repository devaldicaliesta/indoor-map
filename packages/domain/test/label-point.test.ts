import { describe, expect, it } from 'vitest';
import { labelPoint, type Position } from '../src';

/** Titik di dalam cincin (ray casting), untuk memeriksa hasil. */
function inside([x, y]: Position, ring: readonly Position[]): boolean {
  let result = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i] as Position;
    const b = ring[j] as Position;
    if (a[1] > y !== b[1] > y && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) {
      result = !result;
    }
  }
  return result;
}

describe('labelPoint', () => {
  it('persegi: titik label di tengahnya', () => {
    const [x, y] = labelPoint([
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
    ]);
    expect(x).toBeCloseTo(5, 4);
    expect(y).toBeCloseTo(5, 4);
  });

  it('unit berbentuk L: titik label di dalam unit, bukan di pusat massa yang jatuh di luar', () => {
    const ring: Position[] = [
      [0, 0],
      [10, 0],
      [10, 2],
      [2, 2],
      [2, 10],
      [0, 10],
      [0, 0],
    ];
    const point = labelPoint([ring], 1e-4);
    expect(inside(point, ring)).toBe(true);
  });

  it('poligon berlubang: titik label tidak jatuh di lubang', () => {
    const outer: Position[] = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ];
    const hole: Position[] = [
      [3, 3],
      [7, 3],
      [7, 7],
      [3, 7],
      [3, 3],
    ];
    const point = labelPoint([outer, hole], 1e-4);
    expect(inside(point, outer)).toBe(true);
    expect(inside(point, hole)).toBe(false);
  });

  it('koordinat WGS84 skala unit (±10 m) tetap presisi', () => {
    const ring: Position[] = [
      [106.8268, -6.1751],
      [106.8268904, -6.1751],
      [106.8268904, -6.1752447],
      [106.8268, -6.1752447],
      [106.8268, -6.1751],
    ];
    const [x, y] = labelPoint([ring]);
    expect(x).toBeCloseTo(106.8268452, 6);
    expect(y).toBeCloseTo(-6.17517235, 6);
  });

  it('poligon tanpa luas memakai titik sudutnya', () => {
    expect(
      labelPoint([
        [
          [1, 1],
          [1, 1],
          [1, 1],
          [1, 1],
        ],
      ]),
    ).toEqual([1, 1]);
  });
});
