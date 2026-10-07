import { signedInDb } from '@indoor/data/testing/full-venue';
import {
  createLargeVenue,
  type LargeVenueLocation,
  largeVenueLocation,
} from '@indoor/data/testing/large-venue';
import type { Venue } from '@indoor/domain';
import type { Page } from '@playwright/test';
import { ACCOUNTS } from '../../../accounts';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { DataTablePage } from '../../../pages/data-table';

const shot = (name: string) => `evidence/T-503/${name}.png`;
const COUNT = 2000;
/** Batas waktu jawaban server per perubahan cari/filter (T-503, TC-TBL-01). */
const LIMIT_MS = 500;

const expected = (match: (l: LargeVenueLocation) => boolean) =>
  Array.from({ length: COUNT }, (_, i) => largeVenueLocation(i)).filter(match).length;

async function capture(page: Page, name: string) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await page.screenshot({ path: shot(name), fullPage: true });
}

/** Lama permintaan `search_locations` yang dipicu satu aksi (kirim sampai jawaban selesai). */
async function serverMs(page: Page, action: () => Promise<unknown>): Promise<number> {
  const [response] = await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes('/rpc/search_locations') && r.request().method() === 'POST',
    ),
    action(),
  ]);
  await response.finished();
  return response.request().timing().responseEnd;
}

