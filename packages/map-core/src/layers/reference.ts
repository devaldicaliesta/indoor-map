import type { FeatureKind } from '@indoor/domain';
import type {
  ExpressionSpecification,
  GeoJSONSource,
  LayerSpecification,
  Map as MapLibreMap,
} from 'maplibre-gl';
import { DEFAULT_OUTLINE, EDIT_COLORS } from '../defaults';
import type { Corners } from '../georef';
import type { FloorFeatureCollection } from '../map';

const FEATURE_SOURCE = 'ref-floor';
const PLAN_SOURCE = 'ref-floor-plan';

/** Samar agar lantai acuan tidak tertukar dengan lantai yang disunting. */
export const REFERENCE_OPACITY = 0.25;

export const REFERENCE_LAYER_IDS = {
  plan: 'ref-floor-plan',
  fill: 'ref-floor-fill',
  outline: 'ref-floor-outline',
  connectorFill: 'ref-floor-connector-fill',
  connectorOutline: 'ref-floor-connector-outline',
  points: 'ref-floor-points',
} as const;

/** Konektor vertikal: patokan penyelarasan antarlantai (posisinya sama di setiap lantai). */
export const VERTICAL_CONNECTOR_KINDS: readonly FeatureKind[] = ['elevator', 'escalator', 'stairs'];

export interface ReferenceFloor {
  features: FloorFeatureCollection;
  /** Denah aktif lantai acuan, bila sudah ditempatkan. */
  plan: { imageUrl: string; corners: Corners } | null;
}

const isPolygon: ExpressionSpecification = [
  'match',
  ['geometry-type'],
  ['Polygon', 'MultiPolygon'],
  true,
  false,
];
const isConnector: ExpressionSpecification = [
  'in',
  ['get', 'kind'],
  ['literal', [...VERTICAL_CONNECTOR_KINDS]],
];

/** Layer fitur lantai acuan; semua tanpa event sehingga tidak bisa diseleksi atau disunting. */
export function referenceFeatureLayers(): LayerSpecification[] {
  const source = FEATURE_SOURCE;
  return [
    {
      id: REFERENCE_LAYER_IDS.fill,
      type: 'fill',
      source,
      filter: ['all', isPolygon, ['!', isConnector]],
      paint: { 'fill-color': EDIT_COLORS.ink, 'fill-opacity': REFERENCE_OPACITY * 0.3 },
    },
    {
      id: REFERENCE_LAYER_IDS.outline,
      type: 'line',
      source,
      filter: ['!', isConnector],
      paint: {
        'line-color': EDIT_COLORS.ink,
        'line-opacity': REFERENCE_OPACITY * 2,
        'line-width': 1,
        'line-dasharray': [3, 2],
      },
    },
    {
      id: REFERENCE_LAYER_IDS.connectorFill,
      type: 'fill',
      source,
      filter: ['all', isPolygon, isConnector],
      paint: { 'fill-color': EDIT_COLORS.signal, 'fill-opacity': 0.55 },
    },
    {
      id: REFERENCE_LAYER_IDS.connectorOutline,
      type: 'line',
      source,
      filter: isConnector,
      paint: {
        'line-color': DEFAULT_OUTLINE.elevator ?? EDIT_COLORS.ink,
        'line-width': 2,
        'line-dasharray': [2, 1],
      },
    },
    {
      id: REFERENCE_LAYER_IDS.points,
      type: 'circle',
      source,
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-radius': 3,
        'circle-color': EDIT_COLORS.ink,
        'circle-opacity': REFERENCE_OPACITY * 2,
      },
    },
  ];
}

function removeReference(map: MapLibreMap) {
  for (const id of Object.values(REFERENCE_LAYER_IDS)) if (map.getLayer(id)) map.removeLayer(id);
  for (const id of [FEATURE_SOURCE, PLAN_SOURCE]) if (map.getSource(id)) map.removeSource(id);
}

/**
 * Menampilkan (atau dengan `null` menghapus) satu lantai acuan. Hanya tampilan:
 * tidak ada yang disimpan, dan lapisan diletakkan di bawah `beforeId` (misalnya
 * pegangan editor) agar tidak menghalangi alat sunting.
 */
export function setReferenceFloor(
  map: MapLibreMap,
  reference: ReferenceFloor | null,
  beforeId?: string,
): void {
  if (!reference) {
    removeReference(map);
    return;
  }
  const before = beforeId && map.getLayer(beforeId) ? beforeId : undefined;
  const planSource = map.getSource(PLAN_SOURCE);
  if (planSource) {
    map.removeLayer(REFERENCE_LAYER_IDS.plan);
    map.removeSource(PLAN_SOURCE);
  }
  if (reference.plan) {
    map.addSource(PLAN_SOURCE, {
      type: 'image',
      url: reference.plan.imageUrl,
      coordinates: reference.plan.corners,
    });
    const firstFeatureLayer = map.getLayer(REFERENCE_LAYER_IDS.fill)
      ? REFERENCE_LAYER_IDS.fill
      : before;
    map.addLayer(
      {
        id: REFERENCE_LAYER_IDS.plan,
        type: 'raster',
        source: PLAN_SOURCE,
        paint: { 'raster-opacity': REFERENCE_OPACITY, 'raster-fade-duration': 0 },
      },
      firstFeatureLayer,
    );
  }
  const features = map.getSource<GeoJSONSource>(FEATURE_SOURCE);
  if (features) {
    features.setData(reference.features);
    return;
  }
  map.addSource(FEATURE_SOURCE, { type: 'geojson', data: reference.features });
  for (const layer of referenceFeatureLayers()) map.addLayer(layer, before);
}
