import type { Floor, FloorId, GraphPatch, VenueId } from '@indoor/domain';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { data } from '../../app/data-client';
import { editorQueues, graphSaveQueue, saveQueue } from './session-helpers';
import { type EditorPatch, type FeaturePatch, useEditorStore } from './store/editor-store';
import { type Direction, valueAfter } from './store/history';

/**
 * Memuat fitur dan graf jalur satu lantai ke store, lalu menyimpan setiap aksi: fitur ke antrean
 * fitur, node dan edge ke antrean graf. Undo/redo ikut memicu simpan otomatis.
 */
export function useEditorPersistence(venueId: VenueId, floor: Floor | undefined) {
  const floorId = floor?.id ?? null;
  const loaded = useEditorStore((s) => s.floorId === floorId && floorId !== null);
  const query = useQuery({
    queryKey: ['editor-floor', floorId],
    queryFn: async () => {
      // Tulis yang tertunda lebih dulu agar yang dimuat adalah draft terbaru.
      await Promise.all(editorQueues().map((queue) => queue.flush()));
      const id = floorId as FloorId;
      const [features, graph] = await Promise.all([
        data.features.listByFloor(id),
        data.navGraph.listByFloor(id),
      ]);
      return { features, graph };
    },
    enabled: floorId !== null,
    // Store adalah sumber kebenaran selama menyunting; jangan timpa dengan data server.
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (floorId && query.data && !loaded) {
      const { features, graph } = query.data;
      useEditorStore.getState().load(floorId, features, floor?.isOutdoor ?? false, graph);
    }
  }, [floorId, query.data, loaded, floor?.isOutdoor]);

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (editorQueues().some((queue) => queue.hasUnsaved())) event.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, []);

  /** Satu aksi editor: tiap fitur masuk antrean simpan fitur, node dan edge ke antrean graf. */
  const persist = useCallback(
    (patch: EditorPatch, direction: Direction) => {
      for (const change of patch.features) {
        const value = valueAfter(change, direction);
        saveQueue().enqueue(
          change.id,
          value ? { type: 'save', value: { venueId, feature: value } } : { type: 'remove' },
        );
      }
      if (patch.nodes.length === 0 && patch.edges.length === 0) return;
      graphSaveQueue().enqueue(venueId, {
        nodes: patch.nodes.map((change) => ({
          id: change.id,
          value: valueAfter(change, direction),
        })),
        edges: patch.edges.map((change) => ({
          id: change.id,
          value: valueAfter(change, direction),
        })),
      });
    },
    [venueId],
  );

  const commit = useCallback(
    (patch: FeaturePatch) => {
      useEditorStore.getState().commit(patch);
      persist({ features: patch, nodes: [], edges: [] }, 'do');
    },
    [persist],
  );

  const commitGraph = useCallback(
    (patch: GraphPatch) => {
      useEditorStore.getState().commitGraph(patch);
      persist({ features: [], nodes: patch.nodes, edges: patch.edges }, 'do');
    },
    [persist],
  );

  const undo = useCallback(() => {
    const step = useEditorStore.getState().undo();
    if (step) persist(step.patch, step.direction);
  }, [persist]);

  const redo = useCallback(() => {
    const step = useEditorStore.getState().redo();
    if (step) persist(step.patch, step.direction);
  }, [persist]);

  return { loaded, error: query.error, commit, commitGraph, undo, redo };
}
