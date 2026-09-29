import { describe, expect, it } from 'vitest';
import { defaultFeatureKind, nextUnitCode } from './feature-draft';

describe('defaultFeatureKind', () => {
  it('poligon unit di gedung, area luar di Area Luar; garis dinding; titik pintu', () => {
    expect(defaultFeatureKind('Polygon', false)).toBe('unit');
    expect(defaultFeatureKind('Polygon', true)).toBe('outdoor_area');
    expect(defaultFeatureKind('LineString', false)).toBe('wall');
    expect(defaultFeatureKind('Point', true)).toBe('door');
  });
});

describe('nextUnitCode', () => {
  it('melanjutkan nomor tertinggi dengan awalan yang sama, tidak peka huruf besar/kecil', () => {
    expect(nextUnitCode('GU-L1', [])).toBe('GU-L1-001');
    expect(nextUnitCode('GU-L1', ['GU-L1-002', 'gu-l1-010', 'GU-GF-099', 'LOBI'])).toBe(
      'GU-L1-011',
    );
  });

  it('awalan dengan karakter regex tetap aman', () => {
    expect(nextUnitCode('A.B', ['AXB-005'])).toBe('A.B-001');
  });
});
