import type { NewVendorRelease } from '@indoor/domain/vendor-release';
import { toast } from '@indoor/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../data-client';

const keys = {
  releases: ['vendor', 'releases'],
  checkins: (installationId: string) => ['vendor', 'checkins', installationId],
} as const;

const failed = (error: unknown) =>
  toast.error(error instanceof Error ? error.message : 'Tindakan gagal. Coba lagi.');

export const useReleases = () =>
  useQuery({ queryKey: keys.releases, queryFn: () => data.vendor.releases() });

export const useCheckins = (installationId: string | null) =>
  useQuery({
    queryKey: keys.checkins(installationId ?? ''),
    queryFn: () => data.vendor.checkins(installationId ?? ''),
    enabled: installationId !== null,
  });

export function useReleaseActions() {
  const queryClient = useQueryClient();
  const onSettled = () => queryClient.invalidateQueries({ queryKey: keys.releases });
  const add = useMutation({
    mutationFn: (release: NewVendorRelease) => data.vendor.addRelease(release),
    onSuccess: (_id, release) => toast.success(`Rilis ${release.version} ditambahkan.`),
    onError: failed,
    onSettled,
  });
  const remove = useMutation({
    mutationFn: ({ id }: { id: string; version: string }) => data.vendor.removeRelease(id),
    onSuccess: (_result, { version }) => toast.success(`Rilis ${version} dihapus.`),
    onError: failed,
    onSettled,
  });
  return { add, remove };
}
