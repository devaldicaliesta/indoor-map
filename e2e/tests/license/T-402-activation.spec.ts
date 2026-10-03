import { writeFileSync } from 'node:fs';
import type { Server } from 'node:http';
import { createVendorStub } from '../../../tools/vendor-stub/src/server';
import { ACCOUNTS } from '../../accounts';
import { env } from '../../env';
import { expect, test } from '../../fixtures';
import {
  currentLicenseId,
  devLicenseFile,
  releaseLicense,
  restoreLicense,
  sql,
} from '../../support/license';

const shot = (name: string) => `evidence/T-402/${name}.png`;

test.describe.configure({ mode: 'serial' });

test.describe('T-402 Aktivasi lisensi', () => {
  let original = '';
  let stub: Server;

  test.beforeAll(async () => {
    original = currentLicenseId();
    stub = await createVendorStub();
    await new Promise<void>((resolve) => stub.listen(8091, '0.0.0.0', resolve));
  });

  test.afterAll(async () => {
    stub?.close();
    restoreLicense(original);
  });

  test('tanpa lisensi tidak ada menu yang terbuka; unggah manual memulihkan Admin', async ({
    page,
  }, testInfo) => {
    releaseLicense();
    await page.goto('/venues');
    await expect(page).toHaveURL(/\/aktivasi$/);
    await expect(page.getByText('Instalasi ini belum diaktifkan.')).toBeVisible();
    await expect(page.getByText(sql('select instance_id from public.installation'))).toBeVisible();
    await expect(page.getByRole('link', { name: 'Masuk sebagai Super Admin' })).toBeVisible();
    await page.screenshot({ path: shot('01-belum-aktif-tamu') });

    // Super Admin masuk; semua menu tetap mengarah ke aktivasi.
    await page.getByRole('link', { name: 'Masuk sebagai Super Admin' }).click();
    await page.getByLabel('Email').fill(ACCOUNTS.super_admin.email);
    await page.getByLabel('Password').fill(env.password);
    await page.getByRole('button', { name: 'Masuk' }).click();
    await expect(page).toHaveURL(/\/aktivasi$/);
    for (const path of [
      '/venues',
      '/map-editor',
      '/locations',
      '/publish',
      '/settings',
      '/users',
    ]) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/aktivasi$/);
    }

    // Berkas yang diubah ditolak; berkas sah dipasang.
    await page.getByRole('tab', { name: 'Unggah berkas' }).click();
    const valid = await devLicenseFile();
    const tamperedPath = testInfo.outputPath('diubah.json');
    writeFileSync(tamperedPath, JSON.stringify({ ...valid, client: 'RS Uji E2F' }));
    await page.getByLabel('Berkas lisensi (.json)').setInputFiles(tamperedPath);
    await page.getByRole('button', { name: 'Pasang lisensi' }).click();
    await expect(page.getByText(/Tanda tangan lisensi tidak cocok/)).toBeVisible();
    await page.screenshot({ path: shot('02-berkas-diubah-ditolak') });

    const validPath = testInfo.outputPath('lisensi.json');
    writeFileSync(validPath, JSON.stringify(valid));
    await page.getByLabel('Berkas lisensi (.json)').setInputFiles(validPath);
    await page.getByRole('button', { name: 'Pasang lisensi' }).click();
    await expect(page.getByText('Lisensi berlaku.')).toBeVisible();
    await page.getByRole('link', { name: 'Kembali ke Admin' }).click();
    await expect(page).not.toHaveURL(/\/aktivasi/);
    await expect(page.getByRole('navigation').getByRole('link', { name: 'Venue' })).toBeVisible();
    await page.screenshot({ path: shot('03-admin-terbuka') });
  });

  test('aktivasi online dengan kunci lisensi ke server vendor', async ({ page, loginAs }) => {
    releaseLicense();
    await loginAs('super_admin');
    await expect(page).toHaveURL(/\/aktivasi$/);
    await page.getByRole('textbox', { name: 'Kunci lisensi' }).fill('KUNCI-PALSU');
    await page.getByRole('button', { name: 'Aktifkan' }).click();
    await expect(page.getByText(/Kunci lisensi tidak dikenal/)).toBeVisible();
    await page.getByRole('textbox', { name: 'Kunci lisensi' }).fill('DEV-ONLINE-0001');
    await page.screenshot({ path: shot('04-kunci-online') });
    await page.getByRole('button', { name: 'Aktifkan' }).click();
    await expect(page.getByText('Lisensi berlaku.')).toBeVisible();
    expect(sql('select source from public.licenses where is_current')).toBe('online');
  });

  test('instalasi baru: aktivasi lalu Super Admin pertama, langsung masuk', async ({ page }) => {
    const admins = sql(`
      alter table public.profiles disable trigger profiles_guard_last_super_admin;
      update public.profiles set is_active = false where role = 'super_admin' and is_active
        returning user_id;
      alter table public.profiles enable trigger profiles_guard_last_super_admin;`)
      .split('\n')
      .filter((line) => /^[0-9a-f-]{36}$/.test(line));
    releaseLicense();
    const email = `pertama-${Date.now().toString(36)}@e2e.test`;
    try {
      await page.goto('/login');
      await expect(page).toHaveURL(/\/aktivasi$/);
      await page.getByRole('tab', { name: 'Unggah berkas' }).click();
      const path = test.info().outputPath('lisensi-baru.json');
      writeFileSync(path, JSON.stringify(await devLicenseFile()));
      await page.getByLabel('Berkas lisensi (.json)').setInputFiles(path);
      await page.getByRole('button', { name: 'Pasang lisensi' }).click();

      await expect(page.getByRole('heading', { name: 'Buat Super Admin pertama' })).toBeVisible();
      await page.getByLabel('Nama lengkap').fill('Pengelola Pertama');
      await page.getByLabel('Email').fill(email);
      await page.getByLabel('Password', { exact: true }).fill('Rahasia-Pertama-1');
      await page.getByLabel('Ulangi password').fill('Rahasia-Pertama-2');
      await page.getByRole('button', { name: 'Buat Super Admin' }).click();
      await expect(page.getByText('Konfirmasi password tidak sama.')).toBeVisible();
      await page.getByLabel('Ulangi password').fill('Rahasia-Pertama-1');
      await page.screenshot({ path: shot('05-super-admin-pertama') });
      await page.getByRole('button', { name: 'Buat Super Admin' }).click();
      await expect(page).not.toHaveURL(/\/aktivasi/);
      await expect(page.getByText('Pengelola Pertama')).toBeVisible();
      await page.screenshot({ path: shot('06-masuk-sebagai-super-admin-pertama') });
    } finally {
      if (admins.length) {
        sql(`update public.profiles set is_active = true
             where user_id in (${admins.map((id) => `'${id}'`).join(',')});`);
      }
      sql(`
        alter table public.profiles disable trigger profiles_guard_last_super_admin;
        delete from auth.users where email = '${email}';
        alter table public.profiles enable trigger profiles_guard_last_super_admin;`);
    }
  });
});
