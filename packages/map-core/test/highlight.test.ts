import type { LayerSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { FLOOR_3D_SOURCE_ID } from '../src/extrude';
import { HIGHLIGHT_COLORS, highlightFilters, highlightLayers } from '../src/layers/highlight';
import { LABEL_LAYER_ID, type LabelFont } from '../src/layers/labels';
import {
  buildStyle,
  FLOOR_SOURCE_ID,
  HIGHLIGHT_LAYER_IDS,
  LAYER_IDS,
  LAYERS_2D_ONLY,
  LAYERS_3D_ONLY,
} from '../src/style';

const FONT: LabelFont = { name: 'Label', faces: [{ url: '/label.woff2' }] };
const listed = ['in', ['get', 'id'], ['literal', ['u1', 'f1']]];

const paint = (layer: LayerSpecification | undefined) =>
  (layer && 'paint' in layer ? layer.paint : {}) as Record<string, unknown>;

describe('sorotan pilihan pengunjung', () => {
  const layers = highlightLayers(['u1', 'f1']);
  const byId = (id: string) => layers.find((l) => l.layer.id === id);

  it('ruang terpilih memakai warna unit terpilih dari tabel warna peta', () => {
    const fill = byId(HIGHLIGHT_LAYER_IDS.fill)?.layer;
    const line = byId(HIGHLIGHT_LAYER_IDS.line)?.layer;
    expect(HIGHLIGHT_COLORS).toEqual({ fill: '#ffe9a8', line: '#111418' });
    expect(paint(fill)['fill-color']).toBe(HIGHLIGHT_COLORS.fill);
    expect(paint(line)['line-color']).toBe(HIGHLIGHT_COLORS.line);
    for (const layer of [fill, line]) {
      expect(layer && 'source' in layer && layer.source).toBe(FLOOR_SOURCE_ID);
      expect(layer && 'filter' in layer && layer.filter).toContainEqual(listed);
    }
  });

  it('di 3D ruang terpilih diekstrusi ulang dan disembunyikan dari layer ekstrusi biasa', () => {
    const extrusion = byId(HIGHLIGHT_LAYER_IDS.extrusion)?.layer;
    expect(extrusion?.type).toBe('fill-extrusion');
    expect(extrusion && 'source' in extrusion && extrusion.source).toBe(FLOOR_3D_SOURCE_ID);
    expect(paint(extrusion)['fill-extrusion-color']).toBe(HIGHLIGHT_COLORS.fill);
    expect(paint(extrusion)['fill-extrusion-height']).toEqual(['get', 'extrude']);
    expect(highlightFilters(['u1', 'f1'])[LAYER_IDS.extrusion]).toEqual([
      'all',
      ['!', ['has', 'edge']],
      ['!', listed],
    ]);
  });

  it('fasilitas diberi lingkaran di bawah label agar ikon tetap terbaca', () => {
    const point = byId(HIGHLIGHT_LAYER_IDS.point);
    expect(point?.layer.type).toBe('circle');
    expect(point?.before).toBe(LABEL_LAYER_ID);
  });

  it('disisipkan di bawah dinding, tepi ekstrusi, dan label yang ada di style Visitor', () => {
    const ids = buildStyle({}, { labelFont: FONT }).layers.map((l) => l.id);
    for (const { before } of layers) expect(ids).toContain(before);
  });

  it('ikut beralih bersama mode 2D/3D', () => {
    expect(LAYERS_2D_ONLY).toEqual(
      expect.arrayContaining([HIGHLIGHT_LAYER_IDS.fill, HIGHLIGHT_LAYER_IDS.line]),
    );
    expect(LAYERS_3D_ONLY).toContain(HIGHLIGHT_LAYER_IDS.extrusion);
  });

  it('daftar kosong tidak menyorot apa pun', () => {
    const filters = highlightFilters([]);
    expect(filters[HIGHLIGHT_LAYER_IDS.fill]).toContainEqual([
      'in',
      ['get', 'id'],
      ['literal', []],
    ]);
  });
});
