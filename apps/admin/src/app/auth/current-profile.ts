import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { data } from '../data-client';

export const currentProfileKey = ['auth', 'current-profile'] as const;

export function useCurrentProfile() {
  return useQuery({ queryKey: currentProfileKey, queryFn: () => data.auth.getCurrentProfile() });
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
