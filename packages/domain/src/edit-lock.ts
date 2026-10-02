/** Kunci edit lantai (tabel `edit_locks`): satu penyunting per lantai. */
export interface EditLock {
  floorId: string;
  userId: string;
  /** Nama pemegang untuk banner "Sedang diedit oleh …". */
  fullName: string;
  startedAt: string;
  lastActivityAt: string;
}

/** Heartbeat editor; jauh di bawah batas lepas agar satu atau dua kegagalan jaringan tidak melepas kunci. */
export const EDIT_LOCK_HEARTBEAT_MS = 60_000;
/** Kunci dianggap lepas setelah selama ini tanpa aktivitas (sama dengan `app.edit_lock_ttl()`). */
export const EDIT_LOCK_TTL_MS = 30 * 60_000;
