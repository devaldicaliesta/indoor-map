import type { Venue } from '@indoor/domain';
import type { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { VisitorPage } from '../../../pages/visitor-page';

const shot = (name: string) => `evidence/T-217/${name}.png`;

/** Web Share API palsu: URL yang dibagikan disimpan di `window.__shared`. */
async function stubShare(page: Page) {
  await page.addInitScript(() => {
    const target = window as unknown as { __shared: string[] };
    target.__shared = [];
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async (data: { url: string }) => {
        target.__shared.push(data.url);
      },
    });
  });
}

const lastShared = (page: Page) =>
  page.evaluate(() => (window as unknown as { __shared: string[] }).__shared.at(-1) ?? '');

test.describe('T-217 Visitor: bagikan', () => {
  test('tautan rute dan lokasi dibuka di perangkat lain dengan keadaan sama; tanpa Web Share disalin', async ({
    page,
    browser,
    fullVenue,
    superAdmin,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    await superAdmin.publications.publish(venueId);
    await stubShare(page);
    const visitor = new VisitorPage(page);
    await visitor.goto(venueId);

    // Rute aksesibel dalam bahasa Inggris.
    await page.getByRole('button', { name: 'English' }).click();
    await visitor.page.getByRole('searchbox').fill('L1-B08');
    await visitor.results.filter({ hasText: 'L1-B08' }).first().click();
    await visitor.profile.getByRole('button', { name: 'Directions to here' }).click();
    await visitor.page.getByRole('searchbox').fill('GF-B08');
    await visitor.results.filter({ hasText: 'GF-B08' }).first().click();
    await visitor.profile.getByRole('button', { name: "I'm here" }).click();
    const route = page.getByRole('region', { name: 'Route' });
    await route.getByRole('checkbox', { name: /Accessible route/ }).check();
    await route.getByRole('button', { name: 'Share' }).click();
    const routeUrl = await lastShared(page);
    const params = new URL(routeUrl).searchParams;
    expect(params.get('from')).toBeTruthy();
    expect(params.get('to')).toBeTruthy();
    expect(params.get('a11y')).toBe('1');
    expect(params.get('lang')).toBe('en');
    await page.screenshot({ path: shot('01-bagikan-rute') });

    // Perangkat lain (konteks baru, tanpa penyimpanan): keadaan sama.
    const other = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const otherPage = await other.newPage();
    await otherPage.goto(routeUrl);
    await expect(otherPage.locator('html')).toHaveAttribute('lang', 'en');
    const otherRoute = otherPage.getByRole('region', { name: 'Route' });
    await expect(otherRoute.getByRole('definition').first()).toHaveText('GF-B08');
    await expect(otherRoute.getByRole('definition').nth(2)).toHaveText('L1-B08');
    await expect(otherRoute.getByRole('checkbox', { name: /Accessible route/ })).toBeChecked();
    await expect(
      otherRoute
        .getByRole('list', { name: 'Route steps' })
        .getByRole('listitem')
        .filter({
          hasText: /elevator/i,
        }),
    ).toHaveCount(1);
    await otherPage.screenshot({ path: shot('02-rute-di-perangkat-lain') });

    // Bagikan lokasi.
    await route.getByRole('button', { name: 'Close route' }).click();
    await page.getByRole('searchbox').fill('radiologi');
    await visitor.results.filter({ hasText: 'Radiologi' }).first().click();
    await visitor.profile.getByRole('button', { name: 'Share' }).click();
    const locationUrl = await lastShared(page);
    expect(new URL(locationUrl).searchParams.get('loc')).toBeTruthy();
    await otherPage.goto(locationUrl);
    await expect(new VisitorPage(otherPage).profile).toContainText('Radiologi');
    await expect(
      new VisitorPage(otherPage).profile.getByRole('button', { name: 'Directions to here' }),
    ).toBeVisible();
    await otherPage.screenshot({ path: shot('03-lokasi-di-perangkat-lain') });
    await other.close();

    // Tanpa Web Share API: tautan disalin ke clipboard.
    const plain = await browser.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
    const plainPage = await plain.newPage();
    await plainPage.addInitScript(() => {
      Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    });
    await plainPage.goto(locationUrl);
    await plainPage.locator('article').getByRole('button', { name: 'Share' }).click();
    await expect(plainPage.getByRole('button', { name: 'Link copied' })).toBeVisible();
    expect(await plainPage.evaluate(() => navigator.clipboard.readText())).toBe(locationUrl);
    await plainPage.screenshot({ path: shot('04-disalin') });
    await plain.close();
  });
});
