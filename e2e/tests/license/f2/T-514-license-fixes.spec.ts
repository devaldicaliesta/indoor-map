import { ACCOUNTS } from '../../../accounts';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { DataTablePage } from '../../../pages/data-table';
import { currentLicenseId, devLicenseFile, restoreLicense, sql } from '../../../support/license';

const shot = (name: string) => `evidence/T-514/${name}.png`;
const GRACE_HINT = 'Masa tenggang lisensi: Admin hanya-baca.';

test.describe.configure({ mode: 'serial' });

test.describe('T-514 Perbaikan lisensi dan audit R4', () => {
  let original = '';

  test.beforeAll(() => {
    original = currentLicenseId();
  });

  test.afterAll(() => {
    restoreLicense(original);
  });

  test('TC-HRD-10 log audit aktivasi menyebut Super Admin yang memasang lisensi', async ({
    page,
    loginAs,
    superAdmin,
  }) => {
    const license = await devLicenseFile();
    await superAdmin.license.activateManual(license);
    expect(
      sql(`select p.full_name from public.audit_events e
           join public.profiles p on p.user_id = e.user_id
           where e.action = 'license_changed' and e.details->>'license_id' = '${license.licenseId}'`),
    ).toBe(ACCOUNTS.super_admin.name);

    await loginAs('super_admin');
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Catatan' }).click();
    const audit = new DataTablePage(page, 'Log audit');
    await audit.ready();
    const row = audit.rows.filter({ hasText: license.licenseId });
    await expect(row).toHaveCount(1);
    await expect(row).toContainText('Lisensi berubah');
    await expect(row).toContainText(ACCOUNTS.super_admin.name);
    await expect(row).not.toContainText('Sistem');
    await page.screenshot({ path: shot('01-audit-aktivasi-super-admin'), fullPage: true });
  });

  test('TC-HRD-09 masa tenggang: tombol tulis nonaktif dengan keterangan, server tetap menolak', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    await superAdmin.license.activateManual(await devLicenseFile());
    // Berkas yang sudah berakhir ditolak saat aktivasi, jadi tanggal berakhir dimundurkan di
    // database: 2 hari lalu = masih dalam 14 hari masa tenggang.
    sql(`update public.licenses
         set payload = jsonb_set(payload, '{validUntil}', to_jsonb(to_char(
           (now() - interval '2 days') at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS"Z"')))
         where is_current`);
    try {
      expect(sql('select state from public.license_status()')).toBe('grace');

      await loginAs('admin');
      await new AdminShell(page).selectVenue(testVenue.venue.name);
      await page.goto('/venues');
      await expect(page.getByText(/Masa tenggang sampai/)).toBeVisible();
      await page.getByRole('tab', { name: 'Semua venue' }).click();
      const add = page.getByRole('button', { name: 'Tambah venue' });
      await expect(add).toBeDisabled();
      const row = page.getByRole('row', { name: new RegExp(testVenue.venue.name) });
      await expect(row.getByRole('button', { name: 'Ubah' })).toBeDisabled();
      await expect(row.getByRole('button', { name: 'Hapus' })).toBeDisabled();
      await expect(page.locator('fieldset[data-license-locked]').first()).toHaveAttribute(
        'title',
        GRACE_HINT,
      );
      await add.hover({ force: true });
      await page.screenshot({ path: shot('02-masa-tenggang-tombol-nonaktif') });

      // Halaman lain yang memakai izin yang sama ikut hanya-baca; menu tetap bisa dibuka.
      await page.getByRole('tab', { name: 'Gedung' }).click();
      await expect(page.getByRole('button', { name: 'Tambah gedung' })).toBeDisabled();

      // Penegakan server tidak bergantung pada tombol.
      await expect(
        superAdmin.venues.create({
          name: 'Ditolak saat tenggang',
          address: null,
          center: null,
          timezone: 'Asia/Jakarta',
        }),
      ).rejects.toThrow();
      expect(sql(`select count(*) from public.venues where name = 'Ditolak saat tenggang'`)).toBe(
        '0',
      );
    } finally {
      // Venue uji dihapus fixture setelah test, jadi lisensi berlaku dipulihkan lebih dulu.
      restoreLicense(original);
    }
  });
});
