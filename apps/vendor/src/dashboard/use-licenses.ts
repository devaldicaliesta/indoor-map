import type { NewVendorClient, NewVendorInstallation } from '@indoor/data';
import type { LicenseFile } from '@indoor/domain/license';
import { type LicenseIssueRequest, licenseFileName } from '@indoor/domain/license-issue';
import { toast } from '@indoor/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDate } from '../copy';
import { data } from '../data-client';

const keys = {
  clients: ['vendor', 'clients'],
  installations: ['vendor', 'installations'],
  licenses: (installationId: string) => ['vendor', 'licenses', installationId],
} as const;

const failed = (error: unknown) =>
  toast.error(error instanceof Error ? error.message : 'Tindakan gagal. Coba lagi.');

export function downloadLicense(file: LicenseFile) {
  const blob = new Blob([`${JSON.stringify(file, null, 2)}\n`], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = licenseFileName(file);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

export const useLicenses = (installationId: string | null) =>
  useQuery({
    queryKey: keys.licenses(installationId ?? ''),
    queryFn: () => data.vendor.licenses(installationId ?? ''),
    enabled: installationId !== null,
  });

export function useClientActions() {
  const queryClient = useQueryClient();
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.clients }),
      queryClient.invalidateQueries({ queryKey: keys.installations }),
    ]);
  const createClient = useMutation({
    mutationFn: (input: NewVendorClient) => data.vendor.createClient(input),
    onSuccess: (_id, input) => toast.success(`Klien ${input.institution} ditambahkan.`),
    onError: failed,
    onSettled: refresh,
  });
  const createInstallation = useMutation({
    mutationFn: (input: NewVendorInstallation) => data.vendor.createInstallation(input),
    onSuccess: (_id, input) => toast.success(`Instalasi ${input.name} ditambahkan.`),
    onError: failed,
    onSettled: refresh,
  });
  return { createClient, createInstallation };
}

export function useLicenseActions(installationId: string) {
  const queryClient = useQueryClient();
  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: keys.licenses(installationId) }),
      queryClient.invalidateQueries({ queryKey: keys.installations }),
    ]);
  const issue = useMutation({
    mutationFn: (request: LicenseIssueRequest) => data.vendor.issueLicense(request),
    onSuccess: (file) => {
      downloadLicense(file);
      toast.success(
        `Lisensi ${file.licenseId} terbit, berlaku sampai ${formatDate(file.validUntil)}.`,
      );
    },
    onError: failed,
    onSettled: refresh,
  });
  const revoke = useMutation({
    mutationFn: ({ id }: { id: string; licenseId: string }) => data.vendor.revokeLicense(id),
    onSuccess: (_result, { licenseId }) => toast.success(`Lisensi ${licenseId} dicabut.`),
    onError: failed,
    onSettled: refresh,
  });
  return { issue, revoke };
}
