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
  focusFeature,
  type LngLat,
  type MapDisplay,
  type MapInstance,
  type SnapIndex,
  setFacilityIcons,
  setFloorData,
  setFloorPlanImage,
  setHiddenFeatures,
  setHoverHighlight,
  setMapDisplay,
  setSelectionHighlight,
  setViewMode,
} from '@indoor/map-core';
import { type MapControlLabels, MapControls } from '@indoor/ui';
import { useEffect, useMemo, useRef, useState } from 'react';
import { facilityIconSpecs } from '../facilities/icons';
import { GraphLayer } from './graph/graph-layer';
import { graphSnapFeatures } from './graph/graph-views';
import { ReferenceLayer } from './reference-layer';
import { featureList, singleSelected, useEditorStore } from './store/editor-store';
import type { EditorSession } from './use-editor-session';
import { ValidationOverlay } from './validation-overlay';

export interface PlanBackground {
  imageUrl: string;
  corners: Corners;
  opacity: number;
}

const FALLBACK_CENTER: LngLat = [106.8272, -6.1754];

const CONTROL_LABELS: MapControlLabels = {
  zoomIn: 'Perbesar',
  zoomOut: 'Perkecil',
  resetNorth: 'Arahkan ke utara',
  viewMode: 'Mode tampilan',
  mode2d: '2D',
  mode3d: '3D',
};

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
  issueFeatureIds,
  display,
  onCursor,
}: {
  session: EditorSession;
  facilityTypes: readonly FacilityType[];
  issueFeatureIds: readonly string[];
  /** Tinggi dan warna venue agar pratinjau 3D sesuai pengaturan. */
  display: MapDisplay;
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
  const graphSnapIndex = useRef<SnapIndex>(buildSnapIndex([]));
  const graph = useEditorStore((s) => s.graph);
  const canEditRef = useRef(canEdit);
  canEditRef.current = canEdit;
  const tool = useEditorStore((s) => s.tool);
  const hoveredId = useEditorStore((s) => s.hoveredId);
  const viewMode = useEditorStore((s) => s.viewMode);
  const [bearing, setBearing] = useState(0);
  const focusRequest = useEditorStore((s) => s.focusRequest);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const onCursorRef = useRef(onCursor);
  onCursorRef.current = onCursor;
  const initialCenter = useRef(center ?? FALLBACK_CENTER);

  useEffect(() => {
    if (!container.current) return;
    const element = container.current;
    const instance = createMap(element, {
      center: initialCenter.current,
      zoom: 18,
      fadeDuration: 0,
    });
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
    instance.on('rotate', () => setBearing(instance.getBearing()));
    instance.once('load', () => {
      editor.current = createFeatureEditor(instance, {
        onDraw: (geometry) => sessionRef.current.draw(geometry),
        onEdit: (id, geometry) => sessionRef.current.editGeometry(id, geometry),
        onPick: (id, additive) => {
          const store = useEditorStore.getState();
          if (additive && id) store.toggleSelect(id);
          else if (!additive) store.select(id);
        },
        onDrawPath: (coordinates) => sessionRef.current.graph.drawPath(coordinates),
        onPickGraph: (element) => useEditorStore.getState().selectGraph(element),
        snap: {
          enabled: () => useEditorStore.getState().snapEnabled,
          // Jalur menempel ke node dan edge graf; alat lain ke fitur lantai.
          candidates: (bbox, excludeId) =>
            (useEditorStore.getState().tool === 'path' ? graphSnapIndex : snapIndex).current.query(
              bbox,
              excludeId,
            ),
        },
      });
      selection = createSelectionInteractions(instance, {
        enabled: () => {
          const state = useEditorStore.getState();
          return canEditRef.current && state.tool === 'select' && state.viewMode === '2d';
        },
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

  useEffect(() => {
    graphSnapIndex.current = buildSnapIndex(graphSnapFeatures(graph));
  }, [graph]);

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

  useEffect(() => {
    if (map) setHoverHighlight(map, hoveredId);
  }, [map, hoveredId]);

  useEffect(() => {
    if (!map || !focusRequest) return;
    const geometry = useEditorStore.getState().features[focusRequest.id]?.geometry;
    if (geometry) focusFeature(map, geometry);
  }, [map, focusRequest]);

  // Sprite dibangun ulang hanya bila ikon atau tanda keselamatan berubah.
  const iconSpecs = useMemo(() => facilityIconSpecs(facilityTypes), [facilityTypes]);
  const iconKey = JSON.stringify(iconSpecs);
  const iconBackground = display.colors?.facility;
  useEffect(() => {
    if (map) void setFacilityIcons(map, iconSpecs, { background: iconBackground });
  }, [map, iconKey, iconBackground]);

  const displayKey = JSON.stringify(display);
  useEffect(() => {
    if (map) setMapDisplay(map, display);
  }, [map, displayKey]);

  // Beralih 2D/3D hanya mengganti tampilan; isi store dan riwayat tidak tersentuh.
  useEffect(() => {
    if (map) setViewMode(map, viewMode);
  }, [map, viewMode]);

  useEffect(() => {
    editor.current?.setTool(canEdit ? tool : 'select');
  }, [map, tool, canEdit]);

  useEffect(() => {
    if (!map) return;
    // Satu fitur: disunting di terra-draw. Lebih dari satu (atau mode baca): hanya disorot.
    const editing = canEdit && selected && tool === 'select' && viewMode === '2d' ? selected : null;
    // Titik (ikon fasilitas, pintu) tetap tampil dan disorot agar jelas mana yang terpilih;
    // pegangan terra-draw untuk menggeser ada di atasnya.
    const editingPoint = editing?.geometry.type === 'Point' ? editing.properties.id : null;
    setHiddenFeatures(map, editing && !editingPoint ? [editing.properties.id] : []);
    setSelectionHighlight(map, editing ? (editingPoint ? [editingPoint] : []) : selectedIds);
    editor.current?.edit(
      editing ? { id: editing.properties.id, geometry: editing.geometry } : null,
    );
  }, [map, selected, selectedIds, tool, canEdit, viewMode]);

  return (
    <>
      <div
        ref={container}
        className="size-full"
        data-testid="editor-map"
        data-ready={map && session.ready ? 'true' : 'false'}
      />
      <ReferenceLayer map={map} floorId={referenceFloorId} />
      <GraphLayer map={map} session={session} canEdit={canEdit} />
      <ValidationOverlay map={map} featureIds={issueFeatureIds} />
      <MapControls
        className="absolute right-3 bottom-3"
        labels={CONTROL_LABELS}
        bearing={bearing}
        mode={viewMode}
        onModeChange={(mode) => useEditorStore.getState().setViewMode(mode)}
        onZoomIn={() => map?.zoomIn()}
        onZoomOut={() => map?.zoomOut()}
        onResetNorth={() => map?.easeTo({ bearing: 0 })}
      />
      {viewMode === '3d' ? (
        <p className="absolute bottom-3 left-3 rounded-sm bg-surface px-3 py-1.5 text-sm shadow-(--shadow-float)">
          Mode 3D untuk memeriksa hasil. Pilih alat gambar untuk kembali ke 2D.
        </p>
      ) : null}
    </>
  );
}
