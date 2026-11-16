import { buildSnapshot, type OriginPoint, type VenueId } from '@indoor/domain';
import { sampleSnapshotSource } from '@indoor/domain/fixtures/snapshot-source.ts';
import { describe, expect, it } from 'vitest';
import {
  boardsPdf,
  floorFeatures,
  locationStickerUrl,
  MAX_BOARD_LOCATIONS,
  mainLocations,
  stickersPdf,
} from './board-print';

const snapshot = buildSnapshot(sampleSnapshotSource());
const VENUE = snapshot.venue.id as VenueId;
const URL_BASE = 'https://peta.contoh.id';
const floorWithLocations = snapshot.floors.find(
  (floor) => mainLocations(snapshot, floor.id).length,
);
const decode = (bytes: Uint8Array) => new TextDecoder('latin1').decode(bytes);

describe('isi papan dari snapshot terbit', () => {
  it('fitur dan lokasi utama hanya dari lantai titik asal, urut nama, tanpa duplikat', () => {
    if (!floorWithLocations) throw new Error('fixture tanpa lokasi');
    const features = floorFeatures(snapshot, floorWithLocations.id);
    expect(features.features.length).toBeGreaterThan(0);
    expect(features.features.every((f) => f.properties.floorId === floorWithLocations.id)).toBe(
      true,
    );
    const names = mainLocations(snapshot, floorWithLocations.id);
    expect(names).toEqual([...new Set(names)].sort((a, b) => a.localeCompare(b, 'id')));
    expect(names.length).toBeLessThanOrEqual(MAX_BOARD_LOCATIONS);
    const onFloor = new Set(features.features.map((f) => f.properties.id));
    const expected = snapshot.locations.filter((l) => l.unitIds.some((id) => onFloor.has(id)));
    expect(names).toEqual(expect.arrayContaining(expected.slice(0, 3).map((l) => l.name)));
  });

  it('satu halaman per titik asal; QR berisi deep link ?o= titik itu', () => {
    if (!floorWithLocations) throw new Error('fixture tanpa lokasi');
    const geometry = floorFeatures(snapshot, floorWithLocations.id).features[0]?.geometry;
    const corner =
      geometry?.type === 'Polygon'
        ? ((geometry as { coordinates: number[][][] }).coordinates[0]?.[0] ?? [0, 0])
        : [0, 0];
    const point = (code: string): OriginPoint => ({
      id: code,
      floorId: floorWithLocations.id,
      name: `Titik ${code}`,
      coordinates: corner as OriginPoint['coordinates'],
      headingDeg: 45,
      nodeId: null,
      code,
    });
    const text = decode(
      boardsPdf({
        snapshot,
        points: [point('0123456789ab'), point('ba9876543210')],
        paper: 'A3',
        publicUrl: URL_BASE,
        venueId: VENUE,
        floorName: () => 'GF',
      }),
    );
    expect(text).toContain('/Count 2');
    expect(text).toContain('(Titik 0123456789ab \\267 GF) Tj'.replace('\\267', '·'));
    expect(text).toContain(`?o=0123456789ab) Tj`);
    expect(text).toContain('/MediaBox [0 0 841.89 1190.55]');
  });
});

describe('stiker QR lokasi', () => {
  it('URL membuka lokasi sebagai tujuan; satu nama per stiker', () => {
    const location = snapshot.locations[0];
    if (!location) throw new Error('fixture tanpa lokasi');
    const url = locationStickerUrl(URL_BASE, VENUE, location.id);
    expect(url.startsWith(`${URL_BASE}/v/${VENUE}?`)).toBe(true);
    expect(new URL(url).searchParams.get('to')).toContain(location.id);
    const picked = snapshot.locations.slice(0, 4);
    const text = decode(
      stickersPdf({ snapshot, locations: picked, publicUrl: URL_BASE, venueId: VENUE }),
    );
    expect(text).toContain('/Count 1');
    for (const l of picked) expect(text).toContain(`(${l.name}) Tj`);
  });
});
