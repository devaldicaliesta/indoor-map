import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Nilai yang sama dengan yang dipakai app (Vite membaca .env.local di root repo).
const envFile = fileURLToPath(new URL('../.env.local', import.meta.url));
if (existsSync(envFile)) process.loadEnvFile(envFile);

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `${name} belum diisi. Salin .env.example ke .env.local lalu isi (lihat e2e/README.md).`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required('VITE_SUPABASE_URL'),
  anonKey: required('VITE_SUPABASE_ANON_KEY'),
  /** Password semua akun seed (supabase/seed.sql lewat `pnpm db:reset`). */
  password: required('SEED_ADMIN_PASSWORD'),
  adminUrl: process.env.E2E_ADMIN_URL ?? 'http://localhost:5173',
  visitorUrl: process.env.E2E_VISITOR_URL ?? 'http://localhost:5174',
  /** Landing page vendor (T-505). */
  landingUrl: process.env.E2E_LANDING_URL ?? 'http://localhost:5175',
  /** Mailpit Supabase lokal (`supabase status`), penampung email reset dan undangan. */
  mailpitUrl: process.env.E2E_MAILPIT_URL ?? 'http://127.0.0.1:54324',
};
