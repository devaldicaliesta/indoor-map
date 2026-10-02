import { describe, expect, it } from 'vitest';
import {
  checkFloorPlanFile,
  checkFloorPlanPlacement,
  defaultCadLayers,
  MAX_FLOOR_PLAN_BYTES,
  MAX_RASTER_WIDTH_PX,
  naturalWidthM,
  pdfRenderScale,
} from './floor-plan';

const file = (name: string, type: string, size = 1000) => ({ name, type, size });

describe('checkFloorPlanFile', () => {
  it('menerima PNG, JPG/JPEG, dan PDF', () => {
    expect(checkFloorPlanFile(file('denah.png', 'image/png'))).toEqual({ ok: true, format: 'png' });
    expect(checkFloorPlanFile(file('DENAH.JPEG', 'image/jpeg'))).toEqual({
      ok: true,
      format: 'jpg',
    });
    expect(checkFloorPlanFile(file('a.pdf', 'application/pdf'))).toEqual({
      ok: true,
      format: 'pdf',
    });
  });

  it('memakai ekstensi bila browser tidak mengirim MIME', () => {
    expect(checkFloorPlanFile(file('a.pdf', ''))).toEqual({ ok: true, format: 'pdf' });
  });

  it('menolak tipe lain dan MIME yang tidak cocok dengan ekstensi', () => {
    expect(checkFloorPlanFile(file('setup.exe', 'application/x-msdownload'))).toEqual({
      ok: false,
      problem: 'unsupported_type',
    });
    expect(checkFloorPlanFile(file('denah.png', 'application/pdf'))).toMatchObject({ ok: false });
    expect(checkFloorPlanFile(file('tanpa-ekstensi', 'image/png'))).toMatchObject({ ok: false });
  });

  it('DXF diterima dengan MIME apa pun yang biasa dikirim browser', () => {
    for (const type of [
      '',
      'image/vnd.dxf',
      'application/dxf',
      'image/x-dxf',
      'application/octet-stream',
    ]) {
      expect(checkFloorPlanFile(file('Denah L1.DXF', type))).toEqual({ ok: true, format: 'dxf' });
    }
    expect(checkFloorPlanFile(file('denah.dxf', 'image/png'))).toMatchObject({ ok: false });
  });

  it('DWG ditolak dengan arahan menyimpan sebagai DXF/PDF', () => {
    expect(checkFloorPlanFile(file('denah.dwg', ''))).toEqual({
      ok: false,
      problem: 'dwg_unsupported',
    });
  });

  it('batas 50 MB inklusif; berkas kosong ditolak', () => {
    expect(checkFloorPlanFile(file('a.png', 'image/png', MAX_FLOOR_PLAN_BYTES)).ok).toBe(true);
    expect(checkFloorPlanFile(file('a.png', 'image/png', 60 * 1024 * 1024))).toEqual({
      ok: false,
      problem: 'too_large',
    });
    expect(checkFloorPlanFile(file('a.png', 'image/png', 0))).toEqual({
      ok: false,
      problem: 'empty',
    });
  });
});

describe('naturalWidthM', () => {
  it('lebar gambar dalam meter dari batas dan satuan berkas', () => {
    expect(naturalWidthM([0, 0, 20000, 10000], 0.001)).toBe(20);
    expect(naturalWidthM([-5, 0, 37.25, 1], 1)).toBe(42.25);
  });

  it('tanpa satuan, tanpa batas, atau ukuran tak masuk akal: tidak ada skala awal', () => {
    expect(naturalWidthM([0, 0, 20000, 10000], null)).toBeNull();
    expect(naturalWidthM(null, 0.001)).toBeNull();
    expect(naturalWidthM([0, 0, 0, 10], 1)).toBeNull();
    expect(naturalWidthM([0, 0, 1e9, 1], 1)).toBeNull();
  });
});

describe('defaultCadLayers', () => {
  it('mencentang semua layer yang berisi gambar', () => {
    expect(
      defaultCadLayers([
        { name: 'DINDING', entities: 12 },
        { name: 'Defpoints', entities: 0 },
        { name: 'PINTU', entities: 3 },
      ]),
    ).toEqual(['DINDING', 'PINTU']);
  });
});

describe('pdfRenderScale', () => {
  it('lebar mendekati target tanpa sisi mana pun melewati batas raster', () => {
    expect(595 * pdfRenderScale(595, 842)).toBeCloseTo(4000);
    expect(595 * pdfRenderScale(595, 842, 20000)).toBeLessThanOrEqual(MAX_RASTER_WIDTH_PX);
    expect(842 * pdfRenderScale(595, 842, 20000)).toBeCloseTo(MAX_RASTER_WIDTH_PX);
    expect(pdfRenderScale(0, 842)).toBe(1);
  });
});

describe('checkFloorPlanPlacement', () => {
  const corners: [number, number][] = [
    [106.82, -6.17],
    [106.83, -6.17],
    [106.83, -6.18],
    [106.82, -6.18],
  ];

  it('menerima 4 sudut dan opasitas 0–1', () => {
    expect(checkFloorPlanPlacement({ corners, opacity: 0 })).toEqual([]);
    expect(checkFloorPlanPlacement({ corners, opacity: 1 })).toEqual([]);
  });

  it('menolak jumlah sudut salah, koordinat di luar WGS84, dan opasitas di luar rentang', () => {
    expect(checkFloorPlanPlacement({ corners: corners.slice(0, 3), opacity: 0.5 })).toEqual([
      'corners_invalid',
    ]);
    expect(
      checkFloorPlanPlacement({ corners: [...corners.slice(0, 3), [200, 0]], opacity: 1.2 }),
    ).toEqual(['corners_invalid', 'opacity_range']);
    expect(checkFloorPlanPlacement({ corners, opacity: Number.NaN })).toEqual(['opacity_range']);
  });
});
