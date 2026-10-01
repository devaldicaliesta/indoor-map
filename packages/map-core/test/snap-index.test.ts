import { describe, expect, it } from 'vitest';
import { buildSnapIndex } from '../src/snap-index';

const features = [
  {
    properties: { id: 'a' },
    geometry: {
      type: 'Polygon' as const,
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0],
        ] as [number, number][],
      ],
    },
  },
  {
    properties: { id: 'b' },
    geometry: {
      type: 'LineString' as const,
      coordinates: [
        [5, 5],
        [6, 5],
      ] as [number, number][],
    },
  },
];

describe('buildSnapIndex', () => {
  const index = buildSnapIndex(features);

  it('vertex poligon tanpa duplikat titik penutup; ruas yang menyentuh kotak ikut', () => {
    const near = index.query([0.9, -0.1, 1.1, 0.1]);
    expect(near.vertices).toEqual([[1, 0]]);
    expect(near.segments).toEqual([
      [
        [0, 0],
        [1, 0],
      ],
      [
        [1, 0],
        [1, 1],
      ],
    ]);
  });

  it('fitur yang sedang disunting dikecualikan', () => {
    expect(index.query([-1, -1, 2, 2], 'a')).toEqual({ vertices: [], segments: [] });
    expect(index.query([4, 4, 7, 6]).vertices).toHaveLength(2);
  });
});
