import type { ExpressionSpecification, Map as MapLibreMap } from 'maplibre-gl';
import { FACILITY_ICON_SIZE } from '../sprites';
import { FLOOR_SOURCE_ID } from '../style';

/** Warna temuan validasi: token --danger (05-desain-ui.md). */
export const ISSUE_COLOR = '#c8321e';

export const ISSUE_LAYER_IDS = {
  fill: 'floor-issue-fill',
  line: 'floor-issue-line',
  point: 'floor-issue-point',
} as const;

/** Sorotan seleksi dan hover tetap di atas tanda merah agar pegangan sunting terlihat. */
const ABOVE = ['floor-selected-fill', 'floor-hover-fill'];

/**
 * Fitur bermasalah bergaris merah (isi merah tipis untuk poligon, cincin merah
 * untuk titik). Hanya tampilan; tidak memengaruhi seleksi.
 */
export function setIssueHighlight(map: MapLibreMap, ids: readonly string[]): void {
  if (!map.getLayer(ISSUE_LAYER_IDS.fill)) {
    const before = ABOVE.find((id) => map.getLayer(id));
    const facility: ExpressionSpecification = ['==', ['get', 'kind'], 'facility'];
    map.addLayer(
      {
        id: ISSUE_LAYER_IDS.fill,
        type: 'fill',
        source: FLOOR_SOURCE_ID,
        paint: { 'fill-color': ISSUE_COLOR, 'fill-opacity': 0.15 },
      },
      before,
    );
    map.addLayer(
      {
        id: ISSUE_LAYER_IDS.line,
        type: 'line',
        source: FLOOR_SOURCE_ID,
        paint: { 'line-color': ISSUE_COLOR, 'line-width': 3 },
      },
      before,
    );
    map.addLayer(
      {
        id: ISSUE_LAYER_IDS.point,
        type: 'circle',
        source: FLOOR_SOURCE_ID,
        paint: {
          'circle-radius': ['case', facility, FACILITY_ICON_SIZE / 2 + 2, 7],
          'circle-opacity': 0,
          'circle-stroke-color': ISSUE_COLOR,
          'circle-stroke-width': 3,
        },
      },
      before,
    );
  }
  const flagged: ExpressionSpecification = ['in', ['get', 'id'], ['literal', [...ids]]];
  map.setFilter(ISSUE_LAYER_IDS.fill, ['all', ['==', ['geometry-type'], 'Polygon'], flagged]);
  map.setFilter(ISSUE_LAYER_IDS.line, ['all', ['!=', ['geometry-type'], 'Point'], flagged]);
  map.setFilter(ISSUE_LAYER_IDS.point, ['all', ['==', ['geometry-type'], 'Point'], flagged]);
}
