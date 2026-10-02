import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  buildSnapshot,
  type ConnectorKind,
  type DisplayMode,
  type EscalatorDirection,
  type FeatureKind,
  INSTRUCTION_ACTIONS,
  type LanguageCode,
  type LocationStatus,
  type NavNodeRole,
  type OutdoorSubtype,
  parseSnapshot,
  type SnapshotConnectorKind,
  type SnapshotDisplayMode,
  type SnapshotEscalatorDirection,
  type SnapshotFeatureKind,
  type SnapshotLanguage,
  type SnapshotLocationStatus,
  type SnapshotNodeRole,
  type SnapshotOutdoorSubtype,
  SnapshotSchema,
  type SnapshotSource,
  type SnapshotUnitStatus,
  type UnitStatus,
} from '../src';
import { IDS, RADIOLOGY_UNITS, sampleSnapshotSource } from './fixtures/snapshot-source';

const entryOf = (source: SnapshotSource, id: string) =>
  buildSnapshot(source).searchIndex.find((e) => e.id === id);

/** Semua kunci objek di dalam nilai JSON, termasuk yang bersarang. */
function keysOf(value: unknown, keys = new Set<string>()): Set<string> {
  if (Array.isArray(value)) for (const item of value) keysOf(item, keys);
  else if (typeof value === 'object' && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      keys.add(key);
      keysOf(child, keys);
    }
  }
  return keys;
}

