import { gzipSync } from 'node:zlib';
import {
  buildSnapshot,
  type SnapshotSource,
  type SourceFeature,
  type SourceLocation,
} from '@indoor/domain';
import { sampleSnapshotSource } from '@indoor/domain/fixtures/snapshot-source.ts';
import { describe, expect, it } from 'vitest';

const MAX_GZIP_BYTES = 1.5 * 1024 * 1024;
const FLOORS = 10;
const PER_FLOOR = 200;

const gzipBytes = (source: SnapshotSource) =>
  gzipSync(Buffer.from(JSON.stringify(buildSnapshot(source)))).length;

/** Koordinat dengan banyak desimal seperti hasil gambar di editor, sebelum dibulatkan builder. */
const at = (x: number, y: number): [number, number] => [
  106.8268 + x * 0.0000137 + 0.000000012345,
  -6.1751 - y * 0.0000129 - 0.000000067891,
];

function ring(x: number, y: number, points: number): [number, number][] {
  const coordinates = Array.from({ length: points }, (_, i) => {
    const angle = (2 * Math.PI * i) / points;
    return at(x + 2 + 2 * Math.cos(angle), y + 2 + 2 * Math.sin(angle));
  });
  return [...coordinates, coordinates[0] ?? at(x, y)];
}

/**
 * Venue sintetis 10 lantai × 200 fitur: unit dengan 8 titik sudut, koridor, dinding, pintu,
 * dan fasilitas, plus satu lokasi berdeskripsi untuk setiap unit. Lebih berat dari venue nyata
 * yang sebagian besar unitnya persegi.
 */
function largeVenue(): SnapshotSource {
  const base = sampleSnapshotSource();
  const floorIds = Array.from({ length: FLOORS }, (_, i) => `f${String(i).padStart(3, '0')}-floor`);
  const features: SourceFeature[] = [];
  const locations: SourceLocation[] = [];
  floorIds.forEach((floorId, level) => {
    for (let i = 0; i < PER_FLOOR; i++) {
      const id = `${floorId}-${String(i).padStart(4, '0')}`;
      const x = (i % 20) * 5;
      const y = Math.floor(i / 20) * 5;
      const kind =
        i < 120 ? 'unit' : i < 130 ? 'corridor' : i < 150 ? 'wall' : i < 190 ? 'door' : 'facility';
      const geometry =
        kind === 'unit' || kind === 'corridor'
          ? { type: 'Polygon' as const, coordinates: [ring(x, y, kind === 'unit' ? 8 : 12)] }
          : kind === 'wall'
            ? { type: 'LineString' as const, coordinates: ring(x, y, 5) }
            : { type: 'Point' as const, coordinates: at(x, y) };
      features.push({
        id,
        floorId,
        kind,
        geometry,
        name: kind === 'unit' ? `Ruang ${level}-${i}` : null,
        unitCode: kind === 'unit' ? `GU-L${level}-${String(i).padStart(3, '0')}` : null,
        unitStatus: kind === 'unit' ? 'occupied' : null,
        height: null,
        color: null,
        facilityTypeId: kind === 'facility' ? (base.facilityTypes[0]?.id ?? null) : null,
        subtype: null,
      });
      if (kind === 'unit') {
        locations.push({
          id: `${id}-loc`,
          code: `LOK-${level}-${i}`,
          name: `Layanan ${level}-${i}`,
          description:
            'Layanan pemeriksaan dan konsultasi untuk pengunjung, buka setiap hari kerja.',
          locationTypeId: base.locationTypes[0]?.id ?? '',
          status: 'active',
          openingDate: null,
          // Jadwal khas: Senin–Jumat dua rentang, Sabtu setengah hari, Minggu libur.
          hours: {
            weekly: [
              ...Array.from({ length: 5 }, () => [
                { opens: '08:00', closes: '12:00' },
                { opens: '13:00', closes: '16:00' },
              ]),
              [{ opens: '08:00', closes: '12:00' }],
              [],
            ],
            special: {},
          },
          categoryIds: base.categories.map((c) => c.id),
          unitIds: [id],
          primaryUnitId: id,
          logoPath: null,
          photoPaths: [],
          customFields: { extension: String(1000 + i) },
        });
      }
    }
  });
  return {
    ...base,
    floors: floorIds.map((id, level) => ({
      id,
      buildingId: base.buildings[0]?.id ?? null,
      name: `L${level}`,
      level,
      heightM: 4,
      isOutdoor: false,
      sortOrder: level,
    })),
    features,
    locations,
  };
}

describe('ukuran snapshot', () => {
  it('venue contoh jauh di bawah batas', () => {
    expect(gzipBytes(sampleSnapshotSource())).toBeLessThan(50 * 1024);
  });

  it('venue 2.000 fitur di bawah 1,5 MB setelah gzip', () => {
    const source = largeVenue();
    expect(source.features).toHaveLength(FLOORS * PER_FLOOR);
    expect(gzipBytes(source)).toBeLessThan(MAX_GZIP_BYTES);
  });
});
