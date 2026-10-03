import type { Map as MapLibreMap } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import {
  FACILITY_ICON_COLORS,
  FACILITY_ICON_FALLBACK,
  facilityIconId,
  fitContain,
  glyphColorOn,
  isOpaque,
  setFacilityIcons,
} from '../src/sprites';

describe('sprite fasilitas', () => {
  it('id gambar per jenis fasilitas cocok dengan ekspresi icon-image', () => {
    expect(facilityIconId('abc')).toBe('facility-abc');
    expect(FACILITY_ICON_FALLBACK).toBe('facility-unknown');
  });

  it('keselamatan berlatar merah --danger dengan simbol putih; lainnya putih dengan simbol --ink', () => {
    expect(FACILITY_ICON_COLORS.safety).toMatchObject({ background: '#c8321e', glyph: '#ffffff' });
    expect(FACILITY_ICON_COLORS.normal).toMatchObject({ background: '#ffffff', glyph: '#111418' });
  });

  it('fitContain menaruh gambar di tengah tanpa memotong', () => {
    expect(fitContain(200, 100, 40)).toEqual({ x: 0, y: 10, width: 40, height: 20 });
    expect(fitContain(50, 100, 40)).toEqual({ x: 10, y: 0, width: 20, height: 40 });
    expect(fitContain(0, 0, 40)).toEqual({ x: 20, y: 20, width: 0, height: 0 });
  });

  it('isOpaque: satu piksel transparan cukup untuk memperlakukan gambar sebagai topeng', () => {
    const opaque = new Uint8ClampedArray([10, 20, 30, 255, 0, 0, 0, 255]);
    const withHole = new Uint8ClampedArray([10, 20, 30, 255, 0, 0, 0, 0]);
    expect(isOpaque(opaque)).toBe(true);
    expect(isOpaque(withHole)).toBe(false);
  });

  it('latar ikon pilihan venue: simbol tinta di latar terang, putih di latar gelap', () => {
    expect(glyphColorOn('#ffe9a8')).toBe('#111418');
    expect(glyphColorOn('#1463ff')).toBe('#ffffff');
    expect(glyphColorOn('#111418')).toBe('#ffffff');
  });

  it('peta yang sudah dilepas saat ikon selesai dibuat tidak disentuh', async () => {
    // MapLibre setelah remove(): `style` kosong dan akses gambar melempar galat.
    const removed = {
      style: undefined,
      listImages: () => {
        throw new TypeError("Cannot read properties of undefined (reading 'getImage')");
      },
    } as unknown as MapLibreMap;
    await expect(setFacilityIcons(removed, [])).resolves.toBeUndefined();
  });
});
