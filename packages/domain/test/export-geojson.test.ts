import { describe, expect, it } from 'vitest';
import { buildSnapshot, type Snapshot } from '../src';
import {
  type ExportFeatureCollection,
  GEOJSON_EXPORT_FORMAT,
  snapshotToGeoJson,
  toOsmHours,
} from '../src/export';
import { containsPoint } from '../src/export/shapes';
import { hospitalVenue } from './fixtures/demo-venues';
import { sampleSnapshotSource } from './fixtures/snapshot-source';

const collection = (files: Record<string, unknown>, name: string) =>
  files[name] as ExportFeatureCollection;

describe.each([
  ['venue contoh', () => buildSnapshot(sampleSnapshotSource())],
  ['venue demo rumah sakit', () => buildSnapshot(hospitalVenue())],
])('export GeoJSON %s', (_, make) => {
  const snapshot: Snapshot = make();
  // Bolak-balik JSON seperti berkas yang diunduh.
  const files = JSON.parse(JSON.stringify(snapshotToGeoJson(snapshot))) as Record<string, unknown>;

  it('TC-OPS-13: geometri fitur WGS84 sama persis dengan snapshot', () => {
    const features = collection(files, 'features.geojson').features;
    expect(features).toHaveLength(snapshot.features.features.length);
    expect(features.map((f) => [f.id, f.geometry])).toEqual(
      snapshot.features.features.map((f) => [f.id, f.geometry]),
    );
    for (const f of features) {
      for (const [lng, lat] of JSON.stringify(f.geometry)
        .match(/-?\d+(\.\d+)?,-?\d+(\.\d+)?/g)
        ?.map((pair) => pair.split(',').map(Number)) ?? []) {
        expect(Math.abs(lng ?? 999)).toBeLessThanOrEqual(180);
        expect(Math.abs(lat ?? 999)).toBeLessThanOrEqual(90);
      }
    }
  });

  it('footprint gedung sama dengan snapshot', () => {
    const buildings = collection(files, 'buildings.geojson').features;
    expect(buildings.map((b) => [b.id, b.geometry])).toEqual(
      snapshot.buildings.map((b) => [b.id, b.footprint]),
    );
  });

  it('lokasi berada di dalam unit utamanya', () => {
    const units = new Map(snapshot.features.features.map((f) => [f.id, f]));
    const locations = collection(files, 'locations.geojson').features;
    expect(locations).toHaveLength(snapshot.locations.length);
    for (const location of locations) {
      const unitId = (location.properties.primaryUnitId ??
        (location.properties.unitIds as string[])[0]) as string | undefined;
      const unit = unitId ? units.get(unitId) : undefined;
      if (!unit || location.geometry?.type !== 'Point') {
        expect(location.geometry).toBeNull();
        continue;
      }
      expect(
        containsPoint(
          unit.geometry as Parameters<typeof containsPoint>[0],
          location.geometry.coordinates,
        ),
      ).toBe(true);
      expect(location.properties.floorId).toBe(unit.properties.floorId);
    }
  });

  it('graf: simpul, ruas dengan ujung di koordinat simpulnya, dan konektor', () => {
    const graph = collection(files, 'graph.geojson').features;
    const nodes = new Map(snapshot.graph.nodes.map((n) => [n.id, n.coordinates]));
    const count = (element: string) => graph.filter((f) => f.properties.element === element).length;
    expect(count('node')).toBe(snapshot.graph.nodes.length);
    expect(count('edge')).toBe(snapshot.graph.edges.length);
    expect(count('connector')).toBe(snapshot.graph.connectors.length);
    for (const edge of graph.filter((f) => f.properties.element === 'edge')) {
      expect(edge.geometry).toEqual({
        type: 'LineString',
        coordinates: [
          nodes.get(edge.properties.from as string),
          nodes.get(edge.properties.to as string),
        ],
      });
    }
  });

  it('metadata venue dan versi', () => {
    expect(files['venue.json']).toMatchObject({
      format: GEOJSON_EXPORT_FORMAT,
      crs: 'EPSG:4326',
      version: snapshot.version,
      venue: { id: snapshot.venue.id },
      floors: snapshot.floors,
    });
  });
});

describe('toOsmHours', () => {
  const span = (opens: string, closes: string) => ({ opens, closes });

  it('menggabungkan hari berurutan dengan jadwal sama', () => {
    const weekday = [span('08:00', '16:00')];
    expect(
      toOsmHours({
        weekly: [weekday, weekday, weekday, weekday, weekday, [span('08:00', '12:00')], []],
        special: {},
      }),
    ).toBe('Mo-Fr 08:00-16:00; Sa 08:00-12:00');
  });

  it('24 jam, lewat tengah malam, beberapa rentang, dan tanggal khusus', () => {
    expect(
      toOsmHours({
        weekly: [
          [span('00:00', '00:00')],
          [span('22:00', '02:00')],
          [span('08:00', '12:00'), span('13:00', '17:00')],
          [],
          [],
          [],
          [span('00:00', '00:00')],
        ],
        special: { '2026-12-25': [], '2026-08-17': [span('10:00', '14:00')] },
      }),
    ).toBe(
      'Mo 00:00-24:00; Tu 22:00-02:00; We 08:00-12:00,13:00-17:00; Su 00:00-24:00; 2026 Aug 17 10:00-14:00; 2026 Dec 25 off',
    );
  });

  it('tanpa jadwal menjadi null', () => {
    expect(toOsmHours(null)).toBeNull();
    expect(toOsmHours({ weekly: [[], [], [], [], [], [], []], special: {} })).toBeNull();
  });
});
