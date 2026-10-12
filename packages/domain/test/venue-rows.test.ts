import { describe, expect, it } from 'vitest';
import { VENUE_ROW_TABLES, venueRows, withNewIds } from '../src';
import { trialSample } from '../src/trial-sample';
import { mallVenue } from './fixtures/demo-venues';
import { sampleSnapshotSource } from './fixtures/snapshot-source';

const VENUE = '1e000000-0000-4000-8000-000000000001';

describe('venueRows', () => {
  // Lokasi nonaktif permanen tidak disalin (lihat uji terakhir); sisanya draft lengkap.
  const full = sampleSnapshotSource();
  const source = {
    ...full,
    locations: full.locations.filter((l) => l.status !== 'inactive_permanent'),
  };
  const rows = venueRows(source, VENUE);

  it('semua baris satu tabel berkunci sama (disisipkan sekaligus di SQL)', () => {
    for (const table of VENUE_ROW_TABLES) {
      const keys = new Set(rows.tables[table].map((row) => Object.keys(row).sort().join(',')));
      expect(keys.size, table).toBeLessThanOrEqual(1);
    }
  });

  it('Area Luar tidak ikut (dibuat trigger saat venue dibuat)', () => {
    const outdoor = source.floors.filter((f) => f.isOutdoor).map((f) => f.id);
    expect(rows.tables.floors.map((f) => f.id)).not.toEqual(expect.arrayContaining(outdoor));
    expect(rows.tables.floors).toHaveLength(source.floors.length - outdoor.length);
  });

  it('jumlah baris mengikuti draft dan semuanya milik venue yang sama', () => {
    expect(rows.tables.features).toHaveLength(source.features.length);
    expect(rows.tables.locations).toHaveLength(source.locations.length);
    expect(rows.tables.nav_edges).toHaveLength(source.graph.edges.length);
    for (const table of ['buildings', 'features', 'locations', 'nav_nodes'] as const) {
      expect(rows.tables[table].every((row) => row.venue_id === VENUE)).toBe(true);
    }
    expect(rows.defaultBuildingId).toBe(source.venue.defaultBuildingId);
  });

  it('lokasi nonaktif permanen ditolak dengan jelas', () => {
    const [first, ...rest] = source.locations;
    if (!first) throw new Error('fixture tanpa lokasi');
    const withPermanent = {
      ...source,
      locations: [{ ...first, status: 'inactive_permanent' as const }, ...rest],
    };
    expect(() => venueRows(withPermanent, VENUE)).toThrow(/nonaktif permanen/);
  });
});

describe('withNewIds', () => {
  it('setiap UUID diganti konsisten; id tetap memakai penggantinya', () => {
    const sample = trialSample(mallVenue());
    const outdoor = sample.floors.find((f) => f.isOutdoor)?.id ?? '';
    let counter = 0;
    const next = () => `00000000-0000-4000-8000-${String(++counter).padStart(12, '0')}`;
    const copy = withNewIds(sample, next, new Map([[outdoor, VENUE]]));

    const oldIds = new Set(sample.features.map((f) => f.id));
    expect(copy.features.some((f) => oldIds.has(f.id))).toBe(false);
    expect(copy.floors.find((f) => f.isOutdoor)?.id).toBe(VENUE);
    // Rujukan antartabel ikut berganti: unit lokasi tetap menunjuk fitur yang ada.
    const featureIds = new Set(copy.features.map((f) => f.id));
    expect(copy.locations.every((l) => l.unitIds.every((id) => featureIds.has(id)))).toBe(true);
  });
});
