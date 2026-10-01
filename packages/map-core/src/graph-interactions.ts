import type { MapLayerMouseEvent, Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
import type { LngLat } from './georef';
import { GRAPH_LAYER_IDS, setGraphPreview } from './layers/graph';
import { SNAP_TOLERANCE_PX } from './snap';

/** Geseran kurang dari ini dianggap klik, bukan memindah node. */
const DRAG_THRESHOLD_PX = 3;

export interface GraphNodeDrag {
  coordinates: LngLat;
  role: string;
  /** Posisi ujung lain setiap edge node ini, untuk pratinjau. */
  neighbours: readonly LngLat[];
}

export interface GraphInteractionOptions {
  /** Aktif di alat pilih, 2D, dan bila pengguna boleh menyunting. */
  enabled(): boolean;
  /** Data node untuk mulai menggeser; `undefined` = node ini tidak boleh digeser sekarang. */
  dragStart(nodeId: string): GraphNodeDrag | undefined;
  /** Node dilepas di posisi baru (sudah ditempel ke node lain bila dekat). */
  onMove(nodeId: string, to: LngLat): void;
}

/**
 * Memindah node graf dengan menarik: selama ditarik node dan edge-nya tampil di source pratinjau,
 * dan menempel ke node lain dalam toleransi layar (dilepas di sana = digabung oleh domain).
 */
export function createGraphInteractions(
  map: MapLibreMap,
  options: GraphInteractionOptions,
): { destroy(): void } {
  let drag: {
    id: string;
    node: GraphNodeDrag;
    start: MapMouseEvent['point'];
    to: LngLat;
    moved: boolean;
  } | null = null;

  function snapped(e: MapMouseEvent, exceptId: string): LngLat {
    const t = SNAP_TOLERANCE_PX;
    const hits = map.queryRenderedFeatures(
      [
        [e.point.x - t, e.point.y - t],
        [e.point.x + t, e.point.y + t],
      ],
      { layers: [GRAPH_LAYER_IDS.nodes] },
    );
    let best: { at: LngLat; d: number } | null = null;
    for (const hit of hits) {
      if (hit.properties?.id === exceptId || hit.geometry.type !== 'Point') continue;
      const at = hit.geometry.coordinates as LngLat;
      const { x, y } = map.project(at);
      const d = Math.hypot(x - e.point.x, y - e.point.y);
      if (d <= t && (!best || d < best.d)) best = { at, d };
    }
    return best?.at ?? [e.lngLat.lng, e.lngLat.lat];
  }

  function preview(id: string, node: GraphNodeDrag, at: LngLat) {
    setGraphPreview(
      map,
      [{ id, coordinates: at, role: node.role }],
      node.neighbours.map((other, i) => ({
        id: `${id}-${i}`,
        from: at,
        to: other,
        accessible: true,
      })),
    );
  }

  function onDown(e: MapLayerMouseEvent) {
    const id = e.features?.[0]?.properties?.id;
    if (typeof id !== 'string' || e.originalEvent.button !== 0 || e.originalEvent.shiftKey) return;
    if (!options.enabled()) return;
    const node = options.dragStart(id);
    if (!node) return;
    // Menghentikan geser peta untuk gerakan ini.
    e.preventDefault();
    drag = { id, node, start: e.point, to: node.coordinates, moved: false };
  }

  function onMove(e: MapMouseEvent) {
    if (!drag) return;
    const { x, y } = drag.start;
    if (!drag.moved && Math.hypot(e.point.x - x, e.point.y - y) < DRAG_THRESHOLD_PX) return;
    drag.moved = true;
    drag.to = snapped(e, drag.id);
    preview(drag.id, drag.node, drag.to);
    map.getCanvas().style.cursor = 'grabbing';
  }

  function onUp() {
    if (!drag) return;
    const { id, to, moved } = drag;
    drag = null;
    setGraphPreview(map, [], []);
    map.getCanvas().style.cursor = '';
    if (moved) options.onMove(id, to);
  }

  function onEnter() {
    if (options.enabled()) map.getCanvas().style.cursor = 'grab';
  }
  function onLeave() {
    if (!drag) map.getCanvas().style.cursor = '';
  }

  map.on('mousedown', GRAPH_LAYER_IDS.nodes, onDown);
  map.on('mouseenter', GRAPH_LAYER_IDS.nodes, onEnter);
  map.on('mouseleave', GRAPH_LAYER_IDS.nodes, onLeave);
  map.on('mousemove', onMove);
  map.on('mouseup', onUp);
  return {
    destroy() {
      map.off('mousedown', GRAPH_LAYER_IDS.nodes, onDown);
      map.off('mouseenter', GRAPH_LAYER_IDS.nodes, onEnter);
      map.off('mouseleave', GRAPH_LAYER_IDS.nodes, onLeave);
      map.off('mousemove', onMove);
      map.off('mouseup', onUp);
    },
  };
}
