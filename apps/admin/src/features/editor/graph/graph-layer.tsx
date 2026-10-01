import {
  createGraphInteractions,
  type MapInstance,
  setGraphData,
  setGraphSelection,
} from '@indoor/map-core';
import { useEffect, useRef } from 'react';
import { useEditorStore } from '../store/editor-store';
import type { EditorSession } from '../use-editor-session';
import { useEntranceStore } from './entrance-store';
import { graphViews, neighbourPositions } from './graph-views';

/**
 * Graf jalur lantai di kanvas editor: node dan edge, sorotan seleksi, dan menarik node untuk
 * memindahnya (dilepas di atas node lain = digabung).
 */
export function GraphLayer({
  map,
  session,
  canEdit,
}: {
  map: MapInstance | null;
  session: EditorSession;
  canEdit: boolean;
}) {
  const graph = useEditorStore((s) => s.graph);
  const selection = useEditorStore((s) => s.graphSelection);
  const sessionRef = useRef(session);
  sessionRef.current = session;
  const canEditRef = useRef(canEdit);
  canEditRef.current = canEdit;

  useEffect(() => {
    if (!map) return;
    const { nodes, edges } = graphViews(graph);
    setGraphData(map, nodes, edges);
  }, [map, graph]);

  useEffect(() => {
    if (map) setGraphSelection(map, selection);
  }, [map, selection]);

  useEffect(() => {
    if (!map) return;
    const interactions = createGraphInteractions(map, {
      enabled: () => {
        const s = useEditorStore.getState();
        const linking = useEntranceStore.getState().linkingId !== null;
        return canEditRef.current && s.tool === 'select' && s.viewMode === '2d' && !linking;
      },
      dragStart: (id) => {
        const s = useEditorStore.getState();
        const node = s.graph.nodes[id];
        // Selagi fitur disunting, terra-draw yang menangani tarikan di atasnya; node yang belum
        // terpilih dipilih dulu dengan klik.
        if (!node || (s.selectedIds.length > 0 && s.graphSelection?.id !== id)) return undefined;
        s.selectGraph({ kind: 'node', id });
        return {
          coordinates: node.coordinates,
          role: node.role,
          neighbours: neighbourPositions(s.graph, id),
        };
      },
      onMove: (id, to) => sessionRef.current.graph.moveNode(id, to),
    });
    return () => interactions.destroy();
  }, [map]);

  return null;
}
