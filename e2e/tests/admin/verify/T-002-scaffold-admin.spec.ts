import { expect, test } from '../../../fixtures';

const shot = (name: string) => `evidence/T-002/${name}.png`;

test.describe('T-002 Scaffold Admin', () => {
  test('route /login, / (perlu login), 404, port 5173, tanpa galat console', async ({
    page,
    loginAs,
  }) => {
    const errors: string[] = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/login');
    expect(new URL(page.url()).port).toBe('5173');
    await expect(page).toHaveTitle('Admin · Indoor Map');
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible();
    await page.screenshot({ path: shot('01-admin-login'), fullPage: true });

    // Route terlindungi tanpa sesi diarahkan ke login.
    await page.goto('/');
    await expect(page).toHaveURL(/\/login$/);

    await loginAs('admin');
    await expect(page).toHaveURL('/venues');
    await page.screenshot({ path: shot('02-admin-beranda'), fullPage: true });

    await page.goto('/halaman-yang-tidak-ada');
    await expect(page.getByText(/tidak ditemukan/i).first()).toBeVisible();
    await page.screenshot({ path: shot('03-admin-404'), fullPage: true });

    // Aset contoh Vite sudah dihapus.
    expect((await page.request.get('/vite.svg')).headers()['content-type']).not.toContain('svg');
    expect(errors).toEqual([]);
  });
});
