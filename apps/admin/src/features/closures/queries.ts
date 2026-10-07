import type { ClosurePageFilters, PageQuery } from '@indoor/data';
import type { ClosureInput, VenueId } from '@indoor/domain';
import { buildRouteGraph, routeDataFromDraft } from '@indoor/routing';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { data } from '../../app/data-client';
import { useConnectors, useVenueFloors } from '../editor/connectors/queries';
import { CLOSURE_REFRESH_MS, closuresKey } from '../editor/graph/graph-queries';
import { editorQueues } from '../editor/session-helpers';
import type { ClosurePlaces } from './closure-model';

export { useCurrentClosures } from '../editor/graph/graph-queries';

/**
 * Elemen yang baru digambar di editor (klik kanan "Tutup sementara") harus sudah tersimpan
 * sebelum dibaca atau dirujuk penutupan; di luar editor antreannya kosong.
 */
const flushEditor = () => Promise.all(editorQueues().map((queue) => queue.flush()));

/**
 * Jaringan tersimpan venue untuk nama sasaran dan dampak penutupan. Penutupan berlaku tanpa
 * publish, jadi dampaknya dinilai dari data tersimpan, bukan draft yang sedang disunting.
 */
export function useClosureNetwork(venueId: VenueId) {
  const places = useVenueFloors(venueId).data;
  const connectors = useConnectors(venueId).data;
  const graph = useQuery({
    queryKey: ['closure-network', 'graph', venueId],
    queryFn: async () => {
      await flushEditor();
      return data.navGraph.listByVenue(venueId);
    },
  }).data;
  const features = useQuery({
    queryKey: ['closure-network', 'features', venueId],
    queryFn: async () => {
      await flushEditor();
      return data.features.listByVenue(venueId);
    },
  }).data;
  return useMemo(() => {
    if (!places || !connectors || !graph || !features) return null;
    const network: ClosurePlaces = {
      floors: places.floors,
      buildings: places.buildings,
      connectors,
      features: features.features,
      graph,
    };
    const routeData = routeDataFromDraft({
      floors: places.floors,
      graph,
      connectors,
      features: features.features,
      locations: [],
      originPoints: [],
      infoPoints: [],
    });
    return { places: network, routeGraph: buildRouteGraph(routeData) };
  }, [places, connectors, graph, features]);
}

/**
 * Satu halaman tabel Penutupan dari server (termasuk yang sudah selesai). Keadaan dihitung
 * server terhadap waktu sekarang, jadi dimuat ulang tiap menit seperti daftar di editor.
 */
export function useClosurePage(venueId: VenueId, query: PageQuery<ClosurePageFilters>) {
  return useQuery({
    queryKey: [...closuresKey(venueId), 'page', query],
    queryFn: () => data.closures.listPage(venueId, query),
    placeholderData: keepPreviousData,
    refetchInterval: CLOSURE_REFRESH_MS,
  });
}

export function useClosureMutations(venueId: VenueId) {
  const queryClient = useQueryClient();
  const onSettled = () => queryClient.invalidateQueries({ queryKey: closuresKey(venueId) });
  return {
    create: useMutation({
      mutationFn: async (input: ClosureInput) => {
        await flushEditor();
        return data.closures.create(venueId, input);
      },
      onSettled,
    }),
    setEndsAt: useMutation({
      mutationFn: ({ id, endsAt }: { id: string; endsAt: string | null }) =>
        data.closures.setEndsAt(id, endsAt),
      onSettled,
    }),
    remove: useMutation({ mutationFn: (id: string) => data.closures.remove(id), onSettled }),
  };
}

/** Zona waktu venue untuk isian dan tampilan waktu penutupan. */
export function useVenueTimezone(venueId: VenueId): string {
  return (
    useQuery({ queryKey: ['venue', venueId], queryFn: () => data.venues.get(venueId) }).data
      ?.timezone ?? 'Asia/Jakarta'
  );
}
