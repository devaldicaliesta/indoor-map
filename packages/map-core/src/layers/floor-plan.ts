import type { ImageSource, Map as MapLibreMap } from 'maplibre-gl';
import type { Corners } from '../georef';
import { LAYER_IDS } from '../style';

const SOURCE = 'floor-plan-bg';
export const FLOOR_PLAN_LAYER_ID = 'floor-plan-bg';

export interface FloorPlanImage {
  imageUrl: string;
  corners: Corners;
  /** 0–1 (FR-VEN-09). */
  opacity: number;
}

/**
 * Denah lantai sebagai latar untuk menjiplak di editor: di bawah semua fitur, tidak
 * bisa diklik. `null` menghapusnya.
 */
export function setFloorPlanImage(map: MapLibreMap, plan: FloorPlanImage | null): void {
  const source = map.getSource<ImageSource>(SOURCE);
  if (!plan) {
    if (map.getLayer(FLOOR_PLAN_LAYER_ID)) map.removeLayer(FLOOR_PLAN_LAYER_ID);
    if (source) map.removeSource(SOURCE);
    return;
  }
  if (source) {
    source.updateImage({ url: plan.imageUrl, coordinates: plan.corners });
    map.setPaintProperty(FLOOR_PLAN_LAYER_ID, 'raster-opacity', plan.opacity);
    return;
  }
  map.addSource(SOURCE, { type: 'image', url: plan.imageUrl, coordinates: plan.corners });
  map.addLayer(
    {
      id: FLOOR_PLAN_LAYER_ID,
      type: 'raster',
      source: SOURCE,
      paint: { 'raster-opacity': plan.opacity, 'raster-fade-duration': 0 },
    },
    map.getLayer(LAYER_IDS.flat) ? LAYER_IDS.flat : undefined,
  );
}
