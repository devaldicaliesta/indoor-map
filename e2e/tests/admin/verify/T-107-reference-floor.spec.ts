import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';

const shot = (name: string) => `evidence/T-107/${name}.png`;

test.describe('T-107 Lapisan acuan lantai lain', () => {
  test('acuan GF tampil samar di L1 dan tidak ikut disunting', async ({
    page,
    loginAs,
    fullVenue,
  }) => {
    await loginAs('editor');
    await new AdminShell(page).selectVenue(fullVenue.name);
    const map = page.getByTestId('editor-map');
    await expect(map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
    await page.getByRole('radio', { name: 'L1', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Fitur L1' })).toBeVisible();
    await expect(map).toHaveAttribute('data-ready', 'true');
    const status = page.getByText(/^\d+ fitur$/);
    const countL1 = await status.textContent();
    const canvas = map.locator('canvas').first();
    const without = await canvas.screenshot();
    await page.screenshot({ path: shot('01-l1-tanpa-acuan') });

    await page.getByRole('combobox', { name: 'Tampilkan lantai lain' }).click();
    await page.getByRole('option', { name: 'Acuan: Lantai GF' }).click();
    await expect(page.getByRole('combobox', { name: 'Tampilkan lantai lain' })).toHaveText(
      'Acuan: Lantai GF',
    );
    await expect.poll(async () => (await canvas.screenshot()).equals(without)).toBe(false);
    await page.screenshot({ path: shot('02-l1-dengan-acuan-gf') });

    // Tidak bisa disunting: daftar fitur dan hitungan tetap milik L1.
    await expect(status).toHaveText(countL1 ?? '');
    await expect(page.getByRole('heading', { name: 'Fitur L1' })).toBeVisible();
    // Lantai acuan tidak ditawarkan untuk lantai yang sedang dibuka.
    await page.getByRole('combobox', { name: 'Tampilkan lantai lain' }).click();
    await expect(page.getByRole('option', { name: 'Acuan: Lantai L1' })).toHaveCount(0);
    await page.getByRole('option', { name: 'Tanpa lantai acuan' }).click();
    await expect.poll(async () => (await canvas.screenshot()).equals(without)).toBe(true);
  });
});
