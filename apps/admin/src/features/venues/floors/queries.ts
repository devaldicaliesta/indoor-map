import type { BuildingId, FloorId, FloorInput } from '@indoor/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../../app/data-client';

const key = (buildingId: BuildingId) => ['floors', buildingId] as const;

export function useFloors(buildingId: BuildingId | null) {
  return useQuery({
    queryKey: key(buildingId as BuildingId),
    queryFn: () => data.floors.list(buildingId as BuildingId),
    enabled: buildingId !== null,
  });
}

function useRefresh(buildingId: BuildingId) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: key(buildingId) }),
      queryClient.invalidateQueries({ queryKey: ['buildings'] }),
    ]);
}

export function useSaveFloor(buildingId: BuildingId) {
  const refresh = useRefresh(buildingId);
  return useMutation({
    mutationFn: ({ id, input }: { id: FloorId | null; input: FloorInput }) =>
      id ? data.floors.update(id, input) : data.floors.create(buildingId, input),
    onSuccess: refresh,
  });
}

export function useRemoveFloor(buildingId: BuildingId) {
  const refresh = useRefresh(buildingId);
  return useMutation({ mutationFn: (id: FloorId) => data.floors.remove(id), onSuccess: refresh });
}

export function useSetDefaultFloor(buildingId: BuildingId) {
  const refresh = useRefresh(buildingId);
  return useMutation({
    mutationFn: (id: FloorId) => data.floors.setDefault(buildingId, id),
    onSuccess: refresh,
  });
}
