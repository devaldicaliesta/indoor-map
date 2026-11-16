import type { ScanCandidate, ScanConfidenceLevel } from '@indoor/domain';
import type { GeoJSONSource, Map as MapLibreMap } from 'maplibre-gl';

const SOURCE = 'scan-preview';

export const SCAN_LEVEL_COLORS: Record<ScanConfidenceLevel, string> = {
  high: '#12805c',
  medium: '#b26a00',
  low: '#c8321e',
};

export const SCAN_PREVIEW_LAYER_IDS = {
  fill: 'scan-preview-fill',
  line: 'scan-preview-line',
} as const;

export interface ScanPreview {
  candidates: readonly ScanCandidate[];
  selectedIds: ReadonlySet<string>;
}

function toCollection({ candidates, selectedIds }: ScanPreview) {
  return {
    type: 'FeatureCollection' as const,
    features: candidates.map((candidate) => ({
      type: 'Feature' as const,
      id: candidate.id,
      geometry: candidate.geometry,
      properties: {
        id: candidate.id,
        color: SCAN_LEVEL_COLORS[candidate.level],
        selected: selectedIds.has(candidate.id),
      },
    })),
  };
}

function removePreview(map: MapLibreMap) {
  for (const id of Object.values(SCAN_PREVIEW_LAYER_IDS)) if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource(SOURCE)) map.removeSource(SOURCE);
}

export function setScanPreview(map: MapLibreMap, preview: ScanPreview | null): void {
  if (!preview || preview.candidates.length === 0) {
    removePreview(map);
    return;
  }
  const data = toCollection(preview);
  const source = map.getSource<GeoJSONSource>(SOURCE);
  if (source) {
    source.setData(data);
    return;
  }
  map.addSource(SOURCE, { type: 'geojson', data });
  map.addLayer({
    id: SCAN_PREVIEW_LAYER_IDS.fill,
    type: 'fill',
    source: SOURCE,
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': ['case', ['get', 'selected'], 0.3, 0.06],
    },
  });
  map.addLayer({
    id: SCAN_PREVIEW_LAYER_IDS.line,
    type: 'line',
    source: SOURCE,
    paint: {
      'line-color': ['get', 'color'],
      'line-width': ['case', ['get', 'selected'], 3, 1.5],
      'line-opacity': ['case', ['get', 'selected'], 1, 0.5],
    },
  });
}
