import { expect, test } from '../../fixtures';

test.describe('Bahasa Visitor', () => {
  test.use({ locale: 'en-US' });

  test('perangkat berbahasa Inggris membuka Visitor dalam bahasa Inggris; pilihan manual diingat', async ({
    page,
    publishedVenue,
  }) => {
    await page.goto(`/v/${publishedVenue.venue.id}`);
    const map = page.getByTestId('venue-map');
    await expect(map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('searchbox', { name: 'Search locations' })).toBeVisible();
    // Kanvas MapLibre berlabel "Map" bawaan; Visitor menggantinya sesuai bahasa.
    const canvas = page.getByRole('region', { name: /^Floor map/ });
    await expect(canvas).toBeVisible();
    await page.getByRole('searchbox', { name: 'Search locations' }).fill('radilogi');
    await expect(page.getByText('1 result', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Bahasa Indonesia' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(page.getByText('1 hasil', { exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: /^Peta lantai/ })).toBeVisible();

    await page.reload();
    await expect(map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(page.getByRole('searchbox', { name: 'Cari lokasi' })).toBeVisible();
  });
});
