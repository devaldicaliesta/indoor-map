import {
  type CategoryId,
  EMPTY_OPENING_HOURS,
  type FeatureId,
  type LocationId,
  type LocationTypeId,
  openingHoursFromRows,
  type VenueId,
} from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { mapCategoryRow } from '../src/repositories/categories';
import {
  createLocationsRepository,
  hoursToRows,
  type LocationRow,
  mapLocationRow,
  mapVenueUnitRow,
  toSaveLocationArgs,
} from '../src/repositories/locations';
import type { Db } from '../src/supabase';

const VENUE = '10000000-0000-4000-8000-000000000001';
const TYPE = '20000000-0000-4000-8000-000000000001';
const LOCATION = '30000000-0000-4000-8000-000000000001';
const UNIT_1 = '40000000-0000-4000-8000-000000000001';
const UNIT_2 = '40000000-0000-4000-8000-000000000002';
const FLOOR = '50000000-0000-4000-8000-000000000001';
const OUTDOOR = '50000000-0000-4000-8000-000000000002';
const BUILDING = '60000000-0000-4000-8000-000000000001';
const CATEGORY = '70000000-0000-4000-8000-000000000001';

const row: LocationRow = {
  id: LOCATION,
  venue_id: VENUE,
  location_type_id: TYPE,
  code: 'RAD-01',
  name: 'Radiologi',
  description: null,
  logo_path: 'locations/v/logo.png',
  photo_paths: [],
  status: 'active',
  custom_fields: { telepon: '021-555', lantai: 2, rusak: { x: 1 } },
  opening_date: null,
  opening_hours: [
    {
      weekday: 1,
      special_date: null,
      opens_at: '08:00:00',
      closes_at: '16:00:00',
      is_closed: false,
    },
    { weekday: null, special_date: '2026-08-17', opens_at: null, closes_at: null, is_closed: true },
  ],
  location_categories: [{ category_id: CATEGORY }],
  location_units: [
    {
      feature_id: UNIT_1,
      is_primary: true,
      features: {
        unit_code: 'GU-L1-001',
        floor_id: FLOOR,
        floors: { name: 'L1', building_id: BUILDING, buildings: { name: 'Gedung Utama' } },
      },
    },
    {
      feature_id: UNIT_2,
      is_primary: false,
      features: {
        unit_code: 'LUAR-001',
        floor_id: OUTDOOR,
        floors: { name: 'Area Luar', building_id: null, buildings: null },
      },
    },
  ],
};

