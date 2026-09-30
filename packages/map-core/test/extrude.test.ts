import type { MapFeatureProperties } from '@indoor/domain';
import type { Feature, Geometry, Polygon } from 'geojson';
import { describe, expect, it } from 'vitest';
import { build3dFeatures, resolveHeight, WALL_THICKNESS_M } from '../src/extrude';
import { distanceM } from '../src/georef';
import type { FloorFeatureCollection } from '../src/map';

const square = (x: number, size = 0.0001): Polygon => ({
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
const f = (
  id: string,
  geometry: Geometry,
  props: Partial<MapFeatureProperties> & Pick<MapFeatureProperties, 'kind'>,
): Feature<Geometry, MapFeatureProperties> => ({
  type: 'Feature',
  id,
  geometry,
  properties: { id, floorId: 'f', ...props },
});
const collection = (
  ...features: Feature<Geometry, MapFeatureProperties>[]
): FloorFeatureCollection => ({
  type: 'FeatureCollection',
  features,
});

describe('tinggi 3D', () => {
  it('override fitur → tinggi venue → default aplikasi → 0', () => {
    expect(resolveHeight({ id: 'a', floorId: 'f', kind: 'unit', height: 7 }, { unit: 6 })).toBe(7);
    expect(resolveHeight({ id: 'a', floorId: 'f', kind: 'unit' }, { unit: 6 })).toBe(6);
    expect(resolveHeight({ id: 'a', floorId: 'f', kind: 'unit' }, {})).toBe(4);
    expect(resolveHeight({ id: 'a', floorId: 'f', kind: 'corridor' }, {})).toBe(0);
    expect(resolveHeight({ id: 'a', floorId: 'f', kind: 'unit', height: 0 }, { unit: 6 })).toBe(0);
  });
});

describe('build3dFeatures', () => {
  it('default diubah: unit tanpa override ikut, unit dengan override tetap', () => {
    const data = collection(
      f('u1', square(0), { kind: 'unit' }),
      f('u2', square(0.001), { kind: 'unit', height: 9 }),
    );
    const heightOf = (built: ReturnType<typeof build3dFeatures>, id: string) =>
      built.features.find((x) => x.properties.id === id && !x.properties.edge)?.properties.extrude;
    const before = build3dFeatures(data, { unit: 4 });
    const after = build3dFeatures(data, { unit: 6 });
    expect([heightOf(before, 'u1'), heightOf(after, 'u1')]).toEqual([4, 6]);
    expect([heightOf(before, 'u2'), heightOf(after, 'u2')]).toEqual([9, 9]);
  });

  it('ruang mendapat pemisah tepi sedikit lebih tinggi; ruang setinggi 0 tetap tampil rata', () => {
    const built = build3dFeatures(
      collection(
        f('u1', square(0), { kind: 'unit' }),
        f('u0', square(0.001), { kind: 'unit', height: 0 }),
      ),
      {},
    );
    const edge = built.features.find((x) => x.properties.id === 'u1' && x.properties.edge);
    expect(edge?.geometry.type).toBe('MultiPolygon');
    expect(edge?.geometry.type === 'MultiPolygon' && edge.geometry.coordinates).toHaveLength(4);
    expect(edge?.properties.extrude).toBeCloseTo(4.03);
    expect(
      built.features.filter((x) => x.properties.id === 'u0').map((x) => x.properties.extrude),
    ).toEqual([0]);
  });

  it('koridor setinggi 0 tidak diekstrusi; bila diberi tinggi ikut diekstrusi', () => {
    const data = collection(f('c', square(0), { kind: 'corridor' }));
    expect(build3dFeatures(data, {}).features).toEqual([]);
    expect(build3dFeatures(data, { corridor: 1 }).features[0]?.properties.extrude).toBe(1);
  });

  it('dinding diekstrusi dari garis: satu balok per ruas setebal 0,2 m', () => {
    const wall = f(
      'w',
      {
        type: 'LineString',
        coordinates: [
          [106.8, -6.1],
          [106.8001, -6.1],
          [106.8001, -6.1001],
        ],
      },
      { kind: 'wall' },
    );
    const [built] = build3dFeatures(collection(wall), {}).features;
    expect(built?.properties).toMatchObject({ id: 'w', kind: 'wall', extrude: 5 });
    expect(built?.geometry.type === 'MultiPolygon' && built.geometry.coordinates).toHaveLength(2);
    const ring = built?.geometry.type === 'MultiPolygon' ? built.geometry.coordinates[0]?.[0] : [];
    const [a, b, , d] = (ring ?? []) as [number, number][];
    if (!a || !b || !d) throw new Error('balok dinding kosong');
    expect(distanceM(a, d)).toBeCloseTo(WALL_THICKNESS_M, 3);
    // Panjang ruas ±11 m ditambah setengah tebal di kedua ujung.
    expect(distanceM(a, b)).toBeCloseTo(
      distanceM([106.8, -6.1], [106.8001, -6.1]) + WALL_THICKNESS_M,
      3,
    );
  });

  it('pintu dan fasilitas (titik) tidak masuk data 3D', () => {
    const point = { type: 'Point' as const, coordinates: [106.8, -6.1] };
    expect(
      build3dFeatures(
        collection(f('d', point, { kind: 'door' }), f('x', point, { kind: 'facility' })),
        {},
      ).features,
    ).toEqual([]);
  });
});
