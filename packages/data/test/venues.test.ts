import { describe, expect, it } from 'vitest';
import { mapVenueRow, toVenueColumns } from '../src/repositories/venues';

const row = {
  id: '10000000-0000-4000-8000-000000000001',
  name: 'Venue Contoh',
  address: 'Jl. Contoh No. 1',
  center: {
    type: 'Point',
    crs: { type: 'name', properties: { name: 'EPSG:4326' } },
    coordinates: [106.8272, -6.1754],
  },
  logo_path: null,
  timezone: 'Asia/Jakarta',
  venue_type: 'custom' as const,
  default_building_id: null,
  slug: 'demo',
  created_at: '2026-09-29T08:00:00+00:00',
  updated_at: '2026-09-29T08:00:00+00:00',
};

describe('venue', () => {
  it('baris venues menjadi tipe domain dengan titik pusat GeoJSON', () => {
    expect(mapVenueRow(row)).toMatchObject({
      name: 'Venue Contoh',
      center: { type: 'Point', coordinates: [106.8272, -6.1754] },
      venueType: 'custom',
      defaultBuildingId: null,
      slug: 'demo',
    });
  });

  it('input dirapikan; alamat kosong menjadi null; titik dikirim sebagai GeoJSON', () => {
    const columns = toVenueColumns({
      name: '  RS Harapan ',
      address: '  ',
      center: { type: 'Point', coordinates: [106.8, -6.1] },
      timezone: 'Asia/Makassar',
    });
    expect(columns).toMatchObject({ name: 'RS Harapan', address: null, timezone: 'Asia/Makassar' });
    expect(JSON.parse(String(columns.center))).toEqual({
      type: 'Point',
      coordinates: [106.8, -6.1],
    });
  });
});
