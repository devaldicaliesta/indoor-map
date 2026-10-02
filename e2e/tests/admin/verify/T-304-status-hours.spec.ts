import type { Venue } from '@indoor/domain';
import type { Browser } from '@playwright/test';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';

const shot = (name: string) => `evidence/T-304/${name}.png`;

/** Label hasil cari Visitor untuk `query` pada waktu itu (jam palsu, konteks HP baru). */
async function visitorLabel(
  browser: Browser,
  venueId: string,
  at: string,
  query: string,
  name: string,
  screenshot?: string,
): Promise<string> {
  const context = await browser.newContext({
    baseURL: env.visitorUrl,
    viewport: { width: 360, height: 740 },
    hasTouch: true,
    isMobile: true,
  });
  const page = await context.newPage();
  await page.clock.install({ time: new Date(at) });
  await page.goto(`/v/${venueId}`);
  await expect(page.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
    timeout: 30_000,
  });
  await page.getByRole('searchbox', { name: 'Cari lokasi' }).fill(query);
  const item = page.locator('#search-results li').filter({ hasText: name }).first();
  await expect(item).toBeVisible();
  if (screenshot) await page.screenshot({ path: shot(screenshot) });
  const text = (await item.innerText()).split('\n').at(-1) ?? '';
  await context.close();
  return text;
}

test.describe('T-304 Status dan jam operasional', () => {
  test('ubah jam mingguan, tanggal khusus, status segera buka/nonaktif; label buka/tutup di Visitor', async ({
    page,
    browser,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    expect((await superAdmin.venues.get(venueId)).timezone).toBe('Asia/Jakarta');
    await loginAs('editor');
    await new AdminShell(page).selectVenue(fullVenue.name);
    await page.goto('/locations');

    // Radiologi: Rabu sampai 17.00, Sabtu 08.00–12.00, 14 Oktober tutup.
    await page
      .getByRole('row')
      .filter({ hasText: 'Radiologi' })
      .getByRole('button', { name: 'Ubah' })
      .click();
    const sheet = page.getByRole('dialog', { name: 'Ubah Radiologi' });
    await sheet.getByLabel('Rabu tutup 1').fill('17:00');
    await sheet
      .getByRole('group', { name: 'Jam operasional' })
      .getByRole('button', { name: 'Buka' })
      .nth(0)
      .click();
    await sheet.getByLabel('Sabtu tutup 1').fill('12:00');
    await sheet.getByLabel('Tanggal khusus baru').fill('2026-10-14');
    await sheet.getByRole('button', { name: 'Tambah tanggal' }).click();
    await expect(sheet.getByText('2026-10-14')).toBeVisible();
    await page.screenshot({ path: shot('01-jam-operasional') });
    await sheet.getByRole('button', { name: 'Simpan lokasi' }).click();
    await expect(sheet).toBeHidden();

    // Ruang Tunggu: segera buka wajib bertanggal.
    await page
      .getByRole('row')
      .filter({ hasText: 'Ruang Tunggu Ümum' })
      .getByRole('button', { name: 'Ubah' })
      .click();
    const waiting = page.getByRole('dialog', { name: 'Ubah Ruang Tunggu Ümum' });
    await waiting.getByRole('radio', { name: 'Segera buka' }).check();
    await waiting.getByRole('button', { name: 'Simpan lokasi' }).click();
    await expect(waiting.getByLabel('Tanggal buka')).toHaveAttribute('aria-invalid', 'true');
    await page.screenshot({ path: shot('02-segera-buka-tanpa-tanggal') });
    await waiting.getByLabel('Tanggal buka').fill('2026-11-02');
    await waiting.getByRole('button', { name: 'Simpan lokasi' }).click();
    await expect(waiting).toBeHidden();

    const locations = await superAdmin.locations.list(venueId);
    const radiology = locations.find((l) => l.name === 'Radiologi');
    expect(radiology?.hours.weekly[2]).toEqual([{ opens: '08:00', closes: '17:00' }]);
    expect(radiology?.hours.weekly[5]).toEqual([{ opens: '08:00', closes: '12:00' }]);
    expect(radiology?.hours.special['2026-10-14']).toEqual([]);
    expect(locations.find((l) => l.name === 'Ruang Tunggu Ümum')).toMatchObject({
      status: 'coming_soon',
      openingDate: '2026-11-02',
    });
    await superAdmin.publications.publish(venueId);

    // Visitor pada beberapa waktu (WIB = UTC+7).
    const label = (at: string, file?: string) =>
      visitorLabel(browser, venueId, at, 'radiologi', 'Radiologi', file);
    expect(await label('2026-10-07T03:00:00Z', '03-rabu-buka')).toBe('Buka · tutup 17.00');
    expect(await label('2026-10-07T11:00:00Z')).toBe('Tutup · buka besok 08.00');
    expect(await label('2026-10-10T03:00:00Z')).toBe('Buka · tutup 12.00');
    expect(await label('2026-10-10T06:00:00Z')).toBe('Tutup · buka Senin 08.00');
    expect(await label('2026-10-14T03:00:00Z', '04-tanggal-khusus-tutup')).toBe(
      'Tutup · buka besok 08.00',
    );
    expect(
      await visitorLabel(
        browser,
        venueId,
        '2026-10-07T03:00:00Z',
        'ruang tunggu',
        'Ruang Tunggu Ümum',
        '05-segera-buka',
      ),
    ).toMatch(/^Segera buka · mulai /);
  });
});
