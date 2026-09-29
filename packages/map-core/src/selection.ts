import type { Geometry } from '@indoor/domain';
import type { FeatureCollection } from 'geojson';
import type {
  ExpressionSpecification,
  FilterSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
  MapMouseEvent,
} from 'maplibre-gl';
import { EDIT_COLORS } from './defaults';
import type { LngLat } from './georef';
import { buildStyleLayers, FLOOR_SOURCE_ID, LAYER_IDS } from './style';
import { translateGeometry } from './transform';

export const PICKABLE_LAYERS = [
  LAYER_IDS.flat,
  LAYER_IDS.rooms,
  LAYER_IDS.walls,
  LAYER_IDS.points,
  LAYER_IDS.extrusion,
];

const HIGHLIGHT = {
  fill: 'floor-selected-fill',
  line: 'floor-selected-line',
  point: 'floor-selected-point',
} as const;
const PREVIEW_SOURCE = 'floor-drag-preview';
const PREVIEW = { fill: 'floor-drag-preview-fill', line: 'floor-drag-preview-line' } as const;
const MIN_BOX_PX = 4;

/** Menyembunyikan fitur dari layer lantai (saat tampil di lapisan sunting atau pratinjau geser). */
export function setHiddenFeatures(map: MapLibreMap, ids: readonly string[]): void {
  const hide: FilterSpecification = ['!', ['in', ['get', 'id'], ['literal', [...ids]]]];
  for (const layer of buildStyleLayers()) {
    if (!map.getLayer(layer.id) || !('filter' in layer)) continue;
    const base = layer.filter as FilterSpecification | undefined;
    const filter = ids.length ? (base ? (['all', base, hide] as FilterSpecification) : hide) : base;
    map.setFilter(layer.id, filter ?? null);
  }
}

/** Sorotan seleksi ganda di atas layer lantai (seleksi tunggal disorot terra-draw). */
export function setSelectionHighlight(map: MapLibreMap, ids: readonly string[]): void {
  const selected: ExpressionSpecification = ['in', ['get', 'id'], ['literal', [...ids]]];
  const polygon: ExpressionSpecification = ['==', ['geometry-type'], 'Polygon'];
  if (!map.getLayer(HIGHLIGHT.fill)) {
    map.addLayer({
      id: HIGHLIGHT.fill,
      type: 'fill',
      source: FLOOR_SOURCE_ID,
      paint: { 'fill-color': EDIT_COLORS.signal, 'fill-opacity': 0.35 },
    });
    map.addLayer({
      id: HIGHLIGHT.line,
      type: 'line',
      source: FLOOR_SOURCE_ID,
      paint: { 'line-color': EDIT_COLORS.ink, 'line-width': 2 },
    });
    map.addLayer({
      id: HIGHLIGHT.point,
      type: 'circle',
      source: FLOOR_SOURCE_ID,
      paint: {
        'circle-radius': 6,
        'circle-color': EDIT_COLORS.signal,
        'circle-stroke-color': EDIT_COLORS.ink,
        'circle-stroke-width': 2,
      },
    });
  }
  map.setFilter(HIGHLIGHT.fill, ['all', polygon, selected]);
  map.setFilter(HIGHLIGHT.line, ['all', ['!=', ['geometry-type'], 'Point'], selected]);
  map.setFilter(HIGHLIGHT.point, ['all', ['==', ['geometry-type'], 'Point'], selected]);
}

export interface SelectionInteractionOptions {
  /** Hanya aktif di alat pilih dan bila pengguna boleh menyunting. */
  enabled(): boolean;
  selectedIds(): readonly string[];
  geometryOf(id: string): Geometry | undefined;
  /** Shift+tarik: kotak seleksi; id fitur yang terkena kotak. */
  onBoxSelect(ids: string[]): void;
  /** Tarik salah satu fitur dari seleksi ganda: semua bergeser dari `from` ke `to`. */
  onGroupMove(from: LngLat, to: LngLat): void;
}

/**
 * Kotak seleksi (Shift+tarik) dan geser kelompok untuk seleksi ganda. Selama digeser,
 * fitur tampil di source pratinjau kecil; store baru diubah saat mouse dilepas.
 */
