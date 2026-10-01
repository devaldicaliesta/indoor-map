import { describe, expect, it } from 'vitest';
import {
  openRing,
  type Pt,
  prepareRing,
  ringIntersectionArea,
  ringSelfIntersects,
  segmentsCross,
  segmentsIntersect,
  signedArea,
  triangulate,
} from '../../src/validation/planar';

const square = (x: number, y: number, s: number): Pt[] => [
  [x, y],
  [x + s, y],
  [x + s, y + s],
  [x, y + s],
];
const L: Pt[] = [
  [0, 0],
  [10, 0],
  [10, 5],
  [5, 5],
  [5, 10],
  [0, 10],
];

describe('geometri bidang', () => {
  it('cincin terbuka membuang titik penutup dan titik kembar', () => {
    expect(
      openRing([
        [0, 0],
        [1, 0],
        [1, 0],
        [1, 1],
        [0, 0],
      ]),
    ).toEqual([
      [0, 0],
      [1, 0],
      [1, 1],
    ]);
  });

  it('ruas memotong, bersinggungan, dan bersilangan tegas', () => {
    expect(segmentsIntersect([0, 0], [2, 2], [0, 2], [2, 0])).toBe(true);
    expect(segmentsIntersect([0, 0], [1, 0], [1, 0], [2, 0])).toBe(true);
    expect(segmentsIntersect([0, 0], [1, 0], [0, 1], [1, 1])).toBe(false);
    expect(segmentsCross([0, 0], [2, 2], [0, 2], [2, 0])).toBe(true);
    expect(segmentsCross([0, 0], [1, 0], [1, 0], [1, 1])).toBe(false);
  });

  it('cincin memotong diri: dasi kupu-kupu dan paku balik; kotak dan L tidak', () => {
    expect(
      ringSelfIntersects([
        [0, 0],
        [2, 2],
        [2, 0],
        [0, 2],
      ]),
    ).toBe(true);
    expect(
      ringSelfIntersects([
        [0, 0],
        [4, 0],
        [2, 0],
        [2, 3],
      ]),
    ).toBe(true);
    expect(ringSelfIntersects(square(0, 0, 1))).toBe(false);
    expect(ringSelfIntersects(L)).toBe(false);
  });

  it('triangulasi mempertahankan luas, juga untuk cincin searah jarum jam dan titik segaris', () => {
    const area = (ring: Pt[]) =>
      (triangulate(ring) ?? []).reduce((s, t) => s + Math.abs(signedArea(t)), 0);
    expect(area(L)).toBeCloseTo(75);
    expect(area([...L].reverse())).toBeCloseTo(75);
    expect(
      area([
        [0, 0],
        [5, 0],
        [10, 0],
        [10, 10],
        [0, 10],
      ]),
    ).toBeCloseTo(100);
  });

  it('luas irisan cincin cekung', () => {
    const l = prepareRing(L);
    const notch = prepareRing(square(6, 6, 3));
    const half = prepareRing(square(0, 0, 5));
    const across = prepareRing(square(4, 4, 2));
    if (!l || !notch || !half || !across) throw new Error('cincin tidak siap');
    expect(ringIntersectionArea(l, notch)).toBe(0);
    expect(ringIntersectionArea(l, half)).toBeCloseTo(25);
    // Kotak 4..6 × 4..6 menutupi ceruk sebagian: 4 m² dikurangi 1 m² di ceruk.
    expect(ringIntersectionArea(l, across)).toBeCloseTo(3);
  });
});
