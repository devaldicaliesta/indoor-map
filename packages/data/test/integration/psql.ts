import { execFileSync, spawnSync } from 'node:child_process';

const dbUrl = process.env.SUPABASE_DB_URL ?? '';
// Mesin tanpa klien PostgreSQL (mis. Windows) memakai psql di kontainer database Supabase lokal.
const hasPsql = spawnSync('psql', ['--version']).error === undefined;
const container = process.env.SUPABASE_DB_CONTAINER ?? 'supabase_db_indoor-map';

/** SQL langsung sebagai postgres untuk menyiapkan keadaan yang sengaja tidak bisa dicapai API. */
export function sql(statements: string): string {
  const args = ['-Atq', '-v', 'ON_ERROR_STOP=1', '-c', statements];
  const [command, commandArgs] = hasPsql
    ? ['psql', [dbUrl, ...args]]
    : ['docker', ['exec', container, 'psql', '-U', 'postgres', '-d', 'postgres', ...args]];
  return execFileSync(command, commandArgs, { encoding: 'utf8' }).trim();
}
