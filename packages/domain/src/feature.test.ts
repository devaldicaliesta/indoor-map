import { describe, expect, it } from 'vitest';
import {
  checkUnitCode,
  drawKindsFor,
  FEATURE_KINDS,
  KIND_SHAPE,
  normalizeUnitCode,
} from './feature';

describe('drawKindsFor', () => {
  it('pilihan jenis di gedung sesuai bentuk alat', () => {
    expect(drawKindsFor('polygon', false).map((d) => d.kind)).toEqual([
      'unit',
      'corridor',
      'elevator',
      'escalator',
      'stairs',
      'non_walkable',
    ]);
    expect(drawKindsFor('linestring', false)).toEqual([{ kind: 'wall' }]);
    expect(drawKindsFor('point', false).map((d) => d.kind)).toEqual(['door', 'exit']);
  });

  it('Area Luar: jalan/trotoar, taman, parkir sebagai outdoor_area dengan subjenis; tanpa unit', () => {
    const polygons = drawKindsFor('polygon', true);
    expect(polygons.slice(0, 3)).toEqual([
      { kind: 'outdoor_area', subtype: 'road' },
      { kind: 'outdoor_area', subtype: 'garden' },
      { kind: 'outdoor_area', subtype: 'parking' },
    ]);
    expect(polygons.some((d) => d.kind === 'unit')).toBe(false);
  });

  it('setiap jenis punya bentuk', () => {
    for (const kind of FEATURE_KINDS) expect(KIND_SHAPE[kind]).toBeDefined();
  });
});

describe('kode unit', () => {
  it('dinormalkan huruf besar tanpa spasi tepi', () => {
    expect(normalizeUnitCode('  l1-023 ')).toBe('L1-023');
  });

  it('wajib, maksimal 32 karakter, huruf/angka dengan . _ / -', () => {
    expect(checkUnitCode('L1-023')).toEqual([]);
    expect(checkUnitCode('gu/l2.10_b')).toEqual([]);
    expect(checkUnitCode('  ')).toEqual(['required']);
    expect(checkUnitCode('A'.repeat(33))).toEqual(['too_long']);
    expect(checkUnitCode('L1 023')).toEqual(['format']);
    expect(checkUnitCode('-L1')).toEqual(['format']);
  });
});
