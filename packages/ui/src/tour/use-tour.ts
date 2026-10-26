import { useCallback, useEffect, useRef, useState } from 'react';
import type { TourHandle, TourLabels } from './run-tour';
import { resolveTourSteps, type TourDefinition, tourKey } from './steps';

/** Status "sudah dilihat" per kunci tur (`id@versi`): server untuk Admin, perangkat untuk Visitor. */
export interface TourSeenStore {
  /** `undefined` selama status belum terbaca; tur otomatis menunggu. */
  seen(key: string): boolean | undefined;
  markSeen(key: string): void;
}

export interface UseTourOptions<A extends string> {
  tour: TourDefinition<A>;
  labels: TourLabels;
  /** Aksi milik pengguna; langkah dengan `requires` lain tidak ditunjukkan. */
  can?: (action: A) => boolean;
  store: TourSeenStore;
  /** Tur mulai sendiri sekali bila belum dilihat. Info Point dan keadaan sibuk memakai `false`. */
  autoStart: boolean;
  /**
   * Bawaan build untuk tur otomatis (mis. `VITE_TOUR_AUTOSTART=off` di server test E2E); pilihan
   * per perangkat di `localStorage` tetap menang.
   */
  autoStartByDefault?: boolean;
}

/**
 * `localStorage[AUTO_TOUR_STORAGE_KEY]` = `'off'` atau `'on'` memilih tur otomatis untuk perangkat
 * itu (PC bersama yang diatur TI, atau spec E2E tur). Tombol tur selalu berfungsi.
 */
export const AUTO_TOUR_STORAGE_KEY = 'indoor.tour.auto';

export function autoToursEnabled(byDefault = true): boolean {
  try {
    const choice = localStorage.getItem(AUTO_TOUR_STORAGE_KEY);
    if (choice === 'off') return false;
    if (choice === 'on') return true;
  } catch {
    // Penyimpanan diblokir: pakai bawaan build.
  }
  return byDefault;
}

// Jeda agar halaman (tabel, peta) sempat tampil sebelum tur menunjuk elemennya.
const AUTO_DELAY_MS = 600;

export function useTour<A extends string>(options: UseTourOptions<A>) {
  const latest = useRef(options);
  latest.current = options;
  const handle = useRef<TourHandle | null>(null);
  const autoStarted = useRef(false);
  const [running, setRunning] = useState(false);

  const start = useCallback(async () => {
    const { tour, labels, can = () => true, store } = latest.current;
    handle.current?.stop();
    // driver.js baru diunduh di sini, bukan saat halaman dimuat. Gagal diunduh (offline sebelum
    // tur pernah dibuka): tur tidak tampil, halaman tetap berjalan.
    const loaded = await import('./run-tour').catch(() => null);
    if (!loaded) return;
    const { findTourTarget, runTour } = loaded;
    const steps = resolveTourSteps(tour.steps, {
      can,
      isPresent: (target) => findTourTarget(target) !== null,
    });
    if (steps.length === 0) return;
    setRunning(true);
    handle.current = runTour(steps, {
      labels,
      onEnd: () => {
        handle.current = null;
        setRunning(false);
        store.markSeen(tourKey(tour));
      },
    });
  }, []);

  const stop = useCallback(() => handle.current?.stop(), []);

  const seen = options.store.seen(tourKey(options.tour));
  useEffect(() => {
    if (
      !options.autoStart ||
      seen !== false ||
      autoStarted.current ||
      !autoToursEnabled(options.autoStartByDefault)
    ) {
      return;
    }
    const timer = setTimeout(() => {
      autoStarted.current = true;
      void start();
    }, AUTO_DELAY_MS);
    return () => clearTimeout(timer);
  }, [options.autoStart, options.autoStartByDefault, seen, start]);

  // Pindah halaman menutup tur yang masih terbuka.
  useEffect(() => () => handle.current?.stop(), []);

  return { start, stop, running };
}
