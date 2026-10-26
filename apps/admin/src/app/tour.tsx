import { type AdminAction, can, licenseAllows } from '@indoor/domain';
import {
  TourButton,
  type TourDefinition,
  type TourLabels,
  type TourSeenStore,
  useTour,
} from '@indoor/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useLicenseReadOnly, useRole } from './auth/can';
import { data } from './data-client';

export type AdminTour = TourDefinition<AdminAction>;

const LABELS: TourLabels = {
  next: 'Lanjut',
  previous: 'Kembali',
  done: 'Selesai',
  skip: 'Lewati',
  progress: '{{current}} dari {{total}}',
};

const seenKey = ['tours', 'seen'] as const;

/** Status tur di server, per pengguna: tur yang dilewati tidak tampil lagi di perangkat lain. */
function useTourStore(enabled: boolean): TourSeenStore {
  const queryClient = useQueryClient();
  const seen = useQuery({
    queryKey: seenKey,
    queryFn: () => data.tours.seen(),
    enabled,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const mark = useMutation({
    mutationFn: (key: string) => data.tours.markSeen(key),
    onMutate: (key) => {
      queryClient.setQueryData<string[]>(seenKey, (keys = []) =>
        keys.includes(key) ? keys : [...keys, key],
      );
    },
  });
  return {
    // Status yang gagal dibaca dianggap sudah dilihat: lebih baik tur tidak muncul daripada
    // muncul di setiap halaman.
    seen: (key) => (seen.error ? true : seen.data?.includes(key)),
    markSeen: (key) => mark.mutate(key),
  };
}

/** Tur halaman Admin: langkah mengikuti role dan lisensi, status disimpan per akun. */
export function useAdminTour(tour: AdminTour, { autoStart = true } = {}) {
  const role = useRole();
  const readOnly = useLicenseReadOnly();
  const store = useTourStore(role !== null);
  const allows = useCallback(
    (action: AdminAction) => role !== null && can(role, action) && licenseAllows(action, !readOnly),
    [role, readOnly],
  );
  return useTour({
    tour,
    labels: LABELS,
    can: allows,
    store,
    autoStart: autoStart && role !== null,
    autoStartByDefault: import.meta.env.VITE_TOUR_AUTOSTART !== 'off',
  });
}

export function AdminTourButton({ tour, autoStart }: { tour: AdminTour; autoStart?: boolean }) {
  const { start } = useAdminTour(tour, autoStart === undefined ? {} : { autoStart });
  return <TourButton label="Tur halaman" size="sm" onClick={() => void start()} />;
}
