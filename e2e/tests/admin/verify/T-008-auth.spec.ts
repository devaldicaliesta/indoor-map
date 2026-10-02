import type { Locator, Page } from '@playwright/test';
import { ACCOUNTS } from '../../../accounts';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { LoginPage } from '../../../pages/login-page';
import { inviteUser } from '../../../support/auth-users';
import { waitForMail } from '../../../support/mailpit';

const shot = (name: string) => `evidence/T-008/${name}.png`;
const capture = (page: Page, name: string) => page.screenshot({ path: shot(name) });

const validity = (input: Locator, key: keyof ValidityState) =>
  input.evaluate((el, k) => (el as HTMLInputElement).validity[k], key);

const WRONG = 'Email atau password salah.';
const LOCKED = /Akun terkunci karena terlalu banyak percobaan gagal/;

test.describe('T-008 Login, logout, reset password', () => {
  test('TC-AUTH-01/30/31 login benar (email dinormalisasi), validasi kosong', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await capture(page, '01-halaman-masuk');

    // Isian kosong dicegah validasi bawaan formulir: tidak ada permintaan ke server.
    await login.submit.click();
    expect(await validity(login.email, 'valueMissing')).toBe(true);
    await login.email.fill('bukan-email');
    await login.submit.click();
    expect(await validity(login.email, 'typeMismatch')).toBe(true);
    await expect(page).toHaveURL(/\/login$/);

    await login.signIn(`  ${ACCOUNTS.admin.email.toUpperCase()}  `, env.password);
    await expect(page).toHaveURL('/venues');
    await expect(new AdminShell(page).accountButton(ACCOUNTS.admin.name)).toBeVisible();
    await capture(page, '02-masuk-berhasil');
  });

  test('TC-AUTH-02 password salah dan email tidak terdaftar mendapat pesan sama', async ({
    page,
    superAdmin,
  }) => {
    const user = await inviteUser(superAdmin, 'salah');
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn(user.email, `${user.password}-x`);
    await expect(login.error).toHaveText(WRONG);
    await expect(login.submit).toBeEnabled();
    await capture(page, '03-password-salah');

    await login.signIn('tidak-terdaftar@e2e.test', 'Apa-saja-123');
    await expect(login.error).toHaveText(WRONG);
    await expect(page).toHaveURL(/\/login$/);
  });

  test('TC-AUTH-03/39 lima kali gagal mengunci akun; tercatat di Catatan', async ({
    page,
    superAdmin,
  }) => {
    const user = await inviteUser(superAdmin, 'kunci');
    const login = new LoginPage(page);
    await login.goto();
    for (let attempt = 1; attempt <= 5; attempt++) {
      await login.signIn(user.email, `salah-${attempt}`);
      await expect(login.error).toHaveText(WRONG);
      await expect(login.submit).toBeEnabled();
    }
    // Password benar pun ditolak selama terkunci.
    await login.signIn(user.email, user.password);
    await expect(login.error).toHaveText(LOCKED);
    await capture(page, '04-akun-terkunci');

    const failures = (await superAdmin.audit.listRecent('login_failed')).filter(
      (e) => e.actor?.email === user.email,
    );
    expect(failures.map((e) => e.details.reason)).toEqual([
      'locked',
      ...Array(5).fill('invalid_password'),
    ]);
  });

  test('TC-AUTH-05 keluar lalu tombol Back meminta login lagi', async ({ page, loginAs }) => {
    await loginAs('editor');
    await page.goto('/locations');
    await expect(page.getByRole('heading', { name: 'Lokasi' })).toBeVisible();
    const shell = new AdminShell(page);
    await shell.accountButton(ACCOUNTS.editor.name).click();
    await capture(page, '05-menu-akun');
    await page.keyboard.press('Escape');
    await shell.signOut(ACCOUNTS.editor.name);
    await expect(page).toHaveURL(/\/login$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/login$/);
    await expect(new LoginPage(page).submit).toBeVisible();
    await capture(page, '06-back-setelah-keluar');
  });

  test('TC-AUTH-06/07/40/41 lupa password lewat Mailpit; tautan sekali pakai', async ({
    page,
    superAdmin,
  }) => {
    const user = await inviteUser(superAdmin, 'reset');
    const login = new LoginPage(page);
    await login.goto();
    await page.getByRole('link', { name: 'Lupa password?' }).click();
    await expect(page).toHaveURL(/\/forgot-password$/);
    await capture(page, '07-lupa-password');

    // Email tidak terdaftar mendapat pesan yang sama.
    await page.getByLabel('Email').fill('tidak-ada@e2e.test');
    await page.getByRole('button', { name: 'Kirim tautan reset' }).click();
    await expect(page.getByRole('status')).toContainText('Jika tidak-ada@e2e.test terdaftar');

    // Dua permintaan: hanya tautan terakhir yang berlaku.
    // Email pertama untuk alamat ini adalah undangan.
    const requestReset = async (expectedMails: number) => {
      await page.goto('/forgot-password');
      await page.getByLabel('Email').fill(user.email);
      await page.getByRole('button', { name: 'Kirim tautan reset' }).click();
      await expect(page.getByRole('status')).toContainText(`Jika ${user.email} terdaftar`);
      return waitForMail(user.email, expectedMails);
    };
    const first = await requestReset(2);
    const mail = await requestReset(3);
    await capture(page, '08-tautan-terkirim');
    expect(mail.subject).toBe('Atur ulang password Admin Indoor Map');
    expect(mail.link).not.toBe(first.link);

    await page.goto(mail.link);
    await expect(page).toHaveURL(/\/reset-password/);
    const password = page.getByLabel('Password baru', { exact: true });
    await password.fill('pendek7');
    await page.getByLabel('Ulangi password baru').fill('pendek7');
    await page.getByRole('button', { name: 'Simpan password' }).click();
    expect(await validity(password, 'tooShort')).toBe(true);

    await password.fill('Baru-2026-ok');
    await page.getByLabel('Ulangi password baru').fill('Baru-2026-beda');
    await page.getByRole('button', { name: 'Simpan password' }).click();
    await expect(page.getByRole('alert')).toHaveText('Konfirmasi password tidak sama.');
    await capture(page, '09-konfirmasi-beda');

    await page.getByLabel('Ulangi password baru').fill('Baru-2026-ok');
    await page.getByRole('button', { name: 'Simpan password' }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('status')).toHaveText(
      'Password berhasil diubah. Masuk dengan password baru.',
    );
    await capture(page, '10-password-diubah');

    // Password lama tidak berlaku, yang baru berlaku.
    await login.signIn(user.email, user.password);
    await expect(login.error).toHaveText(WRONG);
    await login.signIn(user.email, 'Baru-2026-ok');
    await expect(page).not.toHaveURL(/\/login/);
    await new AdminShell(page).signOut(user.fullName);

    // Tautan yang sudah dipakai, dan tautan sebelumnya, ditolak.
    for (const link of [mail.link, first.link]) {
      await page.goto(link);
      await expect(page.getByRole('alert')).toHaveText(
        'Tautan reset tidak berlaku: sudah dipakai atau lebih dari 1 jam. Minta tautan baru.',
      );
    }
    await expect(page.getByRole('link', { name: 'Minta tautan reset baru' })).toBeVisible();
    await capture(page, '11-tautan-sudah-dipakai');
  });

  test('TC-AUTH-04 60 menit tanpa aktivitas keluar otomatis', async ({ page, loginAs }) => {
    await page.clock.install();
    await loginAs('viewer');
    await expect(page).toHaveURL('/venues');

    // 59 menit: masih masuk.
    await page.clock.fastForward('59:00');
    await expect(page.getByRole('heading', { name: 'Venue' })).toBeVisible();
    await expect(page).toHaveURL('/venues');

    await page.clock.fastForward('02:00');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('status')).toHaveText(
      'Sesi berakhir karena tidak ada aktivitas selama 60 menit. Silakan masuk lagi.',
    );
    await capture(page, '12-sesi-idle');
  });
});
