import type { LayerSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { MUTED_LAYER_IDS, mutedLayers } from '../src/layers/muted';
import { FLOOR_SOURCE_ID } from '../src/style';

const paint = (layer: LayerSpecification | undefined) =>
  (layer && 'paint' in layer ? layer.paint : {}) as Record<string, unknown>;

describe('mutedLayers', () => {
  const layers = mutedLayers(['a', 'b']);

  it('hanya poligon dengan id yang disebut, dari source lantai', () => {
    for (const layer of layers) {
      expect('source' in layer && layer.source).toBe(FLOOR_SOURCE_ID);
      expect('filter' in layer && layer.filter).toEqual([
        'all',
        ['==', ['geometry-type'], 'Polygon'],
        ['in', ['get', 'id'], ['literal', ['a', 'b']]],
      ]);
    }
  });

  it('abu pekat dengan garis putus-putus, berbeda dari sorotan seleksi', () => {
    const fill = layers.find((l) => l.id === MUTED_LAYER_IDS.fill);
    const line = layers.find((l) => l.id === MUTED_LAYER_IDS.line);
    expect(paint(fill)['fill-color']).toBe('#d5d9de');
    expect(paint(line)['line-dasharray']).toEqual([2, 2]);
  });
});
