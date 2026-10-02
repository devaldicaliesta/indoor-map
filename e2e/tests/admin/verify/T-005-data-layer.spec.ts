import { randomUUID } from 'node:crypto';
import { createDataClient, type DataClient, DataError } from '@indoor/data';
import type { AppRole, VenueId } from '@indoor/domain';
import { ACCOUNTS } from '../../../accounts';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { type CheckResult, readRepo, renderSummary } from '../../../support/repo-checks';

// T-005: repository mengembalikan tipe domain dan memetakan galat database ke DataError
// berbahasa Indonesia, termasuk RLS yang diam-diam mengubah 0 baris.
const shot = (name: string) => `evidence/T-005/${name}.png`;
const results: CheckResult[] = [];
// Pesan untuk pengguna tidak boleh membocorkan SQL, nama tabel, atau kode internal.
const LEAK =
  /relation|violates|duplicate key|constraint|PGRST|syntax|column|select |insert |policy/i;

function record(id: string, check: string, ok: boolean) {
  results.push({ id, check, ok });
  expect(ok, `${id} ${check}`).toBe(true);
}

async function as(role: AppRole): Promise<DataClient> {
  const data = createDataClient({ url: env.supabaseUrl, anonKey: env.anonKey });
  await data.auth.signIn(ACCOUNTS[role].email, env.password);
  return data;
}

async function errorOf(run: Promise<unknown>): Promise<DataError> {
  const error = await run.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error, 'harus gagal').toBeInstanceOf(DataError);
  return error as DataError;
}

const safe = (e: DataError) => !LEAK.test(e.message) && e.message.length > 0;

test.describe('T-005 Lapisan data', () => {
  test.describe.configure({ mode: 'serial' });

  test('pemetaan galat nyata per role', async ({ testVenue }) => {
    const { venue, building } = testVenue;
    const editor = await as('editor');
    const viewer = await as('viewer');
    const admin = await as('admin');

    const update = await errorOf(
      editor.venues.update(venue.id, {
        name: 'Diubah Editor',
        address: null,
        center: null,
        timezone: 'Asia/Jakarta',
      }),
    );
    record(
      'TC-SEC-02b',
      `Editor ubah venue (RLS 0 baris) → forbidden: "${update.message}"`,
      update.kind === 'forbidden' && safe(update),
    );

    const display = await errorOf(viewer.displaySettings.update(venue.id, { defaultMode: '3d' }));
    record(
      'TC-SEC-07a',
      `Viewer ubah tampilan → forbidden: "${display.message}"`,
      display.kind === 'forbidden' && safe(display),
    );

    const duplicate = await errorOf(
      admin.buildings.create(venue.id, { name: 'Kembar', code: building.code, footprint: null }),
    );
    record(
      'TC-VEN-39',
      `kode gedung ganda → conflict: "${duplicate.message}"`,
      duplicate.kind === 'conflict' && safe(duplicate),
    );

    const missing = await errorOf(admin.venues.get(randomUUID() as VenueId));
    record(
      'T005-not-found',
      `venue tidak ada → not_found: "${missing.message}"`,
      missing.kind === 'not_found' && safe(missing),
    );

    const malformed = await errorOf(admin.venues.get('bukan-uuid' as VenueId));
    record(
      'T005-invalid',
      `id rusak → invalid: "${malformed.message}"`,
      malformed.kind === 'invalid' && safe(malformed),
    );

    const offline = createDataClient({ url: 'http://127.0.0.1:9', anonKey: env.anonKey });
    const network = await errorOf(offline.venues.list());
    record(
      'TC-REL-04a',
      `server tidak terjangkau → network: "${network.message}"`,
      network.kind === 'network' && safe(network),
    );

    const read = await viewer.venues.get(venue.id);
    record(
      'T005-domain',
      'repository mengembalikan tipe domain (camelCase, id bermerek)',
      read.id === venue.id && 'createdAt' in read && !('created_at' in read),
    );

    const keys = Object.keys(admin);
    record(
      'T005-no-raw',
      'DataClient tidak mengekspos klien Supabase mentah',
      !keys.some((k) => ['db', 'supabase', 'client', 'from', 'rpc'].includes(k)),
    );
    record(
      'T005-boundary',
      'tidak ada impor @supabase di app (dicek Biome, lihat T-003)',
      readRepo('biome.json').includes('Hanya packages/data yang boleh mengimpor Supabase'),
    );
    await Promise.all([editor, viewer, admin].map((d) => d.auth.signOut()));
  });

  test('Admin menampilkan pesan galat jaringan yang jelas', async ({
    page,
    loginAs,
    testVenue,
  }) => {
    await loginAs('admin');
    await new AdminShell(page).selectVenue(testVenue.venue.name);
    await page.route('**/rest/v1/**', (route) => route.abort('internetdisconnected'));
    const started = Date.now();
    await page.goto('/venues');
    const message = page.getByText(/Tidak dapat terhubung ke server/).first();
    await expect(message).toBeVisible({ timeout: 15_000 });
    const seconds = Math.round((Date.now() - started) / 1000);
    record(
      'TC-REL-04b',
      `Admin offline → "Tidak dapat terhubung ke server…" dalam ${seconds} s (≤ 12 s)`,
      seconds <= 12,
    );
    await expect(page.getByRole('button', { name: 'Muat ulang' })).toBeVisible();
    await page.screenshot({ path: shot('03-admin-offline'), fullPage: true });
  });

  test('ringkasan bukti', async ({ page }) => {
    const text = (file: string) => readRepo(`e2e/evidence/T-005/${file}`).trim();
    await renderSummary(page, 'T-005 · Lapisan data', results, [
      {
        name: 'vitest packages/data',
        text: text('01-unit-data.txt'),
      },
      { name: 'test integrasi (Supabase lokal)', text: text('02-integrasi.txt') },
    ]);
    await expect(page.getByText('Gagal', { exact: true })).toHaveCount(0);
    await page.screenshot({ path: shot('04-ringkasan'), fullPage: true });
  });
});
