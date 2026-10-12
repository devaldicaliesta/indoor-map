import { expect, test } from '../../../fixtures';
import { sql } from '../../../support/license';

// T-613: alamat pendek `/v/<slug>` (trial `app.panduarah.my.id/v/<slug>`, demo publik `/v/demo`).
// Penunjuk `snapshots/slugs/{slug}.json` ditulis saat publish, jadi slug diisi lalu diterbitkan ulang.
test.describe('T-613 Alamat pendek venue', () => {
  test('TC-HT-07 /v/<slug> membuka peta venue, parameter tautan tetap berlaku', async ({
    page,
    publishedVenue,
    superAdmin,
  }) => {
    const { id } = publishedVenue.venue;
    const slug = `uji-${id.slice(0, 8)}`;
    sql(`update public.venues set slug = '${slug}' where id = '${id}'`);
    await superAdmin.publications.publish(id);

    await page.goto(`/v/${slug}?lang=en`);
    await expect(page.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    // `lang=en` dari tautan dipakai: parameter dibaca dengan id venue hasil penunjuk.
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.getByRole('searchbox', { name: 'Search locations' }).fill('radiologi');
    await expect(page.getByText('1 result', { exact: true })).toBeVisible();
  });

  test('slug yang tidak dikenal menampilkan "Peta belum tersedia"', async ({ page }) => {
    await page.goto('/v/slug-yang-tidak-ada');
    await expect(page.getByText('Peta belum tersedia')).toBeVisible();
  });
});
