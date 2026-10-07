import { describe, expect, it } from 'vitest';
import { fromVenueInput, impactText, targetLabel, toVenueInput } from './closure-model';

const places = {
  floors: [
    { id: 'f2', name: 'L2', buildingId: 'b' },
    { id: 'out', name: 'Area Luar', buildingId: null },
  ],
  buildings: [{ id: 'b', name: 'Gedung Utama' }],
  connectors: [
    { id: 'k', name: 'A', kind: 'elevator' as const },
    { id: 'k2', name: 'lift Pasien', kind: 'elevator' as const },
  ],
  features: [{ properties: { id: 'u', kind: 'unit' as const, floorId: 'f2', unitCode: 'L2-01' } }],
  graph: {
    edges: {
      e: { id: 'e', floorId: 'out', from: 'a', to: 'b', lengthM: 3, accessible: true },
    },
  },
};

describe('model penutupan', () => {
  it('isian waktu dibaca dan ditulis dalam jam dinding venue', () => {
    expect(toVenueInput('2026-10-01T01:30:00Z', 'Asia/Jakarta')).toBe('2026-10-01T08:30');
    expect(fromVenueInput('2026-10-01T08:30', 'Asia/Jakarta')).toBe('2026-10-01T01:30:00.000Z');
    expect(fromVenueInput('2026-10-01T08:30', 'Asia/Jayapura')).toBe('2026-09-30T23:30:00.000Z');
    expect(fromVenueInput('', 'Asia/Jakarta')).toBeNull();
  });

  it('nama sasaran menyebut lantai dan gedung', () => {
    expect(targetLabel(places, { kind: 'connector', id: 'k' })).toBe('Lift A');
    expect(targetLabel(places, { kind: 'connector', id: 'k2' })).toBe('lift Pasien');
    expect(targetLabel(places, { kind: 'edge', id: 'e' })).toBe('Jalur di Area Luar');
    expect(targetLabel(places, { kind: 'feature', id: 'u' })).toBe('L2-01 · L2 Gedung Utama');
    expect(targetLabel(places, { kind: 'edge', id: 'x' })).toBe('Jalur yang dihapus');
  });

  it('kalimat dampak', () => {
    expect(impactText(places, { floorId: 'f2', allRoutes: false })).toBe(
      'Rute aksesibel ke L2 Gedung Utama tidak tersedia selama penutupan.',
    );
    expect(impactText(places, { floorId: 'f2', allRoutes: true })).toBe(
      'Tidak ada rute ke L2 Gedung Utama selama penutupan.',
    );
  });
});
