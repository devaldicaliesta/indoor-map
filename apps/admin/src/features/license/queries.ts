import type { FirstAdminInput } from '@indoor/data';
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
