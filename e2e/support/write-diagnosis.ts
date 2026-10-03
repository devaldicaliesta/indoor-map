import { execFileSync } from 'node:child_process';
import type { DataClient } from '@indoor/data';

/** Hasil query SQL lewat psql di container database Supabase lokal (baca saja). */
function sql(query: string): string {
  try {
    return execFileSync(
      'docker',
      ['exec', 'supabase_db_indoor-map', 'psql', '-U', 'postgres', '-tA', '-c', query],
      { encoding: 'utf8' },
    ).trim();
  } catch (error) {
    return `psql gagal: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Keadaan saat tulis ditolak RLS (42501) di test: sesi klien, profilnya, dan kunci lantai.
 * Dipakai untuk melacak kegagalan yang hanya muncul saat suite penuh berjalan paralel.
 */
export async function diagnoseWriteRejection(data: DataClient, floorId: string): Promise<string> {
  const session = await data.auth.hasSession().catch((e: Error) => `galat: ${e.message}`);
  const profile = await data.auth
    .getCurrentProfile()
    .then((p) => (p ? `${p.email} ${p.role} aktif=${p.isActive}` : 'tanpa profil'))
    .catch((e: Error) => `galat: ${e.message}`);
  const id = floorId.replace(/[^0-9a-f-]/gi, '');
  const locks = sql(
    `select l.user_id || ' ' || p.email || ' ' || l.last_activity_at from edit_locks l left join profiles p using (user_id) where l.floor_id = '${id}'`,
  );
  return `sesi=${session}; profil=${profile}; kunci lantai=[${locks || 'tidak ada'}]`;
}
