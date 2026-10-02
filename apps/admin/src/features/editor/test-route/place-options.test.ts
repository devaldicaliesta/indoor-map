import type { FloorFeature } from '@indoor/data';
import type {
  Building,
  BuildingId,
  FacilityType,
  FacilityTypeId,
  FeatureId,
  Floor,
  FloorId,
  Location,
  LocationId,
  VenueId,
} from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { floorText, placeName, placeOptions, searchPlaces } from './place-options';

const venueId = 'v' as VenueId;
const gu = { id: 'gu' as BuildingId, name: 'Gedung Utama' } as Building;
const floor = (id: string, name: string, buildingId: BuildingId | null): Floor => ({
  id: id as FloorId,
  venueId,
  buildingId,
  isOutdoor: buildingId === null,
  name,
  level: 0,
  heightM: 4,
  sortOrder: 0,
  featureCount: 0,
});
const floors = [floor('gf', 'GF', gu.id), floor('out', 'Area Luar', null)];
const square = {
  type: 'Polygon' as const,
  coordinates: [
    [
      [106.8, -6.1],
      [106.8001, -6.1],
      [106.8001, -6.1001],
      [106.8, -6.1],
    ] as [number, number][],
  ],
};
const feature = (properties: FloorFeature['properties']): FloorFeature => ({
  type: 'Feature',
  geometry: properties.kind === 'unit' ? square : { type: 'Point', coordinates: [106.8, -6.1] },
  properties,
});
const toilet = { id: 't' as FacilityTypeId, name: 'Toilet' } as FacilityType;
const radiology = {
  id: 'rad' as LocationId,
  name: 'Radiologi',
  code: 'RAD-01',
  status: 'active',
  units: [
    {
      featureId: 'u1' as FeatureId,
      unitCode: 'GF-A01',
      floorId: 'gf' as FloorId,
      floorName: 'GF',
      buildingId: gu.id,
      buildingName: gu.name,
      isPrimary: true,
    },
  ],
} as Location;

const options = placeOptions({
  floors,
  buildings: [gu],
  features: [
    feature({ id: 'u1', kind: 'unit', floorId: 'gf', unitCode: 'GF-A01' }),
    feature({ id: 'u2', kind: 'unit', floorId: 'gf', unitCode: 'GF-A02' }),
    feature({ id: 'f1', kind: 'facility', floorId: 'gf', facilityTypeId: 't' }),
    feature({ id: 'c1', kind: 'corridor', floorId: 'gf' }),
  ],
  facilityTypes: [toilet],
  locations: [radiology, { ...radiology, id: 'old' as LocationId, status: 'inactive_permanent' }],
  originPoints: [
    {
      id: 'o',
      floorId: 'out',
      name: 'Gerbang Parkir',
      coordinates: [106.8, -6.1],
      headingDeg: 0,
      nodeId: null,
      code: 'abc123',
    },
  ],
  infoPoints: [
    {
      id: 'i',
      code: 'IP-LOBI',
      name: 'Info Lobi',
      floorId: 'gf',
      coordinates: [106.8, -6.1],
      headingDeg: 0,
      nodeId: null,
    },
  ],
});

describe('pilihan asal/tujuan uji rute', () => {
  it('lokasi, unit, fasilitas, QR titik asal, dan Info Point; selain itu tidak', () => {
    expect(options.map((o) => [o.kind, o.label, o.detail])).toEqual([
      ['location', 'Radiologi', 'Lokasi RAD-01 · GF-A01 · Gedung Utama · GF'],
      ['unit', 'GF-A01', 'Unit · Gedung Utama · GF'],
      ['unit', 'GF-A02', 'Unit · Gedung Utama · GF'],
      ['facility', 'Toilet', 'Toilet · Gedung Utama · GF'],
      ['origin_point', 'Gerbang Parkir', 'QR titik asal · Area Luar'],
      ['info_point', 'Info Lobi', 'Info Point IP-LOBI · Gedung Utama · GF'],
    ]);
    expect(options.find((o) => o.kind === 'unit')?.mono).toBe(true);
  });

  it('pencarian per kata di nama, kode, jenis, dan tempat; nama yang cocok didahulukan', () => {
    expect(searchPlaces(options, 'gf-a01').map((o) => o.label)).toEqual(['GF-A01', 'Radiologi']);
    expect(searchPlaces(options, 'rad-01').map((o) => o.label)).toEqual(['Radiologi']);
    expect(searchPlaces(options, 'toilet gedung').map((o) => o.label)).toEqual(['Toilet']);
    expect(searchPlaces(options, 'luar').map((o) => o.kind)).toEqual(['origin_point']);
    expect(searchPlaces(options, '  ')).toEqual([]);
    expect(searchPlaces(options, 'gf', 2)).toHaveLength(2);
  });

  it('nama tempat untuk teks instruksi; titik di peta mengikuti bahasa', () => {
    const byKey = new Map(options.map((o) => [o.key, o]));
    expect(placeName({ kind: 'location', locationId: 'rad' }, byKey, 'en')).toBe('Radiologi');
    const point = { kind: 'point', lng: 106.8, lat: -6.1, floorId: 'gf' } as const;
    expect(placeName(point, byKey, 'id')).toBe('titik yang dipilih');
    expect(placeName(point, byKey, 'en')).toBe('the selected point');
  });

  it('nama lantai menyebut gedungnya; Area Luar cukup namanya', () => {
    expect(floorText('gf', floors, [gu])).toBe('Gedung Utama · GF');
    expect(floorText('out', floors, [gu])).toBe('Area Luar');
  });
});
