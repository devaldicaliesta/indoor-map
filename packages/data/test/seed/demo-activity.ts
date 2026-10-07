import type { AppRole, ClosureInput, SnapshotSource, UserId, VenueId } from '@indoor/domain';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { DataClient } from '../../src/client';
import type { Database } from '../../src/database.types';

type Db = SupabaseClient<Database>;

/**
 * Aktivitas demo di atas venue demo agar layar Admin tampak seperti instalasi yang dipakai
 * sehari-hari (bahan video dan motion graphic): riwayat publish bercatatan, penutupan dengan
 * tiga keadaan, dan pengguna beragam role/status yang mengisi log audit.
 */

const RELEASE_NOTES = [
  'Denah lantai dasar diperbarui sesuai renovasi lobi',
  'Tambah lokasi baru dan jam operasional akhir pekan',
  'Perbaikan jalur menuju lift dan tangga darurat',
  'Warna kategori peta diselaraskan dengan papan petunjuk',
  'Titik asal QR di lobi dan area parkir ditambahkan',
];

/** Beberapa versi bercatatan, satu rollback, lalu rilis perbaikan sesudahnya. */
export async function seedPublishHistory(data: DataClient, venueId: VenueId) {
  for (const note of RELEASE_NOTES) await data.publications.publish(venueId, note);
  const [, previous] = await data.publications.history(venueId);
  if (previous) {
    await data.publications.rollback(
      venueId,
      previous.version,
      'Kembali ke versi sebelumnya sementara: papan petunjuk belum terpasang',
    );
  }
  await data.publications.publish(
    venueId,
    'Papan petunjuk terpasang; versi terbaru diterbitkan ulang',
  );
}

const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();

/**
 * Penutupan sedang berlaku, terjadwal, dan selesai. Yang sedang berlaku memilih sasaran yang
 * punya cadangan (unit, lift kedua) agar rute demo di Visitor tetap ada.
 */
export function demoClosures(source: SnapshotSource): ClosureInput[] {
  const connectors = source.graph.connectors.filter((c) => c.kind !== 'building_door');
  const elevators = connectors.filter((c) => c.kind === 'elevator');
  const others = connectors.filter((c) => c.kind !== 'elevator');
  const units = source.features.filter((f) => f.kind === 'unit');
  const connector = (id: string) => ({ kind: 'connector', id }) as const;
  const feature = (id: string) => ({ kind: 'feature', id }) as const;
  const plans: (ClosureInput | null)[] = [
    units[5]
      ? {
          target: feature(units[5].id),
          reason: 'Renovasi interior dan pengecatan ulang',
          startsAt: hoursFromNow(-30),
          endsAt: hoursFromNow(24 * 12),
        }
      : null,
    elevators[1]
      ? {
          target: connector(elevators[1].id),
          reason: `Perawatan berkala ${elevators[1].name}`,
          startsAt: hoursFromNow(-2),
          endsAt: hoursFromNow(5),
        }
      : null,
    elevators[0]
      ? {
          target: connector(elevators[0].id),
          reason: 'Pemeliharaan tahunan mesin lift',
          startsAt: hoursFromNow(26),
          endsAt: hoursFromNow(32),
        }
      : null,
    others[0]
      ? {
          target: connector(others[0].id),
          reason: `Pembersihan ${others[0].name}`,
          startsAt: hoursFromNow(24 * 3),
          endsAt: hoursFromNow(24 * 3 + 4),
        }
      : null,
    others[0]
      ? {
          target: connector(others[0].id),
          reason: 'Perbaikan sensor dan pegangan tangan',
          startsAt: hoursFromNow(-24 * 6),
          endsAt: hoursFromNow(-24 * 6 + 5),
        }
      : null,
    units[12]
      ? {
          target: feature(units[12].id),
          reason: 'Fumigasi berkala',
          startsAt: hoursFromNow(-24 * 10),
          endsAt: hoursFromNow(-24 * 10 + 8),
        }
      : null,
  ];
  return plans.filter((plan): plan is ClosureInput => plan !== null);
}

interface DemoUser {
  fullName: string;
  /** Lokal-part email; domainnya `panduarah.example` (domain contoh, tidak pernah terkirim). */
  login: string;
  role: AppRole;
  /** Role awal sebelum diubah Super Admin (peristiwa "Role diubah" di log audit). */
  formerRole?: AppRole;
  state?: 'nonaktif' | 'terkunci';
}

const DEMO_USERS: readonly DemoUser[] = [
  { fullName: 'Rina Wijayanti', login: 'rina.wijayanti', role: 'admin' },
  { fullName: 'Hendra Gunawan', login: 'hendra.gunawan', role: 'editor', formerRole: 'admin' },
  { fullName: 'Budi Santoso', login: 'budi.santoso', role: 'editor' },
  { fullName: 'Siti Nurhaliza Putri', login: 'siti.putri', role: 'editor' },
  { fullName: 'Andi Pratama', login: 'andi.pratama', role: 'operator' },
  { fullName: 'Dewi Lestari', login: 'dewi.lestari', role: 'operator', state: 'terkunci' },
  { fullName: 'Yusuf Hidayat', login: 'yusuf.hidayat', role: 'viewer' },
  { fullName: 'Maya Anggraini', login: 'maya.anggraini', role: 'viewer', state: 'nonaktif' },
];

export const demoEmail = (login: string) => `${login}@panduarah.example`;

/**
 * Pengguna demo (dibuat ulang setiap seed) beserta peristiwanya: masuk, gagal masuk, role
 * diubah, dan dinonaktifkan. Password sama dengan akun seed lokal agar bisa dipakai saat
 * merekam layar per role.
 */
export async function seedDemoUsers(options: {
  service: Db;
  url: string;
  anonKey: string;
  password: string;
  superAdmin: DataClient;
}) {
  const { service, url, anonKey, password, superAdmin } = options;
  const anon = () =>
    createClient<Database>(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  for (const user of DEMO_USERS) {
    const email = demoEmail(user.login);
    const old = await service.from('profiles').select('user_id').eq('email', email).maybeSingle();
    if (old.data) await service.auth.admin.deleteUser(old.data.user_id);
    const created = await service.auth.admin.createUser({ email, password, email_confirm: true });
    const id = created.data.user?.id;
    if (!id) throw new Error(`Pengguna demo ${email} gagal dibuat: ${created.error?.message}`);
    const profile = await service
      .from('profiles')
      .insert({ user_id: id, full_name: user.fullName, email, role: user.formerRole ?? user.role });
    if (profile.error) throw new Error(profile.error.message);

    const client = anon();
    if (user.state === 'terkunci') {
      // Tiga password salah tercatat sebagai "Gagal masuk", lalu akun dikunci beberapa jam.
      for (let i = 0; i < 3; i += 1) {
        await client.auth.signInWithPassword({ email, password: `${password}-salah` });
      }
      await service
        .from('profiles')
        .update({ failed_login_count: 5, locked_until: hoursFromNow(8) })
        .eq('user_id', id);
      continue;
    }
    await client.auth.signInWithPassword({ email, password });
    await client.auth.signOut();
    if (user.formerRole) await superAdmin.profiles.update(id as UserId, { role: user.role });
    if (user.state === 'nonaktif') {
      await superAdmin.profiles.update(id as UserId, { isActive: false });
    }
  }
}
