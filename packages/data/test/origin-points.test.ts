import { describe, expect, it } from 'vitest';
import { mapOriginPointRow, toOriginPointRow } from '../src/repositories/origin-points';

describe('titik asal', () => {
  it('isian menjadi baris origin_points; nama dirapikan, posisi GeoJSON', () => {
    expect(
      toOriginPointRow({
        floorId: 'f',
        name: ' Lobi Utama ',
        coordinates: [106.8272, -6.1754],
        headingDeg: 90,
        nodeId: 'n',
      }),
    ).toEqual({
      floor_id: 'f',
      name: 'Lobi Utama',
      geom: '{"type":"Point","coordinates":[106.8272,-6.1754]}',
      heading_deg: 90,
      node_id: 'n',
    });
  });

  it('baris menjadi tipe domain; numeric arah hadap jadi angka', () => {
    expect(
      mapOriginPointRow({
        id: 'o',
        floor_id: 'f',
        name: 'Lobi',
        geom: { type: 'Point', coordinates: [106.8, -6.1] },
        heading_deg: '45.5' as unknown as number,
        node_id: null,
        public_code: '0123456789ab',
      }),
    ).toMatchObject({ headingDeg: 45.5, coordinates: [106.8, -6.1], code: '0123456789ab' });
  });
});
