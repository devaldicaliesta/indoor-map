import type { FirstAdminInput, TrialRequest } from '@indoor/data';
import type { PaidFeature } from '@indoor/domain';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { data } from '../../app/data-client';

export const licenseStatusKey = ['license', 'status'] as const;

/** Status lisensi instalasi; bisa dibaca sebelum login. */
export function useLicenseStatus() {
  return useQuery({
    queryKey: licenseStatusKey,
    queryFn: () => data.license.status(),
    staleTime: 60_000,
  });
}

/** Sejak kapan check-in ke vendor gagal (lebih dari 7 hari), untuk banner di seluruh Admin. */
export function useCheckinOverdueSince() {
  return useQuery({
    queryKey: ['license', 'checkin-overdue'],
    queryFn: () => data.license.checkinOverdueSince(),
    staleTime: 15 * 60_000,
  });
}

export function useLicenseValidUntil() {
  return useQuery({
    queryKey: ['license', 'valid-until'],
    queryFn: () => data.license.validUntil(),
    staleTime: 15 * 60_000,
  });
}

function useRefreshStatus() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: licenseStatusKey });
}

export function useActivateOnline() {
  const refresh = useRefreshStatus();
  return useMutation({
    mutationFn: (licenseKey: string) => data.license.activateOnline(licenseKey),
    onSuccess: refresh,
  });
}

/** Trial otomatis: instalasi meminta lisensi trial ke vendor lalu memasangnya. */
export function useStartTrial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TrialRequest) => data.license.startTrial(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['license'] }),
  });
}

export function useActivateManual() {
  const refresh = useRefreshStatus();
  return useMutation({
    mutationFn: (license: unknown) => data.license.activateManual(license),
    onSuccess: refresh,
  });
}

export function useCreateFirstAdmin() {
  const refresh = useRefreshStatus();
  return useMutation({
    mutationFn: async (input: FirstAdminInput) => {
      await data.license.createFirstAdmin(input);
      await data.auth.signIn(input.email, input.password);
    },
    onSuccess: refresh,
  });
}

export const licenseUsageKey = ['license', 'usage'] as const;

/** Pemakaian kuota paket; dimuat ulang setiap kali data struktur berubah. */
export function useLicenseUsage() {
  return useQuery({ queryKey: licenseUsageKey, queryFn: () => data.license.usage() });
}

/** Batas per tindakan (ukuran unggahan, baris impor) dari lisensi berlaku. */
export function useLicenseLimits() {
  return useQuery({
    queryKey: ['license', 'limits'],
    queryFn: () => data.license.limits(),
    staleTime: 5 * 60_000,
  });
}

export function useLicenseDetails() {
  return useQuery({ queryKey: ['license', 'details'], queryFn: () => data.license.details() });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => data.license.checkIn(),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['license'] }),
  });
}

/** `true` bila fitur dibuka lisensi; selama dimuat dianggap terkunci agar tidak berkedip. */
export function useFeature(feature: PaidFeature): boolean {
  const features = useQuery({
    queryKey: ['license', 'features'],
    queryFn: () => data.license.features(),
    staleTime: 5 * 60_000,
  });
  return features.data?.includes(feature) ?? false;
}
