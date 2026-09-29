import { describe, expect, it } from 'vitest';
import { closestOnSegment, snapPoint } from '../src/snap';

describe('snapPoint', () => {
  const vertices: [number, number][] = [
    [100, 100],
    [200, 100],
  ];
  const segments: [[number, number], [number, number]][] = [
    [
      [100, 100],
      [200, 100],
    ],
  ];

  it('menempel ke vertex terdekat dalam 8 px, mendahului tepi', () => {
    expect(snapPoint({ pointer: [105, 104], vertices, segments })).toEqual({
      point: [100, 100],
      kind: 'vertex',
    });
  });

  it('menempel ke tepi bila tidak ada vertex dekat', () => {
    expect(snapPoint({ pointer: [150, 106], vertices, segments })).toEqual({
      point: [150, 100],
      kind: 'edge',
    });
  });

  it('di luar toleransi: tidak menempel', () => {
    expect(snapPoint({ pointer: [150, 109], vertices, segments })).toBeNull();
  });

  it('sudut siku terhadap ruas terakhir yang digambar', () => {
    const previous: [number, number][] = [
      [0, 0],
      [100, 20],
    ];
    const result = snapPoint({ pointer: [96, 45], vertices: [], segments: [], previous });
    expect(result?.kind).toBe('angle');
    const [x, y] = result?.point ?? [0, 0];
    // Vektor (last → titik) tegak lurus ruas terakhir: hasil kali titik = 0.
    expect((x - 100) * 100 + (y - 20) * 20).toBeCloseTo(0, 6);
  });

  it('sudut lurus (melanjutkan ruas) juga ditarik', () => {
    const previous: [number, number][] = [
      [0, 0],
      [100, 0],
    ];
    expect(snapPoint({ pointer: [160, 5], vertices: [], segments: [], previous })).toEqual({
      point: [160, 0],
      kind: 'angle',
    });
  });
});

describe('closestOnSegment', () => {
  it('dijepit ke ujung ruas', () => {
    expect(closestOnSegment([300, 50], [0, 0], [100, 0])).toEqual([100, 0]);
    expect(closestOnSegment([5, 5], [3, 3], [3, 3])).toEqual([3, 3]);
  });
});
