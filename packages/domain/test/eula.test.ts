import { describe, expect, it } from 'vitest';
import { EULA_VERSION, isEulaVersion, needsEulaAcceptance } from '../src';

describe('EULA', () => {
  it('versi berbentuk tanggal terbit', () => {
    expect(isEulaVersion(EULA_VERSION)).toBe(true);
    expect(isEulaVersion('2026-1-3')).toBe(false);
    expect(isEulaVersion('versi 1')).toBe(false);
    expect(isEulaVersion(null)).toBe(false);
  });

  it('persetujuan diminta sampai versi berlaku disetujui', () => {
    expect(needsEulaAcceptance(null)).toBe(true);
    expect(needsEulaAcceptance('2020-01-01')).toBe(true);
    expect(needsEulaAcceptance(EULA_VERSION)).toBe(false);
  });
});
