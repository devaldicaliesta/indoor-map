import { describe, expect, it } from 'vitest';
import { checkBuildingInput, normalizeBuildingCode } from '../src';

describe('gedung', () => {
  it('kode wajib dan dinormalisasi ke huruf besar', () => {
    expect(normalizeBuildingCode(' gu ')).toBe('GU');
    expect(checkBuildingInput({ name: 'Gedung Utama', code: 'gu', footprint: null })).toEqual([]);
    expect(checkBuildingInput({ name: 'Gedung Utama', code: ' ', footprint: null })).toEqual([
      'code_required',
    ]);
  });

  it('kode hanya huruf, angka, tanda hubung, maksimal 12 karakter; nama wajib', () => {
    expect(checkBuildingInput({ name: '', code: 'GEDUNG B', footprint: null })).toEqual([
      'name_required',
      'code_format',
    ]);
    expect(checkBuildingInput({ name: 'X', code: 'GEDUNG-BARAT-1', footprint: null })).toEqual([
      'code_format',
    ]);
    expect(checkBuildingInput({ name: 'X', code: 'GT-2', footprint: null })).toEqual([]);
  });
});
