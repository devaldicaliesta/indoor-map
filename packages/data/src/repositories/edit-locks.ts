import type { EditLock } from '@indoor/domain';
import { toDataError } from '../errors';
import type { Db } from '../supabase';

export interface EditLocksRepository {
  /**
   * Ambil atau perpanjang kunci lantai (juga dipakai sebagai heartbeat). Mengembalikan pemegang
   * setelah panggilan: pengguna ini, atau orang lain yang masih aktif (mode baca).
   */
  acquire(floorId: string): Promise<EditLock | null>;
  release(floorId: string): Promise<void>;
  /**
   * Lepas kunci saat tab ditutup. `fetch` dengan `keepalive` (bukan `sendBeacon`, yang tidak bisa
   * membawa header Authorization) memakai token dari panggilan `acquire` terakhir.
   */
  releaseOnUnload(floorId: string): void;
  /** Super Admin membuka paksa kunci orang lain; dicatat di audit. */
  takeOver(floorId: string): Promise<EditLock | null>;
}

export interface Endpoint {
  url: string;
  anonKey: string;
}

interface LockRow {
  user_id: string;
  full_name: string;
  started_at: string;
  last_activity_at: string;
}

export function mapLockRow(floorId: string, row: LockRow | undefined): EditLock | null {
  return row
    ? {
        floorId,
        userId: row.user_id,
        fullName: row.full_name,
        startedAt: row.started_at,
        lastActivityAt: row.last_activity_at,
      }
    : null;
}

export function createEditLocksRepository(db: Db, endpoint?: Endpoint): EditLocksRepository {
  let token: string | null = null;

  async function acquire(floorId: string) {
    const { data, error } = await db.rpc('acquire_edit_lock', { p_floor_id: floorId });
    if (error) throw toDataError(error);
    token = (await db.auth.getSession()).data.session?.access_token ?? null;
    return mapLockRow(floorId, data?.[0]);
  }

  return {
    acquire,

    async release(floorId) {
      const { error } = await db.rpc('release_edit_lock', { p_floor_id: floorId });
      if (error) throw toDataError(error);
    },

    releaseOnUnload(floorId) {
      if (!endpoint || !token) return;
      void fetch(`${endpoint.url.replace(/\/+$/, '')}/rest/v1/rpc/release_edit_lock`, {
        method: 'POST',
        keepalive: true,
        headers: {
          apikey: endpoint.anonKey,
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_floor_id: floorId }),
      }).catch(() => undefined);
    },

    async takeOver(floorId) {
      const { error } = await db.rpc('take_over_edit_lock', { p_floor_id: floorId });
      if (error) throw toDataError(error);
      return acquire(floorId);
    },
  };
}
