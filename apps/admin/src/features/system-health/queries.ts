import { useQuery } from '@tanstack/react-query';
import { data } from '../../app/data-client';

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: () => data.systemHealth.get(),
    // Agen melapor tiap 15 menit; halaman menyegarkan diri tanpa perlu dimuat ulang.
    refetchInterval: 60_000,
  });
}
