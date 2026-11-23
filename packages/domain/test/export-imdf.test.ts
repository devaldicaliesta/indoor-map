import { describe, expect, it } from 'vitest';
import { buildSnapshot, type Snapshot, type SnapshotSource, type VenueType } from '../src';
import { checkImdfAddress, type ImdfAddress, snapshotToImdf, validateImdf } from '../src/export';
import { doorSegment } from '../src/export/shapes';
import { uuidV5 } from '../src/export/uuid';
import {
  airportVenue,
  campusVenue,
  concertVenue,
  factoryVenue,
  hospitalVenue,
  mallVenue,
  officeVenue,
} from './fixtures/demo-venues';
import { sampleSnapshotSource } from './fixtures/snapshot-source';

const ADDRESS: ImdfAddress = {
  address: 'Jl. Medan Merdeka Barat No. 1',
  locality: 'Jakarta Pusat',
  province: 'ID-JK',
  country: 'ID',
  postalCode: '10110',
};
const CREATED = '2026-11-23T03:00:00.000Z';

interface Collection {
  features: { id: string; feature_type: string; properties: Record<string, unknown> }[];
}

async function exportOf(snapshot: Snapshot, venueType: VenueType = 'hospital') {
  const result = await snapshotToImdf({
    snapshot,
    venueType,
    address: ADDRESS,
    createdAt: CREATED,
  });
  // Bolak-balik JSON seperti berkas di dalam zip.
  return { ...result, files: JSON.parse(JSON.stringify(result.files)) as Record<string, unknown> };
}
const features = (files: Record<string, unknown>, type: string) =>
  (files[`${type}.geojson`] as Collection).features;

const VENUES: [string, () => SnapshotSource, VenueType][] = [
  ['contoh', sampleSnapshotSource, 'hospital'],
  ['mal', mallVenue, 'shopping_center'],
  ['rumah sakit', hospitalVenue, 'hospital'],
  ['kampus', campusVenue, 'campus'],
  ['perkantoran', officeVenue, 'office'],
  ['bandara', airportVenue, 'airport_station'],
  ['pabrik', factoryVenue, 'factory_warehouse'],
  ['konser', concertVenue, 'custom'],
];

describe.each(VENUES)('export IMDF venue %s', (_, make, venueType) => {
  const snapshot = buildSnapshot(make());

  it('TC-OPS-12: lolos validator tanpa error', async () => {
    const { files } = await exportOf(snapshot, venueType);
    expect(validateImdf(files)).toEqual([]);
  });

  it('berisi semua jenis fitur yang diminta', async () => {
    const { files } = await exportOf(snapshot, venueType);
    expect(Object.keys(files).sort()).toEqual(
      [
        'manifest.json',
        ...['address', 'amenity', 'anchor', 'building', 'footprint', 'level', 'occupant'].map(
          (t) => `${t}.geojson`,
        ),
        ...['opening', 'unit', 'venue'].map((t) => `${t}.geojson`),
      ].sort(),
    );
    expect(features(files, 'venue')).toHaveLength(1);
    expect(features(files, 'level').length).toBeGreaterThan(0);
    expect(features(files, 'unit').length).toBeGreaterThan(0);
    expect(features(files, 'occupant').length).toBeGreaterThan(0);
  });
});

describe('export IMDF venue contoh', () => {
  const snapshot = buildSnapshot(sampleSnapshotSource());

  it('id asal UUID dipakai apa adanya, id turunan tetap antar export', async () => {
    const a = await exportOf(snapshot);
    const b = await exportOf(snapshot);
    expect(a.files).toEqual(b.files);
    const unitIds = features(a.files, 'unit').map((u) => u.id);
    expect(unitIds).toEqual(
      expect.arrayContaining(
        snapshot.features.features.filter((f) => f.properties.kind === 'unit').map((f) => f.id),
      ),
    );
    expect(features(a.files, 'venue')[0]?.id).toBe(snapshot.venue.id);
  });

  it('setiap lokasi berunit menjadi occupant dengan anchor di unitnya', async () => {
    const { files, skipped } = await exportOf(snapshot);
    const withUnits = snapshot.locations.filter((l) => l.unitIds.length > 0);
    const occupants = features(files, 'occupant');
    expect(occupants.length).toBe(withUnits.reduce((n, l) => n + l.unitIds.length, 0));
    expect(skipped.locationsWithoutUnit).toBe(snapshot.locations.length - withUnits.length);
    const multi = withUnits.find((l) => l.unitIds.length > 1);
    if (multi) {
      const shared = occupants.filter((o) => o.properties.correlation_id === multi.id);
      expect(shared).toHaveLength(multi.unitIds.length);
    }
  });

  it('manifest dan alamat', async () => {
    const { files } = await exportOf(snapshot);
    expect(files['manifest.json']).toEqual({
      version: '1.0.0',
      created: CREATED,
      generated_by: 'PanduArah',
      language: 'id',
      extensions: null,
    });
    expect(features(files, 'address')[0]?.properties).toMatchObject({
      locality: 'Jakarta Pusat',
      country: 'ID',
      province: 'ID-JK',
    });
  });
});

