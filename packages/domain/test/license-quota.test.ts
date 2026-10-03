import { describe, expect, it } from 'vitest';
import { daysRemaining, isQuotaFull } from '../src/license-quota';

describe('isQuotaFull', () => {
  it('penuh saat pemakaian mencapai kuota', () => {
    expect(isQuotaFull({ kind: 'infoPoints', used: 10, quota: 10 })).toBe(true);
    expect(isQuotaFull({ kind: 'infoPoints', used: 9, quota: 10 })).toBe(false);
    expect(isQuotaFull({ kind: 'infoPoints', used: 12, quota: 10 })).toBe(true);
  });

  it('tanpa lisensi atau data belum dimuat tidak dianggap penuh', () => {
    expect(isQuotaFull({ kind: 'venues', used: 3, quota: null })).toBe(false);
    expect(isQuotaFull(undefined)).toBe(false);
  });
});

describe('daysRemaining', () => {
  const now = new Date('2026-10-03T12:00:00Z');
  it('membulatkan ke atas sisa hari', () => {
    expect(daysRemaining('2026-10-04T00:00:00Z', now)).toBe(1);
    expect(daysRemaining('2026-11-02T12:00:00Z', now)).toBe(30);
  });
  it('nol setelah berakhir', () => {
    expect(daysRemaining('2026-10-01T00:00:00Z', now)).toBe(0);
  });
});
