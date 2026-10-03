import { randomUUID } from 'node:crypto';
import { expect, test } from '../../../fixtures';
import { VisitorPage } from '../../../pages/visitor-page';

const shot = (name: string) => `evidence/T-002/${name}.png`;

test.describe('T-002 Scaffold Visitor', () => {
  test('route /, /v/:venueId, /ip/:code, id salah, 404, port 5174', async ({
    page,
    publishedVenue,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto('/');
    expect(new URL(page.url()).port).toBe('5174');
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(page.getByText(/Pindai QR titik asal/)).toBeInViewport();
    await page.screenshot({ path: shot('04-visitor-beranda'), fullPage: true });

    const visitor = new VisitorPage(page);
    await visitor.goto(publishedVenue.venue.id);
    await page.screenshot({ path: shot('05-visitor-venue') });

    await page.goto('/v/bukan-uuid');
    await expect(page.getByText('Peta belum tersedia')).toBeVisible();
    await page.goto(`/v/${randomUUID()}`);
    await expect(page.getByText('Peta belum tersedia')).toBeVisible();
    await expect(page.getByText(/Tanyakan ke petugas/)).toBeInViewport();
    await page.screenshot({ path: shot('06-visitor-venue-tidak-ada') });

    // Tanpa venue di URL, layar Info Point tidak bisa dimuat (mode lengkapnya di T-408).
    await page.goto('/ip/IP-LOBI');
    await expect(page.getByText('Info Point tidak ditemukan')).toBeVisible();
    await page.screenshot({ path: shot('07-info-point-tanpa-venue') });

    await page.goto('/halaman-yang-tidak-ada');
    await expect(page.getByText('Halaman tidak ditemukan')).toBeVisible();
    // Arahan dan tombol harus terlihat tanpa menarik sheet.
    await expect(page.getByRole('link', { name: 'Ke beranda' })).toBeInViewport();
    await expect(page.getByText(/Unexpected Application Error/)).toHaveCount(0);
    await page.screenshot({ path: shot('08-visitor-404') });
    await page.getByRole('link', { name: 'Ke beranda' }).click();
    await expect(page).toHaveURL(/:5174\/$/);
    expect(errors).toEqual([]);
  });
});
