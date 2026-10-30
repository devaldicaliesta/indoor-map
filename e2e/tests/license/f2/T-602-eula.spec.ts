import { writeFileSync } from 'node:fs';
import { EULA_VERSION } from '@indoor/domain';
import type { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { DataTablePage } from '../../../pages/data-table';
import { currentLicenseId, devLicenseFile, restoreLicense, sql } from '../../../support/license';

const shot = (name: string) => `evidence/T-602/${name}.png`;

test.describe.configure({ mode: 'serial' });

/** Instalasi baru: tanpa Super Admin aktif, tanpa lisensi, belum pernah menyetujui EULA. */
function freshInstallation() {
  const saved = sql(`select coalesce(json_agg(e), '[]') from public.eula_acceptances e;`);
  const admins = sql(`
    alter table public.profiles disable trigger profiles_guard_last_super_admin;
    update public.profiles set is_active = false where role = 'super_admin' and is_active
      returning user_id;
    alter table public.profiles enable trigger profiles_guard_last_super_admin;`)
    .split('\n')
    .filter((line) => /^[0-9a-f-]{36}$/.test(line));
  sql(`update public.licenses set is_current = false where is_current;
       delete from public.eula_acceptances;`);
  return () => {
    if (admins.length) {
      sql(`update public.profiles set is_active = true
           where user_id in (${admins.map((id) => `'${id}'`).join(',')});`);
    }
    sql(`delete from public.eula_acceptances;
         insert into public.eula_acceptances overriding system value
         select * from json_populate_recordset(null::public.eula_acceptances, '${saved}'::json);`);
  };
}

async function capture(page: Page, name: string) {
  await page.screenshot({ path: shot(name), fullPage: true });
}

test.describe('T-602 Persetujuan EULA saat aktivasi', () => {
  let original = '';

  test.beforeAll(() => {
    original = currentLicenseId();
  });

  test.afterAll(() => {
    restoreLicense(original);
  });

  test('TC-KOM-03: aktivasi pertama wajib menyetujui EULA; persetujuan tercatat di audit', async ({
    page,
    superAdmin,
  }) => {
    test.setTimeout(120_000);
    // Berkas dari Super Admin seed dibuat sebelum akunnya dinonaktifkan.
    const refusedFile = await devLicenseFile();
    const license = await devLicenseFile({ client: 'RS EULA E2E' });
    const restore = freshInstallation();
    const email = `eula-${Date.now().toString(36)}@e2e.test`;
    try {
      await page.goto('/login');
      await expect(page).toHaveURL(/\/aktivasi$/);
      const consent = page.getByRole('region', { name: 'Teks EULA' });
      await expect(
        page.getByRole('heading', {
          name: `Perjanjian Lisensi Pengguna Akhir (EULA) versi ${EULA_VERSION}`,
        }),
      ).toBeVisible();
      await expect(consent).toContainText('3. Larangan');
      await expect(consent).toContainText('9. Batas tanggung jawab');
      await page.getByRole('tab', { name: 'Unggah berkas' }).click();
      const path = test.info().outputPath('lisensi-eula.json');
      writeFileSync(path, JSON.stringify(license));
      await page.getByLabel('Berkas lisensi (.json)').setInputFiles(path);
      const install = page.getByRole('button', { name: 'Pasang lisensi' });
      await expect(install).toBeDisabled();
      await capture(page, '01-eula-belum-disetujui');

      // Server tetap menolak tanpa persetujuan, walau tombol di UI dilewati.
      const refused = await superAdmin.license.activateManual(refusedFile).catch((e: unknown) => e);
      expect(String(refused)).toContain(`EULA) versi ${EULA_VERSION}`);

      await consent.evaluate((element) => element.scrollTo(0, element.scrollHeight));
      await page.getByLabel(/Saya telah membaca dan menyetujui EULA ini/).check();
      await expect(install).toBeEnabled();
      await capture(page, '02-eula-disetujui');
      await install.click();

      await expect(page.getByRole('heading', { name: 'Buat Super Admin pertama' })).toBeVisible();
      expect(
        sql(`select version || '|' || licensee || '|' || license_id from public.eula_acceptances`),
      ).toBe(`${EULA_VERSION}|RS EULA E2E|${license.licenseId}`);
      await page.getByLabel('Nama lengkap').fill('Penyetuju EULA');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password', { exact: true }).fill('Rahasia-Eula-1');
      await page.getByLabel('Ulangi password').fill('Rahasia-Eula-1');
      await page.getByRole('button', { name: 'Buat Super Admin' }).click();
      await expect(page).not.toHaveURL(/\/aktivasi/);

      await page.goto('/settings?tab=audit');
      const audit = new DataTablePage(page, 'Log audit');
      await audit.ready();
      await audit.check('Aksi', ['EULA disetujui']);
      const row = audit.rows.filter({ hasText: license.licenseId });
      await expect(row).toHaveCount(1);
      await expect(row).toContainText(`Versi ${EULA_VERSION} · RS EULA E2E`);
      await capture(page, '03-log-audit-eula');

      // Sudah disetujui: pemasangan lisensi berikutnya tidak meminta lagi.
      await page.goto('/aktivasi');
      await expect(page.getByRole('heading', { name: 'Pasang lisensi baru' })).toBeVisible();
      await expect(page.getByRole('region', { name: 'Teks EULA' })).toHaveCount(0);
      await page.getByRole('tab', { name: 'Unggah berkas' }).click();
      await expect(page.getByRole('button', { name: 'Pasang lisensi' })).toBeEnabled();
      await capture(page, '04-lisensi-berikutnya-tanpa-eula');
    } finally {
      restore();
      sql(`
        alter table public.profiles disable trigger profiles_guard_last_super_admin;
        delete from auth.users where email = '${email}';
        alter table public.profiles enable trigger profiles_guard_last_super_admin;`);
    }
  });
});
