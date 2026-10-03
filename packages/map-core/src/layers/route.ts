import type { Feature, FeatureCollection } from 'geojson';
import type {
  FilterSpecification,
  GeoJSONSource,
  LayerSpecification,
  Map as MapLibreMap,
} from 'maplibre-gl';
import { prefersReducedMotion } from '../camera';
import { EDIT_COLORS } from '../defaults';
import type { LngLat } from '../georef';

/** Bagian rute di lantai yang tampil (dari `routeOnFloor` di paket routing). */
export interface RouteView {
  lines: LngLat[][];
  origin: LngLat | null;
  destination: LngLat | null;
  /** Titik naik/turun konektor atau keluar/masuk gedung di lantai ini. */
  transfers: LngLat[];
  /** Ruas (≥ 2 titik) atau titik langkah aktif yang disorot; `null` bila tidak ada. */
  active: LngLat[] | null;
}

export const ROUTE_SOURCE_ID = 'route';

export const ROUTE_LAYER_IDS = {
  activeLine: 'route-active-line',
  casing: 'route-casing',
  line: 'route-line',
  flow: 'route-flow',
  activePoint: 'route-active-point',
  transfers: 'route-transfers',
  origin: 'route-origin',
  destination: 'route-destination',
} as const;

/** Token --route; garis bertepi --surface agar terbaca di atas denah dan jalur graf. */
export const ROUTE_COLOR = '#1463ff';
const ROUTE_WIDTH = 6;
const CASING_WIDTH = 2;

type Role = 'line' | 'active' | 'origin' | 'destination' | 'transfer';

/**
 * Pola putus garis aliran per langkah animasi: putusnya bergeser searah rute sehingga arah
 * jalan terlihat tanpa panah (pola animasi garis MapLibre).
 */
const FLOW_DASHES: number[][] = [
  [0, 4, 3],
  [0.5, 4, 2.5],
  [1, 4, 2],
  [1.5, 4, 1.5],
  [2, 4, 1],
  [2.5, 4, 0.5],
  [3, 4, 0],
  [0, 0.5, 3, 3.5],
  [0, 1, 3, 3],
  [0, 1.5, 3, 2.5],
  [0, 2, 3, 2],
  [0, 2.5, 3, 1.5],
  [0, 3, 3, 1],
  [0, 3.5, 3, 0.5],
];
export const ROUTE_FLOW_STEPS = FLOW_DASHES.length;
const FLOW_INTERVAL_MS = 70;
const FLOW_DURATION_MS = 8000;

export function routeFlowDash(step: number): number[] {
  return FLOW_DASHES[((step % ROUTE_FLOW_STEPS) + ROUTE_FLOW_STEPS) % ROUTE_FLOW_STEPS] as number[];
}

const feature = (role: Role, coordinates: LngLat | LngLat[]): Feature => ({
  type: 'Feature',
  geometry: Array.isArray(coordinates[0])
    ? { type: 'LineString', coordinates: coordinates as LngLat[] }
    : { type: 'Point', coordinates: coordinates as LngLat },
  properties: { role },
});

/** Rute sebagai GeoJSON; properti `role` memilih layer. */
export function routeCollection(view: RouteView | null): FeatureCollection {
  if (!view) return { type: 'FeatureCollection', features: [] };
  const active = view.active ?? [];
  const features: Feature[] = [
    ...(active.length > 1 ? [feature('active', active)] : []),
    ...(active.length === 1 && active[0] ? [feature('active', active[0])] : []),
    ...view.lines.filter((line) => line.length > 1).map((line) => feature('line', line)),
    ...view.transfers.map((point) => feature('transfer', point)),
    ...(view.origin ? [feature('origin', view.origin)] : []),
    ...(view.destination ? [feature('destination', view.destination)] : []),
  ];
  return { type: 'FeatureCollection', features };
}

const is = (role: Role, type: 'LineString' | 'Point'): FilterSpecification => [
  'all',
  ['==', ['get', 'role'], role],
  ['==', ['geometry-type'], type],
];

/**
 * Garis rute --route 6 px bertepi putih 2 px (05-desain-ui.md); langkah aktif disorot --signal di
 * bawah garis; asal berupa lingkaran putih bertepi --route, tujuan lingkaran --route, perpindahan
 * lantai lingkaran putih bertepi --ink.
 */
