import type { FeatureCollection } from 'geojson';
import type { LayerSpecification, Map as MapLibreMap } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import type { LngLat } from '../src/georef';
import {
  ROUTE_COLOR,
  ROUTE_FLOW_STEPS,
  ROUTE_LAYER_IDS,
  type RouteView,
  routeCollection,
  routeFlowDash,
  routeLayers,
  setRoute,
} from '../src/layers/route';

const a: LngLat = [106.8271, -6.1753];
const b: LngLat = [106.8273, -6.1753];
const c: LngLat = [106.8273, -6.1755];
const view: RouteView = {
  lines: [[a, b, c], [c]],
  origin: a,
  destination: null,
  transfers: [c],
  active: [a, b],
};

const roles = (collection: FeatureCollection) =>
  collection.features.map((f) => `${f.properties?.role}:${f.geometry.type}`);
const paint = (l: LayerSpecification) =>
  ('paint' in l ? (l.paint ?? {}) : {}) as Record<string, unknown>;

describe('lapisan rute', () => {
  it('garis, penanda, dan sorotan langkah aktif; garis satu titik dibuang', () => {
    expect(roles(routeCollection(view))).toEqual([
      'active:LineString',
      'line:LineString',
      'transfer:Point',
      'origin:Point',
    ]);
    expect(roles(routeCollection({ ...view, active: [b], destination: c }))).toEqual([
      'active:Point',
      'line:LineString',
      'transfer:Point',
      'origin:Point',
      'destination:Point',
    ]);
    expect(routeCollection(null).features).toEqual([]);
  });

  it('garis --route 6 px bertepi putih 2 px, sorotan di bawahnya, penanda di atasnya', () => {
    const layers = routeLayers();
    expect(layers.map((l) => l.id)).toEqual([
      ROUTE_LAYER_IDS.activeLine,
      ROUTE_LAYER_IDS.casing,
      ROUTE_LAYER_IDS.line,
      ROUTE_LAYER_IDS.flow,
      ROUTE_LAYER_IDS.activePoint,
      ROUTE_LAYER_IDS.transfers,
      ROUTE_LAYER_IDS.origin,
      ROUTE_LAYER_IDS.destination,
    ]);
    const byId = new Map(layers.map((l) => [l.id, paint(l)]));
    expect(byId.get(ROUTE_LAYER_IDS.line)).toMatchObject({
      'line-color': ROUTE_COLOR,
      'line-width': 6,
    });
    expect(byId.get(ROUTE_LAYER_IDS.casing)).toMatchObject({
      'line-color': '#ffffff',
      'line-width': 10,
    });
    expect(byId.get(ROUTE_LAYER_IDS.destination)?.['circle-color']).toBe(ROUTE_COLOR);
  });

  it('dibuat sekali, dijaga di bawah lapisan terra-draw, lalu datanya diganti', () => {
    const calls: string[] = [];
    let added = false;
    const map = {
      getSource: () =>
        added
          ? { setData: (data: FeatureCollection) => calls.push(`data ${data.features.length}`) }
          : undefined,
      addSource: () => {
        added = true;
        calls.push('source');
      },
      addLayer: (layer: LayerSpecification) => calls.push(`layer ${layer.id}`),
      getStyle: () => ({ layers: [{ id: 'units' }, { id: 'td-polygon' }] }),
      moveLayer: (id: string, before?: string) => calls.push(`move ${id} ${before}`),
    } as unknown as MapLibreMap;
    setRoute(map, view);
    setRoute(map, null);
    expect(calls.filter((call) => call === 'source')).toHaveLength(1);
    expect(calls.filter((call) => call.startsWith('layer'))).toHaveLength(8);
    expect(calls).toContain(`move ${ROUTE_LAYER_IDS.destination} td-polygon`);
    expect(calls.filter((call) => call.startsWith('data'))).toEqual(['data 4', 'data 0']);
  });

  it('warna rute venue dipakai saat dibuat dan diganti hanya bila berubah', () => {
    const painted: string[] = [];
    let added = false;
    const map = {
      getSource: () => (added ? { setData: () => undefined } : undefined),
      addSource: () => {
        added = true;
      },
      addLayer: (layer: LayerSpecification) => {
        if (layer.id === ROUTE_LAYER_IDS.line) painted.push(`add ${paint(layer)['line-color']}`);
      },
      getStyle: () => ({ layers: [] }),
      moveLayer: () => undefined,
      setPaintProperty: (id: string, name: string, value: string) =>
        painted.push(`${id} ${name} ${value}`),
    } as unknown as MapLibreMap;
    setRoute(map, view, '#e4002b');
    setRoute(map, null, '#e4002b');
    setRoute(map, view, '#0b1f4d');
    expect(painted).toEqual([
      'add #e4002b',
      `${ROUTE_LAYER_IDS.line} line-color #0b1f4d`,
      `${ROUTE_LAYER_IDS.origin} circle-stroke-color #0b1f4d`,
      `${ROUTE_LAYER_IDS.destination} circle-color #0b1f4d`,
    ]);
    expect(paint(routeLayers('#0b1f4d')[2] as LayerSpecification)['line-color']).toBe('#0b1f4d');
  });

  it('garis aliran putih di atas rute; pola putusnya bergeser per langkah dan berulang', () => {
    const flow = routeLayers().find((l) => l.id === ROUTE_LAYER_IDS.flow);
    expect(flow?.type).toBe('line');
    expect(paint(flow as LayerSpecification)['line-color']).toBe('#ffffff');
    const ids = routeLayers().map((l) => l.id);
    expect(ids.indexOf(ROUTE_LAYER_IDS.flow)).toBe(ids.indexOf(ROUTE_LAYER_IDS.line) + 1);
    expect(routeFlowDash(0)).not.toEqual(routeFlowDash(1));
    expect(routeFlowDash(ROUTE_FLOW_STEPS)).toEqual(routeFlowDash(0));
  });
});
