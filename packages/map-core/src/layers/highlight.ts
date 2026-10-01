import type { MapHit } from '@indoor/domain';
import type {
  ExpressionSpecification,
  FilterSpecification,
  LayerSpecification,
  Map as MapLibreMap,
} from 'maplibre-gl';
import { FLOOR_3D_SOURCE_ID } from '../extrude';
import { getViewMode, modeVisibility } from '../map';
import { FACILITY_ICON_SIZE } from '../sprites';
import { FLOOR_SOURCE_ID, LAYER_IDS } from '../style';
import { LABEL_LAYER_ID } from './labels';

/** Unit terpilih di 05-desain-ui.md: isi --signal-soft, garis --ink. */
export const HIGHLIGHT_COLORS = { fill: '#ffe9a8', line: '#111418' } as const;

/**
 * Di 3D unit yang disorot diberi "atap" setebal ini di atas ekstrusinya. Ekstrusi kedua
 * setinggi ruang aslinya akan berkedip (z-fighting) dengan dinding ruang itu.
 */
export const HIGHLIGHT_CAP_M = 0.3;

/** Area ketuk di sekitar titik sentuh untuk label dan ikon fasilitas yang kecil (px). */
export const LABEL_HIT_PX = 8;

const isPolygon: ExpressionSpecification = [
  'match',
  ['geometry-type'],
  ['Polygon', 'MultiPolygon'],
  true,
  false,
];

/** Layer sorotan beserta layer yang harus tetap di atasnya. */
export function highlightLayers(
  ids: readonly string[],
): { layer: LayerSpecification; before: string }[] {
  const listed: ExpressionSpecification = ['in', ['get', 'id'], ['literal', [...ids]]];
  const polygons: FilterSpecification = ['all', isPolygon, listed];
  return [
    {
      // Di bawah dinding dan pintu agar keduanya tetap terlihat di unit yang disorot.
      before: LAYER_IDS.walls,
      layer: {
        id: LAYER_IDS.highlightFill,
        type: 'fill',
        source: FLOOR_SOURCE_ID,
        filter: polygons,
        paint: { 'fill-color': HIGHLIGHT_COLORS.fill },
      },
    },
    {
      before: LAYER_IDS.points,
      layer: {
        id: LAYER_IDS.highlightLine,
        type: 'line',
        source: FLOOR_SOURCE_ID,
        filter: polygons,
        paint: { 'line-color': HIGHLIGHT_COLORS.line, 'line-width': 2 },
      },
    },
    {
      before: LAYER_IDS.points,
      layer: {
        id: LAYER_IDS.highlightCap,
        type: 'fill-extrusion',
        source: FLOOR_3D_SOURCE_ID,
        filter: ['all', ['!', ['has', 'edge']], listed],
        paint: {
          'fill-extrusion-color': HIGHLIGHT_COLORS.fill,
          'fill-extrusion-base': ['get', 'extrude'],
          'fill-extrusion-height': ['+', ['get', 'extrude'], HIGHLIGHT_CAP_M],
        },
      },
    },
    {
      // Lingkaran di belakang ikon fasilitas (layer label), mengikuti ukuran ikon per zoom.
      before: LABEL_LAYER_ID,
      layer: {
        id: LAYER_IDS.highlightRing,
        type: 'circle',
        source: FLOOR_SOURCE_ID,
        filter: ['all', ['==', ['geometry-type'], 'Point'], listed],
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            FACILITY_ICON_SIZE / 4 + 3,
            18,
            FACILITY_ICON_SIZE / 2 + 3,
          ],
          'circle-color': HIGHLIGHT_COLORS.fill,
          'circle-stroke-color': HIGHLIGHT_COLORS.line,
          'circle-stroke-width': 2,
          'circle-pitch-alignment': 'viewport',
        },
      },
    },
  ];
}

/**
 * Menyorot unit (isi dan garis di 2D, atap di 3D) dan titik fasilitas (lingkaran di belakang
 * ikonnya) untuk Visitor. Layer dibuat saat pertama dipakai; `[]` menghapus sorotan.
 */
export function setHighlight(map: MapLibreMap, ids: readonly string[]): void {
  const mode = getViewMode(map);
  for (const { layer, before } of highlightLayers(ids)) {
    if (map.getLayer(layer.id)) {
      map.setFilter(layer.id, 'filter' in layer ? (layer.filter ?? null) : null);
      continue;
    }
    map.addLayer(
      { ...layer, layout: { visibility: modeVisibility(layer.id, mode) } } as LayerSpecification,
      map.getLayer(before) ? before : undefined,
    );
  }
}

/** Layer ruang yang bisa diketuk; yang sedang tersembunyi (mode lain) tidak mengembalikan apa pun. */
const ROOM_LAYERS = [
  LAYER_IDS.highlightCap,
  LAYER_IDS.extrusion,
  LAYER_IDS.highlightFill,
  LAYER_IDS.rooms,
];

/**
 * Yang diketuk pengunjung: label lokasi atau ikon fasilitas (dengan toleransi beberapa piksel),
 * lalu ruang di bawah titik sentuh. Menentukan lokasi/unit/fasilitasnya dilakukan domain.
 */
export function hitAt(map: MapLibreMap, point: { x: number; y: number }): MapHit | null {
  if (map.getLayer(LABEL_LAYER_ID)) {
    const box: [[number, number], [number, number]] = [
      [point.x - LABEL_HIT_PX, point.y - LABEL_HIT_PX],
      [point.x + LABEL_HIT_PX, point.y + LABEL_HIT_PX],
    ];
    const label = map.queryRenderedFeatures(box, { layers: [LABEL_LAYER_ID] })[0];
    const id = label?.properties?.id;
    if (typeof id === 'string') {
      return label?.properties?.kind === 'location'
        ? { kind: 'location', id }
        : { kind: 'feature', id };
    }
  }
  const layers = ROOM_LAYERS.filter((layer) => map.getLayer(layer));
  if (layers.length === 0) return null;
  const id = map.queryRenderedFeatures([point.x, point.y], { layers })[0]?.properties?.id;
  return typeof id === 'string' ? { kind: 'feature', id } : null;
}
