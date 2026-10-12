import { randomUUID } from 'node:crypto';
import { env } from '../env';
import { sql } from './license';

// Trial ter-hosting (F2-K) untuk E2E: pengguna trial dibuat langsung di database (seperti akun
// seed) karena alurnya lewat email; penguncian dijalankan Edge Function `trial-lifecycle` asli.

export interface HostedTrialUser {
  userId: string;
  email: string;
}

/** Admin venue (`all_venues=false`) dengan trial berakhir `endsInDays` hari lagi. */
export function createHostedTrial(venueId: string, endsInDays: number): HostedTrialUser {
  const userId = randomUUID();
  const email = `trial-${userId.slice(0, 8)}@trial.test`;
  sql(`insert into app.server_settings (key, value) values ('hosting_mode', 'true')
         on conflict (key) do update set value = 'true';
       insert into auth.users (
         instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
         raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
         confirmation_token, recovery_token, email_change_token_new, email_change)
       values ('00000000-0000-0000-0000-000000000000', '${userId}', 'authenticated',
         'authenticated', '${email}',
         extensions.crypt('${env.password.replaceAll("'", "''")}', extensions.gen_salt('bf')),
         now(), '{"provider": "email", "providers": ["email"]}', '{"full_name": "Pemohon Trial"}',
         now(), now(), '', '', '', '');
       insert into auth.identities (
         id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
       values (gen_random_uuid(), '${userId}', '${userId}', 'email',
         jsonb_build_object('sub', '${userId}', 'email', '${email}', 'email_verified', true),
         now(), now(), now());
       insert into public.profiles (user_id, full_name, email, role, all_venues)
         values ('${userId}', 'Pemohon Trial', '${email}', 'admin', false);
       insert into hosting.trials (venue_id, user_id, ends_at)
         values ('${venueId}', '${userId}', now() + interval '${endsInDays} days');
       insert into public.venue_members (venue_id, user_id) values ('${venueId}', '${userId}');`);
  return { userId, email };
}

/** Trial berakhir semenit lalu, lalu siklus hidup sungguhan menguncinya. */
export async function endHostedTrial(venueId: string) {
  sql(`update hosting.trials set ends_at = now() - interval '1 minute'
       where venue_id = '${venueId}'`);
  // Pemanggil sah seperti pg_cron: rahasia Vault (migrasi 0054).
  const secret = sql(
    `select decrypted_secret from vault.decrypted_secrets where name = 'trial_lifecycle_secret'`,
  );
  const response = await fetch(`${env.supabaseUrl}/functions/v1/trial-lifecycle`, {
    method: 'POST',
    headers: { 'x-trial-lifecycle-secret': secret },
  });
  if (!response.ok) throw new Error(`trial-lifecycle: ${response.status} ${await response.text()}`);
}

/**
 * `hosting_mode` sengaja dibiarkan: tanpa baris `trials` ia tidak berpengaruh pada venue lain,
 * dan spek lain yang berjalan paralel mungkin sedang memakainya.
 */
export function removeHostedTrial(trial: HostedTrialUser, venueId: string) {
  sql(`delete from hosting.trials where venue_id = '${venueId}';
       delete from auth.users where id = '${trial.userId}';`);
}
