import type { Venue } from '@indoor/domain';
import type { Browser, BrowserContextOptions } from '@playwright/test';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { sql } from '../../../support/license';
import { enableAutoTours, TourPopover } from '../../../support/tour';

const shot = (name: string) => `evidence/T-599/${name}.png`;

const PHONE_EN: BrowserContextOptions = {
  baseURL: env.visitorUrl,
  viewport: { width: 360, height: 740 },
  isMobile: true,
  hasTouch: true,
  locale: 'en-US',
  // Tanpa animasi: langkah tampil seketika, juga memeriksa tur saat prefers-reduced-motion.
  reducedMotion: 'reduce',
};

async function openVenue(browser: Browser, venueId: string, options: { autoTours: boolean }) {
  const context = await browser.newContext(PHONE_EN);
  if (options.autoTours) await enableAutoTours(context);
  const page = await context.newPage();
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto(`/v/${venueId}`);
  await expect(page.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
    timeout: 30_000,
  });
  return { context, page, requests, tour: new TourPopover(page) };
}

const driverRequests = (urls: string[]) => urls.filter((url) => /driver/i.test(url));

test.describe('T-599 Tur Visitor dan Info Point', () => {
  test('TC-TUR-08: driver.js belum diunduh sebelum tur dimulai', async ({
    browser,
    publishedVenue,
    superAdmin,
  }) => {
    const venueId = publishedVenue.venue.id as Venue['id'];
    await superAdmin.publications.publish(venueId);
    const { context, page, requests, tour } = await openVenue(browser, venueId, {
      autoTours: false,
    });
    await page.waitForTimeout(1_500);
    expect(driverRequests(requests)).toEqual([]);
    await expect(tour.root).toHaveCount(0);

    await page.getByRole('button', { name: 'Map information' }).click();
    await page.getByRole('button', { name: 'How to use the map' }).click();
    await expect(tour.title).toHaveText('Welcome');
    expect(driverRequests(requests).length).toBeGreaterThan(0);
    await context.close();
  });

  test('TC-TUR-06: HP berbahasa Inggris, sheet menyesuaikan, tidak muncul lagi; penyimpanan diblokir tidak berulang', async ({
    browser,
    publishedVenue,
    superAdmin,
  }) => {
    const venueId = publishedVenue.venue.id as Venue['id'];
    await superAdmin.publications.publish(venueId);
    const { context, page, tour } = await openVenue(browser, venueId, { autoTours: true });

    await expect(tour.title).toHaveText('Welcome');
    await expect(tour.description).toContainText(publishedVenue.venue.name);
    await expect(tour.progress).toContainText(/^1 of \d+$/);
    await expect(tour.skip).toHaveText('Skip');
    await page.screenshot({ path: shot('04-visitor-en-mulai-sendiri') });
    await tour.next.click();
    await expect(tour.title).toHaveText('Search places');
    await tour.next.click();
    await expect(tour.title).toHaveText('Categories and facilities');
    // Bottom sheet dibuka setengah agar chip yang ditunjuk terlihat di atas popover.
    await expect(page.locator('[data-snap]')).toHaveAttribute('data-snap', 'half');
    await page.screenshot({ path: shot('05-visitor-en-sheet-setengah') });
    await tour.skip.click();
    await expect(tour.root).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('indoor.tour.seen'))).toBe('["venue@1"]');
    await page.reload();
    await expect(page.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    await page.waitForTimeout(1_500);
    await expect(tour.root).toHaveCount(0);
    await context.close();

    // Penyimpanan status diblokir: tur tetap tampil sekali, lalu tidak berulang dalam sesi itu.
    const blocked = await browser.newContext(PHONE_EN);
    await blocked.addInitScript(() => {
      const getItem = Storage.prototype.getItem;
      const setItem = Storage.prototype.setItem;
      Storage.prototype.getItem = function (key: string) {
        if (key === 'indoor.tour.auto') return 'on';
        if (key === 'indoor.tour.seen') throw new DOMException('diblokir', 'SecurityError');
        return getItem.call(this, key);
      };
      Storage.prototype.setItem = function (key: string, value: string) {
        if (key === 'indoor.tour.seen') throw new DOMException('diblokir', 'SecurityError');
        setItem.call(this, key, value);
      };
    });
    const page2 = await blocked.newPage();
    const tour2 = new TourPopover(page2);
    await page2.goto(`/v/${venueId}`);
    await expect(tour2.title).toHaveText('Welcome', { timeout: 30_000 });
    await tour2.skip.click();
    await expect(tour2.root).toHaveCount(0);
    // Membuka dan menutup daftar memicu render ulang halaman; tur tidak muncul lagi.
    await page2.getByRole('button', { name: 'A–Z', exact: true }).click();
    await page2.getByRole('button', { name: 'A–Z', exact: true }).click();
    await page2.waitForTimeout(1_500);
    await expect(tour2.root).toHaveCount(0);
    await expect(page2.getByText('Something went wrong')).toHaveCount(0);
    await blocked.close();
  });

  test('TC-TUR-07: Info Point tidak memulai tur sendiri; tur yang terbuka ditutup saat idle', async ({
    browser,
    fullVenue,
    superAdmin,
  }) => {
    test.setTimeout(120_000);
    const venueId = fullVenue.venueId as Venue['id'];
    const infoPointId = fullVenue.ids.lobbyInfoPoint;
    sql(`update public.info_points set idle_seconds = 15, default_language = 'id'
         where id = '${infoPointId}'`);
    await superAdmin.publications.publish(venueId);
    const code = sql(`select code from public.info_points where id = '${infoPointId}'`);

    const context = await browser.newContext({
      viewport: { width: 1080, height: 1920 },
      hasTouch: true,
      reducedMotion: 'reduce',
    });
    // Tur otomatis menyala di perangkat ini, tetapi Info Point tetap tidak memulainya sendiri.
    await enableAutoTours(context);
    const page = await context.newPage();
    const tour = new TourPopover(page);
    await page.goto(`${env.visitorUrl}/ip/${code}?venue=${venueId}`);
    await expect(page.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    await page.waitForTimeout(2_000);
    await expect(tour.root).toHaveCount(0);

    await page.getByRole('button', { name: 'Cara pakai' }).click();
    await expect(tour.title).toHaveText('Cara pakai layar ini');
    await tour.next.click();
    await expect(tour.title).toHaveText('Cari tempat');
    await page.screenshot({ path: shot('06-info-point-cara-pakai') });

    const session = await page.locator('[data-info-point-code]').getAttribute('data-session');
    await expect(page.locator('[data-info-point-code]')).not.toHaveAttribute(
      'data-session',
      session ?? '',
      { timeout: 30_000 },
    );
    await expect(tour.root).toHaveCount(0);
    await context.close();
  });
});
