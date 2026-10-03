import type { FeatureKind } from '@indoor/domain';
import type { ExpressionSpecification, LayerSpecification, StyleSpecification } from 'maplibre-gl';
import {
  DEFAULT_FILL,
  DEFAULT_HEIGHTS,
  DEFAULT_OUTLINE,
  MAP_BACKGROUND,
  OUTDOOR_SUBTYPE_FILL,
  POINT_COLOR,
  POINT_STYLE,
  VACANT_UNIT,
} from './defaults';
import { FLOOR_3D_SOURCE_ID, ROOM_KINDS as ROOM_KINDS_3D } from './extrude';
import { LABEL_SOURCE_ID, type LabelFont, labelFontFaces, labelLayer } from './layers/labels';
import { FACILITY_ICON_COLORS, FACILITY_ICON_PREFIX } from './sprites';

export const FLOOR_SOURCE_ID = 'floor';

/** Bagian display_settings yang memengaruhi style. */
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
  extrusionEdges: 'floor-extrusion-edges',
  points: 'floor-points',
  facilities: 'floor-facilities',
} as const;

/** Sorotan pilihan pengunjung (layers/highlight.ts); ditambahkan saat pertama dipakai. */
export const HIGHLIGHT_LAYER_IDS = {
  fill: 'floor-highlight-fill',
  line: 'floor-highlight-line',
  extrusion: 'floor-highlight-extrusion',
  point: 'floor-highlight-point',
} as const;

/** Layer yang hanya tampil di mode 2D / 3D; yang belum ada di peta dilewati. */
export const LAYERS_2D_ONLY = [
  LAYER_IDS.rooms,
  LAYER_IDS.roomOutline,
  LAYER_IDS.vacantOutline,
  HIGHLIGHT_LAYER_IDS.fill,
  HIGHLIGHT_LAYER_IDS.line,
];
export const LAYERS_3D_ONLY = [
  LAYER_IDS.extrusion,
  LAYER_IDS.extrusionEdges,
  HIGHLIGHT_LAYER_IDS.extrusion,
];

const FLAT_KINDS: FeatureKind[] = ['outdoor_area', 'corridor', 'non_walkable'];
const ROOM_KINDS: FeatureKind[] = [...ROOM_KINDS_3D];
const POINT_KINDS: FeatureKind[] = ['door', 'exit', 'landmark'];

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
    [
      'case',
      isVacant,
      VACANT_UNIT.fill,
      ['==', kind, 'outdoor_area'],
      [
        'match',
        ['get', 'subtype'],
        'garden',
        OUTDOOR_SUBTYPE_FILL.garden,
        'parking',
        OUTDOOR_SUBTYPE_FILL.parking,
        display.colors?.outdoor_area ?? OUTDOOR_SUBTYPE_FILL.road,
      ],
      byKind({ ...DEFAULT_FILL, ...display.colors }, '#ffffff'),
    ],
  ] as ExpressionSpecification;
}

/** Warna dinding: override fitur → warna venue → default (garis 2D dan ekstrusi 3D). */
function wallColor(display: MapDisplay): ExpressionSpecification {
  return ['coalesce', ['get', 'color'], display.colors?.wall ?? DEFAULT_OUTLINE.wall ?? '#8a929b'];
}

/** Ekstrusi: dinding memakai warna dinding, lainnya warna isi per jenis. */
function extrusionColor(display: MapDisplay): ExpressionSpecification {
  return ['case', ['==', kind, 'wall'], wallColor(display), fillColor(display)];
}

/** Tinggi default gabungan (aplikasi + venue), dipakai builder data 3D. */
export function venueHeights(display: MapDisplay): Partial<Record<FeatureKind, number>> {
  return { ...DEFAULT_HEIGHTS, ...display.heights };
}

const EDGE_COLOR = '#8a929b';

/** Warna bawaan per jenis untuk isian Pengaturan → Tampilan (isi, garis dinding, titik, latar ikon). */
export function defaultKindColor(featureKind: FeatureKind): string {
  if (featureKind === 'wall') return DEFAULT_OUTLINE.wall ?? '#8a929b';
  if (featureKind === 'facility') return FACILITY_ICON_COLORS.normal.background;
  if (featureKind === 'outdoor_area') return OUTDOOR_SUBTYPE_FILL.road;
  return POINT_STYLE[featureKind]?.color ?? DEFAULT_FILL[featureKind] ?? '#ffffff';
}

