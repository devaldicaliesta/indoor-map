import type { Feature, FeatureCollection, Point, Polygon } from 'geojson';
import type {
  GeoJSONSource,
  ImageSource,
  MapLayerMouseEvent,
  Map as MapLibreMap,
  MapMouseEvent,
} from 'maplibre-gl';
import { EDIT_COLORS } from './defaults';
import {
  type CornerIndex,
  dragCorner,
  type LngLat,
  movePlacement,
  type Placement,
  placementCorners,
} from './georef';
import { LAYER_IDS } from './style';

const IMAGE_SOURCE = 'floor-plan';
const FRAME_SOURCE = 'floor-plan-frame';
const HANDLE_SOURCE = 'floor-plan-handles';
const MEASURE_SOURCE = 'floor-plan-measure';
export const GEOREF_LAYER_IDS = {
  image: 'floor-plan-image',
  frameHit: 'floor-plan-frame-hit',
  frame: 'floor-plan-frame',
  handles: 'floor-plan-handles',
  measureLine: 'floor-plan-measure-line',
  measurePoints: 'floor-plan-measure-points',
} as const;

export interface GeoreferencerOptions {
  imageUrl: string;
  placement: Placement;
  /** 0–1. */
  opacity: number;
  lockAspect: boolean;
  /** `false` untuk role baca: denah tampil tanpa pegangan dan tidak bisa ditarik. */
  editable: boolean;
  /** Dipanggil terus selama pengguna menarik sudut atau menggeser denah. */
  onChange(placement: Placement): void;
}

export interface Georeferencer {
  setPlacement(placement: Placement): void;
  setOpacity(opacity: number): void;
  setLockAspect(lockAspect: boolean): void;
  /** Mode ukur: dua klik berikutnya di peta menjadi titik ukur. */
  startMeasure(onPoints: (a: LngLat, b: LngLat) => void): void;
  /** Menampilkan garis ukur (atau menghapusnya dengan `null`). */
  showMeasurement(points: [LngLat, LngLat] | null): void;
  cancelMeasure(): void;
  destroy(): void;
}

const collection = <G extends Point | Polygon>(features: Feature<G>[]): FeatureCollection<G> => ({
  type: 'FeatureCollection',
  features,
});

function frameData(p: Placement): FeatureCollection<Polygon> {
  const corners = placementCorners(p);
  return collection([
    {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[...corners, corners[0]]] },
      properties: {},
    },
  ]);
}

function handleData(p: Placement): FeatureCollection<Point> {
  return collection(
    placementCorners(p).map((coordinates, index) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates },
      properties: { index },
    })),
  );
}

function measureData(points: LngLat[]): FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: [
      ...(points.length === 2
        ? [
            {
              type: 'Feature' as const,
              geometry: { type: 'LineString' as const, coordinates: points },
              properties: {},
            },
          ]
        : []),
      ...points.map((coordinates) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates },
        properties: {},
      })),
    ],
  };
}

/**
 * Lapisan "Tempatkan denah": gambar denah sebagai image source di bawah fitur peta,
 * bingkai yang bisa digeser, dan 4 pegangan sudut. Hanya transformasi persegi panjang
 * (lihat `georef.ts`), tidak ada warping bebas.
 */
