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
};
