import {
  addPath,
  applyEntrances,
  type EntranceSuggestion,
  type FloorId,
  type GraphPatch,
  linkEntrance as linkGraphEntrance,
  moveNode as moveGraphNode,
  type Position,
  removeEdge as removeGraphEdge,
  removeNode as removeGraphNode,
  splitEdge as splitGraphEdge,
} from '@indoor/domain';
import { useMemo } from 'react';
import { useEditorStore } from '../store/editor-store';

const newId = () => crypto.randomUUID();
const currentGraph = () => useEditorStore.getState().graph;

/**
 * Aksi edit graf jalur lantai yang sedang dibuka. Perhitungan (persimpangan, gabung, pecah) ada
 * di `@indoor/domain`; setiap aksi menjadi satu langkah undo lewat `commit`.
 */
export function useGraphActions(floorId: FloorId | null, commit: (patch: GraphPatch) => void) {
  return useMemo(() => {
    const apply = (patch: GraphPatch | null) => {
      if (patch) commit(patch);
      return patch !== null;
    };
    const removeNode = (id: string) => apply(removeGraphNode(currentGraph(), id));
    const removeEdge = (id: string) => apply(removeGraphEdge(currentGraph(), id));
    return {
      /** Garis jalur baru dari alat Jalur. */
      drawPath(coordinates: Position[]) {
        if (floorId) apply(addPath(currentGraph(), coordinates, { floorId, newId }));
      },
      moveNode(id: string, to: Position) {
        apply(moveGraphNode(currentGraph(), id, to));
      },
      /** `false` bila node itu dipakai konektor, titik asal, atau Info Point. */
      removeNode,
      removeEdge,
      /** Pecah edge di tengah lalu pilih node barunya agar bisa langsung digeser. */
      splitEdge(id: string) {
        const patch = splitGraphEdge(currentGraph(), id, null, newId);
        if (!apply(patch)) return false;
        const created = patch?.nodes.find((change) => change.before === null);
        if (created) useEditorStore.getState().selectGraph({ kind: 'node', id: created.id });
        return true;
      },
      /** Menyetujui saran titik masuk (satu atau sekaligus) sebagai satu langkah undo. */
      approveEntrances(suggestions: readonly EntranceSuggestion[]) {
        if (floorId) apply(applyEntrances(currentGraph(), floorId, suggestions, newId));
      },
      /** Titik masuk manual dari unit/fasilitas ke titik jalur `at`; `false` bila tidak bisa. */
      linkEntrance(featureId: string, at: Position) {
        const feature = useEditorStore.getState().features[featureId];
        if (!floorId || !feature) return false;
        return apply(linkGraphEntrance(currentGraph(), floorId, feature, at, newId));
      },
      /** Hapus node atau edge terpilih; `false` bila node itu tidak boleh dihapus. */
      removeSelected() {
        const selected = useEditorStore.getState().graphSelection;
        if (!selected) return true;
        return selected.kind === 'node' ? removeNode(selected.id) : removeEdge(selected.id);
      },
    };
  }, [floorId, commit]);
}

export type GraphActions = ReturnType<typeof useGraphActions>;
