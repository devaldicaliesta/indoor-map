import type { Venue } from '@indoor/domain';
import type { Browser, Page } from '@playwright/test';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';

const shot = (name: string) => `evidence/T-115/${name}.png`;

/** Membuka Visitor HP untuk venue itu dan mengembalikan gambar kanvas saat kamera diam. */
async function visitorCanvas(browser: Browser, venueId: string, name: string, force3d: boolean) {
  const page: Page = await browser.newPage({
    viewport: { width: 360, height: 740 },
    isMobile: true,
    hasTouch: true,
  });
  try {
    await page.goto(`${env.visitorUrl}/v/${venueId}`);
    const map = page.getByTestId('venue-map');
    await expect(map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
    const mode3d = page.getByRole('button', { name: '3D', exact: true });
    if (force3d) await mode3d.click();
    await expect(map).toHaveAttribute('data-camera', 'idle');
    const pressed = await mode3d.getAttribute('aria-pressed');
    await page.screenshot({ path: shot(name) });
    return { image: await map.locator('canvas').first().screenshot(), is3d: pressed === 'true' };
  } finally {
    await page.close();
  }
}

test.describe('T-115 Tampilan 2D/3D', () => {
  test('tinggi per jenis dan mode awal 3D dari Pengaturan berlaku di Visitor setelah publish', async ({
    page,
    browser,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    await superAdmin.publications.publish(venueId);
    const before = await visitorCanvas(browser, venueId, '01-visitor-3d-bawaan', true);
    expect(before.is3d).toBe(true);

    await loginAs('admin');
    await new AdminShell(page).selectVenue(fullVenue.name);
    await page.goto('/settings');
    await page.getByRole('tab', { name: 'Tampilan' }).click();
    const unitHeight = page.locator('#height-unit');
    await expect(unitHeight).toBeVisible();

    // Validasi: tinggi negatif ditolak.
    await unitHeight.fill('-3');
    await page.getByRole('button', { name: 'Simpan tampilan' }).click();
    await expect(page.locator('#height-unit-error')).toBeVisible();
    await page.screenshot({ path: shot('06-error-tinggi'), fullPage: true });

    await unitHeight.fill('12');
    await page.getByRole('radio', { name: '3D' }).check();
    await page.getByRole('button', { name: 'Simpan tampilan' }).click();
    await expect(page.getByText('Tampilan disimpan')).toBeVisible();
    await page.screenshot({ path: shot('02-pengaturan-tersimpan'), fullPage: true });
    const settings = await superAdmin.displaySettings.get(venueId);
    expect(settings.defaultMode).toBe('3d');
    expect(settings.heights.unit).toBe(12);

    // Editor Peta Admin: 3D berubah dari 2D.
    await page.goto('/map-editor');
    const editor = new EditorPage(page);
    await editor.waitReady();
    const canvas = editor.canvas.locator('canvas').first();
    const flat = await canvas.screenshot();
    await page.getByRole('button', { name: '3D', exact: true }).click();
    await expect.poll(async () => (await canvas.screenshot()).equals(flat)).toBe(false);
    await page.screenshot({ path: shot('03-admin-editor-3d') });

    // Setelah publish: Visitor langsung 3D (tanpa menekan tombol) dan unit lebih tinggi.
    await superAdmin.publications.publish(venueId);
    // Snapshot terbit memuat tinggi baru (yang dibaca Visitor untuk fill-extrusion).
    const published = await superAdmin.snapshots.latest(venueId);
    expect(published.venue.display.heights.unit).toBe(12);
    expect(published.venue.display.defaultMode).toBe('3d');
    const after = await visitorCanvas(browser, venueId, '04-visitor-3d-unit-12m', false);
    // Mode awal 3D tanpa menekan tombol. Gambar tidak dibandingkan dengan `before` karena kamera
    // awal 3D dan 3D hasil klik bisa berbeda; tinggi dibuktikan lewat snapshot di atas.
    expect(after.is3d).toBe(true);
  });
});
