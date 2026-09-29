import { type Geometry, GeometrySchema } from '@indoor/domain';
import { DataError } from './errors';

/**
 * Kolom `geometry` dibaca PostgREST sebagai GeoJSON lewat cast bawaan PostGIS
 * (`ST_AsGeoJSON`), termasuk anggota `crs` yang dibuang di sini.
 */
export function geometryFromColumn(value: unknown): Geometry {
  if (typeof value !== 'object' || value === null) {
    throw new DataError('invalid', { message: 'Geometri dari database kosong atau rusak.' });
  }
  const { crs: _crs, ...geometry } = value as Record<string, unknown>;
  const parsed = GeometrySchema.safeParse(geometry);
  if (!parsed.success) {
    throw new DataError('invalid', {
      message: 'Geometri dari database tidak sesuai GeoJSON WGS84.',
      cause: parsed.error,
    });
  }
  return parsed.data;
}

export function nullableGeometryFromColumn(value: unknown): Geometry | null {
  return value === null || value === undefined ? null : geometryFromColumn(value);
}

/**
 * GeoJSON dikirim apa adanya; PostGIS menerimanya sebagai input `geometry` dan
 * memakai SRID kolom (4326) karena GeoJSON tidak membawa SRID.
 */
export function geometryToColumn(geometry: Geometry): string {
  return JSON.stringify(GeometrySchema.parse(geometry));
}
