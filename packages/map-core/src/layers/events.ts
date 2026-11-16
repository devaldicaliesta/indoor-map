import type { FeatureCollection } from 'geojson';
import type { GeoJSONSource, LayerSpecification, Map as MapLibreMap } from 'maplibre-gl';
import type { LngLat } from '../georef';
import { FLOOR_SOURCE_ID } from '../style';

export interface EventMark {
  id: string;
  position: LngLat;
  kind: 'event' | 'promotion';
  live: boolean;
  onLocation: boolean;
}

export const EVENT_SOURCE_ID = 'events';
export const EVENT_LAYER_IDS = {
  halo: 'event-halo',
  ring: 'event-ring',
  point: 'event-point',
} as const;

export const EVENT_COLORS = { event: '#7a3fc4', promotion: '#d6336c' } as const;

export function eventCollection(marks: readonly EventMark[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: marks.map((mark) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [...mark.position] },
      properties: { id: mark.id, kind: mark.kind, live: mark.live, onLocation: mark.onLocation },
    })),
  };
}

const color = [
  'match',
  ['get', 'kind'],
  'promotion',
  EVENT_COLORS.promotion,
  EVENT_COLORS.event,
] as const;

function eventLayers(): LayerSpecification[] {
  return [
    {
      id: EVENT_LAYER_IDS.halo,
      type: 'circle',
      source: EVENT_SOURCE_ID,
      filter: ['==', ['get', 'live'], true],
      paint: {
        'circle-radius': 22,
        'circle-color': [...color] as never,
        'circle-opacity': 0.2,
      },
    },
    {
      id: EVENT_LAYER_IDS.ring,
      type: 'circle',
      source: EVENT_SOURCE_ID,
      filter: ['==', ['get', 'onLocation'], true],
      paint: {
        'circle-radius': 17,
        'circle-opacity': 0,
        'circle-stroke-color': [...color] as never,
        'circle-stroke-width': 3,
      },
    },
    {
      id: EVENT_LAYER_IDS.point,
      type: 'circle',
      source: EVENT_SOURCE_ID,
      filter: ['==', ['get', 'onLocation'], false],
      paint: {
        'circle-radius': 8,
        'circle-color': [...color] as never,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 3,
      },
    },
  ];
}

export function setEventMarks(map: MapLibreMap, marks: readonly EventMark[]): void {
  if (!map.getSource(FLOOR_SOURCE_ID)) return;
  if (!map.getSource(EVENT_SOURCE_ID)) {
    map.addSource(EVENT_SOURCE_ID, { type: 'geojson', data: eventCollection(marks) });
    for (const layer of eventLayers()) map.addLayer(layer);
  }
  map.getSource<GeoJSONSource>(EVENT_SOURCE_ID)?.setData(eventCollection(marks));
}
