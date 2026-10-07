import type { BuildingId, FloorId, FloorInput } from '@indoor/domain';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../../app/data-client';

const key = (buildingId: BuildingId) => ['floors', buildingId] as const;

export function useFloors(buildingId: BuildingId | null) {
  return useQuery({
    queryKey: key(buildingId as BuildingId),
    queryFn: () => data.floors.list(buildingId as BuildingId),
    enabled: buildingId !== null,
  });
}

/** Lantai beberapa gedung sekaligus, urut sesuai daftar gedung lalu level (atas ke bawah). */
export function useBuildingFloors(buildingIds: readonly BuildingId[]) {
  return useQueries({
    queries: buildingIds.map((id) => ({
      queryKey: key(id),
      queryFn: () => data.floors.list(id),
    })),
    combine: (results) => ({
      data: results.every((result) => result.data)
        ? results.flatMap((result) => result.data ?? [])
        : undefined,
      error: results.find((result) => result.error)?.error ?? null,
      refetch: () => Promise.all(results.map((result) => result.refetch())),
    }),
  });
}

function useRefresh() {
  const queryClient = useQueryClient();
  return (buildingId: BuildingId) =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: key(buildingId) }),
      queryClient.invalidateQueries({ queryKey: ['buildings'] }),
      // Pemakaian kuota paket ikut berubah.
      queryClient.invalidateQueries({ queryKey: ['license', 'usage'] }),
    ]);
}

/** Gedung dibawa setiap mutasi: tabel lantai bisa menampilkan lantai semua gedung. */
interface FloorTarget {
  buildingId: BuildingId;
}

export function useSaveFloor() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({
      buildingId,
      id,
      input,
    }: FloorTarget & { id: FloorId | null; input: FloorInput }) =>
      id ? data.floors.update(id, input) : data.floors.create(buildingId, input),
    onSuccess: (_, { buildingId }) => refresh(buildingId),
  });
}

export function useRemoveFloor() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ id }: FloorTarget & { id: FloorId }) => data.floors.remove(id),
    onSuccess: (_, { buildingId }) => refresh(buildingId),
  });
}

export function useSetDefaultFloor() {
  const refresh = useRefresh();
  return useMutation({
    mutationFn: ({ buildingId, id }: FloorTarget & { id: FloorId }) =>
      data.floors.setDefault(buildingId, id),
    onSuccess: (_, { buildingId }) => refresh(buildingId),
  });
}
