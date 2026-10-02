import { describe, expect, it } from 'vitest';
import { closureCollection } from '../src';

describe('penanda penutupan', () => {
  it('ruas jalur menjadi garis, konektor menjadi titik; ruas tanpa panjang dibuang', () => {
    const { features } = closureCollection({
      lines: [
        [
          [1, 2],
          [3, 4],
        ],
        [[5, 6]],
      ],
      points: [[7, 8]],
    });
    expect(features.map((f) => f.geometry.type)).toEqual(['LineString', 'Point']);
  });
});
