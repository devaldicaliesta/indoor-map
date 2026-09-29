import { describe, expect, it } from 'vitest';
import { DataError } from '../src/errors';
import { geometryFromColumn, geometryToColumn, nullableGeometryFromColumn } from '../src/geometry';

// Bentuk kolom geometry yang dikembalikan PostgREST (PostGIS menambahkan crs).
const pointFromPostgrest = {
  type: 'Point',
  crs: { type: 'name', properties: { name: 'EPSG:4326' } },
  coordinates: [106.8272, -6.1754],
};

describe('geometryFromColumn', () => {
  it('mengubah kolom PostGIS menjadi GeoJSON tanpa crs', () => {
    expect(geometryFromColumn(pointFromPostgrest)).toEqual({
      type: 'Point',
      coordinates: [106.8272, -6.1754],
    });
  });

  it('menolak nilai yang bukan GeoJSON WGS84', () => {
    expect(() => geometryFromColumn({ type: 'Point', coordinates: [500, 0] })).toThrow(DataError);
    expect(() => geometryFromColumn('POINT(1 2)')).toThrow(DataError);
  });

  it('kolom kosong menjadi null', () => {
    expect(nullableGeometryFromColumn(null)).toBeNull();
  });
});

describe('geometryToColumn', () => {
  it('mengirim GeoJSON sebagai teks', () => {
    const point = { type: 'Point' as const, coordinates: [106.8, -6.1] as [number, number] };
    expect(JSON.parse(geometryToColumn(point))).toEqual(point);
  });
});
