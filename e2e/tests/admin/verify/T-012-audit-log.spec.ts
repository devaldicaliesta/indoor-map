import type { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { LoginPage } from '../../../pages/login-page';
import { inviteUser } from '../../../support/auth-users';

const shot = (name: string) => `evidence/T-012/${name}.png`;

async function capture(page: Page, name: string) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await page.screenshot({ path: shot(name), fullPage: true });
}

async function openAuditTab(page: Page) {
  await page.goto('/settings');
  await page.getByRole('tab', { name: 'Catatan' }).click();
  await expect(page.getByLabel('Aksi')).toBeVisible();
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
}

test.describe('T-012 Catatan peristiwa penting', () => {
  test('TC-AUTH-03/08 login, gagal login, role, nonaktif, pengaturan, publish tercatat; filter aksi', async ({
    page,
    loginAs,
    superAdmin,
    publishedVenue,
  }) => {
    // Peristiwa nyata: gagal masuk 2×, masuk, role diubah, dinonaktifkan, pengaturan diubah, publish.
    const user = await inviteUser(superAdmin, 'catatan', 'viewer');
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn(user.email, 'salah-1');
    await expect(login.error).toBeVisible();
    await login.signIn(user.email, 'salah-2');
    await expect(login.error).toHaveText('Email atau password salah.');
    await login.signIn(user.email, user.password);
    await expect(page).not.toHaveURL(/\/login/);
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());

    const profile = (await superAdmin.profiles.list()).find((p) => p.email === user.email);
    if (!profile) throw new Error('profil undangan tidak ada');
    await superAdmin.profiles.update(profile.userId, { role: 'editor' });
    await superAdmin.profiles.update(profile.userId, { isActive: false });
    // Pengaturan dikembalikan segera karena berlaku untuk seluruh instalasi.
    const { publicVisitorUrl } = await superAdmin.systemSettings.get();
    await superAdmin.systemSettings.update({ publicVisitorUrl: 'https://catatan.e2e.test' });
    await superAdmin.systemSettings.update({ publicVisitorUrl });
    expect(publishedVenue.venue.id).toBeTruthy();

    await loginAs('super_admin');
    await openAuditTab(page);
    const rows = page.getByRole('row').filter({ hasText: user.email });
    await expect(rows.filter({ hasText: 'Gagal masuk' })).toHaveCount(2);
    await expect(rows.filter({ hasText: 'password salah (2×)' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'Masuk' }).filter({ hasNotText: 'Gagal' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'Role diubah' })).toContainText('Viewer → Editor');
    await expect(rows.filter({ hasText: 'Pengguna dinonaktifkan' })).toHaveCount(1);
    await expect(
      page.getByRole('row').filter({ hasText: 'URL publik Visitor' }).first(),
    ).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'Publish' }).first()).toBeVisible();
    await capture(page, '01-catatan-semua');

    // Filter aksi: hanya baris aksi itu.
    await page.getByLabel('Aksi').click();
    await page.getByRole('option', { name: 'Role diubah' }).click();
    const body = page.locator('tbody');
    await expect(body.getByRole('row').filter({ hasText: user.email })).toHaveCount(1);
    const actions = await body.getByRole('row').locator('td:nth-child(2)').allTextContents();
    expect(new Set(actions)).toEqual(new Set(['Role diubah']));
    // Keterangan panjang (nama beraksen + email) membungkus, tidak melebar keluar halaman.
    const overflow = await page
      .locator('[data-slot="table-container"]')
      .evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await capture(page, '02-filter-role-diubah');

    await page.getByLabel('Aksi').click();
    await page.getByRole('option', { name: 'Gagal masuk' }).click();
    await expect(body.getByRole('row').filter({ hasText: user.email })).toHaveCount(2);
    await capture(page, '03-filter-gagal-masuk');

    // Isi rahasia tidak pernah tampil (password yang salah tidak dicatat).
    await expect(page.getByText('salah-1')).toHaveCount(0);
  });

  test('TC-SEC-09 role lain tidak bisa membuka Catatan', async ({ page, loginAs }) => {
    await loginAs('admin');
    await page.goto('/settings');
    await expect(page.getByRole('tab', { name: 'Tampilan' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Catatan' })).toHaveCount(0);
  });
});