export function createSelectionInteractions(
  map: MapLibreMap,
  options: SelectionInteractionOptions,
): { destroy(): void } {
  map.boxZoom.disable();
  map.addSource(PREVIEW_SOURCE, {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: [] },
  });
  map.addLayer({
    id: PREVIEW.fill,
    type: 'fill',
    source: PREVIEW_SOURCE,
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: { 'fill-color': EDIT_COLORS.signal, 'fill-opacity': 0.35 },
  });
  map.addLayer({
    id: PREVIEW.line,
    type: 'line',
    source: PREVIEW_SOURCE,
    paint: { 'line-color': EDIT_COLORS.ink, 'line-width': 2, 'line-dasharray': [2, 1] },
  });
  const container = map.getCanvasContainer();
  const pickable = () => PICKABLE_LAYERS.filter((id) => map.getLayer(id));
  const lngLatOf = (e: MapMouseEvent): LngLat => [e.lngLat.lng, e.lngLat.lat];

  let box: { start: MapMouseEvent['point']; el: HTMLDivElement } | null = null;
  let group: { from: LngLat; ids: readonly string[] } | null = null;

  function preview(to: LngLat) {
    if (!group) return;
    const { from } = group;
    const data: FeatureCollection = {
      type: 'FeatureCollection',
      features: group.ids.flatMap((id) => {
        const geometry = options.geometryOf(id);
        return geometry
          ? [
              {
                type: 'Feature' as const,
                geometry: translateGeometry(geometry, from, to),
                properties: {},
              },
            ]
          : [];
      }),
    };
    map.getSource<GeoJSONSource>(PREVIEW_SOURCE)?.setData(data);
  }

  function onDown(e: MapMouseEvent) {
    if (!options.enabled() || e.originalEvent.button !== 0) return;
    if (e.originalEvent.shiftKey) {
      e.preventDefault();
      const el = document.createElement('div');
      el.className = 'indoor-selection-box';
      container.appendChild(el);
      box = { start: e.point, el };
      return;
    }
    const selected = options.selectedIds();
    if (selected.length < 2) return;
    const hit = map.queryRenderedFeatures(e.point, { layers: pickable() })[0]?.properties?.id;
    if (typeof hit !== 'string' || !selected.includes(hit)) return;
    e.preventDefault();
    group = { from: lngLatOf(e), ids: selected };
    setHiddenFeatures(map, selected);
    preview(group.from);
  }

  function onMove(e: MapMouseEvent) {
    if (box) {
      const x0 = Math.min(box.start.x, e.point.x);
      const y0 = Math.min(box.start.y, e.point.y);
      Object.assign(box.el.style, {
        transform: `translate(${x0}px, ${y0}px)`,
        width: `${Math.abs(e.point.x - box.start.x)}px`,
        height: `${Math.abs(e.point.y - box.start.y)}px`,
      });
    } else if (group) {
      preview(lngLatOf(e));
    }
  }

  function onUp(e: MapMouseEvent) {
    if (box) {
      const { start, el } = box;
      box = null;
      el.remove();
      if (Math.abs(e.point.x - start.x) < MIN_BOX_PX && Math.abs(e.point.y - start.y) < MIN_BOX_PX)
        return;
      const hits = map.queryRenderedFeatures([start, e.point], { layers: pickable() });
      const ids = [
        ...new Set(
          hits.flatMap((f) => (typeof f.properties?.id === 'string' ? [f.properties.id] : [])),
        ),
      ];
      options.onBoxSelect(ids);
    } else if (group) {
      const { from } = group;
      group = null;
      map
        .getSource<GeoJSONSource>(PREVIEW_SOURCE)
        ?.setData({ type: 'FeatureCollection', features: [] });
      setHiddenFeatures(map, []);
      options.onGroupMove(from, lngLatOf(e));
    }
  }

  map.on('mousedown', onDown);
  map.on('mousemove', onMove);
  map.on('mouseup', onUp);
  return {
    destroy() {
      map.off('mousedown', onDown);
      map.off('mousemove', onMove);
      map.off('mouseup', onUp);
      box?.el.remove();
    },
  };
}
