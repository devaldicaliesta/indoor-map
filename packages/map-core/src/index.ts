export type { Map as MapInstance } from 'maplibre-gl';
export {
  DEFAULT_FILL,
  DEFAULT_HEIGHTS,
  EDIT_COLORS,
  MAP_BACKGROUND,
  PITCH_3D,
} from './defaults';
export { createPolygonDrawer, type PolygonDrawer } from './draw';
export {
  type CornerIndex,
  type Corners,
  calibratePlacement,
  distanceM,
  initialPlacement,
  type LngLat,
  type Placement,
  placementCorners,
  placementFromCorners,
  rotatePlacement,
  scalePlacement,
} from './georef';
export {
  createGeoreferencer,
  GEOREF_LAYER_IDS,
  type Georeferencer,
  type GeoreferencerOptions,
} from './georef-layer';
export {
  REFERENCE_LAYER_IDS,
  REFERENCE_OPACITY,
  type ReferenceFloor,
  referenceFeatureLayers,
  setReferenceFloor,
  VERTICAL_CONNECTOR_KINDS,
} from './layers/reference';
export {
  type CreateMapOptions,
  createMap,
  type FloorFeatureCollection,
  featureBounds,
  getViewMode,
  setFloorData,
  setReferenceShapes,
  setViewMode,
  type ViewMode,
} from './map';
export { buildStyle, buildStyleLayers, FLOOR_SOURCE_ID, LAYER_IDS, type MapDisplay } from './style';
