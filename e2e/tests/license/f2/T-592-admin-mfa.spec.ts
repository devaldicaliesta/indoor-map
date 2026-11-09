import { totpCode } from '@indoor/data/testing/totp';
import type { Browser, Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { DataTablePage } from '../../../pages/data-table';
import { LoginPage } from '../../../pages/login-page';
import { type InvitedUser, inviteUser } from '../../../support/auth-users';
import { sql } from '../../../support/license';

const shot = (name: string) => `evidence/T-592/${name}.png`;

// Kewajiban 2FA berlaku untuk semua pengguna role itu, jadi spec ini ikut proyek serial yang
// berjalan setelah proyek lain (akun seed Editor tidak boleh terkunci di tengah test paralel).
test.describe.configure({ mode: 'serial' });

async function capture(page: Page, name: string) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await page.screenshot({ path: shot(name), fullPage: true });
}

async function signInAs(browser: Browser, user: InvitedUser): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  const login = new LoginPage(page);
  await login.goto();
  await login.signIn(user.email, user.password);
  return page;
}

/** Layar pendaftaran: kunci rahasia dari halaman, kode salah ditolak, lalu kode benar. */
async function enroll(page: Page, evidence?: string): Promise<{ secret: string; codes: string[] }> {
  await expect(page.getByRole('heading', { name: 'Pasang verifikasi dua langkah' })).toBeVisible();
  await expect(page.getByAltText('QR untuk aplikasi autentikator')).toBeVisible();
  const secret = (await page.getByTestId('totp-secret').textContent()) ?? '';
  if (evidence) await capture(page, evidence);
  await page.getByLabel('Kode 6 digit').fill('000000');
  await page.getByRole('button', { name: 'Aktifkan' }).click();
  await expect(page.getByRole('alert')).toContainText('Kode salah');
  await page.getByLabel('Kode 6 digit').fill(totpCode(secret));
  await page.getByRole('button', { name: 'Aktifkan' }).click();
  await expect(page.getByRole('heading', { name: 'Simpan kode cadangan' })).toBeVisible();
  const codes = await page.getByTestId('recovery-code').allTextContents();
  expect(codes).toHaveLength(10);
  return { secret, codes };
}

