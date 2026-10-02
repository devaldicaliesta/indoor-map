import type { DataClient } from '@indoor/data';
import type { AppRole } from '@indoor/domain';
import { env } from '../env';
import { waitForMail } from './mailpit';

export interface InvitedUser {
  email: string;
  fullName: string;
  password: string;
}

/**
 * Pengguna baru lewat alur undangan (Edge Function `admin-users` → Mailpit), password diisi
 * lewat sesi dari tautan undangan. Dipakai test yang mengunci atau mengubah akun agar akun
 * seed bersama tidak ikut terkunci.
 */
export async function inviteUser(
  superAdmin: DataClient,
  tag: string,
  role: AppRole = 'viewer',
): Promise<InvitedUser> {
  const user = {
    email: `${tag}-${Date.now().toString(36)}@e2e.test`.toLowerCase(),
    fullName: `Pengguna Uji ${tag}`,
    password: `Uji-${crypto.randomUUID().slice(0, 12)}`,
  };
  await superAdmin.users.invite({
    email: user.email,
    fullName: user.fullName,
    role,
    redirectTo: `${env.adminUrl}/reset-password`,
  });
  const { link } = await waitForMail(user.email);
  if (!link) throw new Error(`Email undangan ${user.email} tanpa tautan.`);
  const verified = await fetch(link, { redirect: 'manual' });
  const hash = new URL(verified.headers.get('location') ?? '').hash.slice(1);
  const token = new URLSearchParams(hash).get('access_token');
  if (!token) throw new Error(`Tautan undangan ${user.email} tidak membuka sesi.`);
  const updated = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      apikey: env.anonKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password: user.password }),
  });
  if (!updated.ok) throw new Error(`Gagal mengisi password ${user.email}: ${updated.status}`);
  return user;
}