export function routeLayers(color: string = ROUTE_COLOR): LayerSpecification[] {
  const { signal, ink, paper } = EDIT_COLORS;
  const round = { 'line-cap': 'round', 'line-join': 'round' } as const;
  return [
    {
      id: ROUTE_LAYER_IDS.activeLine,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      filter: is('active', 'LineString'),
      layout: round,
      paint: { 'line-color': signal, 'line-width': ROUTE_WIDTH + 4 * CASING_WIDTH + 4 },
    },
    {
      id: ROUTE_LAYER_IDS.casing,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      filter: is('line', 'LineString'),
      layout: round,
      paint: { 'line-color': paper, 'line-width': ROUTE_WIDTH + 2 * CASING_WIDTH },
    },
    {
      id: ROUTE_LAYER_IDS.line,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      filter: is('line', 'LineString'),
      layout: round,
      paint: { 'line-color': color, 'line-width': ROUTE_WIDTH },
    },
    {
      id: ROUTE_LAYER_IDS.flow,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      filter: is('line', 'LineString'),
      layout: round,
      paint: {
        'line-color': paper,
        'line-width': 2,
        'line-opacity': 0.9,
        'line-dasharray': routeFlowDash(0),
      },
    },
    {
      id: ROUTE_LAYER_IDS.activePoint,
      type: 'circle',
      source: ROUTE_SOURCE_ID,
      filter: is('active', 'Point'),
      paint: {
        'circle-radius': 12,
        'circle-color': signal,
        'circle-stroke-color': ink,
        'circle-stroke-width': 1,
      },
    },
    {
      id: ROUTE_LAYER_IDS.transfers,
      type: 'circle',
      source: ROUTE_SOURCE_ID,
      filter: is('transfer', 'Point'),
      paint: {
        'circle-radius': 6,
        'circle-color': paper,
        'circle-stroke-color': ink,
        'circle-stroke-width': 2.5,
      },
    },
    {
      id: ROUTE_LAYER_IDS.origin,
      type: 'circle',
      source: ROUTE_SOURCE_ID,
      filter: is('origin', 'Point'),
      paint: {
        'circle-radius': 7,
        'circle-color': paper,
        'circle-stroke-color': color,
        'circle-stroke-width': 3,
      },
    },
    {
      id: ROUTE_LAYER_IDS.destination,
      type: 'circle',
      source: ROUTE_SOURCE_ID,
      filter: is('destination', 'Point'),
      paint: {
        'circle-radius': 8,
        'circle-color': color,
        'circle-stroke-color': paper,
        'circle-stroke-width': 3,
      },
    },
  ];
}

const appliedColors = new WeakMap<MapLibreMap, string>();

/**
 * Menggambar rute lantai yang tampil; `null` menghapusnya. Layer rute dijaga tetap di atas fitur
 * dan graf, tetapi di bawah lapisan sunting terra-draw (`td-*`). `color` adalah warna rute venue
 * (branding); garis, tepi asal, dan isi tujuan mengikutinya.
 */
export function setRoute(
  map: MapLibreMap,
  view: RouteView | null,
  color: string = ROUTE_COLOR,
): void {
  if (!map.getSource(ROUTE_SOURCE_ID)) {
    map.addSource(ROUTE_SOURCE_ID, { type: 'geojson', data: routeCollection(null) });
    for (const layer of routeLayers(color)) map.addLayer(layer);
  } else if (appliedColors.get(map) !== color) {
    map.setPaintProperty(ROUTE_LAYER_IDS.line, 'line-color', color);
    map.setPaintProperty(ROUTE_LAYER_IDS.origin, 'circle-stroke-color', color);
    map.setPaintProperty(ROUTE_LAYER_IDS.destination, 'circle-color', color);
  }
  appliedColors.set(map, color);
  const before = map.getStyle().layers.find((layer) => layer.id.startsWith('td-'))?.id;
  for (const id of Object.values(ROUTE_LAYER_IDS)) map.moveLayer(id, before);
  map.getSource<GeoJSONSource>(ROUTE_SOURCE_ID)?.setData(routeCollection(view));
  if (view?.lines.length) startRouteFlow(map);
}

const flows = new WeakMap<MapLibreMap, { timer: number; until: number; step: number }>();

/**
 * Menggerakkan pola putus garis aliran selama beberapa detik setiap rute berganti, lalu diam
 * agar peta tidak menggambar ulang terus (baterai HP). Tidak bergerak bila tab tersembunyi atau
 * pengguna meminta gerak dikurangi (`prefers-reduced-motion`).
 */
function startRouteFlow(map: MapLibreMap): void {
  if (typeof window === 'undefined' || prefersReducedMotion()) return;
  const flow = flows.get(map);
  const until = Date.now() + FLOW_DURATION_MS;
  if (flow) {
    flow.until = until;
    return;
  }
  const state = { timer: 0, until, step: 0 };
  state.timer = window.setInterval(() => {
    if (Date.now() > state.until || document.hidden || !map.getLayer(ROUTE_LAYER_IDS.flow)) return;
    state.step += 1;
    map.setPaintProperty(ROUTE_LAYER_IDS.flow, 'line-dasharray', routeFlowDash(state.step));
  }, FLOW_INTERVAL_MS);
  flows.set(map, state);
  map.once('remove', () => window.clearInterval(state.timer));
}
