import type { Snapshot, VenueId } from '@indoor/domain';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { loadSnapshot, snapshotKey } from '../data/loadSnapshot';
import { type UpdateWatcher, watchUpdates } from './update-watcher';

/**
 * Versi baru diunduh di latar; fungsi yang dikembalikan memasangnya hanya saat dipanggil (idle),
 * agar pengunjung yang sedang memakai layar tidak terganggu.
 */
export function usePendingUpdate(venueId: VenueId, current: Snapshot | undefined) {
  const queryClient = useQueryClient();
  const watcher = useRef<UpdateWatcher<Snapshot> | null>(null);
  const version = current?.version ?? 0;

  useEffect(() => {
    const active = watchUpdates(() => loadSnapshot(venueId), version);
    watcher.current = active;
    return () => active.stop();
  }, [venueId, version]);

  return useCallback(() => {
    const next = watcher.current?.take();
    if (next) queryClient.setQueryData(snapshotKey(venueId), next);
  }, [queryClient, venueId]);
}
