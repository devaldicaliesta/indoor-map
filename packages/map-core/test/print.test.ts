import type { MapFeatureProperties } from '@indoor/domain';
import type { Feature, Geometry } from 'geojson';
import { describe, expect, it } from 'vitest';
import type { FloorFeatureCollection } from '../src/map';
import {
  buildPrintLayout,
  layoutToPdf,
  layoutToSvg,
  type PrintOptions,
  paperPoints,
} from '../src/print';

const box = (x: number, y: number, size = 0.0002) => [
  [
    [x, y],
    [x + size, y],
    [x + size, y + size],
    [x, y + size],
    [x, y],
  ],
];

const feature = (
  id: string,
  geometry: Geometry,
  properties: Partial<MapFeatureProperties>,
): Feature<Geometry, MapFeatureProperties> => ({
  type: 'Feature',
  id,
  geometry,
  properties: { id, kind: 'unit', floorId: 'f', ...properties },
});

const floor: FloorFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    feature('a', { type: 'Polygon', coordinates: box(106.8, -6.1) }, { name: 'Radiologi' }),
    feature('b', { type: 'Polygon', coordinates: box(106.8003, -6.0997) }, { unitCode: 'GF-02' }),
    feature(
      'w',
      {
        type: 'LineString',
        coordinates: [
          [106.8, -6.1],
          [106.8005, -6.1],
        ],
      },
      { kind: 'wall' },
    ),
    feature('e', { type: 'Point', coordinates: [106.8001, -6.1] }, { kind: 'exit' }),
  ],
};

const options: PrintOptions = {
  title: 'RS Contoh — Gedung Utama GF',
  subtitle: 'Denah lantai',
  footer: 'Dicetak 16 November 2026',
  paper: 'A3',
  orientation: 'landscape',
  kindLabels: { unit: 'Unit', wall: 'Dinding', exit: 'Pintu keluar' },
  legendTitle: 'Legenda',
  northLabel: 'U',
};

const texts = (layout: ReturnType<typeof buildPrintLayout>) =>
  layout.shapes.flatMap((s) => (s.type === 'text' ? [s.text] : []));

describe('buildPrintLayout', () => {
  it('A3 lanskap berisi judul, legenda jenis yang ada, arah utara, skala, dan nama ruang', () => {
    const layout = buildPrintLayout(floor, options);
    expect([layout.width, layout.height].map(Math.round)).toEqual([1191, 842]);
    expect(texts(layout)).toEqual(
      expect.arrayContaining([
        options.title,
        'Denah lantai',
        'Legenda',
        'Unit',
        'Dinding',
        'Pintu keluar',
        'U',
        'Radiologi',
        'GF-02',
        'Dicetak 16 November 2026',
      ]),
    );
    expect(texts(layout).some((t) => /^\d+ m$/.test(t))).toBe(true);
  });

  it('utara di atas: ruang di lintang lebih tinggi digambar lebih atas, semua di dalam kertas', () => {
    const layout = buildPrintLayout(floor, options);
    const label = (name: string) =>
      layout.shapes.find((s) => s.type === 'text' && s.text === name) as { x: number; y: number };
    expect(label('GF-02').y).toBeLessThan(label('Radiologi').y);
    expect(label('GF-02').x).toBeGreaterThan(label('Radiologi').x);
    for (const shape of layout.shapes) {
      const points =
        shape.type === 'path' ? shape.rings.flat() : [[shape.x, shape.y] as [number, number]];
      for (const [x, y] of points) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(layout.width);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(layout.height);
      }
    }
  });

  it('potret menaruh legenda di bawah peta', () => {
    const layout = buildPrintLayout(floor, { ...options, orientation: 'portrait' });
    expect([layout.width, layout.height].map(Math.round)).toEqual([842, 1191]);
    const legend = layout.shapes.find((s) => s.type === 'text' && s.text === 'Legenda');
    expect(legend && legend.type === 'text' && legend.y).toBeGreaterThan(layout.height / 2);
  });
});

describe('layoutToSvg', () => {
  it('SVG ukuran kertas dengan teks yang di-escape', () => {
    const svg = layoutToSvg(buildPrintLayout(floor, { ...options, title: 'Mal <A & B>' }));
    expect(svg).toContain('width="420mm" height="297mm"');
    expect(svg).toContain('<title>Mal &lt;A &amp; B&gt;</title>');
    expect(svg).toContain('>Radiologi</text>');
    expect(svg.match(/<path /g)?.length).toBeGreaterThan(3);
  });
});

describe('layoutToPdf', () => {
  it('PDF satu halaman A3 dengan xref yang menunjuk ke setiap objek', () => {
    expect(paperPoints('A3', 'landscape').map((v) => v.toFixed(2))).toEqual(['1190.55', '841.89']);
    const bytes = layoutToPdf(buildPrintLayout(floor, { ...options, title: 'Lobi (Utama) — 東' }));
    const text = String.fromCharCode(...bytes);
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain('/MediaBox [0 0 1190.55 841.89]');
    expect(text).toContain(`${String.raw`(Lobi \(Utama\) `}\u0097 ?) Tj`);
    const xref = Number(/startxref\n(\d+)/.exec(text)?.[1]);
    expect(text.slice(xref, xref + 4)).toBe('xref');
    const offsets = [...text.slice(xref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) =>
      Number(m[1]),
    );
    expect(offsets).toHaveLength(7);
    offsets.forEach((offset, index) => {
      expect(text.startsWith(`${index + 1} 0 obj\n`, offset)).toBe(true);
    });
    const length = Number(/\/Length (\d+) >>\nstream\n/.exec(text)?.[1]);
    const start = text.indexOf('stream\n') + 'stream\n'.length;
    expect(text.slice(start + length, start + length + 10)).toBe('\nendstream');
  });
});
