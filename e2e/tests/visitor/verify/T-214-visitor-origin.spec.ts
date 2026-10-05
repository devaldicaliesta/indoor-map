import type { Venue } from '@indoor/domain';
import { expect, test } from '../../../fixtures';
import { VisitorPage } from '../../../pages/visitor-page';

const shot = (name: string) => `evidence/T-214/${name}.png`;

test.describe('T-214 Visitor: titik asal', () => {
  test('pilih "Anda di sini" lewat daftar (Saya di sini), ketuk peta, dan QR', async ({
    page,
    fullVenue,
    superAdmin,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    await superAdmin.publications.publish(venueId);
    const snapshot = await superAdmin.snapshots.latest(venueId);
    const visitor = new VisitorPage(page);
    await visitor.goto(venueId);
    const route = page.getByRole('region', { name: 'Rute' });
    const from = route.getByRole('definition').first();

    // Tujuan dulu, lalu asal dicari dan dipilih dengan "Saya di sini".
    await visitor.search.fill('radiologi');
    await visitor.results.filter({ hasText: 'Radiologi' }).first().click();
    await visitor.profile.getByRole('button', { name: 'Rute ke sini' }).click();
    await expect(page.getByRole('heading', { name: 'Anda sedang di mana?' })).toBeVisible();
    await page.screenshot({ path: shot('01-pilih-asal') });
    await visitor.search.fill('GF-B08');
    await visitor.results.filter({ hasText: 'GF-B08' }).first().click();
    await visitor.profile.getByRole('button', { name: 'Saya di sini' }).click();
    await expect(from).toHaveText('GF-B08');
    await expect(route.getByRole('definition').nth(2)).toHaveText('Radiologi');
    await expect(route.getByRole('list', { name: 'Langkah rute' })).toBeVisible();
    await page.screenshot({ path: shot('02-asal-dari-daftar') });

    // Ganti asal dengan mengetuk peta.
    await route.getByRole('button', { name: 'Ganti' }).click();
    await page.getByRole('button', { name: 'Ketuk di peta' }).click();
    await expect(page.getByText('Ketuk posisi Anda di peta.')).toBeVisible();
    await visitor.tapFocusedPoint();
    await expect(from).toHaveText('Titik di peta');
    await expect(route.getByRole('list', { name: 'Langkah rute' })).toBeVisible();
    await page.screenshot({ path: shot('03-asal-ketuk-peta') });

    // QR titik asal milik fixture.
    const qr = snapshot.originPoints.find((p) => p.name === 'Lobi Utama');
    if (!qr) throw new Error('Lobi Utama tidak ada di snapshot');
    await page.goto(`/v/${venueId}?o=${qr.code}`);
    await expect(visitor.map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
    await expect(page.getByText(/Anda di sini/)).toBeVisible();
    await expect(page.getByText('Lobi Utama', { exact: true })).toBeVisible();
    await page.screenshot({ path: shot('04-asal-qr') });
  });
});
