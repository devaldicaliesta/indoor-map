import type { Map as MapLibreMap } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { BASEMAP_LAYER_ID, BASEMAP_SOURCE_ID, setBasemap } from '../src/layers/basemap';
import { LAYER_IDS } from '../src/style';

function fakeMap() {
  const calls: string[] = [];
  const layers = new Set<string>([LAYER_IDS.flat]);
  const sources = new Set<string>();
  const map = {
    getLayer: (id: string) => (layers.has(id) ? { id } : undefined),
    getSource: (id: string) => (sources.has(id) ? { id } : undefined),
    addSource: (id: string, spec: { tiles: string[]; attribution: string }) => {
      sources.add(id);
      calls.push(`source ${id} ${spec.tiles[0]} ${spec.attribution}`);
    },
    addLayer: (layer: { id: string }, before?: string) => {
      layers.add(layer.id);
      calls.push(`layer ${layer.id} before ${before}`);
    },
    removeLayer: (id: string) => {
      layers.delete(id);
      calls.push(`remove layer ${id}`);
    },
    removeSource: (id: string) => {
      sources.delete(id);
      calls.push(`remove source ${id}`);
    },
    addControl: () => calls.push('attribution'),
    getStyle: () => ({
      layers: [{ id: LAYER_IDS.background }, ...[...layers].map((id) => ({ id }))],
    }),
  } as unknown as MapLibreMap;
  return { map, calls };
}

describe('peta dasar opsional', () => {
  const basemap = { tileUrl: 'https://tile.contoh.id/{z}/{x}/{y}.png', attribution: '© Contoh' };

  it('tile raster di bawah lantai dengan atribusi; diganti tanpa menumpuk', () => {
    const { map, calls } = fakeMap();
    setBasemap(map, basemap);
    setBasemap(map, { ...basemap, tileUrl: 'https://lain.id/{z}/{x}/{y}.png' });
    expect(calls).toEqual([
      `source ${BASEMAP_SOURCE_ID} ${basemap.tileUrl} © Contoh`,
      `layer ${BASEMAP_LAYER_ID} before ${LAYER_IDS.flat}`,
      'attribution',
      `remove layer ${BASEMAP_LAYER_ID}`,
      `remove source ${BASEMAP_SOURCE_ID}`,
      `source ${BASEMAP_SOURCE_ID} https://lain.id/{z}/{x}/{y}.png © Contoh`,
      `layer ${BASEMAP_LAYER_ID} before ${LAYER_IDS.flat}`,
    ]);
  });

  it('null melepas peta dasar', () => {
    const { map, calls } = fakeMap();
    setBasemap(map, basemap);
    setBasemap(map, null);
    expect(calls.slice(-2)).toEqual([
      `remove layer ${BASEMAP_LAYER_ID}`,
      `remove source ${BASEMAP_SOURCE_ID}`,
    ]);
  });
});
