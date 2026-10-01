import { describe, expect, it } from 'vitest';
import {
  type FeatureKind,
  type Geometry,
  issuesByFeature,
  type Polygon,
  type ValidatedFeature,
  validateFloorGeometry,
} from '../../src';
import fixture from '../fixtures/validation-floor.json';
import sample from '../fixtures/venue-sample.json';

type FixtureFeature = { geometry: unknown; properties: { id: string; kind: string } };
const toValidated = (f: FixtureFeature) => f as unknown as ValidatedFeature;
const features = fixture.features.features.map(toValidated);
const boundary = fixture.boundary as Polygon;
const issues = validateFloorGeometry(features, { boundary });
const byCode = (code: string) => issues.filter((i) => i.code === code);

describe('validateFloorGeometry: fixture setiap kasus (FR-MAP-09)', () => {
  it('poligon tidak tertutup', () => {
    expect(byCode('polygon_not_closed')).toEqual([
      expect.objectContaining({ severity: 'error', featureIds: ['area-open'] }),
    ]);
    expect(byCode('polygon_not_closed')[0]?.message).toBe(
      'Poligon tanpa nama tidak tertutup: poligon butuh minimal 3 titik dan titik akhir sama dengan titik awal.',
    );
  });

  it('poligon memotong diri', () => {
    expect(byCode('polygon_self_intersection').map((i) => i.featureIds)).toEqual([
      ['corridor-bowtie'],
    ]);
  });

  it('unit tumpang tindih > 0,5 m²; bersebelahan, 0,4 m², dan ceruk unit cekung tidak dihitung', () => {
    const overlaps = byCode('unit_overlap');
    expect(overlaps.map((i) => [...i.featureIds].sort())).toEqual([['unit-b', 'unit-c']]);
    expect(overlaps[0]?.message).toBe(
      'Unit GU-GF-002 dan Unit GU-GF-003 tumpang tindih 20 m². Rapikan batas salah satunya.',
    );
  });

  it('fitur di luar batas lantai: unit, garis, dan titik; tepi footprint masih di dalam', () => {
    const outside = byCode('outside_floor');
    expect(outside.map((i) => i.featureIds[0]).sort()).toEqual([
      'facility-out',
      'unit-i',
      'unit-j',
      'wall-out',
    ]);
    expect(outside.find((i) => i.featureIds[0] === 'unit-j')?.message).toBe(
      'Unit GU-GF-010 berada di luar batas gedung (16 m² di luar). Pindahkan ke dalam footprint atau perbarui footprint gedung di menu Venue.',
    );
    expect(outside.find((i) => i.featureIds[0] === 'facility-out')?.message).toContain(
      '“ATM luar” berada di luar batas gedung.',
    );
  });

  it('kode unit ganda tanpa membedakan huruf besar/kecil', () => {
    expect(byCode('duplicate_unit_code')).toEqual([
      {
        code: 'duplicate_unit_code',
        severity: 'error',
        featureIds: ['unit-a', 'unit-h'],
        message: 'Kode unit GU-GF-001 dipakai 2 unit. Kode unit harus unik di satu venue.',
      },
    ]);
  });

  it('tidak ada temuan lain; semua pesan Bahasa Indonesia', () => {
    expect(issues).toHaveLength(8);
    const flagged = issuesByFeature(issues);
    for (const clean of [
      'unit-d',
      'unit-e',
      'unit-f',
      'unit-g',
      'unit-k',
      'wall-edge',
      'door-edge',
    ])
      expect(flagged.has(clean)).toBe(false);
    expect(flagged.get('unit-a')?.map((i) => i.code)).toEqual(['duplicate_unit_code']);
  });

  it('tanpa batas lantai (Area Luar, footprint kosong) pemeriksaan "di luar" dilewati', () => {
    const noBoundary = validateFloorGeometry(features, { boundary: null });
    expect(noBoundary.some((i) => i.code === 'outside_floor')).toBe(false);
    expect(noBoundary).toHaveLength(4);
  });

  it('lantai kosong tidak punya temuan', () => {
    expect(validateFloorGeometry([], { boundary })).toEqual([]);
  });
});

describe('validateFloorGeometry: kasus tambahan', () => {
  const square = (x: number, size: number): Geometry => ({
    type: 'Polygon',
    coordinates: [
      [
        [106.8 + x, -6.1],
        [106.8 + x + size, -6.1],
        [106.8 + x + size, -6.1 + size],
        [106.8 + x, -6.1 + size],
        [106.8 + x, -6.1],
      ],
    ],
  });
  const feature = (id: string, kind: FeatureKind, geometry: Geometry): ValidatedFeature => ({
    geometry,
    properties: kind === 'unit' ? { id, kind, unitCode: id } : { id, kind },
  });

  it('unit berlubang: unit lain di dalam lubangnya tidak tumpang tindih', () => {
    const outer = square(0, 0.0002).coordinates as unknown as number[][][];
    const hole = (square(0.00005, 0.0001) as { coordinates: number[][][] }).coordinates[0];
    const ring: Geometry = {
      type: 'Polygon',
      coordinates: [outer[0] as [number, number][], [...(hole as [number, number][])].reverse()],
    };
    const inside = feature('U-2', 'unit', square(0.00006, 0.00008));
    expect(
      validateFloorGeometry([feature('U-1', 'unit', ring), inside], { boundary: null }),
    ).toEqual([]);
    const across = feature('U-3', 'unit', square(0.00003, 0.00005));
    expect(
      validateFloorGeometry([feature('U-1', 'unit', ring), across], { boundary: null }).map(
        (i) => i.code,
      ),
    ).toEqual(['unit_overlap']);
  });

  it('koridor dan lift yang menimpa unit tidak dilaporkan (hanya antar-unit)', () => {
    expect(
      validateFloorGeometry(
        [feature('U-1', 'unit', square(0, 0.0001)), feature('c', 'corridor', square(0, 0.0001))],
        { boundary: null },
      ),
    ).toEqual([]);
  });

  it('fixture venue contoh tidak punya unit tumpang tindih atau kode ganda', () => {
    const all = sample.features.features as unknown as (ValidatedFeature & {
      properties: { floorId: string };
    })[];
    for (const floor of sample.floors) {
      const onFloor = all.filter((f) => f.properties.floorId === floor.id);
      expect(validateFloorGeometry(onFloor, { boundary: null })).toEqual([]);
    }
  });

  it('1.000 unit dalam kisi divalidasi cepat', () => {
    const grid = Array.from({ length: 1000 }, (_, i) =>
      feature(`G-${i}`, 'unit', {
        type: 'Polygon',
        coordinates: [
          (() => {
            const x = 106.8 + (i % 40) * 0.00003;
            const y = -6.1 + Math.floor(i / 40) * 0.00003;
            return [
              [x, y],
              [x + 0.00003, y],
              [x + 0.00003, y + 0.00003],
              [x, y + 0.00003],
              [x, y],
            ] as [number, number][];
          })(),
        ],
      }),
    );
    const started = Date.now();
    expect(validateFloorGeometry(grid, { boundary: null })).toEqual([]);
    expect(Date.now() - started).toBeLessThan(500);
  });
});
