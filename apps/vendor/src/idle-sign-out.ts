import { isSessionIdle } from '@indoor/domain';
import { useEffect } from 'react';

// Dasbor berisi data pribadi calon klien dan sesi Supabase Free tidak dibatasi waktu di server,
// jadi peramban yang ditinggal terbuka dikeluarkan lebih cepat dari Admin.
export const VENDOR_IDLE_TIMEOUT_MS = 30 * 60 * 1000;

// Dibagi antar-tab lewat localStorage (hanya waktu, bukan token).
const LAST_ACTIVITY_KEY = 'panduarah-vendor.last-activity';
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
const WRITE_INTERVAL_MS = 15_000;
const CHECK_INTERVAL_MS = 30_000;

function readLastActivity(): number | null {
  try {
    const value = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

/** Dipanggil saat masuk agar waktu dari sesi lama tidak langsung mengeluarkan akun. */
export function markActivity(now: number = Date.now()) {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
  } catch {
    // Penyimpanan diblokir: dasbor tetap bisa dipakai, hanya tanpa keluar otomatis antar-tab.
  }
}

export function useIdleSignOut(onIdle: () => void) {
  useEffect(() => {
    let lastWrite = 0;
    let done = false;
    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite < WRITE_INTERVAL_MS) return;
      lastWrite = now;
      markActivity(now);
    };
    const check = () => {
      const last = readLastActivity();
      if (done || last === null || !isSessionIdle(last, Date.now(), VENDOR_IDLE_TIMEOUT_MS)) return;
      done = true;
      onIdle();
    };
    if (readLastActivity() === null) markActivity();
    check();
    const timer = window.setInterval(check, CHECK_INTERVAL_MS);
    for (const name of ACTIVITY_EVENTS) {
      window.addEventListener(name, onActivity, { passive: true });
    }
    return () => {
      window.clearInterval(timer);
      for (const name of ACTIVITY_EVENTS) window.removeEventListener(name, onActivity);
    };
  }, [onIdle]);
}
