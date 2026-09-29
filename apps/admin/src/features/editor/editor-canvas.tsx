import type { FloorFeatures } from '@indoor/data';
import type { FloorId } from '@indoor/domain';
import {
  type Corners,
  createFeatureEditor,
  createMap,
  type FeatureEditor,
  featureBounds,
  type LngLat,
  type MapInstance,
  setFloorData,
  setFloorPlanImage,
  setHiddenFeature,
} from '@indoor/map-core';
import { useEffect, useRef, useState } from 'react';
import { featureList, useEditorStore } from './editor-store';
import { ReferenceLayer } from './reference-layer';
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
  onCursor,
}: {
  session: EditorSession;
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
  const selectedId = useEditorStore((s) => s.selectedId);
  const tool = useEditorStore((s) => s.tool);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const onCursorRef = useRef(onCursor);
  onCursorRef.current = onCursor;
  const initialCenter = useRef(center ?? FALLBACK_CENTER);

  useEffect(() => {
    if (!container.current) return;
    const instance = createMap(container.current, { center: initialCenter.current, zoom: 18 });
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
        onPick: (id) => useEditorStore.getState().select(id),
      });
      setMap(instance);
    });
    return () => {
      cancelAnimationFrame(frame);
      editor.current?.destroy();
      editor.current = null;
      instance.remove();
    };
  }, []);

  useEffect(() => {
    if (map) setFloorData(map, toCollection(featureList(features)));
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

  useEffect(() => {
    editor.current?.setTool(canEdit ? tool : 'select');
  }, [map, tool, canEdit]);

  const selected = selectedId ? features[selectedId] : undefined;
  useEffect(() => {
    if (!map) return;
    const editing = canEdit && selected && tool === 'select' ? selected : null;
    setHiddenFeature(map, editing ? editing.properties.id : null);
    editor.current?.edit(
      editing ? { id: editing.properties.id, geometry: editing.geometry } : null,
    );
  }, [map, selected, tool, canEdit]);

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
