import { describe, expect, it } from 'vitest';
import {
  COLOR_KINDS,
  HEIGHT_KINDS,
  parseCamera,
  parseColors,
  parseHeightInput,
  parseHeights,
  toCameraView,
} from './display-settings';
import { KIND_SHAPE } from './feature';

describe('pengaturan tampilan', () => {
  it('jenis bertinggi = semua jenis poligon + dinding; titik tidak punya tinggi', () => {
    for (const kind of HEIGHT_KINDS) expect(KIND_SHAPE[kind]).not.toBe('point');
    expect(COLOR_KINDS).toContain('facility');
  });

  it('jsonb tinggi dibaca aman: entri tak dikenal atau di luar 0–100 m dibuang', () => {
    expect(
      parseHeights({ unit: 4, wall: 5, corridor: 0, door: 3, stairs: -1, elevator: 101, x: 1 }),
    ).toEqual({ unit: 4, wall: 5, corridor: 0 });
    expect(parseHeights(null)).toEqual({});
    expect(parseHeights([1, 2])).toEqual({});
  });

  it('jsonb warna hanya #rrggbb, disimpan huruf kecil', () => {
    expect(parseColors({ unit: '#FFE9A8', wall: 'merah', door: '#123' })).toEqual({
      unit: '#ffe9a8',
    });
  });

  it('kamera tidak valid menjadi null', () => {
    expect(parseCamera({ center: [106.8, -6.1], zoom: 18, pitch: 50, bearing: 20 })).toEqual({
      center: [106.8, -6.1],
      zoom: 18,
      pitch: 50,
      bearing: 20,
    });
    expect(parseCamera({ center: [106.8, -6.1], zoom: 18, pitch: 80, bearing: 0 })).toBeNull();
    expect(parseCamera(null)).toBeNull();
  });

  it('isian tinggi: kosong = default, koma desimal, batas 0–100 m', () => {
    expect(parseHeightInput(' ')).toEqual({ ok: true, value: null });
    expect(parseHeightInput('3,456')).toEqual({ ok: true, value: 3.46 });
    expect(parseHeightInput('0')).toEqual({ ok: true, value: 0 });
    expect(parseHeightInput('abc')).toEqual({ ok: false, problem: 'not_number' });
    expect(parseHeightInput('-1')).toEqual({ ok: false, problem: 'negative' });
    expect(parseHeightInput('150')).toEqual({ ok: false, problem: 'too_high' });
  });

  it('kamera dari peta dibulatkan dan rotasi dinormalkan ke -180..180', () => {
    expect(
      toCameraView({
        center: [106.82721234567, -6.17541234567],
        zoom: 18.456,
        pitch: 49.96,
        bearing: 190,
      }),
    ).toEqual({ center: [106.8272123, -6.1754123], zoom: 18.46, pitch: 50, bearing: -170 });
  });
});
