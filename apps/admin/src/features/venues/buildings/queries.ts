import type { BuildingId, BuildingInput, VenueId } from '@indoor/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../../app/data-client';

const key = (venueId: VenueId) => ['buildings', venueId] as const;

export function useBuildings(venueId: VenueId) {
  return useQuery({ queryKey: key(venueId), queryFn: () => data.buildings.list(venueId) });
}

export function useOutdoorLayer(venueId: VenueId) {
  return useQuery({
    queryKey: ['outdoor-layer', venueId],
    queryFn: () => data.buildings.outdoorLayer(venueId),
  });
}

function useRefresh(venueId: VenueId) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: key(venueId) }),
      queryClient.invalidateQueries({ queryKey: ['venues'] }),
      // Pemakaian kuota paket ikut berubah.
      queryClient.invalidateQueries({ queryKey: ['license', 'usage'] }),
    ]);
}

export function useSaveBuilding(venueId: VenueId) {
  const refresh = useRefresh(venueId);
  return useMutation({
    mutationFn: ({ id, input }: { id: BuildingId | null; input: BuildingInput }) =>
      id ? data.buildings.update(id, input) : data.buildings.create(venueId, input),
    onSuccess: refresh,
  });
}

export function useRemoveBuilding(venueId: VenueId) {
  const refresh = useRefresh(venueId);
  return useMutation({
    mutationFn: (id: BuildingId) => data.buildings.remove(id),
    onSuccess: refresh,
  });
}

export function useSetDefaultBuilding(venueId: VenueId) {
  const refresh = useRefresh(venueId);
  return useMutation({
    mutationFn: (id: BuildingId) => data.buildings.setDefault(venueId, id),
    onSuccess: refresh,
  });
}
