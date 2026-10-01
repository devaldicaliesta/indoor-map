import type {
  ExpressionSpecification,
  FilterSpecification,
  LayerSpecification,
  Map as MapLibreMap,
} from 'maplibre-gl';
import { FLOOR_SOURCE_ID } from '../style';

export const MUTED_LAYER_IDS = { fill: 'floor-muted-fill', line: 'floor-muted-line' } as const;

/** Token --line (isi) dan --ink-muted (garis), 05-desain-ui.md. */
const MUTED = { fill: '#d5d9de', line: '#545b64' } as const;

function mutedFilter(ids: readonly string[]): FilterSpecification {
  const listed: ExpressionSpecification = ['in', ['get', 'id'], ['literal', [...ids]]];
  return ['all', ['==', ['geometry-type'], 'Polygon'], listed];
}

/** Poligon yang tidak bisa dipilih: isi abu pekat dan garis putus-putus. */
export function mutedLayers(ids: readonly string[]): LayerSpecification[] {
  const filter = mutedFilter(ids);
  return [
    {
      id: MUTED_LAYER_IDS.fill,
      type: 'fill',
      source: FLOOR_SOURCE_ID,
      filter,
      paint: { 'fill-color': MUTED.fill, 'fill-opacity': 0.85 },
    },
    {
      id: MUTED_LAYER_IDS.line,
      type: 'line',
      source: FLOOR_SOURCE_ID,
      filter,
      paint: { 'line-color': MUTED.line, 'line-width': 1, 'line-dasharray': [2, 2] },
    },
  ];
}

/**
 * Menandai fitur yang tidak bisa dipilih, misalnya unit yang sudah dipakai lokasi lain
 * saat memilih unit di peta. Sorotan seleksi yang ditambahkan kemudian tetap
 * di atasnya.
 */
export function setMutedFeatures(map: MapLibreMap, ids: readonly string[]): void {
  if (!map.getLayer(MUTED_LAYER_IDS.fill)) {
    for (const layer of mutedLayers(ids)) map.addLayer(layer);
    return;
  }
  const filter = mutedFilter(ids);
  map.setFilter(MUTED_LAYER_IDS.fill, filter);
  map.setFilter(MUTED_LAYER_IDS.line, filter);
}
