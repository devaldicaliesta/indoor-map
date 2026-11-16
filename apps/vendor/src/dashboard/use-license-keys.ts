import type { LicenseKeyRequest } from '@indoor/domain/license-key';
import { toast } from '@indoor/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../data-client';

const keys = {
  licenseKeys: (clientId: string) => ['vendor', 'license-keys', clientId],
  installations: ['vendor', 'installations'],
} as const;

const failed = (error: unknown) =>
  toast.error(error instanceof Error ? error.message : 'Tindakan gagal. Coba lagi.');

export const useLicenseKeys = (clientId: string | null) =>
  useQuery({
    queryKey: keys.licenseKeys(clientId ?? ''),
    queryFn: () => data.vendor.licenseKeys(clientId ?? ''),
    enabled: clientId !== null,
    staleTime: 0,
  });

export function useLicenseKeyActions(clientId: string) {
  const queryClient = useQueryClient();
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.licenseKeys(clientId) }),
      queryClient.invalidateQueries({ queryKey: keys.installations }),
    ]);
  const create = useMutation({
    mutationFn: (request: LicenseKeyRequest) => data.vendor.createLicenseKey(request),
    onSuccess: () =>
      toast.success('Kunci lisensi dibuat. Salin sekarang, kunci tidak ditampilkan lagi.'),
    onError: failed,
    onSettled: refresh,
  });
  const revoke = useMutation({
    mutationFn: ({ id }: { id: string; hint: string }) => data.vendor.revokeLicenseKey(id),
    onSuccess: (_result, { hint }) => toast.success(`Kunci …${hint} dicabut.`),
    onError: failed,
    onSettled: refresh,
  });
  return { create, revoke };
}