describe('buildSnapshot', () => {
  it('snapshot venue contoh valid terhadap skema zod-nya tanpa kehilangan field', () => {
    const snapshot = buildSnapshot(sampleSnapshotSource());
    expect(SnapshotSchema.safeParse(snapshot).success).toBe(true);
    // Skema membuang anggota yang tidak dikenal; hasil parse yang sama berarti skema lengkap.
    expect(parseSnapshot(JSON.parse(JSON.stringify(snapshot)))).toEqual(snapshot);
    expect(snapshot.features.features).toHaveLength(127);
  });

  it('tidak berisi email, pengaturan server, atau data pribadi', () => {
    const source = sampleSnapshotSource();
    const venue = {
      ...source.venue,
      address: 'Jl. Kenari 9, Jakarta',
      createdBy: '5a1c0de0-0000-4000-8000-000000000001',
      contactEmail: 'pengelola@rs.test',
    };
    const infoPoints = source.infoPoints.map((p) => ({
      ...p,
      lastHeartbeatAt: '2026-09-30T05:59:00Z',
      loadedVersion: 2,
    }));
    const features = source.features.map((f) => ({
      ...f,
      createdBy: '5a1c0de0-0000-4000-8000-000000000001',
      updatedBy: '5a1c0de0-0000-4000-8000-000000000002',
      areaM2: 42,
    }));
    const leaky = {
      ...source,
      venue,
      infoPoints,
      features,
      smtpHost: 'smtp.rs.test',
      smtpUsername: 'mailer@rs.test',
      publishedBy: '5a1c0de0-0000-4000-8000-000000000003',
    };

    const json = JSON.stringify(buildSnapshot(leaky));
    for (const secret of [
      'pengelola@rs.test',
      'mailer@rs.test',
      'smtp.rs.test',
      'Jl. Kenari',
      '5a1c0de0-',
      '0812-0000-1111',
    ]) {
      expect(json).not.toContain(secret);
    }
    const keys = keysOf(JSON.parse(json));
    for (const key of [
      'email',
      'contactEmail',
      'address',
      'createdBy',
      'updatedBy',
      'publishedBy',
      'lastHeartbeatAt',
      'loadedVersion',
      'areaM2',
      'staff_phone',
    ]) {
      expect(keys.has(key)).toBe(false);
    }
  });

  it('lokasi nonaktif permanen tidak ikut; field kustom hanya yang ditandai tampil', () => {
    const snapshot = buildSnapshot(sampleSnapshotSource());
    const ids = snapshot.locations.map((l) => l.id);
    expect(ids).not.toContain(IDS.closedPharmacy);
    expect(snapshot.searchIndex.some((e) => e.id === IDS.closedPharmacy)).toBe(false);
    expect(snapshot.locations.find((l) => l.id === IDS.radiology)?.fields).toEqual({
      extension: '1203',
    });
    expect(snapshot.locationTypes[0]?.fields.map((f) => f.key)).toEqual(['extension']);
  });

  it('field tersembunyi tidak masuk indeks pencarian walau ditandai dapat dicari', () => {
    const source = sampleSnapshotSource();
    const hidden = source.locationTypes[0]?.fields.find((f) => f.key === 'staff_phone');
    if (hidden) hidden.isSearchable = true;
    const text = JSON.stringify(entryOf(source, IDS.radiology));
    expect(text).not.toContain('0812');
    expect(text).toContain('1203');
  });

  it('koordinat dibulatkan 7 desimal dan anggota selain type/coordinates dibuang', () => {
    const source = sampleSnapshotSource();
    const [first] = source.features;
    const geometry = {
      type: 'Point' as const,
      coordinates: [106.827123456789, -6.175987654321] as [number, number],
      crs: { type: 'name', properties: { name: 'EPSG:4326' } },
    };
    const snapshot = buildSnapshot({
      ...source,
      features: first ? [{ ...first, kind: 'door', geometry }] : [],
    });
    expect(snapshot.features.features[0]?.geometry).toEqual({
      type: 'Point',
      coordinates: [106.8271235, -6.1759877],
    });
    expect(snapshot.originPoints[0]?.coordinates).toEqual([106.8268, -6.1752809]);
  });

  it('properti fitur hanya yang dipakai Visitor dan sesuai jenisnya', () => {
    const source = sampleSnapshotSource();
    const snapshot = buildSnapshot(source);
    const unit = snapshot.features.features.find((f) => f.properties.kind === 'unit');
    expect(Object.keys(unit?.properties ?? {}).sort()).toEqual([
      'floorId',
      'id',
      'kind',
      'name',
      'unitCode',
      'unitStatus',
    ]);
    const door = snapshot.features.features.find((f) => f.properties.kind === 'door');
    expect(Object.keys(door?.properties ?? {}).sort()).toEqual(['floorId', 'id', 'kind']);
    const facility = snapshot.features.features.find((f) => f.properties.kind === 'facility');
    expect(facility?.properties.facilityTypeId).toBe(IDS.toiletType);
  });

  it('indeks pencarian dinormalisasi dan mencakup nama, kode, kode unit, alias, field yang dapat dicari', () => {
    const source = sampleSnapshotSource();
    const radiology = entryOf(source, IDS.radiology);
    expect(radiology?.kind).toBe('location');
    const unitCodes = source.features
      .filter((f) => RADIOLOGY_UNITS.includes(f.id))
      .map((f) => f.unitCode?.toLowerCase());
    for (const term of ['radiologi', 'rad-01', 'rontgen', '1203', ...unitCodes]) {
      expect(radiology?.text).toContain(term);
    }
    expect(radiology?.text).not.toContain('0812');
    expect(entryOf(source, IDS.waitingRoom)?.text).toBe('ruang tunggu umum');
    expect(entryOf(source, IDS.examCategory)).toEqual({
      kind: 'category',
      id: IDS.examCategory,
      text: 'pemeriksaan periksa',
    });
    expect(entryOf(source, IDS.toiletType)?.text).toBe('toilet wc');
    const unitEntries = buildSnapshot(source).searchIndex.filter((e) => e.kind === 'unit');
    expect(unitEntries).toHaveLength(source.features.filter((f) => f.kind === 'unit').length);
  });

  it('urutan stabil: gedung per sortOrder, Area Luar lalu lantai per gedung dari yang terendah', () => {
    const source = sampleSnapshotSource();
    const snapshot = buildSnapshot(source);
    expect(snapshot.buildings.map((b) => b.code)).toEqual(['GU', 'GT']);
    expect(snapshot.floors.map((f) => `${f.isOutdoor ? 'luar' : f.name}`)).toEqual([
      'luar',
      'GF',
      'L1',
      'L2',
      'GF',
    ]);
    expect(snapshot.facilityTypes.map((t) => t.name)).toEqual(['APAR', 'Toilet']);
    expect(snapshot.locations.map((l) => l.name)).toEqual([
      'Laboratorium',
      'Radiologi',
      'Ruang Tunggu Ümum',
    ]);
    const shuffled = { ...source, features: [...source.features].reverse() };
    expect(JSON.stringify(buildSnapshot(shuffled))).toBe(JSON.stringify(snapshot));
  });

  it('pengaturan tampilan dibersihkan; tanpa pengaturan memakai 2D dan kamera kosong', () => {
    const source = sampleSnapshotSource();
    const messy = {
      ...source,
      display: {
        defaultMode: '3d',
        heights: { unit: 4, wall: -1, stairs: 'tinggi', unknown_kind: 3 },
        colors: { unit: '#D9DCD4', wall: 'red' },
        camera: { center: [106.82712345678, -6.1753], zoom: 18, pitch: 30, bearing: 0 },
      },
    };
    const venue = buildSnapshot(messy).venue;
    expect(venue.display).toEqual({
      defaultMode: '3d',
      heights: { unit: 4 },
      colors: { unit: '#D9DCD4' },
    });
    expect(venue.camera?.center).toEqual([106.8271235, -6.1753]);
    expect(venue.defaultLanguage).toBe('id');

    const bare = buildSnapshot({ ...source, display: null }).venue;
    expect(bare.display).toEqual({ defaultMode: '2d', heights: {}, colors: {} });
    expect(bare.camera).toBeNull();
  });

  it('template instruksi lengkap untuk semua aksi dan fitur lisensi unik', () => {
    const snapshot = buildSnapshot({
      ...sampleSnapshotSource(),
      enabledFeatures: ['info_point', '3d', 'info_point'],
    });
    expect(Object.keys(snapshot.instructionTemplates)).toEqual([...INSTRUCTION_ACTIONS]);
    expect(snapshot.instructionTemplates.start).toEqual({
      id: 'Mulai dari {origin}',
      en: 'Start at {origin}',
    });
    expect(snapshot.instructionTemplates.turn_left).toEqual({ id: '', en: '' });
    expect(snapshot.enabledFeatures).toEqual(['3d', 'info_point']);
  });

  it('versi skema ditolak bila bukan 1', () => {
    const snapshot = { ...buildSnapshot(sampleSnapshotSource()), schemaVersion: 2 };
    expect(SnapshotSchema.safeParse(snapshot).success).toBe(false);
  });
});

describe('tipe snapshot sama dengan enum domain', () => {
  it('perubahan enum internal harus disengaja di format publik', () => {
    expectTypeOf<SnapshotFeatureKind>().toEqualTypeOf<FeatureKind>();
    expectTypeOf<SnapshotUnitStatus>().toEqualTypeOf<UnitStatus>();
    expectTypeOf<SnapshotOutdoorSubtype>().toEqualTypeOf<OutdoorSubtype>();
    expectTypeOf<SnapshotLanguage>().toEqualTypeOf<LanguageCode>();
    expectTypeOf<SnapshotDisplayMode>().toEqualTypeOf<DisplayMode>();
    expectTypeOf<SnapshotLocationStatus>().toEqualTypeOf<
      Exclude<LocationStatus, 'inactive_permanent'>
    >();
    expectTypeOf<SnapshotConnectorKind>().toEqualTypeOf<ConnectorKind>();
    expectTypeOf<SnapshotEscalatorDirection>().toEqualTypeOf<EscalatorDirection>();
    expectTypeOf<SnapshotNodeRole>().toEqualTypeOf<NavNodeRole>();
  });
});
