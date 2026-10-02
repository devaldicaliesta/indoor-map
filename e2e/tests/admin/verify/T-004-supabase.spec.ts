import { execFileSync } from 'node:child_process';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { type CheckResult, readRepo, renderSummary } from '../../../support/repo-checks';

// T-004: skema inti, seed, RLS. Reset dua kali, pgTAP, dan tipe generate dijalankan terpisah
// (log di evidence/T-004/); spec ini memeriksa katalog database, akses anon, dan data seed.
const shot = (name: string) => `evidence/T-004/${name}.png`;
const results: CheckResult[] = [];

function record(id: string, check: string, ok: boolean) {
  results.push({ id, check, ok });
  expect(ok, `${id} ${check}`).toBe(true);
}

/** Query katalog lewat psql di container database Supabase lokal. */
function sql(query: string): string[] {
  const out = execFileSync(
    'docker',
    ['exec', 'supabase_db_indoor-map', 'psql', '-U', 'postgres', '-tA', '-c', query],
    { encoding: 'utf8' },
  );
  return out.split('\n').filter(Boolean);
}

async function anonGet(path: string) {
  const response = await fetch(`${env.supabaseUrl}/rest/v1/${path}`, {
    headers: { apikey: env.anonKey, Authorization: `Bearer ${env.anonKey}` },
  });
  return { status: response.status, body: (await response.json()) as unknown };
}

test.describe('T-004 Supabase lokal dan skema inti', () => {
  test.describe.configure({ mode: 'serial' });

  test('keamanan skema dari katalog database', () => {
    record(
      'TC-SEC-01a',
      'semua tabel public memakai RLS',
      sql(
        "select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity",
      ).length === 0,
    );
    record(
      'TC-SEC-45a',
      'setiap fungsi security definer (public, app) punya search_path tetap',
      sql(
        "select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace where p.prosecdef and n.nspname in ('public','app') and not exists (select 1 from unnest(coalesce(p.proconfig,'{}')) c where c like 'search_path=%')",
      ).length === 0,
    );
    record(
      'TC-SEC-45b',
      'tidak ada fungsi public (RPC) yang bisa dipanggil anon',
      sql(
        "select p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace join pg_roles r on r.oid=p.proowner where n.nspname='public' and p.prokind='f' and r.rolname not in ('supabase_admin') and has_function_privilege('anon', p.oid, 'execute') and p.proname not like 'st\\_%' and p.proname not like '\\_%'",
      ).length === 0,
    );
    record(
      'TC-SEC-45c',
      'skema app tidak diekspos lewat API',
      /schemas = \["public", "graphql_public"\]/.test(readRepo('supabase/config.toml')),
    );
    record(
      'TC-SEC-01b',
      'anon hanya punya policy baca untuk closures dan publications',
      sql(
        "select distinct tablename from pg_policies where schemaname='public' and cmd in ('SELECT','ALL') and (roles @> '{anon}' or roles @> '{public}') order by 1",
      ).join(',') === 'closures,publications',
    );
  });

  test('akses anon lewat REST', async () => {
    for (const table of ['venues', 'profiles', 'features', 'locations', 'floor_plans']) {
      const { status, body } = await anonGet(`${table}?select=*&limit=1`);
      record(
        `TC-SEC-01-${table}`,
        `anon membaca ${table} → kosong`,
        status === 200 && Array.isArray(body) && body.length === 0,
      );
    }
    const insert = await fetch(`${env.supabaseUrl}/rest/v1/venues`, {
      method: 'POST',
      headers: {
        apikey: env.anonKey,
        Authorization: `Bearer ${env.anonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'Peretas' }),
    });
    record(
      'TC-SEC-02a',
      'anon membuat venue → ditolak',
      insert.status === 401 || insert.status === 403,
    );
  });

  test('seed: Venue Contoh lengkap dan Super Admin lokal', async ({ page, loginAs }) => {
    const venue = sql("select id from public.venues where name='Venue Contoh'");
    record('T004-seed-1', 'satu Venue Contoh', venue.length === 1);
    const id = venue[0] ?? '';
    const count = (q: string) => Number(sql(q)[0]);
    record(
      'T004-seed-2',
      'lapisan Area Luar',
      count(`select count(*) from floors where venue_id='${id}' and is_outdoor`) === 1,
    );
    record(
      'T004-seed-3',
      'satu gedung dua lantai',
      count(`select count(*) from floors where venue_id='${id}' and not is_outdoor`) === 2,
    );
    record(
      'T004-seed-4',
      'display_settings',
      count(`select count(*) from display_settings where venue_id='${id}'`) === 1,
    );
    record(
      'T004-seed-5',
      'tipe lokasi "Lokasi"',
      count(`select count(*) from location_types where venue_id='${id}' and name='Lokasi'`) === 1,
    );
    record(
      'T004-seed-6',
      '15 template instruksi',
      count(`select count(*) from instruction_templates where venue_id='${id}'`) === 15,
    );
    record(
      'T004-seed-7',
      'Super Admin lokal',
      count(
        "select count(*) from profiles where email='admin@local.test' and role='super_admin'",
      ) === 1,
    );
    record(
      'T004-env',
      '.env.example tanpa nilai rahasia',
      !/=\S*(eyJ|sk_|password)/i.test(readRepo('.env.example')),
    );
    record(
      'T004-types',
      'tipe database ter-commit (sama dengan hasil generate, lihat log)',
      readRepo('packages/data/src/database.types.ts').includes('natural_width_m'),
    );

    await loginAs('super_admin');
    await new AdminShell(page).selectVenue('Venue Contoh');
    await page.goto('/venues');
    await expect(page.getByRole('cell', { name: 'Area Luar' })).toBeVisible();
    await page.screenshot({ path: shot('04-venue-contoh-admin'), fullPage: true });
  });

  test('ringkasan bukti', async ({ page }) => {
    const tail = (file: string) =>
      readRepo(`e2e/evidence/T-004/${file}`).trim().split('\n').slice(-3).join('\n');
    await renderSummary(page, 'T-004 · Supabase lokal dan skema inti', results, [
      { name: 'db reset ke-1', text: tail('01-db-reset-1.txt') },
      { name: 'db reset ke-2', text: tail('02-db-reset-2.txt') },
      { name: 'supabase test db (pgTAP)', text: tail('03-pgtap.txt') },
    ]);
    await expect(page.getByText('Gagal', { exact: true })).toHaveCount(0);
    await page.screenshot({ path: shot('05-ringkasan'), fullPage: true });
  });
});
