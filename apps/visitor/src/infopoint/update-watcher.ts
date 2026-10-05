/** Info Point memeriksa versi terbit setiap 5 menit (FR-IP-06). */
export const UPDATE_CHECK_MS = 5 * 60_000;

export interface UpdateWatcher<T> {
  /** Versi baru yang sudah diunduh dan belum dipasang; diambil sekali. */
  take(): T | null;
  stop(): void;
}

/**
 * Memeriksa versi terbaru secara berkala dan menyimpan yang lebih baru tanpa memasangnya.
 * Gagal memuat (server tidak terjangkau) diabaikan: versi yang sudah dimuat tetap dipakai.
 */
export function watchUpdates<T extends { version: number }>(
  load: () => Promise<T>,
  currentVersion: number,
  intervalMs = UPDATE_CHECK_MS,
): UpdateWatcher<T> {
  let pending: T | null = null;
  const timer = setInterval(() => {
    load()
      .then((latest) => {
        if (latest.version > (pending?.version ?? currentVersion)) pending = latest;
      })
      .catch(() => undefined);
  }, intervalMs);
  return {
    take() {
      const next = pending;
      pending = null;
      return next;
    },
    stop: () => clearInterval(timer),
  };
}
