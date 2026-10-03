import type { MapLabel } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import {
  buildStyle,
  LABEL_LAYER_ID,
  LABEL_SOURCE_ID,
  LAYER_IDS,
  type LabelFont,
  labelCollection,
} from '../src';

const FONT: LabelFont = {
  name: 'Atkinson Hyperlegible Bold',
  faces: [
    { url: '/assets/atkinson-latin-700.woff2', unicodeRange: ['U+0000-00FF'] },
    { url: '/assets/atkinson-latin-ext-700.woff2' },
  ],
};

describe('label Visitor', () => {
  const style = buildStyle({}, { labelFont: FONT });
  const label = style.layers.find((l) => l.id === LABEL_LAYER_ID);

  it('font label berasal dari berkas yang di-host sendiri, tanpa server glyph', () => {
    expect(style['font-faces']).toEqual({
      'Atkinson Hyperlegible Bold': [
        { url: '/assets/atkinson-latin-700.woff2', 'unicode-range': ['U+0000-00FF'] },
        { url: '/assets/atkinson-latin-ext-700.woff2' },
      ],
    });
    expect(style.glyphs).toBeUndefined();
    expect(JSON.stringify(style)).not.toMatch(/https?:\/\//);
  });

  it('satu layer label di atas semua layer, dari source label sendiri', () => {
    expect(style.sources[LABEL_SOURCE_ID]?.type).toBe('geojson');
    expect(style.layers.at(-1)?.id).toBe(LABEL_LAYER_ID);
    expect(label?.type).toBe('symbol');
  });

  it('label dan ikon yang bertumpuk disembunyikan menurut prioritas', () => {
    const layout = label?.type === 'symbol' ? label.layout : undefined;
    expect(layout?.['symbol-sort-key']).toEqual(['get', 'priority']);
    expect(layout?.['text-allow-overlap']).toBe(false);
    expect(layout?.['icon-allow-overlap']).toBe(false);
    expect(layout?.['text-font']).toEqual(['Atkinson Hyperlegible Bold']);
    const paint = label?.type === 'symbol' ? label.paint : undefined;
    expect(paint?.['text-halo-width']).toBe(1.5);
    // Ikon POI lokasi di atas namanya, seperti penanda peta indoor komersial.
    expect(layout?.['icon-image']).toEqual(['get', 'icon']);
    expect(JSON.stringify(layout?.['text-anchor'])).toContain('top');
  });

  it('ikon fasilitas editor yang selalu tampil tidak dipakai Visitor', () => {
    expect(style.layers.some((l) => l.id === LAYER_IDS.facilities)).toBe(false);
    const editor = buildStyle();
    expect(editor.layers.some((l) => l.id === LAYER_IDS.facilities)).toBe(true);
    expect(editor.layers.some((l) => l.id === LABEL_LAYER_ID)).toBe(false);
    expect(editor['font-faces']).toBeUndefined();
  });

  it('label menjadi titik GeoJSON dengan properti per jenis', () => {
    const labels: MapLabel[] = [
      {
        kind: 'location',
        id: 'loc',
        floorId: 'f',
        name: 'Radiologi',
        categoryId: 'cat',
        position: [106.8, -6.1],
        priority: 2,
      },
      {
        kind: 'location',
        id: 'loc2',
        floorId: 'f',
        name: 'Gudang',
        categoryId: null,
        position: [106.7, -6.1],
        priority: 2,
      },
      {
        kind: 'facility',
        id: 'fac',
        floorId: 'f',
        facilityTypeId: 'ft',
        position: [106.9, -6.2],
        priority: 1,
      },
    ];
    expect(labelCollection(labels).features).toEqual([
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [106.8, -6.1] },
        properties: {
          kind: 'location',
          id: 'loc',
          name: 'Radiologi',
          icon: 'facility-category-cat',
          priority: 2,
        },
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [106.7, -6.1] },
        properties: { kind: 'location', id: 'loc2', name: 'Gudang', icon: '', priority: 2 },
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [106.9, -6.2] },
        properties: { kind: 'facility', id: 'fac', icon: 'facility-ft', priority: 1 },
      },
    ]);
  });
});
