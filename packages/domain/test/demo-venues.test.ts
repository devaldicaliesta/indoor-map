import { describe, expect, it } from 'vitest';
import { buildSnapshot, validateVenue } from '../src';
import {
  airportVenue,
  campusVenue,
  factoryVenue,
  hospitalVenue,
  mallVenue,
  officeVenue,
} from './fixtures/demo-venues';

const VENUES = {
  mal: mallVenue,
  'rumah sakit': hospitalVenue,
  kampus: campusVenue,
  perkantoran: officeVenue,
  bandara: airportVenue,
  pabrik: factoryVenue,
};
const CONTEXT = { today: '2026-10-03', floorPlans: [] };

describe.each(Object.entries(VENUES))('venue demo %s', (_, make) => {
  const source = make();

  it('lolos validasi publish tanpa Error', () => {
    const errors = validateVenue(source, CONTEXT).filter((f) => f.severity === 'error');
    expect(errors.map((e) => e.message)).toEqual([]);
  });

  it('cukup besar dan terbit menjadi snapshot', () => {
    const units = source.features.filter((f) => f.kind === 'unit').length;
    expect(units).toBeGreaterThanOrEqual(80);
    expect(source.locations.length).toBeGreaterThanOrEqual(70);
    expect(source.categories.length).toBeGreaterThanOrEqual(8);
    const snapshot = buildSnapshot(source);
    expect(snapshot.graph.connectors.length).toBeGreaterThan(0);
  });

  it('id stabil antar pemanggilan', () => {
    expect(make().features.map((f) => f.id)).toEqual(source.features.map((f) => f.id));
  });
});

describe('ukuran', () => {
  it('mal ±150 unit, rumah sakit ±110, kampus dua gedung dengan Area Luar', () => {
    const count = (s: ReturnType<typeof mallVenue>) =>
      s.features.filter((f) => f.kind === 'unit').length;
    expect(count(mallVenue())).toBe(150);
    expect(count(hospitalVenue())).toBe(112);
    const campus = campusVenue();
    expect(campus.buildings).toHaveLength(2);
    expect(campus.features.some((f) => f.kind === 'outdoor_area')).toBe(true);
  });
});
