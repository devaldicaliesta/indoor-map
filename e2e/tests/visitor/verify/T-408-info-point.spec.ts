import type { Venue } from '@indoor/domain';
import type { Page } from '@playwright/test';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { sql } from '../../../support/license';

const shot = (name: string) => `evidence/T-408/${name}.png`;

async function typeOnScreen(page: Page, text: string) {
  const keyboard = page.getByRole('group', { name: /keyboard/i });
  for (const letter of text) {
    await keyboard.getByRole('button', { name: letter, exact: true }).click();
  }
}

test.describe('T-408 Mode Info Point', () => {
  test('layar potret/lanskap, keyboard di layar, idle, paksa 2D', async ({
    browser,
    superAdmin,
    fullVenue,
  }) => {
    test.setTimeout(120_000);
    const venueId = fullVenue.venueId as Venue['id'];
    const infoPointId = fullVenue.ids.lobbyInfoPoint;
    // Idle tercepat yang diizinkan dan bahasa bawaan EN agar pemulihan bahasa terlihat.
    sql(`update public.info_points set idle_seconds = 15, default_language = 'en'
         where id = '${infoPointId}'`);
    await superAdmin.publications.publish(venueId);
    const code = sql(`select code from public.info_points where id = '${infoPointId}'`);
    const url = `${env.visitorUrl}/ip/${code}?venue=${venueId}`;

    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, hasTouch: true });
    await page.goto(url);
    const map = page.getByTestId('venue-map');
    await expect(map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
    await expect(page.locator('html')).toHaveAttribute('data-surface', 'info-point');
    await expect(page.getByRole('button', { name: 'Change' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: '3D', exact: true })).toBeVisible();

    // Pencarian seluruhnya lewat keyboard di layar; keyboard OS tidak dimunculkan.
    const search = page.getByRole('searchbox');
    await expect(search).toHaveAttribute('inputmode', 'none');
    await search.click();
    await typeOnScreen(page, 'RADIO');
    await expect(search).toHaveValue('RADIO');
    await page.screenshot({ path: shot('01-potret-keyboard') });
    await page
      .getByRole('group', { name: /keyboard/i })
      .getByRole('button', { name: /Search|Cari/ })
      .click();
    await expect(page.locator('article')).toContainText('Radiologi');

    // Pengunjung mengganti bahasa; setelah 15 detik tanpa sentuhan semuanya kembali.
    await page.locator('button[lang="id"]').click();
    await expect(page.getByRole('searchbox', { name: 'Cari lokasi' })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Search locations' })).toBeVisible({
      timeout: 25_000,
    });
    await expect(page.locator('article')).toHaveCount(0);
    await expect(page.getByRole('searchbox')).toHaveValue('');
    await page.screenshot({ path: shot('02-setelah-idle') });
    await page.close();

    // Lanskap 1920 × 1080 dan paksa 2D.
    sql(`update public.info_points set force_2d = true where id = '${infoPointId}'`);
    await superAdmin.publications.publish(venueId);
    const wide = await browser.newPage({ viewport: { width: 1920, height: 1080 }, hasTouch: true });
    await wide.goto(url);
    await expect(wide.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    await expect(wide.getByRole('button', { name: '3D', exact: true })).toHaveCount(0);
    await wide.screenshot({ path: shot('03-lanskap-paksa-2d') });
    await wide.close();
  });
});
