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
  createFeatureEditor,
  type EditableFeature,
  type EditorTool,
  type FeatureEditor,
  type FeatureEditorCallbacks,
} from './editor';
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
export { FLOOR_PLAN_LAYER_ID, type FloorPlanImage, setFloorPlanImage } from './layers/floor-plan';
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
export {
  createSelectionInteractions,
  PICKABLE_LAYERS,
  type SelectionInteractionOptions,
  setHiddenFeatures,
  setSelectionHighlight,
} from './selection';
export { closestOnSegment, type Px, SNAP_TOLERANCE_PX, type SnapKind, snapPoint } from './snap';
export { type BBox, buildSnapIndex, type SnapCandidates, type SnapIndex } from './snap-index';
export {
  FACILITY_ICON_COLORS,
  FACILITY_ICON_FALLBACK,
  FACILITY_ICON_PREFIX,
  FACILITY_ICON_SIZE,
  type FacilityIconSpec,
  facilityIconId,
  fitContain,
  type IconSource,
  isOpaque,
  renderFacilityIcon,
  setFacilityIcons,
} from './sprites';
export { buildStyle, buildStyleLayers, FLOOR_SOURCE_ID, LAYER_IDS, type MapDisplay } from './style';
export {
  boundsCenter,
  positionsOf,
  rotateGeometry,
  roundCoordinate,
  roundGeometry,
  translateGeometry,
} from './transform';
