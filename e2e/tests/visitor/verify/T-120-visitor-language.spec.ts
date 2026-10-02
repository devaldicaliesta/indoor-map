import type { Venue } from '@indoor/domain';
import { expect, test } from '../../../fixtures';
import { VisitorPage } from '../../../pages/visitor-page';

const shot = (name: string) => `evidence/T-120/${name}.png`;

test.describe('T-120 Visitor: bahasa ID/EN', () => {
  test('ganti bahasa tanpa memuat ulang, diingat, tautan ?lang=en, detail lokasi ikut berganti', async ({
    page,
    fullVenue,
    superAdmin,
  }) => {
    await superAdmin.publications.publish(fullVenue.venueId as Venue['id']);
    const visitor = new VisitorPage(page);
    await visitor.goto(fullVenue.venueId);
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await visitor.search.fill('radiologi');
    await visitor.results.filter({ hasText: 'Radiologi' }).first().click();
    await expect(visitor.profile.getByRole('button', { name: 'Rute ke sini' })).toBeVisible();
    await page.screenshot({ path: shot('01-detail-id') });

    // Ganti ke English: teks UI dan detail berganti tanpa navigasi.
    let navigations = 0;
    page.on('framenavigated', (f) => {
      if (f === page.mainFrame()) navigations += 1;
    });
    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(visitor.profile.getByRole('button', { name: 'Directions to here' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ubah tinggi panel' })).toHaveCount(0);
    expect(navigations).toBe(0);
    await page.screenshot({ path: shot('02-detail-en') });

    // Diingat setelah muat ulang.
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    // Tautan berbahasa membuka bahasa itu walau pilihan tersimpan berbeda.
    await page.getByRole('button', { name: 'Bahasa Indonesia' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await page.goto(`/v/${fullVenue.venueId}?lang=en`);
    await expect(visitor.map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('searchbox', { name: 'Search locations' })).toBeVisible();
    await page.screenshot({ path: shot('03-tautan-lang-en') });
  });
});
