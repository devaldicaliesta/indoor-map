import type { PreparedSearchEntry, SearchEntry } from '@indoor/domain';

const DB_NAME = 'indoor-search-db';
const STORE_NAME = 'search-index';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('indexedDB not available'));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedSearchIndex(
  venueId: string,
  version: number,
): Promise<PreparedSearchEntry<SearchEntry>[] | null> {
  try {
    const db = await openDB();
    return new Promise<PreparedSearchEntry<SearchEntry>[] | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(`${venueId}-${version}`);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

export async function setCachedSearchIndex(
  venueId: string,
  version: number,
  data: PreparedSearchEntry<SearchEntry>[],
): Promise<void> {
  try {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(data, `${venueId}-${version}`);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // Abaikan error cache
  }
}
