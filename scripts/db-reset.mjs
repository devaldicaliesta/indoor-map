// Menjalankan `supabase db reset` dengan password Super Admin lokal dari .env.local.
// seed.sql membaca password dari setting `seed.admin_password` (lewat PGOPTIONS),
// karena file SQL seed tidak bisa membaca variabel lingkungan.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const MIN_PASSWORD_LENGTH = 8;

if (existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
}

const password = process.env.SEED_ADMIN_PASSWORD ?? '';
if (password.length < MIN_PASSWORD_LENGTH) {
  console.error(
    `SEED_ADMIN_PASSWORD di .env.local wajib diisi, minimal ${MIN_PASSWORD_LENGTH} karakter (lihat .env.example).`,
  );
  process.exit(1);
}

// libpq memisahkan PGOPTIONS dengan spasi; spasi dan backslash di nilai harus di-escape.
const escaped = password.replaceAll('\\', '\\\\').replaceAll(' ', '\\ ');
const pgOptions = [process.env.PGOPTIONS, `-c seed.admin_password=${escaped}`]
  .filter(Boolean)
  .join(' ');

const result = spawnSync('supabase', ['db', 'reset', ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: { ...process.env, PGOPTIONS: pgOptions },
  // Di Windows bin pnpm berupa supabase.cmd, yang hanya bisa dijalankan lewat shell.
  shell: process.platform === 'win32',
});
process.exit(result.status ?? 1);
