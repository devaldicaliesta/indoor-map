import { createDataClient } from '@indoor/data';
import type { Page } from '@playwright/test';
import { ACCOUNTS } from '../../../accounts';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { DataTablePage } from '../../../pages/data-table';

const shot = (name: string) => `evidence/T-503/${name}.png`;
/** Versi terbit venue uji: satu dari fixture, sisanya diterbitkan test ini. */
const VERSIONS = 30;

async function capture(page: Page, name: string) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await page.screenshot({ path: shot(name), fullPage: true });
}

/** Tanggal kalender (YYYY-MM-DD) di zona waktu browser uji (Asia/Jakarta). */
function jakartaDate(offsetDays = 0): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(
    new Date(Date.now() + offsetDays * 86_400_000),
  );
}

test.describe('T-503 Tabel Log audit dan Riwayat publish (disaring di server)', () => {
  test('Log audit dan Riwayat publish: cari, filter, pindah halaman, muat ulang; total Admin 0 (TC-SEC-81)', async ({
    page,
    loginAs,
    superAdmin,
    publishedVenue,
  }) => {
    test.setTimeout(240_000);
    const { venue } = publishedVenue;
    // Setiap publish menulis satu peristiwa "Publish" yang memuat nama venue.
    for (let version = 2; version <= VERSIONS; version++) {
      await superAdmin.publications.publish(venue.id, `Rilis uji ${version}`);
    }
    const today = jakartaDate();

    await loginAs('super_admin');
    await page.goto('/settings?tab=audit');
    const audit = new DataTablePage(page, 'Log audit');
    await audit.ready();
    await audit.searchFor(venue.name);
    await audit.expectTotal(VERSIONS);
    await expect(audit.position).toHaveText(`1–25 dari ${VERSIONS}`);
    await capture(page, '10-log-audit-cari-venue');

    await audit.check('Aksi', ['Publish']);
    await audit.choose('Pengguna', `${ACCOUNTS.super_admin.name} · ${ACCOUNTS.super_admin.email}`);
    await audit.dateRange('Tanggal', today, today);
    await audit.expectTotal(VERSIONS);
    await audit.goToPage(2);
    await expect(audit.position).toHaveText(`26–${VERSIONS} dari ${VERSIONS}`);
    await expect(audit.rows).toHaveCount(VERSIONS - 25);
    await capture(page, '11-log-audit-filter-halaman-2');

    // Muat ulang: kata kunci, filter, dan halaman dari URL.
    await page.reload();
    await audit.expectTotal(VERSIONS);
    await expect(audit.search).toHaveValue(venue.name);
    await expect(audit.pageButton(2)).toHaveAttribute('aria-current', 'page');
    await expect(audit.activeFilters.getByRole('listitem')).toHaveCount(4);
    await capture(page, '12-log-audit-muat-ulang');

    // Aksi lain pada venue ini tidak ada; rentang besok kosong.
    await audit.check('Aksi', ['Publish', 'Rollback']);
    await expect(audit.root.getByText('Tidak ada log audit yang cocok.')).toBeVisible();
    await audit.check('Aksi', ['Rollback', 'Publish']);
    await audit.dateRange('Tanggal', jakartaDate(1), jakartaDate(1));
    await audit.expectTotal(0);

    // TC-TBL-09 / TC-SEC-81: Admin tidak boleh membaca log; total juga 0, bukan jumlah sebenarnya.
    const admin = createDataClient({ url: env.supabaseUrl, anonKey: env.anonKey });
    await admin.auth.signIn(ACCOUNTS.admin.email, env.password);
    const leaked = await admin.audit.listPage({
      q: venue.name,
      page: 1,
      size: 25,
      filters: { actions: [], userId: null, from: null, to: null, timeZone: 'Asia/Jakarta' },
    });
    expect(leaked).toEqual({ rows: [], total: 0 });
    await admin.auth.signOut();

    // Riwayat publish: 10 baris per halaman, cari catatan dan nomor versi, rentang tanggal.
    await new AdminShell(page).selectVenue(venue.name);
    await page.goto('/publish');
    const history = new DataTablePage(page, 'Riwayat versi');
    await history.expectTotal(VERSIONS);
    await expect(history.position).toHaveText(`1–10 dari ${VERSIONS}`);
    await capture(page, '13-riwayat-publish');
    await history.searchFor('v17');
    await history.expectTotal(1);
    // "Rilis uji 2" dan "Rilis uji 20" s.d. "Rilis uji 29".
    await history.searchFor('rilis uji 2');
    await history.expectTotal(11);
    await history.dateRange('Terbit', today, today);
    await history.goToPage(2);
    await expect(history.rows).toHaveCount(1);
    await page.reload();
    await history.expectTotal(11);
    await expect(history.pageButton(2)).toHaveAttribute('aria-current', 'page');
    await capture(page, '14-riwayat-publish-cari-halaman-2');
  });
});