export function createGeoreferencer(
  map: MapLibreMap,
  options: GeoreferencerOptions,
): Georeferencer {
  let placement = options.placement;
  let lockAspect = options.lockAspect;
  let measuring: { points: LngLat[]; done: (a: LngLat, b: LngLat) => void } | null = null;
  // Sisipkan di bawah lapisan lantai pertama agar fitur yang dijiplak tetap di atas denah.
  const beforeId = map.getLayer(LAYER_IDS.flat) ? LAYER_IDS.flat : undefined;

  map.addSource(IMAGE_SOURCE, {
    type: 'image',
    url: options.imageUrl,
    coordinates: placementCorners(placement),
  });
  map.addLayer(
    {
      id: GEOREF_LAYER_IDS.image,
      type: 'raster',
      source: IMAGE_SOURCE,
      paint: { 'raster-opacity': options.opacity, 'raster-fade-duration': 0 },
    },
    beforeId,
  );
  map.addSource(FRAME_SOURCE, { type: 'geojson', data: frameData(placement) });
  map.addSource(HANDLE_SOURCE, { type: 'geojson', data: handleData(placement) });
  map.addSource(MEASURE_SOURCE, { type: 'geojson', data: measureData([]) });
  // Isi transparan tetap bisa di-query: dipakai untuk menangkap tarikan geser.
  map.addLayer({
    id: GEOREF_LAYER_IDS.frameHit,
    type: 'fill',
    source: FRAME_SOURCE,
    paint: { 'fill-color': EDIT_COLORS.signal, 'fill-opacity': 0 },
  });
  map.addLayer({
    id: GEOREF_LAYER_IDS.frame,
    type: 'line',
    source: FRAME_SOURCE,
    paint: { 'line-color': EDIT_COLORS.ink, 'line-width': 1.5, 'line-dasharray': [4, 2] },
  });
  map.addLayer({
    id: GEOREF_LAYER_IDS.handles,
    type: 'circle',
    source: HANDLE_SOURCE,
    paint: {
      'circle-radius': 7,
      'circle-color': EDIT_COLORS.signal,
      'circle-stroke-color': EDIT_COLORS.ink,
      'circle-stroke-width': 2,
    },
  });
  map.addLayer({
    id: GEOREF_LAYER_IDS.measureLine,
    type: 'line',
    source: MEASURE_SOURCE,
    filter: ['==', ['geometry-type'], 'LineString'],
    paint: { 'line-color': EDIT_COLORS.ink, 'line-width': 2.5 },
  });
  map.addLayer({
    id: GEOREF_LAYER_IDS.measurePoints,
    type: 'circle',
    source: MEASURE_SOURCE,
    filter: ['==', ['geometry-type'], 'Point'],
    paint: {
      'circle-radius': 5,
      'circle-color': EDIT_COLORS.paper,
      'circle-stroke-color': EDIT_COLORS.ink,
      'circle-stroke-width': 2.5,
    },
  });

  const source = <T>(id: string) => map.getSource(id) as T;
  function render() {
    source<ImageSource>(IMAGE_SOURCE).setCoordinates(placementCorners(placement));
    source<GeoJSONSource>(FRAME_SOURCE).setData(frameData(placement));
    source<GeoJSONSource>(HANDLE_SOURCE).setData(handleData(placement));
  }
  const toLngLat = (e: MapMouseEvent): LngLat => [e.lngLat.lng, e.lngLat.lat];

  type Drag = { kind: 'corner'; index: CornerIndex } | { kind: 'move'; last: LngLat };
  let drag: Drag | null = null;
  const canvas = map.getCanvasContainer();

  function onMove(e: MapMouseEvent) {
    if (!drag) return;
    const pointer = toLngLat(e);
    if (drag.kind === 'corner') {
      placement = dragCorner(placement, drag.index, pointer, lockAspect);
    } else {
      placement = movePlacement(placement, drag.last, pointer);
      drag = { kind: 'move', last: pointer };
    }
    render();
    options.onChange(placement);
  }
  function onUp() {
    drag = null;
    canvas.style.cursor = '';
    map.off('mousemove', onMove);
  }
  function begin(next: Drag, e: MapLayerMouseEvent, cursor: string) {
    if (measuring) return;
    // Mencegah peta ikut bergeser selama denah ditarik.
    e.preventDefault();
    drag = next;
    canvas.style.cursor = cursor;
    map.on('mousemove', onMove);
    map.once('mouseup', onUp);
  }
  function onHandleDown(e: MapLayerMouseEvent) {
    const index = e.features?.[0]?.properties?.index;
    if (typeof index === 'number')
      begin({ kind: 'corner', index: index as CornerIndex }, e, 'grabbing');
  }
  function onFrameDown(e: MapLayerMouseEvent) {
    const onHandle = map.queryRenderedFeatures(e.point, { layers: [GEOREF_LAYER_IDS.handles] });
    if (onHandle.length === 0) begin({ kind: 'move', last: toLngLat(e) }, e, 'move');
  }
  function onClick(e: MapMouseEvent) {
    if (!measuring) return;
    measuring.points.push(toLngLat(e));
    source<GeoJSONSource>(MEASURE_SOURCE).setData(measureData(measuring.points));
    const [a, b] = measuring.points;
    if (a && b) {
      const done = measuring.done;
      measuring = null;
      canvas.style.cursor = '';
      done(a, b);
    }
  }
  const hover = (cursor: string) => () => {
    if (!drag && !measuring) canvas.style.cursor = cursor;
  };
  const leave = () => {
    if (!drag && !measuring) canvas.style.cursor = '';
  };
  const handleEnter = hover('grab');
  const frameEnter = hover('move');

  if (!options.editable) map.setLayoutProperty(GEOREF_LAYER_IDS.handles, 'visibility', 'none');
  if (options.editable) map.on('mousedown', GEOREF_LAYER_IDS.handles, onHandleDown);
  if (options.editable) {
    map.on('mousedown', GEOREF_LAYER_IDS.frameHit, onFrameDown);
    map.on('mouseenter', GEOREF_LAYER_IDS.handles, handleEnter);
    map.on('mouseleave', GEOREF_LAYER_IDS.handles, leave);
    map.on('mouseenter', GEOREF_LAYER_IDS.frameHit, frameEnter);
    map.on('mouseleave', GEOREF_LAYER_IDS.frameHit, leave);
  }
  map.on('click', onClick);

  return {
    setPlacement(next) {
      placement = next;
      render();
    },
    setOpacity(opacity) {
      map.setPaintProperty(GEOREF_LAYER_IDS.image, 'raster-opacity', opacity);
    },
    setLockAspect(next) {
      lockAspect = next;
    },
    startMeasure(done) {
      measuring = { points: [], done };
      source<GeoJSONSource>(MEASURE_SOURCE).setData(measureData([]));
      canvas.style.cursor = 'crosshair';
    },
    showMeasurement(points) {
      source<GeoJSONSource>(MEASURE_SOURCE).setData(measureData(points ?? []));
    },
    cancelMeasure() {
      measuring = null;
      canvas.style.cursor = '';
    },
    destroy() {
      map.off('mousedown', GEOREF_LAYER_IDS.handles, onHandleDown);
      map.off('mousedown', GEOREF_LAYER_IDS.frameHit, onFrameDown);
      map.off('mouseenter', GEOREF_LAYER_IDS.handles, handleEnter);
      map.off('mouseleave', GEOREF_LAYER_IDS.handles, leave);
      map.off('mouseenter', GEOREF_LAYER_IDS.frameHit, frameEnter);
      map.off('mouseleave', GEOREF_LAYER_IDS.frameHit, leave);
      map.off('click', onClick);
      onUp();
      if (!map.style) return;
      for (const id of Object.values(GEOREF_LAYER_IDS)) if (map.getLayer(id)) map.removeLayer(id);
      for (const id of [IMAGE_SOURCE, FRAME_SOURCE, HANDLE_SOURCE, MEASURE_SOURCE]) {
        if (map.getSource(id)) map.removeSource(id);
      }
    },
  };
}
