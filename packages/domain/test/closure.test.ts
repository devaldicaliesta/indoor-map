import { describe, expect, it } from 'vitest';
import { closureStatus, closureTarget, validateClosureInput } from '../src';

const NOW = new Date('2026-10-01T08:00:00Z');

describe('penutupan', () => {
  it('status menurut waktu: berlaku, terjadwal, berakhir (selesai tepat sekarang = berakhir)', () => {
    const at = (startsAt: string, endsAt: string | null) =>
      closureStatus({ startsAt, endsAt }, NOW);
    expect(at('2026-10-01T07:00:00Z', null)).toBe('active');
    expect(at('2026-10-01T08:00:00Z', '2026-10-01T09:00:00Z')).toBe('active');
    expect(at('2026-10-01T09:00:00Z', null)).toBe('scheduled');
    expect(at('2026-10-01T07:00:00Z', '2026-10-01T08:00:00Z')).toBe('ended');
  });

  it('sasaran dari kolom yang terisi', () => {
    expect(closureTarget({ featureId: null, edgeId: 'e', connectorId: null })).toEqual({
      kind: 'edge',
      id: 'e',
    });
    expect(closureTarget({ featureId: 'f', edgeId: null, connectorId: null }).kind).toBe('feature');
    expect(closureTarget({ featureId: null, edgeId: null, connectorId: 'c' }).kind).toBe(
      'connector',
    );
  });

  it('alasan wajib; selesai harus setelah mulai; tanpa selesai boleh', () => {
    const ok = { reason: 'Perawatan lift', startsAt: '2026-10-01T08:00:00Z', endsAt: null };
    expect(validateClosureInput(ok)).toEqual({});
    expect(validateClosureInput({ ...ok, reason: '  ' })).toHaveProperty('reason');
    expect(validateClosureInput({ ...ok, endsAt: '2026-10-01T08:00:00Z' })).toHaveProperty(
      'endsAt',
    );
    expect(validateClosureInput({ ...ok, startsAt: 'x' })).toHaveProperty('startsAt');
  });
});
