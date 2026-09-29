import { describe, expect, it } from 'vitest';
import {
  checkFloorPlanFile,
  MAX_FLOOR_PLAN_BYTES,
  MAX_RASTER_WIDTH_PX,
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

  it('DWG/DXF diarahkan ke konversi CAD nanti', () => {
    expect(checkFloorPlanFile(file('denah.dwg', ''))).toEqual({ ok: false, problem: 'cad_later' });
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

describe('pdfRenderScale', () => {
  it('lebar mendekati target tanpa sisi mana pun melewati batas raster', () => {
    expect(595 * pdfRenderScale(595, 842)).toBeCloseTo(4000);
    expect(595 * pdfRenderScale(595, 842, 20000)).toBeLessThanOrEqual(MAX_RASTER_WIDTH_PX);
    expect(842 * pdfRenderScale(595, 842, 20000)).toBeCloseTo(MAX_RASTER_WIDTH_PX);
    expect(pdfRenderScale(0, 842)).toBe(1);
  });
});
