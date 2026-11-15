import { readFile } from 'node:fs/promises';
import type { Venue } from '@indoor/domain';
import type { Browser, Download, Page } from '@playwright/test';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { sql } from '../../../support/license';

const evidence = (name: string) => `evidence/T-591/${name}.png`;
const PHONE = { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true };

test.describe.configure({ mode: 'serial' });

const eventCount = (venueId: string, where = 'true') =>
  Number(
    sql(`select count(*) from public.analytics_events where venue_id = '${venueId}' and ${where}`),
  );

async function searchOnPhone(page: Page, text: string) {
  await page.getByRole('searchbox').fill(text);
  await page.waitForTimeout(1_600);
}

async function searchOnKiosk(page: Page, text: string) {
  await page.getByRole('searchbox').click();
  const keyboard = page.getByRole('group', { name: /keyboard/i });
  for (const letter of text) {
    await keyboard.getByRole('button', { name: letter, exact: true }).click();
  }
  await keyboard.getByRole('button', { name: /Cari|Search/ }).click();
}

async function downloaded(download: Promise<Download>): Promise<string> {
  const file = await (await download).path();
  return readFile(file, 'latin1');
}

function watchPosts(page: Page): string[] {
  const posts: string[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/functions/v1/analytics')) {
      posts.push(request.url());
    }
  });
  return posts;
}

async function phone(browser: Browser) {
  const context = await browser.newContext(PHONE);
  return { context, page: await context.newPage() };
}