describe('validateImdf', () => {
  const snapshot = buildSnapshot(sampleSnapshotSource());

  it('menolak rujukan ke fitur yang tidak ada dan kategori di luar daftar', async () => {
    const { files } = await exportOf(snapshot);
    const unit = features(files, 'unit')[0];
    const occupant = features(files, 'occupant')[0];
    if (!unit || !occupant) throw new Error('fixture tanpa unit/occupant');
    unit.properties.category = 'shop';
    occupant.properties.anchor_id = '00000000-0000-4000-8000-000000000000';
    const messages = validateImdf(files).map((i) => `${i.file} ${i.message}`);
    expect(messages).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^unit\.geojson .*category/),
        expect.stringMatching(/^occupant\.geojson anchor_id merujuk anchor yang tidak ada/),
      ]),
    );
  });

  it('menolak berkas wajib yang hilang, id ganda, dan properti asing', async () => {
    const { files } = await exportOf(snapshot);
    delete files['address.geojson'];
    const [first, second] = features(files, 'level');
    if (!first || !second) throw new Error('fixture kurang lantai');
    second.id = first.id;
    const unit = features(files, 'unit')[0];
    if (!unit) throw new Error('fixture tanpa unit');
    unit.properties.extra = 1;
    const messages = validateImdf(files).map((i) => `${i.file} ${i.message}`);
    expect(messages).toEqual(
      expect.arrayContaining([
        'address.geojson berkas wajib tidak ada',
        expect.stringMatching(/^level\.geojson id dipakai lebih dari satu fitur/),
        expect.stringMatching(/^unit\.geojson .*extra/),
      ]),
    );
  });
});

describe('uuidV5', () => {
  it('cocok dengan vektor uji RFC 9562 (namespace DNS)', async () => {
    expect(await uuidV5('www.example.com', '6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(
      '2ed6657d-e927-568b-95e1-2665a8aea6a2',
    );
  });
});

describe('checkImdfAddress', () => {
  it('merapikan isian dan menerima alamat lengkap', () => {
    expect(
      checkImdfAddress({
        address: ' Jl. Merdeka 1 ',
        locality: ' Bandung ',
        province: 'id-jb',
        country: 'id',
        postalCode: ' ',
      }),
    ).toEqual({
      value: {
        address: 'Jl. Merdeka 1',
        locality: 'Bandung',
        province: 'ID-JB',
        country: 'ID',
        postalCode: null,
      },
      problems: [],
    });
  });

  it('melaporkan isian wajib dan kode yang salah', () => {
    expect(
      checkImdfAddress({
        address: '',
        locality: ' ',
        province: 'Jawa Barat',
        country: 'IDN',
        postalCode: '',
      }).problems,
    ).toEqual(['address_required', 'locality_required', 'invalid_country', 'invalid_province']);
  });
});

describe('doorSegment', () => {
  const room = {
    type: 'Polygon' as const,
    coordinates: [
      [
        [106.8, -6.2],
        [106.8001, -6.2],
        [106.8001, -6.1999],
        [106.8, -6.1999],
        [106.8, -6.2],
      ] as [number, number][],
    ],
  };
  const middle = ([a, b]: [[number, number], [number, number]]) => [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
  ];

  it('pintu di dinding: garis 1 m di sepanjang dinding, berpusat di titik pintu', () => {
    const door: [number, number] = [106.80005, -6.2];
    const segment = doorSegment(door, [room]);
    expect(middle(segment)[0]).toBeCloseTo(door[0], 7);
    expect(middle(segment)[1]).toBeCloseTo(door[1], 7);
    expect(segment[0][1]).toBeCloseTo(-6.2, 7);
    expect(segment[1][1]).toBeCloseTo(-6.2, 7);
  });

  it('ruang terdekat jauh: garis melalui titik pintu, bukan di dinding ruang itu', () => {
    const door: [number, number] = [106.8005, -6.2005];
    const segment = doorSegment(door, [room]);
    expect(middle(segment)[0]).toBeCloseTo(door[0], 7);
    expect(middle(segment)[1]).toBeCloseTo(door[1], 7);
  });
});
