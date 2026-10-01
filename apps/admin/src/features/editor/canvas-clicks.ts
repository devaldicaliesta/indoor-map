import { graphElementAt, type LngLat, type MapInstance, PICK_TOLERANCE_PX } from '@indoor/map-core';
import { useEntranceStore } from './graph/entrance-store';
import { useEditorStore } from './store/editor-store';
import { useTestRouteStore } from './test-route/test-route-store';
import type { EditorSession } from './use-editor-session';

/**
 * Klik peta di alat Pilih yang lebih dulu dipakai alat lain: titik asal/tujuan uji rute, atau
 * menyambung titik masuk manual (klik berikutnya di jalur membuat titik masuknya). `true` = klik
 * sudah dipakai sehingga seleksi tidak berubah.
 */
export function interceptCanvasClick(
  map: MapInstance,
  session: EditorSession,
  at: LngLat,
  point: { x: number; y: number },
): boolean {
  const route = useTestRouteStore.getState();
  const floorId = useEditorStore.getState().floorId;
  if (route.picking && floorId) {
    route.setPlace(route.picking, { kind: 'point', lng: at[0], lat: at[1], floorId });
    return true;
  }
  const entrances = useEntranceStore.getState();
  if (!entrances.linkingId) return false;
  if (!graphElementAt(map, point, PICK_TOLERANCE_PX + 2)) {
    entrances.setLinkingMessage('Klik tepat pada garis jalur.');
  } else if (session.graph.linkEntrance(entrances.linkingId, at)) {
    entrances.stopLinking();
  } else {
    entrances.setLinkingMessage('Titik masuk tidak bisa dibuat di sini.');
  }
  return true;
}
