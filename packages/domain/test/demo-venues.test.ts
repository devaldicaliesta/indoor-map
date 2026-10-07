import { describe, expect, it } from 'vitest';
import { buildSnapshot, validateVenue } from '../src';
import {
  airportVenue,
  campusVenue,
  concertVenue,
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
  konser: concertVenue,
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

describe('ukuran dan bentuk', () => {
  const count = (s: ReturnType<typeof mallVenue>) =>
    s.features.filter((f) => f.kind === 'unit').length;
  const footprintCorners = (s: ReturnType<typeof mallVenue>) =>
    (s.buildings[0]?.footprint?.coordinates[0]?.length ?? 1) - 1;

  it('jumlah unit per venue', () => {
    expect(count(mallVenue())).toBe(210);
    expect(count(hospitalVenue())).toBe(154);
    expect(count(officeVenue())).toBe(105);
    expect(count(concertVenue())).toBe(99);
    const campus = campusVenue();
    expect(campus.buildings).toHaveLength(2);
    expect(campus.features.some((f) => f.kind === 'outdoor_area')).toBe(true);
  });

  it('mal, rumah sakit, dan stadion konser tidak lagi berupa persegi panjang', () => {
    expect(footprintCorners(mallVenue())).toBe(24);
    expect(footprintCorners(hospitalVenue())).toBe(8);
    expect(footprintCorners(concertVenue())).toBeGreaterThan(40);
  });

  it('konser punya panggung, zona festival, tribun dua lantai, dan gerbang ke Area Luar', () => {
    const concert = concertVenue();
    const names = new Set(concert.locations.map((l) => l.name));
    for (const name of [
      'Panggung Utama',
      'Moshpit',
      'Festival B',
      'Area Disabilitas',
      'Tribun 1',
    ]) {
      expect(names.has(name)).toBe(true);
    }
    expect([...names].some((n) => n.startsWith('Tribun Atas'))).toBe(true);
    const doors = concert.graph.connectors.filter((c) => c.kind === 'building_door');
    expect(doors).toHaveLength(4);
  });
});
