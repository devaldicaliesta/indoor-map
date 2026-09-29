import type { LayerSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import {
  REFERENCE_LAYER_IDS,
  REFERENCE_OPACITY,
  referenceFeatureLayers,
} from '../src/layers/reference';
import { buildStyleLayers } from '../src/style';

const paint = (layer: LayerSpecification) =>
  ('paint' in layer ? layer.paint : {}) as Record<string, unknown>;

describe('referenceFeatureLayers', () => {
  const layers = referenceFeatureLayers();

  it('fitur non-konektor samar: opasitas isi dan garis tidak lebih dari 50%, garis putus-putus', () => {
    const fill = layers.find((l) => l.id === REFERENCE_LAYER_IDS.fill);
    const outline = layers.find((l) => l.id === REFERENCE_LAYER_IDS.outline);
    expect(paint(fill as LayerSpecification)['fill-opacity']).toBeLessThanOrEqual(
      REFERENCE_OPACITY,
    );
    expect(paint(outline as LayerSpecification)['line-opacity']).toBeLessThanOrEqual(0.5);
    expect(paint(outline as LayerSpecification)['line-dasharray']).toBeDefined();
  });

  it('konektor vertikal ditonjolkan lebih kuat dari fitur lain', () => {
    const connector = layers.find((l) => l.id === REFERENCE_LAYER_IDS.connectorFill);
    expect(paint(connector as LayerSpecification)['fill-opacity']).toBeGreaterThan(
      REFERENCE_OPACITY,
    );
    expect(JSON.stringify(connector && 'filter' in connector ? connector.filter : null)).toContain(
      'elevator',
    );
  });

  it('memakai source dan id sendiri, terpisah dari lantai yang disunting', () => {
    const editable = new Set(buildStyleLayers().map((l) => l.id));
    for (const layer of layers) {
      expect(editable.has(layer.id)).toBe(false);
      expect('source' in layer && layer.source).toBe('ref-floor');
    }
  });
});
