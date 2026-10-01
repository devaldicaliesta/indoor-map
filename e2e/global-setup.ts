import { createDataClient } from '@indoor/data';
import { ACCOUNTS } from './accounts';
import { env } from './env';

/** Gagal cepat dengan pesan yang jelas bila Supabase lokal atau akun seed belum siap. */
export default async function globalSetup() {
  const health = await fetch(`${env.supabaseUrl}/auth/v1/health`, {
    headers: { apikey: env.anonKey },
  }).catch(() => null);
  if (!health?.ok) {
    throw new Error('Supabase lokal tidak bisa dihubungi. Jalankan `supabase start` di root repo.');
  }
  const data = createDataClient({ url: env.supabaseUrl, anonKey: env.anonKey });
  try {
    await data.auth.signIn(ACCOUNTS.super_admin.email, env.password);
  } catch {
    throw new Error(
      'Akun seed tidak bisa masuk. Jalankan `pnpm db:reset` dengan SEED_ADMIN_PASSWORD yang sama di .env.local.',
    );
  }
  await data.auth.signOut();
}
