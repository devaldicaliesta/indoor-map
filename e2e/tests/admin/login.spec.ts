import type { AppRole } from '@indoor/domain';
import { ACCOUNTS } from '../../accounts';
import { env } from '../../env';
import { expect, test } from '../../fixtures';
import { AdminShell } from '../../pages/admin-shell';
import { LoginPage } from '../../pages/login-page';

// Beranda = menu pertama yang boleh diubah role itu, atau dibaca bila tidak ada.
const HOME: Record<AppRole, string> = {
  super_admin: '/venues',
  admin: '/venues',
  editor: '/map-editor',
  operator: '/closures',
  viewer: '/venues',
};

test.describe('Login Admin', () => {
  for (const [role, home] of Object.entries(HOME) as [AppRole, string][]) {
    test(`${role} masuk ke ${home} lalu keluar`, async ({ page, loginAs }) => {
      await loginAs(role);
      await expect(page).toHaveURL(home);

      const shell = new AdminShell(page);
      await expect(shell.accountButton(ACCOUNTS[role].name)).toBeVisible();
      await shell.signOut(ACCOUNTS[role].name);

      // Sesi benar-benar berakhir: halaman Admin kembali meminta login.
      await page.goto(home);
      await expect(page).toHaveURL(/\/login$/);
    });
  }

  test('password salah ditolak dengan pesan yang jelas', async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.signIn(ACCOUNTS.editor.email, `${env.password}-salah`);

    await expect(login.error).toHaveText('Email atau password salah.');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('halaman Admin tanpa sesi diarahkan ke login lalu kembali setelah masuk', async ({
    page,
  }) => {
    await page.goto('/map-editor');
    await expect(page).toHaveURL(/\/login$/);

    const login = new LoginPage(page);
    await login.signIn(ACCOUNTS.super_admin.email, env.password);
    await expect(page).toHaveURL('/map-editor');
  });
});
