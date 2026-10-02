import type { AppRole } from '@indoor/domain';
import type { Page } from '@playwright/test';
import { ACCOUNTS } from '../../../accounts';
import { expect, test } from '../../../fixtures';
import { LoginPage } from '../../../pages/login-page';
import { inviteUser } from '../../../support/auth-users';
import { waitForMail } from '../../../support/mailpit';

const shot = (name: string) => `evidence/T-009b/${name}.png`;

async function capture(page: Page, name: string) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await page.screenshot({ path: shot(name), fullPage: true });
}

// Nama bervariasi: aksen, emoji, nama sangat panjang, karakter khusus, angka di awal.
const VARIED: { tag: string; role: AppRole }[] = [
  { tag: 'andre', role: 'admin' },
  { tag: 'zoe', role: 'editor' },
  { tag: 'nur', role: 'editor' },
  { tag: 'op1', role: 'operator' },
  { tag: 'op2', role: 'operator' },
  { tag: 'tamu', role: 'viewer' },
  { tag: 'dewi', role: 'viewer' },
  { tag: '3d', role: 'editor' },
];

test.describe('T-009b Halaman Pengguna', () => {
  test('TC-AUTH-08/42 undang, ubah role, nonaktifkan; ditolak bila duplikat', async ({
    page,
    loginAs,
    superAdmin,
  }) => {
    await Promise.all(VARIED.map((v) => inviteUser(superAdmin, v.tag, v.role)));
    await loginAs('super_admin');
    await page.goto('/users');
    await expect(page.getByRole('cell', { name: ACCOUNTS.viewer.email })).toBeVisible();
    await capture(page, '01-daftar-pengguna');

    // Undang lewat UI: nama beraksen dan panjang.
    const email = `renee-${Date.now().toString(36)}@e2e.test`;
    const fullName = 'Renée Ümmü Ballesteros-Wijayakusuma Pratamaningsih';
    await page.getByRole('button', { name: 'Tambah pengguna' }).click();
    const dialog = page.getByRole('dialog', { name: 'Tambah pengguna' });
    await dialog.getByLabel('Nama lengkap').fill(fullName);
    await dialog.getByLabel('Email').fill(email);
    await dialog.getByRole('combobox', { name: 'Role' }).click();
    await page.getByRole('option', { name: 'Operator' }).click();
    await capture(page, '02-form-undang');
    await dialog.getByRole('button', { name: 'Kirim undangan' }).click();
    await expect(page.getByText('Undangan terkirim')).toBeVisible();
    await expect(dialog).toBeHidden();
    const row = page.getByRole('row').filter({ hasText: email });
    await expect(row).toBeVisible();
    await capture(page, '03-diundang');
    const mail = await waitForMail(email);
    expect(mail.subject).toBe('Undangan Admin Indoor Map');

    // Database: profil tersimpan dengan role yang dipilih.
    const stored = (await superAdmin.profiles.list()).find((p) => p.email === email);
    expect(stored).toMatchObject({ fullName, role: 'operator', isActive: true });

    // Email yang sudah terdaftar ditolak dengan pesan.
    await page.getByRole('button', { name: 'Tambah pengguna' }).click();
    await dialog.getByLabel('Nama lengkap').fill('Duplikat');
    await dialog.getByLabel('Email').fill(email);
    await dialog.getByRole('button', { name: 'Kirim undangan' }).click();
    await expect(dialog.getByRole('alert')).toBeVisible();
    await capture(page, '06-error-duplikat');
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    // Ubah role.
    await row.getByRole('combobox', { name: `Role ${fullName}` }).click();
    await page.getByRole('option', { name: 'Editor' }).click();
    await expect(page.getByText(`Role ${fullName} diubah.`)).toBeVisible();
    await expect
      .poll(async () => (await superAdmin.profiles.list()).find((p) => p.email === email)?.role)
      .toBe('editor');
    await capture(page, '04-role-diubah');

    // Nonaktifkan: status berubah dan pengguna tidak bisa masuk.
    await row.getByRole('button', { name: 'Nonaktifkan' }).click();
    await expect(page.getByText(`${fullName} dinonaktifkan.`)).toBeVisible();
    await expect(row.getByText('Nonaktif')).toBeVisible();
    await expect(row.getByRole('button', { name: 'Aktifkan' })).toBeVisible();
    await capture(page, '05-dinonaktifkan');
    await page.reload();
    await expect(
      page.getByRole('row').filter({ hasText: email }).getByText('Nonaktif'),
    ).toBeVisible();
  });

  test('TC-AUTH-09 Super Admin terakhir tidak bisa dinonaktifkan atau diturunkan', async ({
    page,
    loginAs,
    superAdmin,
  }) => {
    await loginAs('super_admin');
    await page.goto('/users');
    const me = page.getByRole('row').filter({ hasText: '(Anda)' });
    await me.getByRole('button', { name: 'Nonaktifkan' }).click();
    const toast = page
      .locator('[data-sonner-toast]')
      .filter({ hasText: 'Perubahan tidak disimpan' });
    await expect(toast).toBeVisible();
    // Gambar diambil setelah animasi toast selesai.
    await expect(toast).toHaveCSS('opacity', '1');
    await expect(toast).toContainText('Super Admin');
    await page.screenshot({ path: shot('07-super-admin-terakhir') });
    await expect(me.getByText('Aktif', { exact: true })).toBeVisible();

    await me.getByRole('combobox').click();
    await page.getByRole('option', { name: 'Admin', exact: true }).click();
    await expect(page.getByText('Perubahan tidak disimpan').first()).toBeVisible();
    const self = (await superAdmin.profiles.list()).find(
      (p) => p.email === ACCOUNTS.super_admin.email,
    );
    expect(self).toMatchObject({ role: 'super_admin', isActive: true });
  });

  test('TC-AUTH-36 pengguna yang dinonaktifkan saat sedang masuk dikeluarkan', async ({
    page,
    superAdmin,
  }) => {
    const user = await inviteUser(superAdmin, 'aktif', 'editor');
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn(user.email, user.password);
    await expect(page).not.toHaveURL(/\/login/);

    const target = (await superAdmin.profiles.list()).find((p) => p.email === user.email);
    if (!target) throw new Error('profil undangan tidak ada');
    await superAdmin.profiles.update(target.userId, { isActive: false });

    await page.reload();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('status')).toHaveText(
      'Akun Anda dinonaktifkan. Hubungi Super Admin.',
    );
    await capture(page, '08-dikeluarkan-nonaktif');

    await login.signIn(user.email, user.password);
    await expect(login.error).toHaveText('Akun Anda dinonaktifkan. Hubungi Super Admin.');
  });
});
