import type { FloorPlanUpload } from '@indoor/data';
import type { FloorId, FloorPlan } from '@indoor/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../app/data-client';

export interface FloorPlanVersion extends FloorPlan {
  /** URL bertanda gambar tampil (raster). */
  imageUrl: string;
  /** URL bertanda berkas asli (untuk diunduh). */
  sourceUrl: string;
}

const key = (floorId: FloorId) => ['floor-plans', floorId] as const;

async function listWithUrls(floorId: FloorId): Promise<FloorPlanVersion[]> {
  const plans = await data.floorPlans.list(floorId);
  const paths = plans.flatMap((p) => [p.rasterPath ?? p.sourcePath, p.sourcePath]);
  const urls = await data.floorPlans.signedUrls(paths);
  return plans.map((plan, i) => ({
    ...plan,
    imageUrl: urls[i * 2] ?? '',
    sourceUrl: urls[i * 2 + 1] ?? '',
  }));
}

export function useFloorPlans(floorId: FloorId | null) {
  return useQuery({
    queryKey: key(floorId as FloorId),
    queryFn: () => listWithUrls(floorId as FloorId),
    enabled: floorId !== null,
    // URL bertanda berlaku satu jam; ambil ulang sebelum kedaluwarsa.
    staleTime: 30 * 60 * 1000,
  });
}

export function useUploadFloorPlan(floorId: FloorId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: FloorPlanUpload) => data.floorPlans.upload(floorId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key(floorId) }),
  });
}
