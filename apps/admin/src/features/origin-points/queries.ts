import {
  type GraphPatch,
  type OriginPoint,
  type OriginPointInput,
  type Position,
  snapOriginPoint,
  type VenueId,
} from '@indoor/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../app/data-client';
import { editorQueues } from '../editor/session-helpers';

export const originPointsKey = (venueId: VenueId) => ['origin-points', venueId] as const;

export function useOriginPoints(venueId: VenueId) {
  return useQuery({
    queryKey: originPointsKey(venueId),
    queryFn: () => data.originPoints.list(venueId),
  });
}

export function usePublicVisitorUrl() {
  return useQuery({
    queryKey: ['public-visitor-url'],
    queryFn: () => data.systemSettings.publicVisitorUrl(),
  });
}

/** Graf tersimpan venue; dipakai peta pemilih posisi dan penempelan ke jalur. */
export function useSavedGraph(venueId: VenueId) {
  return useQuery({
    queryKey: ['origin-points', 'graph', venueId],
    queryFn: () => data.navGraph.listByVenue(venueId),
  });
}

function toChanges(patch: GraphPatch) {
  return {
    saveNodes: patch.nodes.flatMap((c) => (c.after ? [c.after] : [])),
    removeNodeIds: patch.nodes.flatMap((c) => (c.after ? [] : [c.id])),
    saveEdges: patch.edges.flatMap((c) => (c.after ? [c.after] : [])),
    removeEdgeIds: patch.edges.flatMap((c) => (c.after ? [] : [c.id])),
  };
}

export interface OriginPointDraft {
  id: string | null;
  floorId: string;
  name: string;
  position: Position;
  headingDeg: number;
}

export class SnapError extends Error {}

/**
 * Simpan titik asal: tempelkan ke jalur tersimpan terbaru (edge dipecah bila perlu, langsung
 * disimpan seperti editor menyimpan graf), lalu simpan titiknya di posisi jalur itu.
 */
export function useSaveOriginPoint(venueId: VenueId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: OriginPointDraft): Promise<OriginPoint> => {
      // Jalur yang baru digambar di editor harus tersimpan dulu agar titik menempel ke graf terbaru.
      await Promise.all(editorQueues().map((queue) => queue.flush()));
      const graph = await data.navGraph.listByVenue(venueId);
      const snap = snapOriginPoint(graph, draft.floorId, draft.position, () => crypto.randomUUID());
      if (!snap) {
        throw new SnapError(
          'Tidak ada jalur dalam 15 m dari titik ini. Gambar jalur di Editor Peta lebih dulu.',
        );
      }
      if (snap.patch.nodes.length || snap.patch.edges.length) {
        await data.navGraph.apply(venueId, toChanges(snap.patch));
      }
      const input: OriginPointInput = {
        floorId: draft.floorId,
        name: draft.name,
        coordinates: snap.coordinates,
        headingDeg: draft.headingDeg,
        nodeId: snap.nodeId,
      };
      return draft.id
        ? data.originPoints.update(draft.id, input)
        : data.originPoints.create(venueId, input);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: originPointsKey(venueId) });
      void queryClient.invalidateQueries({ queryKey: ['origin-points', 'graph', venueId] });
    },
  });
}

export function useRemoveOriginPoint(venueId: VenueId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => data.originPoints.remove(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: originPointsKey(venueId) }),
  });
}
