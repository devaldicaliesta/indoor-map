import { AttributionControl, type Map as MapLibreMap } from 'maplibre-gl';
import { LAYER_IDS } from '../style';

export const BASEMAP_SOURCE_ID = 'basemap';
export const BASEMAP_LAYER_ID = 'basemap';

export interface Basemap {
  tileUrl: string;
  attribution: string;
}

const attributed = new WeakSet<MapLibreMap>();

/** Tepat di atas latar, di bawah semua layer lantai (termasuk ekstrusi 3D dan label). */
function firstLayerAfterBackground(map: MapLibreMap): string | undefined {
  return map
    .getStyle()
    .layers.find((l) => l.id !== LAYER_IDS.background && l.id !== BASEMAP_LAYER_ID)?.id;
}

/**
 * Peta dasar tile XYZ di bawah lantai (di atas latar). Bila server tile tidak terjangkau
 * (offline), tile gagal dimuat dan latar polos yang tampil; peta gedung tetap utuh.
 * `null` melepas peta dasar.
 */
export function setBasemap(map: MapLibreMap, basemap: Basemap | null): void {
  if (map.getLayer(BASEMAP_LAYER_ID)) map.removeLayer(BASEMAP_LAYER_ID);
  if (map.getSource(BASEMAP_SOURCE_ID)) map.removeSource(BASEMAP_SOURCE_ID);
  if (!basemap) return;
  map.addSource(BASEMAP_SOURCE_ID, {
    type: 'raster',
    tiles: [basemap.tileUrl],
    tileSize: 256,
    maxzoom: 19,
    attribution: basemap.attribution,
  });
  map.addLayer(
    {
      id: BASEMAP_LAYER_ID,
      type: 'raster',
      source: BASEMAP_SOURCE_ID,
      // Sedikit pudar agar gedung tetap menonjol di atas jalan dan bangunan sekitar.
      paint: { 'raster-opacity': 0.8, 'raster-saturation': -0.3 },
    },
    firstLayerAfterBackground(map),
  );
  if (!attributed.has(map)) {
    map.addControl(new AttributionControl({ compact: true }), 'bottom-left');
    attributed.add(map);
  }
}
