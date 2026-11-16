import type { EventInput, Venue } from '@indoor/domain';
import type { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { VisitorPage } from '../../../pages/visitor-page';

const evidence = (name: string) => `evidence/T-582/${name}.png`;
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;

const base = (overrides: Partial<EventInput>): EventInput => ({
  kind: 'event',
  status: 'active',
  title: { id: 'Event', en: '' },
  summary: { id: '', en: '' },
  description: { id: '', en: '' },
  imagePath: null,
  linkUrl: null,
  startsAt: new Date(Date.now() - HOUR).toISOString(),
  endsAt: new Date(Date.now() + HOUR).toISOString(),
  repeat: 'none',
  repeatUntil: null,
  point: null,
  locationIds: [],
  ...overrides,
});

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

const chips = (page: Page) => page.getByRole('navigation', { name: 'Kategori dan fasilitas' });

test.describe('T-582 Event & Promo di Visitor', () => {
  test('TC-EVT-06/07: berlangsung dan segera, lencana, penanda, rute, bagikan ev=, hilang sendiri', async ({
    page,
    browser,
    superAdmin,
    publishedVenue,
  }) => {
    test.setTimeout(120_000);
    const { venue, floor } = publishedVenue;
    const venueId = venue.id as Venue['id'];
    const snapshot = await superAdmin.snapshots.latest(venueId);
    const radiology = snapshot.locations.find((l) => l.name === 'Radiologi');
    if (!radiology) throw new Error('Radiologi belum terbit');
    const unit = snapshot.features.features.find((f) => f.properties.unitCode === 'UJI-GF-002');
    const corner =
      unit?.geometry.type === 'Polygon' ? unit.geometry.coordinates[0]?.[0] : undefined;
    if (!corner) throw new Error('unit uji tidak ada');

    const image = await superAdmin.events.uploadImage(
      venueId,
      new Blob(
        [
          Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            'base64',
          ),
        ],
        {
          type: 'image/png',
        },
      ),
    );
    const seminar = await superAdmin.events.create(
      venueId,
      base({
        title: { id: 'Seminar Jantung', en: 'Heart Seminar' },
        summary: { id: 'Bincang kesehatan jantung.', en: '' },
        description: { id: '<b>Gratis</b> untuk umum', en: '' },
        locationIds: [radiology.id],
        imagePath: image,
        linkUrl: 'https://contoh.id/seminar',
      }),
    );
    await superAdmin.events.create(
      venueId,
      base({
        title: { id: 'Senam Singkat', en: '' },
        endsAt: new Date(Date.now() + 2 * MINUTE).toISOString(),
        point: { floorId: floor.id, coordinates: [corner[0] ?? 0, corner[1] ?? 0] },
      }),
    );
    await superAdmin.events.create(
      venueId,
      base({
        kind: 'promotion',
        title: { id: 'Diskon Kantin', en: '' },
        startsAt: new Date(Date.now() + 48 * HOUR).toISOString(),
        endsAt: new Date(Date.now() + 50 * HOUR).toISOString(),
        point: { floorId: floor.id, coordinates: [corner[0] ?? 0, corner[1] ?? 0] },
      }),
    );
    await superAdmin.events.create(
      venueId,
      base({ title: { id: 'Draf Rahasia', en: '' }, status: 'draft' }),
    );

    await page.clock.install();
    await stubShare(page);
    const visitor = new VisitorPage(page);
    await visitor.goto(venueId);
    const chip = chips(page).getByRole('button', { name: 'Event & Promo (3)' });
    await expect(chip).toBeVisible();
    await expect(visitor.map).toHaveAttribute('data-event-marks', '3');
    await page.screenshot({ path: evidence('01-chip-dan-penanda') });

    await chip.click();
    const live = page.getByRole('region', { name: 'Sedang berlangsung' });
    const soon = page.getByRole('region', { name: 'Segera' });
    await expect(live.getByRole('button')).toHaveText([/Seminar Jantung/, /Senam Singkat/]);
    await expect(soon.getByRole('button')).toHaveText([/Diskon Kantin/]);
    await expect(page.getByText('Draf Rahasia')).toHaveCount(0);
    await page.screenshot({ path: evidence('02-daftar-event') });

    await live.getByRole('button', { name: 'Seminar Jantung' }).click();
    const detail = page.getByRole('article', { name: 'Seminar Jantung' });
    await expect(detail.getByText('Berlangsung', { exact: true })).toBeVisible();
    await expect(detail.getByText('<b>Gratis</b> untuk umum')).toBeVisible();
    await expect(detail.getByRole('link', { name: 'Info lebih lanjut' })).toHaveAttribute(
      'href',
      'https://contoh.id/seminar',
    );
    await expect(detail.locator('img')).toHaveJSProperty('complete', true);
    await page.screenshot({ path: evidence('03-detail-event') });

    await detail.getByRole('button', { name: 'Bagikan' }).click();
    const shared = await lastShared(page);
    expect(new URL(shared).searchParams.get('ev')).toBe(seminar.id);

    await detail.getByRole('button', { name: 'Radiologi' }).click();
    const profile = page.getByRole('article', { name: 'Radiologi' });
    const badges = profile.getByRole('region', { name: 'Event di sini' });
    await expect(badges.getByRole('button', { name: /Seminar Jantung/ })).toBeVisible();
    await page.screenshot({ path: evidence('04-lencana-lokasi') });
    await badges.getByRole('button', { name: /Seminar Jantung/ }).click();

    await page
      .getByRole('article', { name: 'Seminar Jantung' })
      .getByRole('button', { name: 'Rute ke sini' })
      .click();
    await expect(page.getByText('Anda sedang di mana?')).toBeVisible();
    await visitor.search.fill('UJI-GF-002');
    await visitor.results.filter({ hasText: 'UJI-GF-002' }).first().click();
    await visitor.profile.getByRole('button', { name: 'Saya di sini' }).click();
    const route = page.getByRole('region', { name: 'Rute' });
    await expect(route.getByRole('definition').nth(2)).toHaveText('Radiologi');
    await expect(
      route.getByRole('list', { name: 'Langkah rute' }).getByRole('listitem').last(),
    ).toContainText('Radiologi');
    await page.screenshot({ path: evidence('05-rute-ke-event') });
    await route.getByRole('button', { name: 'Tutup rute' }).click();

    await page.clock.fastForward('03:00');
    await expect(chips(page).getByRole('button', { name: 'Event & Promo (2)' })).toBeVisible();
    await expect(visitor.map).toHaveAttribute('data-event-marks', '2');
    await chips(page).getByRole('button', { name: 'Event & Promo (2)' }).click();
    await expect(page.getByText('Senam Singkat')).toHaveCount(0);
    await page.screenshot({ path: evidence('06-event-selesai-hilang') });

    const other = await browser.newPage({ viewport: { width: 360, height: 740 } });
    await other.goto(shared.replace('lang=id', 'lang=en'));
    const opened = other.getByRole('article', { name: 'Heart Seminar' });
    await expect(opened).toBeVisible({ timeout: 30_000 });
    await expect(opened.getByText('Bincang kesehatan jantung.')).toBeVisible();
    await expect(opened.getByRole('button', { name: 'Directions to here' })).toBeVisible();
    await other.screenshot({ path: evidence('07-tautan-ev-en') });
    await other.getByRole('button', { name: 'All events' }).click();
    await expect(other.getByRole('region', { name: 'Coming up' }).getByRole('button')).toHaveText([
      /Diskon Kantin/,
    ]);
    await other.close();
  });

  test('TC-EVT-08: 50 event aktif dimuat setelah peta tampil', async ({
    page,
    superAdmin,
    publishedVenue,
  }) => {
    test.setTimeout(120_000);
    const venueId = publishedVenue.venue.id as Venue['id'];
    for (let i = 1; i <= 50; i++) {
      await superAdmin.events.create(
        venueId,
        base({ title: { id: `Bazar ${String(i).padStart(2, '0')}`, en: '' } }),
      );
    }
    const visitor = new VisitorPage(page);
    const requested = page.waitForRequest((r) => r.url().includes('/rest/v1/events'));
    const started = Date.now();
    await page.goto(`/v/${venueId}`);
    await requested;
    expect(await visitor.map.getAttribute('data-ready')).toBe('true');
    const readyMs = Date.now() - started;
    await expect(chips(page).getByRole('button', { name: 'Event & Promo (50)' })).toBeVisible();
    await chips(page).getByRole('button', { name: 'Event & Promo (50)' }).click();
    await expect(
      page.getByRole('region', { name: 'Sedang berlangsung' }).getByRole('button'),
    ).toHaveCount(50);
    await page.screenshot({ path: evidence('08-lima-puluh-event') });
    test.info().annotations.push({ type: 'peta-siap-ms', description: String(readyMs) });
  });
});
