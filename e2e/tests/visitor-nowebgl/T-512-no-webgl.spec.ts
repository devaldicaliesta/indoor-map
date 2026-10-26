import type { Venue } from '@indoor/domain';
import type { Page } from '@playwright/test';
import { env } from '../../env';
import { expect, test } from '../../fixtures';
import { VisitorPage } from '../../pages/visitor-page';
import { sql } from '../../support/license';

const shot = (name: string) => `evidence/T-512/${name}.png`;

/** Tidak ada layar galat dan WebGL2 memang tidak tersedia di browser proyek ini. */
async function expectNoMapNoError(page: Page) {
  expect(
    await page.evaluate(() => document.createElement('canvas').getContext('webgl2') === null),
  ).toBe(true);
  await expect(page.getByTestId('map-unavailable')).toBeVisible();
  await expect(page.getByTestId('venue-map')).toHaveCount(0);
  await expect(page.getByText('Terjadi kesalahan')).toHaveCount(0);
  await expect(page.getByText('Something went wrong')).toHaveCount(0);
}

test.describe('T-512 Visitor tanpa WebGL', () => {
  test('HP: pesan pengganti peta, cari Radiologi, rute dari QR titik asal dengan langkah', async ({
    page,
    fullVenue,
    superAdmin,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    await superAdmin.publications.publish(venueId);
    const snapshot = await superAdmin.snapshots.latest(venueId);
    const qr = snapshot.originPoints.find((p) => p.name === 'Lobi Utama');
    if (!qr) throw new Error('Lobi Utama tidak ada di snapshot');
    const visitor = new VisitorPage(page);

    await page.goto(`/v/${venueId}?o=${qr.code}`);
    await expectNoMapNoError(page);
    await expect(page.getByRole('status')).toContainText('Perangkat ini tidak mendukung peta');
    await expect(page.getByText(/Anda di sini/)).toBeVisible();
    await page.screenshot({ path: shot('01-hp-pesan-tanpa-peta') });

    await visitor.search.fill('radiologi');
    await visitor.results.filter({ hasText: 'Radiologi' }).first().click();
    await expect(visitor.profile).toContainText('Radiologi');
    await page.screenshot({ path: shot('02-hp-cari-radiologi') });

    await visitor.profile.getByRole('button', { name: 'Rute ke sini' }).click();
    const route = page.getByRole('region', { name: 'Rute' });
    const steps = route.getByRole('list', { name: 'Langkah rute' }).getByRole('listitem');
    await expect(route.getByRole('definition').first()).toHaveText('Lobi Utama');
    await expect(route.getByRole('definition').nth(2)).toHaveText('Radiologi');
    await expect(route.getByText(/^\d[\d.,]* m$/)).toBeVisible();
    expect(await steps.count()).toBeGreaterThan(1);
    await expect(steps.last()).toContainText('Radiologi');
    await page.screenshot({ path: shot('03-hp-langkah-rute') });

    // Mode langkah tetap berjalan walau tidak ada peta yang dipindah.
    const total = await steps.count();
    await steps.nth(1).getByRole('button').click();
    await expect(route.getByText(`Langkah 2 dari ${total}`)).toBeVisible();
    await route.getByRole('button', { name: 'Berikutnya' }).click();
    await expect(route.getByText(`Langkah 3 dari ${total}`)).toBeVisible();
    await expectNoMapNoError(page);
  });

  test('HP tanpa QR: asal dipilih dari daftar, tanpa pilihan "Ketuk di peta"', async ({
    page,
    fullVenue,
    superAdmin,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    await superAdmin.publications.publish(venueId);
    const visitor = new VisitorPage(page);
    await page.goto(`/v/${venueId}`);
    await expectNoMapNoError(page);

    await visitor.search.fill('radiologi');
    await visitor.results.filter({ hasText: 'Radiologi' }).first().click();
    await visitor.profile.getByRole('button', { name: 'Rute ke sini' }).click();
    await expect(page.getByRole('heading', { name: 'Anda sedang di mana?' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ketuk di peta' })).toHaveCount(0);
    await expect(page.getByText(/ketuk posisi Anda di peta/i)).toHaveCount(0);
    await page.screenshot({ path: shot('04-hp-pilih-asal-tanpa-peta') });

    await visitor.search.fill('GF-B08');
    await visitor.results.filter({ hasText: 'GF-B08' }).first().click();
    await visitor.profile.getByRole('button', { name: 'Saya di sini' }).click();
    const route = page.getByRole('region', { name: 'Rute' });
    await expect(route.getByRole('definition').first()).toHaveText('GF-B08');
    await expect(route.getByRole('list', { name: 'Langkah rute' })).toBeVisible();
    await expectNoMapNoError(page);
  });

  test('Info Point: pesan layar besar, cari lewat keyboard layar, langkah rute dan QR', async ({
    browser,
    fullVenue,
    superAdmin,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    const infoPointId = fullVenue.ids.lobbyInfoPoint;
    sql(`update public.info_points set default_language = 'id' where id = '${infoPointId}'`);
    await superAdmin.publications.publish(venueId);
    const code = sql(`select code from public.info_points where id = '${infoPointId}'`);

    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, hasTouch: true });
    await page.goto(`${env.visitorUrl}/ip/${code}?venue=${venueId}`);
    await expect(page.locator('html')).toHaveAttribute('data-surface', 'info-point');
    await expectNoMapNoError(page);
    const title = page.getByRole('heading', { name: 'Perangkat ini tidak mendukung peta' });
    // Versi layar besar: judul 32 px (HP 20 px).
    expect(await title.evaluate((el) => getComputedStyle(el).fontSize)).toBe('32px');
    await page.screenshot({ path: shot('05-info-point-pesan') });

    await page.getByRole('searchbox').click();
    const keyboard = page.getByRole('group', { name: /keyboard/i });
    for (const letter of 'RADIO') {
      await keyboard.getByRole('button', { name: letter, exact: true }).click();
    }
    await keyboard.getByRole('button', { name: /Cari|Search/ }).click();
    await expect(page.locator('article')).toContainText('Radiologi');
    await page.getByRole('button', { name: 'Rute ke sini' }).click();

    const route = page.getByRole('region', { name: 'Rute' });
    const steps = route.getByRole('list', { name: 'Langkah rute' }).getByRole('listitem');
    expect(await steps.count()).toBeGreaterThan(1);
    await expect(steps.last()).toContainText('Radiologi');
    await expect(page.getByRole('img', { name: 'QR rute untuk HP' })).toBeVisible();
    await expectNoMapNoError(page);
    await page.screenshot({ path: shot('06-info-point-langkah-rute') });
    await page.close();
  });
});
