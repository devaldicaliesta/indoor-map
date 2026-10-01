import type { Map as MapLibreMap } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { floorFeatureAt, LAYER_IDS, pickAt } from '../src';

function fakeMap(hits: Record<string, string>) {
  const queried: string[][] = [];
  const map = {
    getLayer: () => ({}),
    queryRenderedFeatures: (_point: unknown, options: { layers: string[] }) => {
      queried.push(options.layers);
      const layer = options.layers.find((id) => hits[id]);
      return layer ? [{ properties: { id: hits[layer] } }] : [];
    },
  } as unknown as MapLibreMap;
  return { map, queried };
}

describe('memilih fitur lantai', () => {
  it('Admin bisa memilih koridor dan Area Luar; ketukan pengunjung tidak', () => {
    const { map } = fakeMap({ [LAYER_IDS.flat]: 'koridor' });
    expect(floorFeatureAt(map, { x: 5, y: 5 })).toBe('koridor');
    expect(pickAt(map, { x: 5, y: 5 })).toBeNull();
  });

  it('ruang di atas koridor didahulukan sesuai urutan hasil peta', () => {
    const { map, queried } = fakeMap({ [LAYER_IDS.rooms]: 'unit' });
    expect(floorFeatureAt(map, { x: 5, y: 5 })).toBe('unit');
    expect(queried.at(-1)).toContain(LAYER_IDS.flat);
  });
});
