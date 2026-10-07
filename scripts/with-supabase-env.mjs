// Menjalankan perintah dengan variabel dari `supabase status -o env`, diberi awalan
// SUPABASE_ (misalnya SUPABASE_API_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY).
import { execFileSync, spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const supabase = join(root, 'node_modules', '.bin', 'supabase');
// Di Windows bin pnpm berupa file .cmd, yang hanya bisa dijalankan lewat shell.
const shell = process.platform === 'win32';

let status;
try {
  status = execFileSync(supabase, ['status', '-o', 'env'], { cwd: root, encoding: 'utf8', shell });
} catch {
  console.error('Supabase lokal belum berjalan. Jalankan `supabase start` di root repo.');
  process.exit(1);
}

const env = { ...process.env };
for (const line of status.split('\n')) {
  const match = /^([A-Z0-9_]+)="(.*)"$/.exec(line.trim());
  if (match) env[`SUPABASE_${match[1]}`] = match[2];
}

const [command, ...args] = process.argv.slice(2);
const result = spawnSync(command, args, { stdio: 'inherit', env, shell });
process.exit(result.status ?? 1);
