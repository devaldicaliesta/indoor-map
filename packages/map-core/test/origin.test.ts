import { describe, expect, it } from 'vitest';
import { distanceM, originCollection } from '../src';

describe('penanda titik asal', () => {
  it('garis arah hadap 4 m dari titik ke arah yang dituju', () => {
    const position: [number, number] = [106.8272, -6.1754];
    const { features } = originCollection([{ id: 'o', position, headingDeg: 90, selected: true }]);
    expect(features).toHaveLength(2);
    const line = features[0]?.geometry;
    if (line?.type !== 'LineString') throw new Error('bukan garis');
    const [start, end] = line.coordinates as [number, number][];
    expect(start).toEqual(position);
    expect(distanceM(position, end ?? position)).toBeCloseTo(4, 1);
    expect((end?.[0] ?? 0) > position[0]).toBe(true);
    expect(end?.[1]).toBeCloseTo(position[1], 7);
    expect(features[1]?.properties).toEqual({ id: 'o', selected: true });
  });
});

describe('penanda tanpa arah hadap', () => {
  it('hanya titik', () => {
    const { features } = originCollection([
      { id: 'o', position: [106.8, -6.1], headingDeg: null, selected: true },
    ]);
    expect(features.map((f) => f.geometry.type)).toEqual(['Point']);
  });
});
