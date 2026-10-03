import { describe, expect, it } from 'vitest';
import { DataError } from '../src/errors';
import { positionFromColumn } from '../src/geometry';
import { mapInfoPointRow } from '../src/repositories/info-points';
import { mapOriginPointRow } from '../src/repositories/origin-points';

const point = {
  type: 'Point',
  crs: { type: 'name', properties: { name: 'EPSG:4326' } },
  coordinates: [106.8268, -6.17528085],
};

describe('sumber uji rute', () => {
  it('baris origin_points dan info_points menjadi tipe domain', () => {
    expect(
      mapOriginPointRow({
        id: 'o1',
        floor_id: 'f1',
        name: 'Lobi Utama',
        geom: point,
        heading_deg: 90,
        node_id: null,
        public_code: '3fa9c1d2e4b5',
      }),
    ).toEqual({
      id: 'o1',
      floorId: 'f1',
      name: 'Lobi Utama',
      coordinates: [106.8268, -6.17528085],
      headingDeg: 90,
      nodeId: null,
      code: '3fa9c1d2e4b5',
    });
    expect(
      mapInfoPointRow({
        id: 'i1',
        code: 'IP-LOBI',
        name: 'Info Point Lobi',
        floor_id: 'f1',
        geom: point,
        heading_deg: 180,
        node_id: 'n1',
        default_mode: '2d',
        force_2d: true,
        default_language: 'en',
        idle_seconds: 90,
      }),
    ).toEqual({
      id: 'i1',
      code: 'IP-LOBI',
      name: 'Info Point Lobi',
      floorId: 'f1',
      coordinates: [106.8268, -6.17528085],
      headingDeg: 180,
      nodeId: 'n1',
      defaultMode: '2d',
      force2d: true,
      defaultLanguage: 'en',
      idleSeconds: 90,
    });
  });

  it('kolom titik yang bukan titik ditolak', () => {
    const line = {
      type: 'LineString',
      coordinates: [
        [106.8, -6.1],
        [106.9, -6.2],
      ],
    };
    expect(() => positionFromColumn(line)).toThrow(DataError);
  });
});