test.describe('T-591 Analitik penggunaan', () => {
  test.afterAll(() => {
    sql('update public.system_settings set analytics_enabled = false');
  });

  test('TC-OPS-01/02/05: event uji dari HP (QR) dan Info Point cocok dengan dasbor, CSV, dan PDF', async ({
    browser,
    page,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    test.setTimeout(180_000);
    sql('update public.system_settings set analytics_enabled = true');
    const venueId = fullVenue.venueId as Venue['id'];
    await superAdmin.publications.publish(venueId);
    const origin = sql(
      `select public_code || '|' || name from public.origin_points where id = '${fullVenue.ids.lobbyOrigin}'`,
    ).split('|');
    const kiosk = sql(
      `select code || '|' || name from public.info_points where id = '${fullVenue.ids.lobbyInfoPoint}'`,
    ).split('|');

    const visitor = await phone(browser);
    await visitor.page.goto(`${env.visitorUrl}/v/${venueId}?o=${origin[0]}`);
    const notice = visitor.page.getByRole('region', { name: 'Pemberitahuan privasi' });
    await expect(notice).toContainText('tanpa data pribadi');
    await visitor.page.screenshot({ path: evidence('01-pemberitahuan-privasi') });
    await notice.getByRole('button', { name: 'Oke' }).click();
    await searchOnPhone(visitor.page, 'zzzqqq');
    await searchOnPhone(visitor.page, 'Radiologi');
    await visitor.page
      .locator('#search-results li')
      .filter({ hasText: 'Radiologi' })
      .first()
      .click();
    await expect(visitor.page.getByRole('article', { name: 'Radiologi' })).toBeVisible();

    const screen = await browser.newPage({
      viewport: { width: 1080, height: 1920 },
      hasTouch: true,
    });
    await screen.goto(`${env.visitorUrl}/ip/${kiosk[0]}?venue=${venueId}`);
    await expect(screen.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    await expect(screen.getByRole('region', { name: 'Pemberitahuan privasi' })).toHaveCount(0);
    await searchOnKiosk(screen, 'RADIO');
    await screen.getByRole('button', { name: 'Rute ke sini' }).click();
    await expect(screen.getByRole('img', { name: 'QR rute untuk HP' })).toBeVisible();

    await expect.poll(() => eventCount(venueId, "kind = 'route'"), { timeout: 30_000 }).toBe(1);
    await expect.poll(() => eventCount(venueId, "kind = 'search'"), { timeout: 30_000 }).toBe(3);
    await screen.close();
    await visitor.context.close();

    expect(
      eventCount(
        venueId,
        `row_to_json(analytics_events)::text ~* '(mozilla|chrome|webkit|127\\.0\\.0\\.1|::1|@)'`,
      ),
    ).toBe(0);
    const totals = Object.fromEntries(
      ['visit', 'search', 'location', 'route'].map((kind) => [
        kind,
        eventCount(venueId, `kind = '${kind}'`),
      ]),
    );
    expect(totals).toEqual({ visit: 2, search: 3, location: totals.location, route: 1 });
    expect(totals.location).toBeGreaterThanOrEqual(2);

    await loginAs('super_admin');
    await new AdminShell(page).selectVenue(fullVenue.name);
    await page.goto('/analytics');
    for (const [kind, count] of Object.entries(totals)) {
      await expect(page.getByTestId(`total-${kind}`)).toHaveText(String(count));
    }
    await expect(page.getByRole('region', { name: 'Pencarian tanpa hasil' })).toContainText(
      'zzzqqq',
    );
    await expect(page.getByRole('region', { name: 'Pencarian teratas' })).toContainText(
      'radiologi',
    );
    await expect(page.getByRole('region', { name: 'Pemakaian per Info Point' })).toContainText(
      kiosk[1] ?? '',
    );
    await expect(page.getByRole('region', { name: 'Pemindaian per QR titik asal' })).toContainText(
      origin[1] ?? '',
    );
    await expect(page.getByRole('region', { name: 'Tujuan rute teratas' })).toContainText(
      'Radiologi',
    );
    await page.screenshot({ path: evidence('02-dasbor-analitik'), fullPage: true });

    const csv = await downloaded(
      Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Export CSV' }).click(),
      ]).then(([download]) => download),
    );
    expect(csv).toContain(
      `Total,${totals.visit},${totals.search},${totals.location},${totals.route}\r\n`,
    );
    expect(csv).toContain('zzzqqq,1');

    const pdf = await downloaded(
      Promise.all([
        page.waitForEvent('download'),
        page.getByRole('button', { name: 'Export PDF' }).click(),
      ]).then(([download]) => download),
    );
    expect(pdf.startsWith('%PDF-1.4')).toBe(true);
    expect(pdf).toContain('(Pencarian tanpa hasil) Tj');
    expect(pdf).toContain('(zzzqqq) Tj');
    expect(pdf).toContain(`(Kunjungan) Tj ET\nBT /F1 10 Tf`);
  });

  test('TC-OPS-03: pengunjung menolak, lalu analitik dimatikan di Pengaturan: tidak ada kiriman', async ({
    browser,
    page,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    test.setTimeout(120_000);
    sql('update public.system_settings set analytics_enabled = true');
    const venueId = fullVenue.venueId as Venue['id'];
    await superAdmin.publications.publish(venueId);

    const declined = await phone(browser);
    const declinedPosts = watchPosts(declined.page);
    await declined.page.goto(`${env.visitorUrl}/v/${venueId}`);
    const notice = declined.page.getByRole('region', { name: 'Pemberitahuan privasi' });
    await notice.getByRole('button', { name: 'Tolak' }).click();
    await expect(notice).toHaveCount(0);
    await searchOnPhone(declined.page, 'Radiologi');
    await declined.page.waitForTimeout(11_000);
    expect(declinedPosts).toEqual([]);
    await declined.page.getByRole('button', { name: 'Informasi peta' }).click();
    await expect(declined.page.getByLabel('Kirim statistik pemakaian anonim')).not.toBeChecked();
    await declined.page.screenshot({ path: evidence('03-pengunjung-menolak') });
    await declined.context.close();
    expect(eventCount(venueId)).toBe(0);

    await loginAs('super_admin');
    await page.goto('/settings?tab=system');
    const toggle = page.getByLabel('Aktifkan analitik pengunjung');
    await expect(toggle).toBeChecked();
    await toggle.uncheck();
    await page.getByRole('button', { name: 'Simpan pengaturan' }).click();
    await expect(page.getByText('Pengaturan sistem tersimpan')).toBeVisible();
    await page.getByRole('heading', { name: 'Analitik pengunjung' }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: evidence('04-pengaturan-analitik') });
    expect(sql('select analytics_enabled from public.system_settings')).toBe('f');

    const off = await phone(browser);
    const offPosts = watchPosts(off.page);
    await off.page.goto(`${env.visitorUrl}/v/${venueId}`);
    await expect(off.page.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    await expect(off.page.getByRole('region', { name: 'Pemberitahuan privasi' })).toHaveCount(0);
    await searchOnPhone(off.page, 'Radiologi');
    await off.page.waitForTimeout(11_000);
    expect(offPosts).toEqual([]);
    await off.context.close();
    expect(eventCount(venueId)).toBe(0);
  });
});
