import { describe, expect, it } from 'vitest';
import {
  mapDisplaySettingsRow,
  toDisplaySettingsUpdate,
} from '../src/repositories/display-settings';

const row = {
  venue_id: '10000000-0000-4000-8000-000000000001',
  default_mode: '3d' as const,
  heights: { unit: 4, wall: 5, corridor: 0, outdoor_area: 0 },
  colors: { unit: '#FFFFFF', wall: 'abu' },
  camera: { center: [106.8272, -6.1754], zoom: 18.5, pitch: 50, bearing: 15 },
};

describe('pengaturan tampilan', () => {
  it('baris display_settings menjadi tipe domain; jsonb yang rusak diabaikan per entri', () => {
    expect(mapDisplaySettingsRow(row)).toEqual({
      venueId: row.venue_id,
      defaultMode: '3d',
      heights: { unit: 4, wall: 5, corridor: 0, outdoor_area: 0 },
      colors: { unit: '#ffffff' },
      camera: { center: [106.8272, -6.1754], zoom: 18.5, pitch: 50, bearing: 15 },
    });
    expect(mapDisplaySettingsRow({ ...row, camera: { zoom: 'x' } }).camera).toBeNull();
  });

  it('patch hanya mengirim kolom yang diisi; kamera null menghapus kamera awal', () => {
    expect(toDisplaySettingsUpdate({ defaultMode: '2d' })).toEqual({ default_mode: '2d' });
    expect(toDisplaySettingsUpdate({ heights: { unit: 3 }, camera: null })).toEqual({
      heights: { unit: 3 },
      camera: null,
    });
  });
});
