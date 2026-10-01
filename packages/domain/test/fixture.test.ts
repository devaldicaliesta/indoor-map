import { describe, expect, it } from 'vitest';
import { FeatureKindSchema, GeometrySchema } from '../src';
import sample from './fixtures/venue-sample.json';

describe('fixture venue-sample.json', () => {
  const features = sample.features.features;

  it('sesuai 06-alur-kerja: 2 gedung, 3 lantai di gedung utama, ≥ 20 unit', () => {
    expect(sample.buildings).toHaveLength(2);
    const main = sample.buildings[0]?.id;
    expect(sample.floors.filter((f) => f.buildingId === main)).toHaveLength(3);
    expect(features.filter((f) => f.properties.kind === 'unit').length).toBeGreaterThanOrEqual(20);
  });

  it('lift tidak melayani semua lantai; ada eskalator naik dan turun serta tangga', () => {
    const floorsWith = (name: string) =>
      new Set(features.filter((f) => f.properties.name === name).map((f) => f.properties.floorId));
    expect(floorsWith('Lift 1').size).toBe(2);
    expect(floorsWith('Eskalator naik').size).toBeGreaterThan(0);
    expect(floorsWith('Eskalator turun').size).toBeGreaterThan(0);
    expect(floorsWith('Tangga Barat').size).toBe(3);
  });

  it('setiap fitur punya jenis dan geometri WGS84 yang valid', () => {
    for (const feature of features) {
      expect(FeatureKindSchema.safeParse(feature.properties.kind).success).toBe(true);
      expect(GeometrySchema.safeParse(feature.geometry).success).toBe(true);
    }
  });
});
