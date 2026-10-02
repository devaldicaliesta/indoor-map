import type { Venue } from '@indoor/domain';
import type { Locator, Page } from '@playwright/test';
import { ACCOUNTS } from '../../../accounts';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { LoginPage } from '../../../pages/login-page';
import { VisitorPage } from '../../../pages/visitor-page';

const shot = (name: string) => `evidence/T-104/${name}.png`;

async function idle(map: Locator) {
  await expect(map).toHaveAttribute('data-camera', 'idle');
}

/** Gambar peta saat kamera diam; dipakai untuk membuktikan tampilan benar-benar berubah. */
async function mapImage(page: Page, map: Locator): Promise<Buffer> {
  await idle(map);
  return page.locator('[data-testid="venue-map"] canvas').first().screenshot();
}

test.describe('T-104 Fondasi peta', () => {
  test('peta tampil; zoom, rotasi + kompas, 2D/3D, kembali ke tampilan awal', async ({
    page,
    fullVenue,
    superAdmin,
  }) => {
    await superAdmin.publications.publish(fullVenue.venueId as Venue['id']);
    const visitor = new VisitorPage(page);
    await visitor.goto(fullVenue.venueId);
    const map = visitor.map;
    await page.getByRole('button', { name: 'Ubah tinggi panel' }).focus();
    await page.keyboard.press('ArrowDown');
    await idle(map);
    const start = await mapImage(page, map);
    await page.screenshot({ path: shot('01-peta-awal') });

    // Perbesar dan perkecil.
    await page.getByRole('button', { name: 'Perbesar' }).click();
    const zoomed = await mapImage(page, map);
    expect(zoomed.equals(start)).toBe(false);
    await page.screenshot({ path: shot('02-diperbesar') });
    await page.getByRole('button', { name: 'Perkecil' }).click();
    expect((await mapImage(page, map)).equals(zoomed)).toBe(false);

    // Rotasi lewat keyboard di kanvas; ikon kompas ikut berputar, lalu kembali ke utara.
    const compass = page.getByRole('button', { name: 'Arahkan ke utara' }).locator('svg');
    await map.locator('canvas').first().focus();
    for (let i = 0; i < 3; i++) await page.keyboard.press('Shift+ArrowLeft');
    await idle(map);
    await expect(compass).toHaveAttribute('style', /rotate\(-?[1-9][\d.]*deg\)/);
    await page.screenshot({ path: shot('03-diputar') });
    await page.getByRole('button', { name: 'Arahkan ke utara' }).click();
    await idle(map);
    await expect(compass).toHaveAttribute('style', /rotate\(-?0deg\)/);

    // 3D lalu 2D.
    const mode3d = page.getByRole('button', { name: '3D', exact: true });
    const mode2d = page.getByRole('button', { name: '2D', exact: true });
    await expect(mode2d).toHaveAttribute('aria-pressed', 'true');
    const flat = await mapImage(page, map);
    await mode3d.click();
    await expect(mode3d).toHaveAttribute('aria-pressed', 'true');
    const extruded = await mapImage(page, map);
    expect(extruded.equals(flat)).toBe(false);
    await page.screenshot({ path: shot('04-3d') });
    await mode2d.click();
    await expect(mode2d).toHaveAttribute('aria-pressed', 'true');

    // Geser lalu kembali ke tampilan awal.
    await map.locator('canvas').first().focus();
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowRight');
    const panned = await mapImage(page, map);
    expect(panned.equals(start)).toBe(false);
    await page.getByRole('button', { name: 'Kembali ke tampilan awal' }).click();
    expect((await mapImage(page, map)).equals(panned)).toBe(false);
    await page.screenshot({ path: shot('05-tampilan-awal') });

    // Semua kontrol peta ≥ 44 px.
    for (const name of ['Perbesar', 'Perkecil', 'Arahkan ke utara', 'Kembali ke tampilan awal']) {
      const box = await page.getByRole('button', { name }).boundingBox();
      expect(Math.min(box?.width ?? 0, box?.height ?? 0), name).toBeGreaterThanOrEqual(44);
    }
  });

  test('Admin: kanvas Editor Peta tampil untuk venue lengkap', async ({ browser, fullVenue }) => {
    const context = await browser.newContext({
      baseURL: env.adminUrl,
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    try {
      const login = new LoginPage(page);
      await login.goto();
      await login.signIn(ACCOUNTS.editor.email, env.password);
      await expect(page).toHaveURL('/map-editor');
      await new AdminShell(page).selectVenue(fullVenue.name);
      await expect(page.getByTestId('editor-map')).toHaveAttribute('data-ready', 'true', {
        timeout: 30_000,
      });
      await page.screenshot({ path: shot('06-admin-editor') });
    } finally {
      await context.close();
    }
  });
});