test.describe('T-503 Tabel Lokasi 2.000 baris (disaring di server)', () => {
  test('TC-TBL-01..07 cari, filter gabungan, halaman terakhir, muat ulang, URL rusak, tanpa hasil, hapus baris terakhir', async ({
    page,
    context,
    loginAs,
    superAdmin,
  }, testInfo) => {
    test.setTimeout(240_000);
    const db = await signedInDb(env.supabaseUrl, env.anonKey, {
      email: ACCOUNTS.super_admin.email,
      password: env.password,
    });
    const venue = await createLargeVenue(
      db,
      `E2E Tabel ${testInfo.workerIndex}-${Date.now().toString(36)}`,
      COUNT,
    );
    const timings: [string, number][] = [];
    try {
      await loginAs('admin');
      await new AdminShell(page).selectVenue(venue.name);
      await page.goto('/locations');
      const table = new DataTablePage(page, 'Lokasi');
      await table.expectTotal(COUNT);
      await expect(table.position).toHaveText('1–25 dari 2.000');
      await capture(page, '01-lokasi-2000-baris');

      // TC-TBL-01: kata kunci tanpa aksen, kode lokasi, dan kode unit disaring di server.
      timings.push([
        'cari "kafe lumiere"',
        await serverMs(page, () => table.searchFor('kafe lumiere')),
      ]);
      await table.expectTotal(expected((l) => l.name.startsWith('Kafé Lumière')));
      await capture(page, '02-cari-tanpa-aksen');
      timings.push(['cari kode "LK-0042"', await serverMs(page, () => table.searchFor('LK-0042'))]);
      await table.expectTotal(1);
      const unitCode = largeVenueLocation(1).unitCode ?? '';
      timings.push([
        `cari kode unit "${unitCode}"`,
        await serverMs(page, () => table.searchFor(unitCode.toLowerCase())),
      ]);
      await table.expectTotal(1);
      await table.removeFilter(/Hapus filter Kata kunci/);
      await table.expectTotal(COUNT);

      // TC-TBL-02: filter gabungan berupa irisan, lalu dihapus satu per satu.
      timings.push([
        'status Aktif + Segera buka',
        await serverMs(page, () => table.check('Status', ['Aktif', 'Segera buka'])),
      ]);
      timings.push([
        'kategori Kopi & Teh',
        await serverMs(page, () => table.choose('Kategori', 'Kopi & Teh')),
      ]);
      timings.push([
        'gedung Gedung Utama',
        await serverMs(page, () => table.choose('Gedung', 'Gedung Utama')),
      ]);
      timings.push(['lantai L2', await serverMs(page, () => table.choose('Lantai', 'L2'))]);
      const statuses: LargeVenueLocation['status'][] = ['active', 'coming_soon'];
      await table.expectTotal(
        expected((l) => statuses.includes(l.status) && l.category === 'kopi' && l.floor === 'L2'),
      );
      await expect(table.activeFilters.getByRole('listitem')).toHaveText([
        /Status: Aktif, Segera buka/,
        /Kategori: Kopi & Teh/,
        /Gedung: Gedung Utama/,
        /Lantai: L2/,
      ]);
      await capture(page, '03-filter-gabungan');
      timings.push([
        'hapus filter kategori',
        await serverMs(page, () => table.removeFilter(/Hapus filter Kategori/)),
      ]);
      await table.expectTotal(expected((l) => statuses.includes(l.status) && l.floor === 'L2'));
      // Mengganti gedung mengosongkan lantai (lantai milik gedung lama).
      await table.choose('Gedung', 'Area Luar');
      await expect(table.activeFilters).not.toContainText('Lantai');
      await table.expectTotal(
        expected((l) => statuses.includes(l.status) && l.floor === 'outdoor'),
      );
      await capture(page, '04-hapus-satu-filter');
      await table.root.getByRole('button', { name: 'Hapus semua filter' }).click();
      await table.expectTotal(COUNT);

      // TC-TBL-03: 100 baris per halaman, halaman terakhir; tidak ada baris ganda.
      await table.setPageSize(100);
      await table.goToPage(20);
      await expect(table.position).toHaveText('1.901–2.000 dari 2.000');
      await expect(table.rows).toHaveCount(100);
      const lastPage = await table.rows.locator('td:first-child').allInnerTexts();
      expect(new Set(lastPage).size).toBe(100);
      await capture(page, '05-halaman-terakhir-100');

      // TC-TBL-04: muat ulang dan URL di tab baru memulihkan cari, filter, halaman, ukuran.
      await table.searchFor('poli');
      await table.check('Status', ['Aktif']);
      await table.goToPage(2);
      const url = page.url();
      expect(Object.fromEntries(new URL(url).searchParams)).toEqual({
        q: 'poli',
        status: 'active',
        size: '100',
        page: '2',
      });
      const total = expected((l) => l.status === 'active' && /poli/i.test(l.name));
      await page.reload();
      await table.expectTotal(total);
      await expect(table.search).toHaveValue('poli');
      await expect(table.pageButton(2)).toHaveAttribute('aria-current', 'page');
      await capture(page, '06-setelah-muat-ulang');
      const copy = await context.newPage();
      await copy.goto(url);
      const copied = new DataTablePage(copy, 'Lokasi');
      await copied.expectTotal(total);
      await expect(copied.pageButton(2)).toHaveAttribute('aria-current', 'page');
      await copy.close();

      // TC-TBL-05: URL rusak dinormalisasi tanpa galat.
      await page.goto('/locations?page=999&size=7&status=active,bukan-status&tautan=apa');
      const active = expected((l) => l.status === 'active');
      await table.expectTotal(active);
      // Halaman di luar jangkauan pindah ke halaman terakhir; ukuran dan nilai asing dibuang.
      await expect(page).toHaveURL(new RegExp(`page=${Math.ceil(active / 25)}`));
      await expect(page).toHaveURL(/status=active/);
      await expect(page).not.toHaveURL(/size=7|bukan-status|tautan=/);
      await capture(page, '07-url-rusak-dinormalisasi');

      // TC-TBL-08: karakter khusus diperlakukan sebagai teks (tanpa filter lain).
      await page.goto('/locations');
      await table.expectTotal(COUNT);
      for (const [q, match] of [
        ['50%', (l: LargeVenueLocation) => l.name.includes('50%')],
        ["o'bakery", (l: LargeVenueLocation) => l.name.startsWith("Roti O'Bakery")],
        ['ruang_laktasi', (l: LargeVenueLocation) => l.name.startsWith('Ruang_Laktasi')],
        ['\\', () => false],
      ] as const) {
        await table.searchFor(q);
        await table.expectTotal(expected(match));
      }

      // TC-TBL-06: tanpa hasil: keadaan kosong dengan tombol hapus filter.
      await table.searchFor('tidak-ada-lokasi-seperti-ini');
      await expect(table.root.getByText('Tidak ada lokasi yang cocok.')).toBeVisible();
      await capture(page, '08-tanpa-hasil');
      await table.root.getByRole('button', { name: 'Hapus filter', exact: true }).click();
      await table.expectTotal(COUNT);

      // TC-TBL-07: menghapus satu-satunya baris di halaman terakhir pindah ke halaman sebelumnya.
      await table.setPageSize(10);
      await table.searchFor('kopi senja 11');
      await table.expectTotal(11);
      await table.goToPage(2);
      await expect(table.rows).toHaveCount(1);
      const last = table.rows.first();
      const lastName = (await last.locator('td:nth-child(2) .font-bold').innerText()).trim();
      await last.getByRole('button', { name: 'Hapus' }).click();
      await page.getByRole('dialog').getByRole('button', { name: /Hapus/ }).last().click();
      await table.expectTotal(10);
      await expect(table.pageButton(1)).toHaveAttribute('aria-current', 'page');
      await expect(table.rows).toHaveCount(10);
      await expect(table.rows.filter({ hasText: lastName })).toHaveCount(0);
      await capture(page, '09-hapus-baris-terakhir');

      testInfo.annotations.push({
        type: 'waktu server (ms)',
        description: timings.map(([name, ms]) => `${name}: ${Math.round(ms)}`).join('; '),
      });
      // Setiap perubahan < 500 ms dibuktikan berurutan di test integrasi `server-tables`. Di E2E
      // worker lain bisa berjalan bersamaan (mis. puluhan publish), jadi yang dibatasi 500 ms
      // adalah median, dan setiap perubahan diberi batas atas dua kali lipat.
      const sorted = timings.map(([, ms]) => ms).sort((a, b) => a - b);
      expect(sorted[Math.floor(sorted.length / 2)] ?? 0, 'median').toBeLessThan(LIMIT_MS);
      for (const [name, ms] of timings) expect(ms, name).toBeLessThan(2 * LIMIT_MS);
    } finally {
      await superAdmin.venues.remove(venue.venueId as Venue['id']);
      await db.auth.signOut();
    }
  });
});
