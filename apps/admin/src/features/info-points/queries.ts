import { type InfoPoint, type InfoPointInput, snapOriginPoint, type VenueId } from '@indoor/domain';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { data } from '../../app/data-client';
import { editorQueues } from '../editor/session-helpers';
import { SnapError, toChanges } from '../origin-points/queries';

const infoPointsKey = (venueId: VenueId) => ['info-points', venueId] as const;

/**
 * Simpan Info Point: tempelkan ke jalur tersimpan terbaru (sama seperti titik asal), lalu simpan
 * posisi jalur itu. Kuota dan fitur paket diperiksa server.
 */
export function useSaveInfoPoint(venueId: VenueId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string | null; input: InfoPointInput }) => {
      await Promise.all(editorQueues().map((queue) => queue.flush()));
      const graph = await data.navGraph.listByVenue(venueId);
      const snap = snapOriginPoint(graph, input.floorId, input.coordinates, () =>
        crypto.randomUUID(),
      );
      if (!snap) {
        throw new SnapError(
          'Tidak ada jalur dalam 15 m dari titik ini. Gambar jalur di Editor Peta lebih dulu.',
        );
      }
      if (snap.patch.nodes.length || snap.patch.edges.length) {
        await data.navGraph.apply(venueId, toChanges(snap.patch));
      }
      const saved = { ...input, coordinates: snap.coordinates, nodeId: snap.nodeId };
      return id ? data.infoPoints.update(id, saved) : data.infoPoints.create(venueId, saved);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: infoPointsKey(venueId) });
      void queryClient.invalidateQueries({ queryKey: ['origin-points', 'graph', venueId] });
      void queryClient.invalidateQueries({ queryKey: ['license', 'usage'] });
    },
  });
}

export function useRemoveInfoPoint(venueId: VenueId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (point: InfoPoint) => data.infoPoints.remove(point.id),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: infoPointsKey(venueId) });
      void queryClient.invalidateQueries({ queryKey: ['license', 'usage'] });
    },
  });
}
