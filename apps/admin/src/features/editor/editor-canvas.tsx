import type { FloorFeatures } from '@indoor/data';
import type { FacilityType, FloorId } from '@indoor/domain';
import {
  buildSnapIndex,
  type Corners,
  createFeatureEditor,
  createMap,
  createSelectionInteractions,
  type FeatureEditor,
  featureBounds,
  type LngLat,
  type MapInstance,
  type SnapIndex,
  setFacilityIcons,
  setFloorData,
  setFloorPlanImage,
  setHiddenFeatures,
  setSelectionHighlight,
} from '@indoor/map-core';
import { useEffect, useMemo, useRef, useState } from 'react';
import { facilityIconSpecs } from '../facilities/icons';
import { ReferenceLayer } from './reference-layer';
import { featureList, singleSelected, useEditorStore } from './store/editor-store';
import type { EditorSession } from './use-editor-session';

export interface PlanBackground {
  imageUrl: string;
  corners: Corners;
  opacity: number;
}

const FALLBACK_CENTER: LngLat = [106.8272, -6.1754];

function toCollection(features: ReturnType<typeof featureList>): FloorFeatures {
  return { type: 'FeatureCollection', features };
}

/** Kanvas editor: fitur lantai (layer style), denah latar, lantai acuan, dan lapisan sunting. */
export function EditorCanvas({
  session,
  canEdit,
  plan,
  center,
  referenceFloorId,
  facilityTypes,
  onCursor,
}: {
  session: EditorSession;
  facilityTypes: readonly FacilityType[];
  canEdit: boolean;
  plan: PlanBackground | null;
  center: LngLat | null;
  referenceFloorId: FloorId | null;
  onCursor: (lngLat: LngLat | null) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const editor = useRef<FeatureEditor | null>(null);
  const [map, setMap] = useState<MapInstance | null>(null);
  const features = useEditorStore((s) => s.features);
  const floorId = useEditorStore((s) => s.floorId);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const selected = useEditorStore(singleSelected);
  const snapIndex = useRef<SnapIndex>(buildSnapIndex([]));
  const canEditRef = useRef(canEdit);
  canEditRef.current = canEdit;
  const tool = useEditorStore((s) => s.tool);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const onCursorRef = useRef(onCursor);
  onCursorRef.current = onCursor;
  const initialCenter = useRef(center ?? FALLBACK_CENTER);

  useEffect(() => {
    if (!container.current) return;
    const element = container.current;
    const instance = createMap(element, { center: initialCenter.current, zoom: 18 });
    // terra-draw mencegah fokus pindah ke peta; kolom yang masih fokus disimpan dan dilepas
    // agar pintasan (Delete, Ctrl+Z) langsung berlaku setelah mengklik peta.
    const releaseFocus = () => {
      const active = document.activeElement;
      if (
        active instanceof HTMLElement &&
        active.matches('input, textarea, select, [contenteditable]')
      ) {
        active.blur();
      }
    };
    element.addEventListener('pointerdown', releaseFocus, { capture: true });
    let selection: { destroy(): void } | null = null;
    let frame = 0;
    instance.on('mousemove', (e) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => onCursorRef.current([e.lngLat.lng, e.lngLat.lat]));
    });
    instance.on('mouseout', () => onCursorRef.current(null));
    instance.once('load', () => {
      editor.current = createFeatureEditor(instance, {
        onDraw: (geometry) => sessionRef.current.draw(geometry),
        onEdit: (id, geometry) => sessionRef.current.editGeometry(id, geometry),
        onPick: (id, additive) => {
          const store = useEditorStore.getState();
          if (additive && id) store.toggleSelect(id);
          else if (!additive) store.select(id);
        },
        snap: {
          enabled: () => useEditorStore.getState().snapEnabled,
          candidates: (bbox, excludeId) => snapIndex.current.query(bbox, excludeId),
        },
      });
      selection = createSelectionInteractions(instance, {
        enabled: () => canEditRef.current && useEditorStore.getState().tool === 'select',
        selectedIds: () => useEditorStore.getState().selectedIds,
        geometryOf: (id) => useEditorStore.getState().features[id]?.geometry,
        onBoxSelect: (ids) => useEditorStore.getState().selectMany(ids),
        onGroupMove: (from, to) =>
          sessionRef.current.moveMany(useEditorStore.getState().selectedIds, from, to),
      });
      setMap(instance);
    });
    return () => {
      cancelAnimationFrame(frame);
      element.removeEventListener('pointerdown', releaseFocus, { capture: true });
      selection?.destroy();
      editor.current?.destroy();
      editor.current = null;
      instance.remove();
    };
  }, []);

  useEffect(() => {
    const list = featureList(features);
    snapIndex.current = buildSnapIndex(list);
    if (map) setFloorData(map, toCollection(list));
  }, [map, features]);

  // Kamera diarahkan ke isi lantai setiap kali lantai berganti.
  const framedFloor = useRef<string | null>(null);
  useEffect(() => {
    if (!map || !floorId || framedFloor.current === floorId) return;
    framedFloor.current = floorId;
    const all = featureList(useEditorStore.getState().features);
    const bounds =
      featureBounds(toCollection(all)) ??
      (plan
        ? featureBounds({
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: { type: 'MultiPoint', coordinates: plan.corners },
                properties: { id: 'plan', kind: 'unit', floorId },
              },
            ],
          })
        : null);
    if (bounds) map.fitBounds(bounds, { padding: 64, duration: 0, maxZoom: 21 });
    else if (center) map.jumpTo({ center });
  }, [map, floorId, plan, center]);

  useEffect(() => {
    if (map) setFloorPlanImage(map, plan);
  }, [map, plan]);

  // FR-MAP-07: sprite ikon fasilitas dibangun ulang hanya bila ikon/keselamatan berubah.
  const iconSpecs = useMemo(() => facilityIconSpecs(facilityTypes), [facilityTypes]);
  const iconKey = JSON.stringify(iconSpecs);
  useEffect(() => {
    if (map) void setFacilityIcons(map, iconSpecs);
  }, [map, iconKey]);

  useEffect(() => {
    editor.current?.setTool(canEdit ? tool : 'select');
  }, [map, tool, canEdit]);

  useEffect(() => {
    if (!map) return;
    // Satu fitur: disunting di terra-draw. Lebih dari satu (atau mode baca): hanya disorot.
    const editing = canEdit && selected && tool === 'select' ? selected : null;
    // Titik (ikon fasilitas, pintu) tetap tampil dan disorot agar jelas mana yang terpilih;
    // pegangan terra-draw untuk menggeser ada di atasnya.
    const editingPoint = editing?.geometry.type === 'Point' ? editing.properties.id : null;
    setHiddenFeatures(map, editing && !editingPoint ? [editing.properties.id] : []);
    setSelectionHighlight(map, editing ? (editingPoint ? [editingPoint] : []) : selectedIds);
    editor.current?.edit(
      editing ? { id: editing.properties.id, geometry: editing.geometry } : null,
    );
  }, [map, selected, selectedIds, tool, canEdit]);

  return (
    <>
      <div
        ref={container}
        className="size-full"
        data-testid="editor-map"
        data-ready={map && session.ready ? 'true' : 'false'}
      />
      <ReferenceLayer map={map} floorId={referenceFloorId} />
    </>
  );
}
