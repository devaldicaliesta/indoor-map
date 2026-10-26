import { describe, expect, it } from 'vitest';
import { createDeviceTourStore, SEEN_STORAGE_KEY } from './tour-store';

function memoryStorage(): Storage {
  const items = new Map<string, string>();
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, value),
  };
}

const blocked = (): Storage => {
  throw new DOMException('Akses penyimpanan ditolak', 'SecurityError');
};

describe('status tur per perangkat', () => {
  it('tersimpan di localStorage dan terbaca oleh kunjungan berikutnya', () => {
    const storage = memoryStorage();
    const first = createDeviceTourStore(() => storage);
    expect(first.seen('venue@1')).toBe(false);
    first.markSeen('venue@1');
    first.markSeen('venue@1');
    expect(JSON.parse(storage.getItem(SEEN_STORAGE_KEY) ?? '[]')).toEqual(['venue@1']);
    const nextVisit = createDeviceTourStore(() => storage);
    expect(nextVisit.seen('venue@1')).toBe(true);
    expect(nextVisit.seen('venue@2')).toBe(false);
  });

  it('localStorage diblokir: tidak melempar galat dan tidak berulang dalam satu sesi', () => {
    const store = createDeviceTourStore(blocked);
    expect(store.seen('venue@1')).toBe(false);
    store.markSeen('venue@1');
    expect(store.seen('venue@1')).toBe(true);
  });

  it('isi rusak diabaikan, bukan menggagalkan halaman', () => {
    const storage = memoryStorage();
    storage.setItem(SEEN_STORAGE_KEY, '{bukan json');
    const store = createDeviceTourStore(() => storage);
    expect(store.seen('venue@1')).toBe(false);
    store.markSeen('venue@1');
    expect(store.seen('venue@1')).toBe(true);
  });
});
