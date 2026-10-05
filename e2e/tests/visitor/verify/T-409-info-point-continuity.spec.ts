import type { Venue } from '@indoor/domain';
import type { Page } from '@playwright/test';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { sql } from '../../../support/license';

const shot = (name: string) => `evidence/T-409/${name}.png`;

async function searchAndRoute(page: Page, query: string) {
  await page.getByRole('searchbox').click();
  const keyboard = page.getByRole('group', { name: /keyboard/i });
  for (const letter of query) {
    await keyboard.getByRole('button', { name: letter, exact: true }).click();
  }
  await keyboard.getByRole('button', { name: /Cari|Search/ }).click();
  await page.getByRole('button', { name: 'Rute ke sini' }).click();
}

test.describe('T-409 Info Point: lanjutkan di HP, pembaruan, tahan jaringan', () => {
  test('QR rute, versi baru hanya saat idle, tetap jalan tanpa jaringan', async ({
    browser,
    superAdmin,
    fullVenue,
  }) => {
    // Pemeriksaan versi berjalan tiap 5 menit sungguhan (jam tiruan ikut membekukan peta).
    test.setTimeout(600_000);
    const venueId = fullVenue.venueId as Venue['id'];
    const infoPointId = fullVenue.ids.lobbyInfoPoint;
    sql(`update public.info_points set idle_seconds = 15, default_language = 'id'
         where id = '${infoPointId}'`);
    const first = await superAdmin.publications.publish(venueId);
    const code = sql(`select code from public.info_points where id = '${infoPointId}'`);

    const context = await browser.newContext({
      viewport: { width: 1080, height: 1920 },
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto(`${env.visitorUrl}/ip/${code}?venue=${venueId}`);
    await expect(page.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    const screen = page.locator('[data-info-point-code]');
    await expect(screen).toHaveAttribute('data-version', String(first.version));

    // QR Lanjutkan di HP berisi rute yang sama.
    await searchAndRoute(page, 'RADIO');
    const qr = page.getByRole('img', { name: 'QR rute untuk HP' });
    await expect(qr).toBeVisible();
    expect((await qr.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(200);
    await page.screenshot({ path: shot('01-qr-lanjutkan-di-hp') });
    const url = (await qr.getAttribute('data-url')) ?? '';
    expect(url).toContain(`ip=${encodeURIComponent(code)}`);

    // Versi baru terbit: diperiksa tiap 5 menit, tetapi tidak dipasang selama layar dipakai.
    const second = await superAdmin.publications.publish(venueId);
    const until = Date.now() + 5.5 * 60_000;
    while (Date.now() < until) {
      await page.getByRole('heading', { name: 'Lanjutkan di HP' }).click();
      await page.waitForTimeout(10_000);
    }
    await expect(screen).toHaveAttribute('data-version', String(first.version));
    // Tanpa sentuhan selama durasi idle: tampilan kembali ke awal dengan versi baru.
    await expect(screen).toHaveAttribute('data-version', String(second.version), {
      timeout: 25_000,
    });
    await expect(page.getByRole('img', { name: 'QR rute untuk HP' })).toHaveCount(0);

    // QR yang dipindai di HP membuka rute yang sama.
    const phone = await browser.newPage({ viewport: { width: 360, height: 740 }, isMobile: true });
    await phone.goto(url);
    await expect(phone.getByText('Mulai dari Info Point Lobi')).toBeVisible({ timeout: 30_000 });
    await expect(phone.getByText('Radiologi', { exact: true }).first()).toBeVisible();
    await phone.screenshot({ path: shot('02-rute-di-hp') });
    await phone.close();

    // Server terputus: pencarian dan rute tetap berjalan dari versi yang sudah dimuat.
    await context.setOffline(true);
    await searchAndRoute(page, 'RADIO');
    await expect(page.getByRole('img', { name: 'QR rute untuk HP' })).toBeVisible();
    await expect(page.getByText('Offline', { exact: true })).toBeVisible();
    await page.screenshot({ path: shot('03-tanpa-jaringan') });
    await context.close();
  });
});
