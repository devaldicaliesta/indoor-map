import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { data } from '../data-client';

export const currentProfileKey = ['auth', 'current-profile'] as const;

export function useCurrentProfile() {
  return useQuery({
    queryKey: currentProfileKey,
    queryFn: () => data.auth.getCurrentProfile(),
    // Pengguna yang dinonaktifkan Super Admin keluar paling lambat dalam 1 menit.
    refetchInterval: 60_000,
  });
}

/** Menyegarkan profil setiap sesi berubah (masuk, keluar, token diperbarui di tab lain). */
export function useAuthSync() {
  const queryClient = useQueryClient();
  useEffect(
    () =>
      data.auth.onChange(() => {
        void queryClient.invalidateQueries({ queryKey: currentProfileKey });
      }),
    [queryClient],
  );
}