describe('lokasi', () => {
  it('baris lokasi beserta kategori dan unit (gedung/lantai) menjadi tipe domain', () => {
    expect(mapLocationRow(row)).toEqual({
      id: LOCATION,
      venueId: VENUE,
      locationTypeId: TYPE,
      code: 'RAD-01',
      name: 'Radiologi',
      // Isi jsonb yang bentuknya tidak dikenal (objek) dibuang.
      customFields: { telepon: '021-555', lantai: 2 },
      openingDate: null,
      hours: {
        weekly: [[{ opens: '08:00', closes: '16:00' }], [], [], [], [], [], []],
        special: { '2026-08-17': [] },
      },
      description: null,
      logoPath: 'locations/v/logo.png',
      photoPaths: [],
      status: 'active',
      categoryIds: [CATEGORY],
      units: [
        {
          featureId: UNIT_1,
          unitCode: 'GU-L1-001',
          floorId: FLOOR,
          floorName: 'L1',
          buildingId: BUILDING,
          buildingName: 'Gedung Utama',
          isPrimary: true,
        },
        {
          featureId: UNIT_2,
          unitCode: 'LUAR-001',
          floorId: OUTDOOR,
          floorName: 'Area Luar',
          buildingId: null,
          buildingName: null,
          isPrimary: false,
        },
      ],
    });
  });

  it('argumen save_location: isian kosong tidak dikirim, unit utama harus salah satu unit', () => {
    const input = {
      code: '  ',
      name: ' Radiologi ',
      description: '',
      categoryIds: [CATEGORY as CategoryId],
      unitIds: [UNIT_1 as FeatureId, UNIT_2 as FeatureId],
      primaryUnitId: UNIT_2 as FeatureId,
      customFields: { telepon: '021-555' },
      status: 'coming_soon' as const,
      openingDate: '2026-11-01',
      hours: EMPTY_OPENING_HOURS,
    };
    const args = toSaveLocationArgs(
      LOCATION as LocationId,
      VENUE as VenueId,
      TYPE as LocationTypeId,
      input,
      { logoPath: null, photoPaths: ['locations/v/a.jpg'] },
    );
    expect(args).toEqual({
      p_id: LOCATION,
      p_venue_id: VENUE,
      p_location_type_id: TYPE,
      p_name: 'Radiologi',
      p_category_ids: [CATEGORY],
      p_unit_ids: [UNIT_1, UNIT_2],
      p_photo_paths: ['locations/v/a.jpg'],
      p_primary_unit_id: UNIT_2,
      p_custom_fields: { telepon: '021-555' },
      p_status: 'coming_soon',
      p_opening_date: '2026-11-01',
      p_hours: [],
    });
    const other = toSaveLocationArgs(
      LOCATION as LocationId,
      VENUE as VenueId,
      TYPE as LocationTypeId,
      { ...input, code: 'rad-01', description: 'Lantai 1', unitIds: [UNIT_1 as FeatureId] },
      { logoPath: 'locations/v/logo.png', photoPaths: [] },
    );
    expect(other).toMatchObject({
      p_code: 'rad-01',
      p_description: 'Lantai 1',
      p_logo_path: 'locations/v/logo.png',
    });
    expect(other).not.toHaveProperty('p_primary_unit_id');
  });

  it('unit venue: hanya lokasi yang bukan nonaktif permanen yang memakai unit', () => {
    const unit = mapVenueUnitRow({
      id: UNIT_1,
      unit_code: 'GU-L1-001',
      unit_status: 'vacant',
      floor_id: FLOOR,
      floors: { name: 'L1', level: 1, building_id: BUILDING, buildings: { name: 'Gedung Utama' } },
      location_units: [
        { location_id: LOCATION, locations: { name: 'Radiologi', status: 'active' } },
        {
          location_id: '30000000-0000-4000-8000-000000000002',
          locations: { name: 'Apotek Lama', status: 'inactive_permanent' },
        },
      ],
    });
    expect(unit).toMatchObject({
      unitCode: 'GU-L1-001',
      unitStatus: 'vacant',
      floorLevel: 1,
      buildingName: 'Gedung Utama',
      holders: [{ locationId: LOCATION, name: 'Radiologi' }],
    });
  });

  it('baris kategori menjadi tipe domain dengan ikon terurai', () => {
    expect(
      mapCategoryRow({
        id: CATEGORY,
        location_type_id: TYPE,
        name: 'Anak',
        icon: 'builtin:first-aid',
        sort_order: 2,
      }),
    ).toEqual({
      id: CATEGORY,
      locationTypeId: TYPE,
      name: 'Anak',
      icon: { kind: 'builtin', key: 'first-aid' },
      sortOrder: 2,
    });
  });
});

describe('jam operasional', () => {
  it('jadwal → baris save_location → jadwal lagi (tanggal khusus tanpa rentang = tutup)', () => {
    const hours = {
      weekly: [
        [
          { opens: '08:00', closes: '12:00' },
          { opens: '13:00', closes: '16:00' },
        ],
        [],
        [],
        [],
        [],
        [{ opens: '20:00', closes: '02:00' }],
        [],
      ],
      special: { '2026-08-17': [], '2026-12-24': [{ opens: '08:00', closes: '12:00' }] },
    };
    const rows = hoursToRows(hours);
    expect(rows).toContainEqual({
      weekday: null,
      special_date: '2026-08-17',
      opens_at: null,
      closes_at: null,
      is_closed: true,
    });
    expect(openingHoursFromRows(rows)).toEqual(hours);
  });
});

describe('import lokasi', () => {
  it('ditulis per batch 200 baris; kemajuan dilaporkan setelah setiap batch', async () => {
    const sizes: number[] = [];
    const db = {
      rpc: async (_name: string, args: { p_rows: unknown[] }) => {
        sizes.push(args.p_rows.length);
        return { data: args.p_rows.length, error: null };
      },
    } as unknown as Db;
    const write = {
      id: null,
      code: null,
      name: 'A',
      description: '',
      status: 'active' as const,
      openingDate: null,
      categoryIds: [],
      unitIds: [],
      customFields: {},
    };
    const progress: number[] = [];
    const saved = await createLocationsRepository(db).importRows(
      VENUE as VenueId,
      TYPE as LocationTypeId,
      Array.from({ length: 450 }, () => write),
      (n) => progress.push(n),
    );
    expect(sizes).toEqual([200, 200, 50]);
    expect(progress).toEqual([200, 400, 450]);
    expect(saved).toBe(450);
  });
});
