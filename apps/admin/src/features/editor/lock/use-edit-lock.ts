import { EDIT_LOCK_HEARTBEAT_MS, EDIT_LOCK_TTL_MS, type EditLock } from '@indoor/domain';
import { useCallback, useEffect, useRef, useState } from 'react';
import { data } from '../../../app/data-client';

export type EditLockState =
  | { status: 'idle' }
  | { status: 'mine'; lock: EditLock }
  | { status: 'other'; lock: EditLock }
  | { status: 'error'; error: Error };

const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel'] as const;

/**
 * Kunci lantai yang sedang dibuka di editor. Diambil saat lantai dibuka, diperpanjang tiap menit
 * selama ada aktivitas dalam 30 menit terakhir (tab yang ditinggal tidak memegang kunci
 * selamanya), dan dilepas saat lantai berganti, editor ditutup, atau tab ditutup. Yang tidak
 * memegang kunci mencoba lagi tiap menit, sehingga mode baca berakhir sendiri saat kunci lepas.
 */
export function useEditLock(floorId: string | null, userId: string | null, enabled: boolean) {
  const [state, setState] = useState<EditLockState>({ status: 'idle' });
  const lastActivity = useRef(Date.now());

  const apply = useCallback(
    (lock: EditLock | null) => {
      if (!lock || !userId) return setState({ status: 'idle' });
      // Server sudah memperhitungkan kedaluwarsa: pemegang yang dikembalikan selalu aktif.
      setState({ status: lock.userId === userId ? 'mine' : 'other', lock });
    },
    [userId],
  );

  useEffect(() => {
    const touch = () => {
      lastActivity.current = Date.now();
    };
    for (const name of ACTIVITY_EVENTS) window.addEventListener(name, touch, { passive: true });
    return () => {
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, touch);
    };
  }, []);

  useEffect(() => {
    if (!enabled || !floorId || !userId) {
      setState({ status: 'idle' });
      return;
    }
    let active = true;
    const acquire = () =>
      data.editLocks.acquire(floorId).then(
        (lock) => active && apply(lock),
        (error: Error) => active && setState({ status: 'error', error }),
      );
    void acquire();
    const timer = window.setInterval(() => {
      if (Date.now() - lastActivity.current < EDIT_LOCK_TTL_MS) void acquire();
    }, EDIT_LOCK_HEARTBEAT_MS);
    const onPageHide = () => data.editLocks.releaseOnUnload(floorId);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener('pagehide', onPageHide);
      void data.editLocks.release(floorId).catch(() => undefined);
    };
  }, [enabled, floorId, userId, apply]);

  const takeOver = useCallback(async () => {
    if (!floorId) return;
    apply(await data.editLocks.takeOver(floorId));
  }, [floorId, apply]);

  return { state, takeOver };
}
