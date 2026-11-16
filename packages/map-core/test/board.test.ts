import { encodeQr, type MapFeatureProperties } from '@indoor/domain';
import type { Feature, Geometry } from 'geojson';
import { describe, expect, it } from 'vitest';
import { BOARD_TEXTS, buildBoardLayout, buildStickerSheets } from '../src/board';
import type { FloorFeatureCollection } from '../src/map';
import { drawFloor, layoutsToPdf, qrShapes } from '../src/print';

const unit = (
  id: string,
  x: number,
  y: number,
  name: string,
): Feature<Geometry, MapFeatureProperties> => ({
  type: 'Feature',
  id,
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [x, y],
        [x + 0.0002, y],
        [x + 0.0002, y + 0.0002],
        [x, y + 0.0002],
        [x, y],
      ],
    ],
  },
  properties: { id, kind: 'unit', floorId: 'f', name },
});

const floor: FloorFeatureCollection = {
  type: 'FeatureCollection',
  features: [unit('w', 106.8, -6.1, 'Barat'), unit('e', 106.8006, -6.1, 'Timur')],
};

const textAt = (shapes: ReturnType<typeof drawFloor>['shapes'], value: string) =>
  shapes.find((s) => s.type === 'text' && s.text === value) as { x: number; y: number };

describe('drawFloor dengan arah hadap', () => {
  const area = { x: 0, y: 0, w: 400, h: 400 };

  it('tanpa rotasi timur di kanan; menghadap timur (90°) timur di atas', () => {
    const north = drawFloor(floor, area);
    expect(textAt(north.shapes, 'Timur').x).toBeGreaterThan(textAt(north.shapes, 'Barat').x);
    const east = drawFloor(floor, area, { rotationDeg: 90 });
    expect(textAt(east.shapes, 'Timur').y).toBeLessThan(textAt(east.shapes, 'Barat').y);
    const south = drawFloor(floor, area, { rotationDeg: 180 });
    expect(textAt(south.shapes, 'Timur').x).toBeLessThan(textAt(south.shapes, 'Barat').x);
  });
});

describe('qrShapes', () => {
  it('modul gelap digambar persis, dengan zona tenang 4 modul', () => {
    const matrix = encodeQr('https://peta.contoh.id/v/abc?o=0123456789ab');
    const [background, dark] = qrShapes(matrix, 10, 20, 290);
    const modules = matrix.length + 8;
    const cell = 290 / modules;
    expect(background?.type).toBe('path');
    if (dark?.type !== 'path') throw new Error('modul gelap hilang');
    const area = dark.rings.reduce((sum, ring) => {
      const [a, b, , d] = ring as [number, number][];
      return sum + ((b?.[0] ?? 0) - (a?.[0] ?? 0)) * ((d?.[1] ?? 0) - (a?.[1] ?? 0));
    }, 0);
    const darkCount = matrix.flat().filter(Boolean).length;
    expect(area / (cell * cell)).toBeCloseTo(darkCount, 6);
    const first = dark.rings[0]?.[0] as [number, number];
    expect(first[0]).toBeGreaterThanOrEqual(10 + 4 * cell - 1e-9);
    expect(first[1]).toBeCloseTo(20 + 4 * cell, 6);
  });
});

describe('papan "Anda di sini"', () => {
  const base = {
    paper: 'A3' as const,
    venueName: 'RS Contoh',
    place: 'Lobi Utama · GF',
    here: [106.8003, -6.0999] as [number, number],
    headingDeg: 90,
    qr: encodeQr('https://peta.contoh.id/v/abc?o=0123456789ab'),
    url: 'https://peta.contoh.id/v/abc?o=0123456789ab',
    locations: ['Apotek', 'Radiologi', 'Laboratorium'],
    texts: BOARD_TEXTS.id,
    kindLabels: { unit: 'Unit' },
    accent: '#0b5cad',
  };

  it('A3 potret berisi judul, tempat, legenda, daftar lokasi, ajakan pindai, dan URL', () => {
    const layout = buildBoardLayout(floor, base);
    expect([layout.width, layout.height].map(Math.round)).toEqual([842, 1191]);
    const texts = layout.shapes.flatMap((s) => (s.type === 'text' ? [s.text] : []));
    expect(texts).toEqual(
      expect.arrayContaining([
        'RS Contoh',
        'Anda di sini',
        'Lobi Utama · GF',
        'Legenda',
        'Unit',
        'Lokasi utama',
        'Apotek',
        'Radiologi',
        'Laboratorium',
        'Pindai untuk petunjuk arah',
        'dari titik ini',
        'peta.contoh.id/v/abc?o=0123456789ab',
        'U',
      ]),
    );
  });

  it('bahasa Inggris dan ukuran A2', () => {
    const layout = buildBoardLayout(floor, { ...base, paper: 'A2', texts: BOARD_TEXTS.en });
    expect([layout.width, layout.height].map(Math.round)).toEqual([1191, 1684]);
    const texts = layout.shapes.flatMap((s) => (s.type === 'text' ? [s.text] : []));
    expect(texts).toEqual(expect.arrayContaining(['You are here', 'Main locations', 'N']));
  });
});

describe('lembar stiker QR', () => {
  it('20 lokasi menjadi lembar A4 berisi stiker 5 × 5 cm; nama panjang dipotong', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      name: i === 0 ? 'Instalasi Gawat Darurat dan Ruang Tindakan Khusus' : `Lokasi ${i + 1}`,
      qr: encodeQr(`https://peta.contoh.id/v/abc?to=l:${i}`),
    }));
    const pages = buildStickerSheets(items, {
      caption: 'Pindai untuk rute ke sini',
      venueName: 'RS',
    });
    const perPage = 15;
    expect(pages).toHaveLength(Math.ceil(20 / perPage));
    const names = pages.flatMap((page) =>
      page.shapes.flatMap((s) => (s.type === 'text' && s.bold ? [s.text] : [])),
    );
    expect(names).toHaveLength(20);
    expect(names[0]?.endsWith('…')).toBe(true);
    expect(names[19]).toBe('Lokasi 20');
    const outline = pages[0]?.shapes.find((s) => s.type === 'path' && s.stroke);
    if (outline?.type !== 'path') throw new Error('garis potong hilang');
    const [a, b] = outline.rings[0] as [number, number][];
    expect((((b?.[0] ?? 0) - (a?.[0] ?? 0)) * 25.4) / 72).toBeCloseTo(50, 6);
  });

  it('PDF banyak halaman: satu objek halaman per lembar', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      name: `L${i}`,
      qr: encodeQr(`x${i}`),
    }));
    const pages = buildStickerSheets(items, { caption: 'c', venueName: 'RS' });
    const text = new TextDecoder('latin1').decode(layoutsToPdf(pages, 'Stiker'));
    expect(text).toContain(`/Count ${pages.length}`);
    expect(text.match(/\/Type \/Page /g)).toHaveLength(pages.length);
  });
});
