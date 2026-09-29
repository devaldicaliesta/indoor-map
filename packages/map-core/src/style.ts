import type { FeatureKind } from '@indoor/domain';
import type { ExpressionSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl';
import {
  DEFAULT_FILL,
  DEFAULT_HEIGHTS,
  DEFAULT_OUTLINE,
  MAP_BACKGROUND,
  POINT_COLOR,
  VACANT_UNIT,
} from './defaults';

export const FLOOR_SOURCE_ID = 'floor';

/** Bagian display_settings yang memengaruhi style (FR-VIS-01..03). */
export interface MapDisplay {
  heights?: Partial<Record<FeatureKind, number>>;
  colors?: Partial<Record<FeatureKind, string>>;
}

/** Id layer yang dipakai setViewMode dan editor. */
export const LAYER_IDS = {
  background: 'background',
  flat: 'floor-flat',
  rooms: 'floor-rooms',
  roomOutline: 'floor-room-outline',
  vacantOutline: 'floor-vacant-outline',
  walls: 'floor-walls',
  extrusion: 'floor-extrusion',
  points: 'floor-points',
} as const;

/** Layer yang hanya tampil di mode 2D / 3D. */
export const LAYERS_2D_ONLY = [LAYER_IDS.rooms, LAYER_IDS.roomOutline, LAYER_IDS.vacantOutline];
export const LAYERS_3D_ONLY = [LAYER_IDS.extrusion];

const FLAT_KINDS: FeatureKind[] = ['outdoor_area', 'corridor', 'non_walkable'];
const ROOM_KINDS: FeatureKind[] = ['unit', 'elevator', 'escalator', 'stairs'];
const POINT_KINDS: FeatureKind[] = ['door', 'exit', 'facility', 'landmark'];

const kind: ExpressionSpecification = ['get', 'kind'];
const isVacant: ExpressionSpecification = ['==', ['get', 'unitStatus'], 'vacant'];
const isPolygon: ExpressionSpecification = [
  'match',
  ['geometry-type'],
  ['Polygon', 'MultiPolygon'],
  true,
  false,
];

function kindIn(kinds: FeatureKind[]): ExpressionSpecification {
  return ['match', kind, kinds, true, false];
}

/** `match` per jenis fitur dengan fallback. */
function byKind(
  values: Partial<Record<FeatureKind, string | number>>,
  fallback: string | number,
): ExpressionSpecification {
  const pairs = Object.entries(values).flatMap(([k, v]) => [k, v]);
  // `match` butuh minimal satu pasangan; label mustahil dipakai saat tidak ada entri.
  const body = pairs.length ? pairs : ['__none__', fallback];
  return ['match', kind, ...body, fallback] as ExpressionSpecification;
}

/** Warna per fitur: override fitur → unit kosong → warna venue/default per jenis. */
function fillColor(display: MapDisplay): ExpressionSpecification {
  return [
    'coalesce',
    ['get', 'color'],
    ['case', isVacant, VACANT_UNIT.fill, byKind({ ...DEFAULT_FILL, ...display.colors }, '#ffffff')],
  ] as ExpressionSpecification;
}

function height(display: MapDisplay): ExpressionSpecification {
  return [
    'coalesce',
    ['get', 'height'],
    byKind({ ...DEFAULT_HEIGHTS, ...display.heights }, 0),
  ] as ExpressionSpecification;
}

/** Layer 2D dan 3D per `feature_kind`; tanpa WebGL sehingga bisa diuji langsung. */
export function buildStyleLayers(display: MapDisplay = {}): LayerSpecification[] {
  const source = FLOOR_SOURCE_ID;
  return [
    {
      id: LAYER_IDS.flat,
      type: 'fill',
      source,
      filter: ['all', isPolygon, kindIn(FLAT_KINDS)],
      paint: { 'fill-color': fillColor(display) },
    },
    {
      id: LAYER_IDS.rooms,
      type: 'fill',
      source,
      filter: ['all', isPolygon, kindIn(ROOM_KINDS)],
      paint: { 'fill-color': fillColor(display) },
    },
    {
      id: LAYER_IDS.roomOutline,
      type: 'line',
      source,
      filter: ['all', isPolygon, kindIn(ROOM_KINDS), ['!', isVacant]],
      paint: { 'line-color': byKind(DEFAULT_OUTLINE, '#bfc5cc'), 'line-width': 1 },
    },
    {
      id: LAYER_IDS.vacantOutline,
      type: 'line',
      source,
      filter: ['all', isPolygon, isVacant],
      paint: { 'line-color': VACANT_UNIT.outline, 'line-width': 1, 'line-dasharray': [2, 2] },
    },
    {
      id: LAYER_IDS.walls,
      type: 'line',
      source,
      filter: ['==', kind, 'wall'],
      paint: {
        'line-color': ['coalesce', ['get', 'color'], DEFAULT_OUTLINE.wall ?? '#8a929b'],
        'line-width': 2,
      },
    },
    {
      id: LAYER_IDS.extrusion,
      type: 'fill-extrusion',
      source,
      filter: ['all', isPolygon, kindIn(ROOM_KINDS)],
      layout: { visibility: 'none' },
      paint: {
        'fill-extrusion-color': fillColor(display),
        'fill-extrusion-height': height(display),
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.92,
      },
    },
    {
      id: LAYER_IDS.points,
      type: 'circle',
      source,
      filter: ['all', ['==', ['geometry-type'], 'Point'], kindIn(POINT_KINDS)],
      paint: { 'circle-radius': 3, 'circle-color': POINT_COLOR },
    },
  ];
}

/** Style tanpa basemap internet: hanya latar dan data lantai dari snapshot/editor. */
export function buildStyle(display: MapDisplay = {}): StyleSpecification {
  return {
    version: 8,
    sources: {
      [FLOOR_SOURCE_ID]: { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
    },
    layers: [
      {
        id: LAYER_IDS.background,
        type: 'background',
        paint: { 'background-color': MAP_BACKGROUND },
      },
      ...buildStyleLayers(display),
    ],
  };
}