/** Warna titik (pintu, pintu keluar) dari pengaturan venue. */
function pointColors(display: MapDisplay): Partial<Record<FeatureKind, string>> {
  const colors: Partial<Record<FeatureKind, string>> = {};
  for (const k of ['door', 'exit'] as const) if (display.colors?.[k]) colors[k] = display.colors[k];
  return colors;
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
      // `outline` per fitur: tepi berwarna kategori di Visitor (lihat `categoryUnitColors`).
      paint: {
        'line-color': ['coalesce', ['get', 'outline'], byKind(DEFAULT_OUTLINE, '#bfc5cc')],
        'line-width': 1,
      },
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
      paint: { 'line-color': wallColor(display), 'line-width': 2 },
    },
    {
      // Tinggi sudah dihitung builder 3D (override → venue → default).
      id: LAYER_IDS.extrusion,
      type: 'fill-extrusion',
      source: FLOOR_3D_SOURCE_ID,
      filter: ['!', ['has', 'edge']],
      layout: { visibility: 'none' },
      paint: {
        'fill-extrusion-color': extrusionColor(display),
        'fill-extrusion-height': ['get', 'extrude'],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.92,
      },
    },
    {
      // Pemisah tipis di tepi atas ruang agar unit bersebelahan tidak tampak menyatu.
      id: LAYER_IDS.extrusionEdges,
      type: 'fill-extrusion',
      source: FLOOR_3D_SOURCE_ID,
      filter: ['has', 'edge'],
      layout: { visibility: 'none' },
      paint: {
        'fill-extrusion-color': EDGE_COLOR,
        'fill-extrusion-height': ['get', 'extrude'],
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.92,
      },
    },
    {
      id: LAYER_IDS.points,
      type: 'circle',
      source,
      filter: ['all', ['==', ['geometry-type'], 'Point'], kindIn(POINT_KINDS)],
      paint: {
        'circle-radius': byKind(
          Object.fromEntries(Object.entries(POINT_STYLE).map(([k, v]) => [k, v.radius])),
          3,
        ),
        'circle-color': byKind(
          {
            ...Object.fromEntries(Object.entries(POINT_STYLE).map(([k, v]) => [k, v.color])),
            ...pointColors(display),
          },
          POINT_COLOR,
        ),
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1,
      },
    },
    {
      // Ikon dari sprite yang dibangun saat memuat (sprites.ts), bukan berkas sprite server.
      id: LAYER_IDS.facilities,
      type: 'symbol',
      source,
      filter: ['all', ['==', ['geometry-type'], 'Point'], ['==', kind, 'facility']],
      layout: {
        'icon-image': [
          'concat',
          FACILITY_ICON_PREFIX,
          ['coalesce', ['get', 'facilityTypeId'], 'unknown'],
        ],
        'icon-size': ['interpolate', ['linear'], ['zoom'], 15, 0.5, 18, 1],
        // Di editor setiap fasilitas harus terlihat dan bisa diklik; penyembunyian label
        // yang bertumpuk untuk pengunjung diatur saat Visitor dibuat.
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    },
  ];
}

const emptyCollection = () => ({ type: 'FeatureCollection' as const, features: [] });

/**
 * Style tanpa basemap internet: hanya latar dan data lantai dari snapshot/editor.
 * Dengan `labelFont` (Visitor), nama lokasi dan ikon fasilitas digambar lewat satu layer label
 * yang saling menyembunyikan saat bertumpuk; layer ikon editor yang selalu tampil tidak dipakai.
 */
export function buildStyle(
  display: MapDisplay = {},
  options: { labelFont?: LabelFont } = {},
): StyleSpecification {
  const { labelFont } = options;
  const layers = buildStyleLayers(display).filter(
    (layer) => !labelFont || layer.id !== LAYER_IDS.facilities,
  );
  return {
    version: 8,
    ...(labelFont ? { 'font-faces': labelFontFaces(labelFont) } : {}),
    sources: {
      [FLOOR_SOURCE_ID]: { type: 'geojson', data: emptyCollection() },
      [FLOOR_3D_SOURCE_ID]: { type: 'geojson', data: emptyCollection() },
      ...(labelFont ? { [LABEL_SOURCE_ID]: { type: 'geojson', data: emptyCollection() } } : {}),
    },
    layers: [
      {
        id: LAYER_IDS.background,
        type: 'background',
        paint: { 'background-color': MAP_BACKGROUND },
      },
      ...layers,
      ...(labelFont ? [labelLayer(labelFont)] : []),
    ],
  };
}
