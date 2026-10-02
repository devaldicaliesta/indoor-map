import type { Browser, Page } from '@playwright/test';
import { ACCOUNTS } from '../../../accounts';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';
import { LoginPage } from '../../../pages/login-page';

const shot = (name: string) => `evidence/T-301/${name}.png`;

/** Pengguna kedua/ketiga di browser terpisah, sudah di Editor Peta venue itu. */
async function openEditorAs(
  browser: Browser,
  role: 'admin' | 'super_admin',
  venueName: string,
): Promise<Page> {
  const context = await browser.newContext();
  const page = await context.newPage();
  const login = new LoginPage(page);
  await login.goto();
  await login.signIn(ACCOUNTS[role].email, env.password);
  await expect(page).not.toHaveURL(/\/login/);
  await new AdminShell(page).selectVenue(venueName);
  await new EditorPage(page).goto();
  return page;
}

test.describe('T-301 Kunci edit per lantai', () => {
  test('pengguna kedua baca saja; Super Admin ambil alih; pemegang lama jadi baca saja', async ({
    page,
    browser,
    loginAs,
    testVenue,
  }) => {
    const { venue } = testVenue;
    const banner = (p: Page) => p.getByRole('status').filter({ hasText: /Sedang diedit oleh/ });

    // Editor memegang kunci lantai GF; jamnya palsu agar heartbeat bisa dimajukan.
    await page.clock.install();
    await loginAs('editor');
    await new AdminShell(page).selectVenue(venue.name);
    const editor = new EditorPage(page);
    await editor.goto();
    await expect(editor.tool('Poligon')).toBeEnabled();
    await expect(banner(page)).toHaveCount(0);

    // Admin di lantai yang sama: baca saja, tanpa tombol ambil alih.
    const admin = await openEditorAs(browser, 'admin', venue.name);
    await expect(banner(admin)).toContainText('Editor Lokal');
    await expect(new EditorPage(admin).tool('Poligon')).toBeDisabled();
    await expect(admin.getByRole('button', { name: 'Ambil alih kunci' })).toHaveCount(0);
    await admin.screenshot({ path: shot('01-admin-baca-saja') });

    // Super Admin mengambil alih.
    const superAdminPage = await openEditorAs(browser, 'super_admin', venue.name);
    await expect(banner(superAdminPage)).toContainText('Editor Lokal');
    await superAdminPage.screenshot({ path: shot('02-super-admin-sebelum') });
    await superAdminPage.getByRole('button', { name: 'Ambil alih kunci' }).click();
    await expect(banner(superAdminPage)).toHaveCount(0);
    await expect(new EditorPage(superAdminPage).tool('Poligon')).toBeEnabled();
    await superAdminPage.screenshot({ path: shot('03-super-admin-memegang') });

    // Heartbeat berikutnya di sisi Editor: kini baca saja, pemegang Super Admin.
    await page.clock.fastForward('01:05');
    await expect(banner(page)).toContainText('Super Admin Lokal', { timeout: 15_000 });
    await expect(editor.tool('Poligon')).toBeDisabled();
    await expect(page.getByText('Belum ada fitur di lantai ini.')).toBeVisible();
    await page.screenshot({ path: shot('04-editor-kehilangan-kunci') });

    await admin.context().close();
    await superAdminPage.context().close();
  });
});
