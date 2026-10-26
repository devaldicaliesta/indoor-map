import type { TourSeenStore } from '@indoor/ui';

export const SEEN_STORAGE_KEY = 'indoor.tour.seen';

/**
 * Status tur Visitor per perangkat di `localStorage` (tanpa cookie). Bila penyimpanan diblokir
 * atau rusak, status tetap diingat di memori agar tur tidak muncul berulang dalam satu sesi.
 */
export function createDeviceTourStore(storage: () => Storage): TourSeenStore {
  const memory = new Set<string>();
  const read = (): Set<string> => {
    try {
      const raw = storage().getItem(SEEN_STORAGE_KEY);
      const saved: unknown = raw ? JSON.parse(raw) : [];
      const keys = Array.isArray(saved) ? saved.filter((k) => typeof k === 'string') : [];
      return new Set([...memory, ...keys]);
    } catch {
      return new Set(memory);
    }
  };
  return {
    seen: (key) => read().has(key),
    markSeen(key) {
      memory.add(key);
      try {
        storage().setItem(SEEN_STORAGE_KEY, JSON.stringify([...read()]));
      } catch {
        // Diblokir: cukup di memori.
      }
    },
  };
}

export const deviceTourStore = createDeviceTourStore(() => window.localStorage);
