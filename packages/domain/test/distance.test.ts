import { describe, expect, it } from 'vitest';
import { distanceM, EARTH_RADIUS_M, haversineM } from '../src';

describe('jarak haversine', () => {
  it('satu derajat lintang ≈ 111,2 km; titik yang sama 0', () => {
    expect(haversineM(106.8, -6, 106.8, -5)).toBeCloseTo((Math.PI / 180) * EARTH_RADIUS_M, 3);
    expect(distanceM([106.8272, -6.1754], [106.8272, -6.1754])).toBe(0);
  });

  it('skala gedung: 0,0001° bujur di lintang -6,175 ≈ 11,055 m', () => {
    expect(distanceM([106.8272, -6.1754], [106.8273, -6.1754])).toBeCloseTo(11.055, 3);
  });

  it('simetris dan memenuhi ketaksamaan segitiga', () => {
    const a = [106.8268, -6.1751];
    const b = [106.8276, -6.1757];
    const c = [106.828, -6.1753];
    expect(distanceM(a, b)).toBeCloseTo(distanceM(b, a), 9);
    expect(distanceM(a, c)).toBeLessThanOrEqual(distanceM(a, b) + distanceM(b, c));
  });
});
