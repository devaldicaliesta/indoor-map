export type { Map as MapInstance } from 'maplibre-gl';
export { DEFAULT_FILL, DEFAULT_HEIGHTS, MAP_BACKGROUND, PITCH_3D } from './defaults';
export { createPolygonDrawer, type PolygonDrawer } from './draw';
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