test.describe('T-592a Verifikasi dua langkah Admin', () => {
  let user: InvitedUser;

  test.beforeAll(async () => {
    sql(`update public.system_settings set mfa_required_roles = '{}' where id`);
  });
  test.afterAll(() => {
    sql(`update public.system_settings set mfa_required_roles = '{}' where id`);
  });

  test('TC-OPS-06: 2FA wajib untuk role, kode salah ditolak, kode cadangan hanya sekali', async ({
    page,
    browser,
    loginAs,
    superAdmin,
  }) => {
    test.setTimeout(180_000);
    user = await inviteUser(superAdmin, 't592', 'editor');

    // ---- Super Admin mewajibkan 2FA untuk Editor ----
    await loginAs('super_admin');
    await page.goto('/settings?tab=system');
    const editorBox = page.getByRole('checkbox', { name: 'Editor' });
    await editorBox.check();
    await capture(page, '01-pengaturan-wajib-2fa');
    await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
    await expect(page.getByText('Pengaturan sistem tersimpan')).toBeVisible();
    // Super Admin tanpa 2FA tidak bisa mewajibkan role-nya sendiri.
    await page.getByRole('checkbox', { name: 'Super Admin' }).check();
    await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
    await expect(page.getByText('Aktifkan verifikasi dua langkah untuk akun Anda')).toBeVisible();

    // ---- Editor: password saja tidak membuka Admin; pasang aplikasi autentikator ----
    const editor = await signInAs(browser, user);
    const first = await enroll(editor, '02-pasang-2fa');
    await capture(editor, '03-kode-cadangan');
    await editor.getByRole('button', { name: 'Sudah saya simpan' }).click();
    await expect(editor.getByRole('button', { name: new RegExp(user.fullName) })).toBeVisible();

    // ---- Masuk berikutnya: kode salah ditolak, data tidak terbuka tanpa kode ----
    const again = await signInAs(browser, user);
    await expect(again.getByRole('heading', { name: 'Verifikasi dua langkah' })).toBeVisible();
    await again.getByLabel('Kode 6 digit').fill('000000');
    await again.getByRole('button', { name: 'Verifikasi' }).click();
    await expect(again.getByRole('alert')).toContainText('Kode salah');
    await capture(again, '04-kode-salah');
    await again.goto('/venues');
    await expect(again.getByRole('heading', { name: 'Verifikasi dua langkah' })).toBeVisible();

    // ---- Ponsel hilang: kode cadangan melepas aplikasi lama, lalu pasang aplikasi baru ----
    await again.getByRole('button', { name: 'Ponsel hilang? Pakai kode cadangan' }).click();
    await again.getByLabel('Kode cadangan').fill(first.codes[0] ?? '');
    await again.getByRole('button', { name: 'Pakai kode cadangan' }).click();
    const second = await enroll(again);
    await again.getByRole('button', { name: 'Sudah saya simpan' }).click();
    await expect(again.getByRole('button', { name: new RegExp(user.fullName) })).toBeVisible();

    // ---- Kode cadangan yang sudah dipakai ditolak; kode aplikasi baru diterima ----
    const third = await signInAs(browser, user);
    await third.getByRole('button', { name: 'Ponsel hilang? Pakai kode cadangan' }).click();
    await third.getByLabel('Kode cadangan').fill(first.codes[0] ?? '');
    await third.getByRole('button', { name: 'Pakai kode cadangan' }).click();
    await expect(third.getByRole('alert')).toContainText('sudah pernah dipakai');
    await capture(third, '05-kode-cadangan-ditolak');
    await third.getByRole('button', { name: 'Pakai kode dari aplikasi' }).click();
    await third.getByLabel('Kode 6 digit').fill(totpCode(second.secret));
    await third.getByRole('button', { name: 'Verifikasi' }).click();
    await expect(third.getByRole('button', { name: new RegExp(user.fullName) })).toBeVisible();

    // ---- Keamanan akun: 2FA wajib tidak bisa dimatikan sendiri ----
    await third.getByRole('button', { name: new RegExp(user.fullName) }).click();
    await third.getByRole('menuitem', { name: 'Keamanan akun' }).click();
    const dialog = third.getByRole('dialog', { name: 'Keamanan akun' });
    await expect(dialog).toContainText('Verifikasi dua langkah aktif');
    await expect(dialog).toContainText('Wajib untuk role Anda');
    await expect(dialog).toContainText('Sisa kode cadangan: 10 dari 10');
    await expect(dialog.getByRole('button', { name: 'Matikan' })).toHaveCount(0);
    await capture(third, '06-keamanan-akun');
  });

  test('TC-OPS-07: Super Admin mereset 2FA pengguna dan tercatat di audit', async ({
    page,
    browser,
    loginAs,
  }) => {
    test.setTimeout(120_000);
    await loginAs('super_admin');
    await page.goto('/users');
    const users = new DataTablePage(page, 'Pengguna');
    await users.ready();
    await users.searchFor(user.email);
    await users.expectTotal(1);
    await expect(page.getByRole('row', { name: new RegExp(user.email) })).toContainText('Aktif');

    await page.getByRole('button', { name: `Aksi data akun ${user.fullName}` }).click();
    await page.getByRole('menuitem', { name: 'Reset verifikasi dua langkah…' }).click();
    const dialog = page.getByRole('dialog', {
      name: `Reset verifikasi dua langkah ${user.fullName}?`,
    });
    await capture(page, '07-konfirmasi-reset');
    await dialog.getByRole('button', { name: 'Reset 2FA' }).click();
    await expect(page.getByText(`Verifikasi dua langkah ${user.fullName} direset`)).toBeVisible();

    await page.goto('/settings?tab=audit');
    const row = page.getByRole('row', { name: /2FA direset/ }).first();
    await expect(row).toContainText(user.fullName);
    await capture(page, '08-log-audit-reset');

    // Masuk berikutnya: aplikasi lama tidak berlaku, role wajib → pasang aplikasi baru.
    const editor = await signInAs(browser, user);
    await enroll(editor);
  });
});
