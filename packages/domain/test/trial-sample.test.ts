import { describe, expect, it } from 'vitest';
import { buildSnapshot, VenueSlugSchema, validateVenue } from '../src';
import { BUILDING_TYPES } from '../src/trial-request';
// Tidak diekspor dari index: menarik `trial-request.ts` → `license.ts` (crypto, atob) ke paket
// yang tidak memuat lib DOM, seperti `trial-request` sendiri.
import {
  slugFromName,
  TRIAL_SAMPLE_LIMITS,
  TRIAL_TEMPLATES,
  trialSample,
} from '../src/trial-sample';
import {
  airportVenue,
  campusVenue,
  concertVenue,
  factoryVenue,
  hospitalVenue,
  mallVenue,
  officeVenue,
} from './fixtures/demo-venues';

// Venue demo per slug templat (`TRIAL_TEMPLATES`), sama dengan `db:seed-demo`.
const DEMO_BY_SLUG = {
  'demo-mal': mallVenue,
  demo: hospitalVenue,
  'demo-kampus': campusVenue,
  'demo-kantor': officeVenue,
  'demo-bandara': airportVenue,
  'demo-pabrik': factoryVenue,
  'demo-konser': concertVenue,
};
const CONTEXT = { today: '2026-10-12', floorPlans: [] };

describe('templat trial per jenis gedung', () => {
  it('setiap jenis gedung form trial punya venue demo', () => {
    for (const type of BUILDING_TYPES) {
      expect(Object.keys(DEMO_BY_SLUG)).toContain(TRIAL_TEMPLATES[type].slug);
    }
  });
});

describe.each(Object.entries(DEMO_BY_SLUG))('data contoh trial dari %s', (_, make) => {
  const source = make();
  const sample = trialSample(source);

  it('muat di batas trial', () => {
    const indoor = sample.floors.filter((f) => !f.isOutdoor);
    expect(sample.buildings).toHaveLength(1);
    expect(indoor.length).toBeGreaterThan(0);
    expect(indoor.length).toBeLessThanOrEqual(TRIAL_SAMPLE_LIMITS.floors);
    expect(sample.locations.length).toBeGreaterThan(0);
    expect(sample.locations.length).toBeLessThanOrEqual(TRIAL_SAMPLE_LIMITS.locations);
    expect(sample.originPoints.length).toBeLessThanOrEqual(TRIAL_SAMPLE_LIMITS.originPoints);
    expect(sample.infoPoints.length).toBeLessThanOrEqual(TRIAL_SAMPLE_LIMITS.infoPoints);
  });

  it('rujukan tetap utuh dan lolos validasi publish tanpa Error', () => {
    const floorIds = new Set(sample.floors.map((f) => f.id));
    const featureIds = new Set(sample.features.map((f) => f.id));
    const nodeIds = new Set(sample.graph.nodes.map((n) => n.id));
    expect(sample.features.every((f) => floorIds.has(f.floorId))).toBe(true);
    expect(sample.locations.every((l) => l.unitIds.every((id) => featureIds.has(id)))).toBe(true);
    expect(sample.graph.edges.every((e) => nodeIds.has(e.from) && nodeIds.has(e.to))).toBe(true);
    expect(sample.graph.connectors.every((c) => c.stops.length >= 2)).toBe(true);
    expect(sample.venue.defaultBuildingId).toBe(sample.buildings[0]?.id);
    const errors = validateVenue(sample, CONTEXT).filter((f) => f.severity === 'error');
    expect(errors.map((e) => e.message)).toEqual([]);
    expect(() => buildSnapshot(sample)).not.toThrow();
  });

  it('tidak membawa berkas milik venue demo', () => {
    expect(sample.venue.logoPath).toBeNull();
    expect(sample.locations.every((l) => l.logoPath === null && l.photoPaths.length === 0)).toBe(
      true,
    );
    expect(
      sample.facilityTypes.every((t) => t.icon === null || t.icon.startsWith('builtin:')),
    ).toBe(true);
  });
});

describe('trialSample', () => {
  it('lantai berisi fitur melebihi batas ditolak (venue demo harus diperkecil)', () => {
    expect(() => trialSample(mallVenue(), { ...TRIAL_SAMPLE_LIMITS, featuresPerFloor: 5 })).toThrow(
      /melebihi batas trial/,
    );
  });
});

describe('slugFromName', () => {
  it.each([
    ['RS Harapan Sehat', 'rs-harapan-sehat'],
    ['Mal Ciputra — Jakarta Barat', 'mal-ciputra-jakarta-barat'],
    ['Universitas Pelita Harapan (UPH)', 'universitas-pelita-harapan-uph'],
    ['Café Señor', 'cafe-senor'],
    ['A', 'trial'],
    ['Demo', 'trial-demo'],
    ['Demo Expo Center', 'trial-demo-expo-center'],
  ])('%s → %s', (name, slug) => {
    expect(slugFromName(name)).toBe(slug);
    expect(VenueSlugSchema.safeParse(slugFromName(name)).success).toBe(true);
  });

  it('dipotong 50 karakter tanpa tanda hubung di ujung', () => {
    const slug = slugFromName(`${'Rumah Sakit Umum Daerah '.repeat(4)}Kabupaten`);
    expect(slug.length).toBeLessThanOrEqual(50);
    expect(slug.endsWith('-')).toBe(false);
  });
});
