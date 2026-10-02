import type { Feature, FeatureCollection } from 'geojson';
import type {
  ExpressionSpecification,
  GeoJSONSource,
  LayerSpecification,
  Map as MapLibreMap,
} from 'maplibre-gl';
import type { LngLat } from '../georef';
import { FLOOR_SOURCE_ID } from '../style';

/** Elemen tertutup sementara di lantai yang tampil. */
export interface ClosureMarks {
  /** Fitur lantai (area, koridor, ruang) yang ditutup. */
  areaIds: readonly string[];
  /** Ruas jalur yang ditutup. */
  lines: readonly LngLat[][];
  /** Pemberhentian konektor (lift, eskalator, tangga, pintu) yang ditutup. */
  points: readonly LngLat[];
}

export const CLOSURE_SOURCE_ID = 'closures';
export const CLOSURE_LAYER_IDS = {
  areaFill: 'closure-area-fill',
  areaLine: 'closure-area-line',
  line: 'closure-line',
  point: 'closure-point',
} as const;

/** Token --danger, 05-desain-ui.md. */
export const CLOSURE_COLOR = '#c8321e';

export function closureCollection(
  marks: Pick<ClosureMarks, 'lines' | 'points'>,
): FeatureCollection {
  const features: Feature[] = [
    ...marks.lines
      .filter((line) => line.length > 1)
      .map(
        (line): Feature => ({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [...line] },
          properties: {},
        }),
      ),
    ...marks.points.map(
      (point): Feature => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: point },
        properties: {},
      }),
    ),
  ];
  return { type: 'FeatureCollection', features };
}

function areaFilter(ids: readonly string[]): ExpressionSpecification {
  return ['in', ['get', 'id'], ['literal', [...ids]]];
}

function closureLayers(ids: readonly string[]): LayerSpecification[] {
  return [
    {
      id: CLOSURE_LAYER_IDS.areaFill,
      type: 'fill',
      source: FLOOR_SOURCE_ID,
      filter: areaFilter(ids),
      paint: { 'fill-color': CLOSURE_COLOR, 'fill-opacity': 0.25 },
    },
    {
      id: CLOSURE_LAYER_IDS.areaLine,
      type: 'line',
      source: FLOOR_SOURCE_ID,
      filter: areaFilter(ids),
      paint: { 'line-color': CLOSURE_COLOR, 'line-width': 2, 'line-dasharray': [2, 1] },
    },
    {
      id: CLOSURE_LAYER_IDS.line,
      type: 'line',
      source: CLOSURE_SOURCE_ID,
      filter: ['==', ['geometry-type'], 'LineString'],
      layout: { 'line-cap': 'round' },
      paint: { 'line-color': CLOSURE_COLOR, 'line-width': 4, 'line-dasharray': [1, 1] },
    },
    {
      id: CLOSURE_LAYER_IDS.point,
      type: 'circle',
      source: CLOSURE_SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 7,
        'circle-color': '#ffffff',
        'circle-stroke-color': CLOSURE_COLOR,
        'circle-stroke-width': 3,
      },
    },
  ];
}

/** Menandai elemen tertutup di atas fitur lantai dan di bawah garis rute. */
export function setClosureMarks(map: MapLibreMap, marks: ClosureMarks): void {
  if (!map.getSource(FLOOR_SOURCE_ID)) return;
  if (!map.getSource(CLOSURE_SOURCE_ID)) {
    map.addSource(CLOSURE_SOURCE_ID, { type: 'geojson', data: closureCollection(marks) });
    for (const layer of closureLayers(marks.areaIds)) map.addLayer(layer);
  }
  const filter = areaFilter(marks.areaIds);
  map.setFilter(CLOSURE_LAYER_IDS.areaFill, filter);
  map.setFilter(CLOSURE_LAYER_IDS.areaLine, filter);
  map.getSource<GeoJSONSource>(CLOSURE_SOURCE_ID)?.setData(closureCollection(marks));
}
