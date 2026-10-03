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
export {
  createGraphInteractions,
  type GraphInteractionOptions,
  type GraphNodeDrag,
} from './graph-interactions';
export { BASEMAP_LAYER_ID, type Basemap, setBasemap } from './layers/basemap';
export {
  CLOSURE_LAYER_IDS,
  type ClosureMarks,
  closureCollection,
  setClosureMarks,
} from './layers/closures';
export { FLOOR_PLAN_LAYER_ID, type FloorPlanImage, setFloorPlanImage } from './layers/floor-plan';
export {
  type GraphEdgeView,
  type GraphElement,
  type GraphNodeView,
  type GraphSuggestionView,
  graphCollection,
  graphElementAt,
  setGraphData,
  setGraphPreview,
  setGraphSelection,
  setGraphSuggestions,
  setGraphVisibility,
} from './layers/graph';
export {
  CLOSED_NODE_DIAMETER,
  HATCH_IMAGE_IDS,
  hatchDisc,
  hatchTile,
  type PixelImage,
} from './layers/graph-hatch';
export {
  GRAPH_LAYER_IDS,
  GRAPH_PICK_LAYERS,
  GRAPH_STATUS_COLORS,
  GRAPH_VISIBILITY_GROUPS,
  type GraphVisibility,
  graphLayers,
} from './layers/graph-style';
export {
  HIGHLIGHT_COLORS,
  highlightFilters,
  highlightLayers,
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
  ORIGIN_LAYER_IDS,
  type OriginMarker,
  originCollection,
  setOriginMarkers,
} from './layers/origin';
export {
  REFERENCE_LAYER_IDS,
  REFERENCE_OPACITY,
  type ReferenceFloor,
  referenceFeatureLayers,
  setReferenceFloor,
  VERTICAL_CONNECTOR_KINDS,
} from './layers/reference';
export {
  ROUTE_COLOR,
  ROUTE_FLOW_STEPS,
  ROUTE_LAYER_IDS,
  type RouteView,
  routeCollection,
  routeFlowDash,
  routeLayers,
  setRoute,
} from './layers/route';
export { ISSUE_COLOR, ISSUE_LAYER_IDS, setIssueHighlight } from './layers/validation';
export {
  type CreateMapOptions,
  createMap,
  type FloorFeatureCollection,
  featureBounds,
  getViewMode,
  setFloorData,
  setMapDisplay,
  setMapLabel,
  setReferenceShapes,
  setViewMode,
  type ViewMode,
} from './map';
export {
  createTapInteractions,
  floorFeatureAt,
  type MapPick,
  PICK_TOLERANCE_PX,
  pickAt,
  type TapInteractionOptions,
} from './pick';
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
  categoryIconTypeId,
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
  HIGHLIGHT_LAYER_IDS,
  LAYER_IDS,
  type MapDisplay,
  venueHeights,
} from './style';
export * from './tint';
export {
  boundsCenter,
  positionsOf,
  rotateGeometry,
  roundCoordinate,
  roundGeometry,
  translateGeometry,
} from './transform';
