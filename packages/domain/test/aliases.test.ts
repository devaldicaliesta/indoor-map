import { describe, expect, it } from 'vitest';
import { checkAliases, normalizeAliases } from '../src';

describe('alias pencarian', () => {
  it('dipisah koma/baris baru, dirapikan, tanpa duplikat dan tanpa nama sendiri', () => {
    expect(
      normalizeAliases(' rontgen,  X-Ray\nrontgen , Radiologi,, foto  thorax', 'Radiologi'),
    ).toEqual(['rontgen', 'X-Ray', 'foto thorax']);
  });

  it('batas panjang dan jumlah', () => {
    expect(checkAliases(['a'.repeat(61)])).toEqual(['too_long']);
    expect(checkAliases(Array.from({ length: 21 }, (_, i) => `a${i}`))).toEqual(['too_many']);
    expect(checkAliases(['rontgen'])).toEqual([]);
  });
});
