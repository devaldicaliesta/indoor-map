export type { Map as MapInstance } from 'maplibre-gl';
export {
  FOCUS_MIN_ZOOM,
  focusFeature,
  focusZoom,
  geometryBounds,
  getCamera,
  prefersReducedMotion,
} from './camera';
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
  build3dFeatures,
  EDGE_WIDTH_M,
  FLOOR_3D_SOURCE_ID,
  type Floor3dCollection,
  resolveHeight,
  WALL_THICKNESS_M,
} from './extrude';
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
  HIGHLIGHT_CAP_M,
  HIGHLIGHT_COLORS,
  highlightLayers,
  hitAt,
  LABEL_HIT_PX,
  setHighlight,
} from './layers/highlight';
export {
  LABEL_LAYER_ID,
  LABEL_SOURCE_ID,
  type LabelFont,
  labelCollection,
  labelFontFaces,
  labelLayer,
  setLabels,
} from './layers/labels';
export { MUTED_LAYER_IDS, mutedLayers, setMutedFeatures } from './layers/muted';
export {
  REFERENCE_LAYER_IDS,
  REFERENCE_OPACITY,
  type ReferenceFloor,
  referenceFeatureLayers,
  setReferenceFloor,
  VERTICAL_CONNECTOR_KINDS,
} from './layers/reference';
export { ISSUE_COLOR, ISSUE_LAYER_IDS, setIssueHighlight } from './layers/validation';
export {
  type CreateMapOptions,
  createMap,
  type FloorFeatureCollection,
  featureBounds,
  getViewMode,
  modeVisibility,
  setFloorData,
  setMapDisplay,
  setReferenceShapes,
  setViewMode,
  type ViewMode,
} from './map';
export {
  createSelectionInteractions,
  PICKABLE_LAYERS,
  type SelectionInteractionOptions,
  setHiddenFeatures,
  setHoverHighlight,
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
  glyphColorOn,
  type IconSource,
  isOpaque,
  renderFacilityIcon,
  setFacilityIcons,
} from './sprites';
export {
  buildStyle,
  buildStyleLayers,
  defaultKindColor,
  FLOOR_SOURCE_ID,
  LAYER_IDS,
  type MapDisplay,
  venueHeights,
} from './style';
export {
  boundsCenter,
  positionsOf,
  rotateGeometry,
  roundCoordinate,
  roundGeometry,
  translateGeometry,
} from './transform';
