/**
 * Riwayat undo/redo editor dengan pola command berbasis patch: setiap aksi
 * (buat, ubah geometri/properti, hapus, aksi massal) dicatat sebagai daftar perubahan
 * `before → after` per fitur. `do` memasang `after`, `undo` memasang `before`, sehingga
 * pembalikan selalu tepat tanpa logika khusus per jenis aksi.
 */
export interface Change<T> {
  id: string;
  /** `null` = fitur belum ada (aksi membuat). */
  before: T | null;
  /** `null` = fitur dihapus. */
  after: T | null;
}
export type Patch<T> = readonly Change<T>[];

export interface History<T> {
  past: Patch<T>[];
  future: Patch<T>[];
}

/** Minimal 50 langkah per sesi; disimpan 100 agar ada kelonggaran. */
export const HISTORY_LIMIT = 100;

export const emptyHistory = <T>(): History<T> => ({ past: [], future: [] });

export type Direction = 'do' | 'undo';

/** Nilai akhir tiap fitur setelah patch diterapkan ke arah tertentu. */
export const valueAfter = <T>(change: Change<T>, direction: Direction) =>
  direction === 'do' ? change.after : change.before;

export function applyPatch<T>(
  state: Readonly<Record<string, T>>,
  patch: Patch<T>,
  direction: Direction,
): Record<string, T> {
  const next = { ...state };
  // Urutan dibalik saat undo agar perubahan berantai pada fitur yang sama pulih benar.
  const ordered = direction === 'do' ? patch : [...patch].reverse();
  for (const change of ordered) {
    const value = valueAfter(change, direction);
    if (value === null) delete next[change.id];
    else next[change.id] = value;
  }
  return next;
}

export function record<T>(history: History<T>, patch: Patch<T>): History<T> {
  if (patch.length === 0) return history;
  const past = [...history.past, patch];
  return { past: past.slice(-HISTORY_LIMIT), future: [] };
}

export function undo<T>(history: History<T>): { history: History<T>; patch: Patch<T> } | null {
  const patch = history.past.at(-1);
  if (!patch) return null;
  return {
    patch,
    history: { past: history.past.slice(0, -1), future: [...history.future, patch] },
  };
}

export function redo<T>(history: History<T>): { history: History<T>; patch: Patch<T> } | null {
  const patch = history.future.at(-1);
  if (!patch) return null;
  return {
    patch,
    history: { past: [...history.past, patch], future: history.future.slice(0, -1) },
  };
}
