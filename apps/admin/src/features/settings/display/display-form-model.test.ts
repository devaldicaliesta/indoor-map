import type { DisplaySettings, VenueId } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { toFormValues, toPatch, validate } from './display-form-model';

const settings: DisplaySettings = {
  venueId: '10000000-0000-4000-8000-000000000001' as VenueId,
  defaultMode: '2d',
  heights: { unit: 4, wall: 5, corridor: 0, outdoor_area: 0 },
  colors: { unit: '#ffe9a8' },
  camera: null,
};

describe('formulir tampilan', () => {
  it('nilai tersimpan tampil di formulir; yang tidak diatur kosong', () => {
    const values = toFormValues({ ...settings, heights: { ...settings.heights, stairs: 3.5 } });
    expect(values.heights).toMatchObject({
      unit: '4',
      wall: '5',
      corridor: '0',
      stairs: '3,5',
      elevator: '',
    });
    expect(values.colors.unit).toBe('#ffe9a8');
    expect(values.colors.wall).toBe('');
  });

  it('bolak-balik tanpa kehilangan nilai', () => {
    expect(toPatch(toFormValues(settings))).toEqual({
      defaultMode: '2d',
      heights: settings.heights,
      colors: settings.colors,
    });
  });

  it('tinggi dan warna salah diberi pesan cara memperbaiki', () => {
    const values = toFormValues(settings);
    values.heights.unit = 'tinggi';
    values.heights.wall = '120';
    values.colors.door = 'biru';
    expect(validate(values)).toEqual({
      unit: 'Isi angka dalam meter, misalnya 4 atau 3,5.',
      wall: 'Tinggi maksimal 100 m.',
      door: 'Warna harus berformat #rrggbb, misalnya #ffe9a8.',
    });
  });

  it('tinggi baru dengan koma dan warna huruf besar disimpan rapi; kosong = bawaan', () => {
    const values = toFormValues(settings);
    values.heights.unit = '6,25';
    values.heights.corridor = '';
    values.colors.wall = '#222AAA';
    values.defaultMode = '3d';
    expect(toPatch(values)).toEqual({
      defaultMode: '3d',
      heights: { unit: 6.25, wall: 5, outdoor_area: 0 },
      colors: { unit: '#ffe9a8', wall: '#222aaa' },
    });
  });
});
