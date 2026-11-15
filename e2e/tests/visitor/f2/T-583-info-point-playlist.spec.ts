import type { DataClient } from '@indoor/data';
import type { FullVenue } from '@indoor/data/testing/full-venue';
import type { EventInput, Venue } from '@indoor/domain';
import type { Browser, Page } from '@playwright/test';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { sql } from '../../../support/license';

const evidence = (name: string) => `evidence/T-583/${name}.png`;
const HOUR = 3_600_000;
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const base = (overrides: Partial<EventInput>): EventInput => ({
  kind: 'event',
  status: 'active',
  title: { id: 'Event', en: '' },
  summary: { id: '', en: '' },
  description: { id: '', en: '' },
  imagePath: null,
  linkUrl: null,
  startsAt: new Date(Date.now() - HOUR).toISOString(),
  endsAt: new Date(Date.now() + 4 * HOUR).toISOString(),
  repeat: 'none',
  repeatUntil: null,
  point: null,
  locationIds: [],
  ...overrides,
});

async function setUp(superAdmin: DataClient, fullVenue: FullVenue) {
  const venueId = fullVenue.venueId as Venue['id'];
  const infoPointId = fullVenue.ids.lobbyInfoPoint;
  await superAdmin.publications.publish(venueId);
  const snapshot = await superAdmin.snapshots.latest(venueId);
  const radiology = snapshot.locations.find((l) => l.name === 'Radiologi');
  if (!radiology) throw new Error('Radiologi belum terbit');
  const image = () =>
    superAdmin.events.uploadImage(venueId, new Blob([PNG], { type: 'image/png' }));
  const expo = await superAdmin.events.create(
    venueId,
    base({
      title: { id: 'Pameran Alat Medis', en: '' },
      summary: { id: 'Coba alat terbaru di lobi.', en: '' },
      startsAt: new Date(Date.now() - 2 * HOUR).toISOString(),
      locationIds: [radiology.id],
      imagePath: await image(),
    }),
  );
  const promo = await superAdmin.events.create(
    venueId,
    base({
      kind: 'promotion',
      title: { id: 'Promo Apotek', en: '' },
      imagePath: await image(),
    }),
  );
  await superAdmin.events.create(venueId, base({ title: { id: 'Tidak Diputar', en: '' } }));
  sql(`update public.info_points set idle_seconds = 15, playlist_enabled = true,
         playlist_slide_seconds = 5, playlist_event_ids = array['${expo.id}', '${promo.id}']::uuid[]
       where id = '${infoPointId}'`);
  await superAdmin.publications.publish(venueId);
  const code = sql(`select code from public.info_points where id = '${infoPointId}'`);
  return { url: `${env.visitorUrl}/ip/${code}?venue=${venueId}` };
}

async function openScreen(browser: Browser, url: string) {
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1920 },
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.clock.install();
  await page.goto(url);
  await expect(page.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
    timeout: 30_000,
  });
  return { context, page };
}

const playlist = (page: Page) => page.getByRole('region', { name: 'Event & Promo' });
const slide = (page: Page, title: string) => playlist(page).getByRole('article', { name: title });

test.describe('T-583 Playlist promosi di Info Point', () => {
  test('TC-EVT-09: idle memutar playlist, sentuhan membuka rute atau event', async ({
    browser,
    superAdmin,
    fullVenue,
  }) => {
    test.setTimeout(180_000);
    const { url } = await setUp(superAdmin, fullVenue);
    const { context, page } = await openScreen(browser, url);
    await expect(playlist(page)).toHaveCount(0);

    await page.clock.fastForward('00:16');
    await expect(slide(page, 'Pameran Alat Medis')).toBeVisible();
    await expect(slide(page, 'Pameran Alat Medis')).toContainText('Radiologi');
    await expect(slide(page, 'Pameran Alat Medis').locator('img')).toHaveJSProperty(
      'complete',
      true,
    );
    await expect(
      slide(page, 'Pameran Alat Medis').getByRole('img', { name: 'QR detail event untuk HP' }),
    ).toHaveAttribute('data-url', /ev=/);
    await expect(playlist(page).locator('[data-event-id]')).toHaveCount(2);
    await page.screenshot({ path: evidence('01-playlist-slide-1') });

    await page.clock.fastForward('00:05');
    await expect(slide(page, 'Promo Apotek')).toBeVisible();
    await expect(slide(page, 'Pameran Alat Medis')).toHaveCount(0);
    await page.screenshot({ path: evidence('02-playlist-slide-2') });

    await page.clock.fastForward('00:05');
    await expect(slide(page, 'Pameran Alat Medis')).toBeVisible();
    await page.getByRole('button', { name: 'Sentuh layar untuk rute dan peta' }).click();
    await expect(playlist(page)).toHaveCount(0);
    const route = page.getByRole('region', { name: 'Rute' });
    await expect(route).toBeVisible();
    await expect(
      route.getByRole('list', { name: 'Langkah rute' }).getByRole('listitem').last(),
    ).toContainText('Radiologi');
    await page.screenshot({ path: evidence('03-sentuh-rute-ke-event') });

    await page.clock.fastForward('00:16');
    await expect(slide(page, 'Pameran Alat Medis')).toBeVisible();
    await page.clock.fastForward('00:05');
    await expect(slide(page, 'Promo Apotek')).toBeVisible();
    await page.getByRole('button', { name: 'Sentuh layar untuk rute dan peta' }).click();
    const detail = page.getByRole('article', { name: 'Promo Apotek' });
    await expect(detail).toBeVisible();
    await expect(detail.getByRole('button', { name: 'Semua event' })).toBeVisible();
    await page.screenshot({ path: evidence('04-sentuh-buka-event') });
    await context.close();
  });

  test('TC-EVT-10: tanpa jaringan slide yang sudah dimuat tetap tampil', async ({
    browser,
    superAdmin,
    fullVenue,
  }) => {
    test.setTimeout(180_000);
    const { url } = await setUp(superAdmin, fullVenue);
    const { context, page } = await openScreen(browser, url);
    await page.clock.fastForward('00:16');
    await expect(slide(page, 'Pameran Alat Medis')).toBeVisible();
    const images = playlist(page).locator('[data-event-id] img');
    await expect(images).toHaveCount(2);
    for (const image of await images.all()) {
      await expect(image).toHaveJSProperty('complete', true);
      expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    }

    await context.setOffline(true);
    await page.clock.fastForward('01:05');
    await expect(page.getByText('Offline', { exact: true })).toBeVisible();
    for (const title of ['Pameran Alat Medis', 'Promo Apotek']) {
      await expect(async () => {
        await page.clock.fastForward('00:05');
        await expect(slide(page, title)).toBeVisible({ timeout: 500 });
      }).toPass({ timeout: 20_000 });
      const image = slide(page, title).locator('img');
      expect(await image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
    }
    await page.screenshot({ path: evidence('05-offline-tetap-tampil') });
    await context.close();
  });
});
