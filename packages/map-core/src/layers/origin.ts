import type { Feature, FeatureCollection } from 'geojson';
import type {
  ExpressionSpecification,
  GeoJSONSource,
  LayerSpecification,
  Map as MapLibreMap,
} from 'maplibre-gl';
import { EDIT_COLORS } from '../defaults';
import type { LngLat } from '../georef';
import { ROUTE_COLOR } from './route';

/** QR titik asal di peta Admin: posisi dan arah hadap pemindai. */
export interface OriginMarker {
  id: string;
  position: LngLat;
  headingDeg: number;
  selected: boolean;
}

export const ORIGIN_SOURCE_ID = 'origin-points';
export const ORIGIN_LAYER_IDS = { heading: 'origin-heading', point: 'origin-point' } as const;

/** Panjang garis arah hadap; cukup terlihat di zoom gedung tanpa menutupi ruang sebelah. */
const HEADING_LENGTH_M = 4;
const METERS_PER_DEGREE = 111_320;

function ahead([lng, lat]: LngLat, headingDeg: number, meters: number): LngLat {
  const rad = (headingDeg * Math.PI) / 180;
  const dLat = (meters * Math.cos(rad)) / METERS_PER_DEGREE;
  const dLng = (meters * Math.sin(rad)) / (METERS_PER_DEGREE * Math.cos((lat * Math.PI) / 180));
  return [lng + dLng, lat + dLat];
}

/** Titik dan garis arah hadap (dari utara searah jarum jam) per penanda. */
export function originCollection(markers: readonly OriginMarker[]): FeatureCollection {
  const features: Feature[] = markers.flatMap((marker): Feature[] => {
    const properties = { id: marker.id, selected: marker.selected };
    return [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            marker.position,
            ahead(marker.position, marker.headingDeg, HEADING_LENGTH_M),
          ],
        },
        properties,
      },
      { type: 'Feature', geometry: { type: 'Point', coordinates: marker.position }, properties },
    ];
  });
  return { type: 'FeatureCollection', features };
}

function originLayers(): LayerSpecification[] {
  const { ink, paper } = EDIT_COLORS;
  const selected = ['get', 'selected'] as ExpressionSpecification;
  return [
    {
      id: ORIGIN_LAYER_IDS.heading,
      type: 'line',
      source: ORIGIN_SOURCE_ID,
      filter: ['==', ['geometry-type'], 'LineString'],
      layout: { 'line-cap': 'round' },
      paint: { 'line-color': ['case', selected, ROUTE_COLOR, ink], 'line-width': 3 },
    },
    {
      id: ORIGIN_LAYER_IDS.point,
      type: 'circle',
      source: ORIGIN_SOURCE_ID,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': ['case', selected, 8, 6],
        'circle-color': paper,
        'circle-stroke-color': ['case', selected, ROUTE_COLOR, ink],
        'circle-stroke-width': 3,
      },
    },
  ];
}

export function setOriginMarkers(map: MapLibreMap, markers: readonly OriginMarker[]): void {
  if (!map.getSource(ORIGIN_SOURCE_ID)) {
    map.addSource(ORIGIN_SOURCE_ID, { type: 'geojson', data: originCollection([]) });
    for (const layer of originLayers()) map.addLayer(layer);
  }
  for (const id of Object.values(ORIGIN_LAYER_IDS)) map.moveLayer(id);
  map.getSource<GeoJSONSource>(ORIGIN_SOURCE_ID)?.setData(originCollection(markers));
}
