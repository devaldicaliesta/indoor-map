import type { Venue } from '@indoor/domain';
import type { Browser } from '@playwright/test';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { sql } from '../../../support/license';

const shot = (name: string) => `evidence/T-554/${name}.png`;

async function visitorProfile(browser: Browser, venueId: string, language: 'id' | 'en') {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto(`${env.visitorUrl}/v/${venueId}?lang=${language}`);
  await expect(page.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
    timeout: 30_000,
  });
  await page.getByRole('searchbox').fill('radiologi');
  await page.locator('#search-results li').filter({ hasText: 'Radiologi' }).first().click();
  return page;
}

test.describe('T-554 Konten multi-bahasa', () => {
  test('TC-NVX-07: EN tampil untuk konten berterjemahan; yang kosong jatuh ke ID', async ({
    page,
    browser,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    test.setTimeout(180_000);
    const venueId = fullVenue.venueId as Venue['id'];
    await loginAs('admin');
    await new AdminShell(page).selectVenue(fullVenue.name);

    await page.goto('/locations?tab=types');
    await page.getByText('Layanan', { exact: true }).click();
    await page
      .getByRole('row')
      .filter({ hasText: 'Pemeriksaan' })
      .getByRole('button', { name: 'Ubah' })
      .click();
    const category = page.getByRole('dialog');
    await category.getByLabel('Nama (English, opsional)').fill('Examination');
    await page.screenshot({ path: shot('01-kategori-english') });
    await category.getByRole('button', { name: 'Simpan kategori' }).click();
    await expect(page.getByText('Kategori disimpan')).toBeVisible();

    await page.goto('/locations');
    await page
      .getByRole('row')
      .filter({ hasText: 'Radiologi' })
      .getByRole('button', { name: 'Ubah' })
      .click();
    const sheet = page.getByRole('dialog');
    await sheet.getByLabel(/^Deskripsi English/).fill('X-ray and CT scan.');
    await sheet.getByLabel(/^Deskripsi English/).scrollIntoViewIfNeeded();
    await page.screenshot({ path: shot('02-deskripsi-english') });
    await sheet.getByRole('button', { name: 'Simpan lokasi' }).click();
    await expect(page.getByText('Lokasi disimpan')).toBeVisible();
    expect(
      sql(
        `select c.name_en || '|' || l.description_en from public.locations l, public.categories c where l.id = '${fullVenue.ids.radiology}' and c.id = '${fullVenue.ids.examCategory}'`,
      ),
    ).toBe('Examination|X-ray and CT scan.');

    await superAdmin.publications.publish(venueId);
    const english = await visitorProfile(browser, venueId, 'en');
    const profile = english.getByRole('article', { name: 'Radiologi' });
    await expect(profile).toContainText('X-ray and CT scan.');
    await expect(profile).toContainText('Examination');
    await expect(profile).not.toContainText('Rontgen');
    await english.screenshot({ path: shot('03-visitor-en') });
    await english.close();

    const indonesian = await visitorProfile(browser, venueId, 'id');
    const profileId = indonesian.getByRole('article', { name: 'Radiologi' });
    await expect(profileId).toContainText('Rontgen dan CT scan.');
    await expect(profileId).toContainText('Pemeriksaan');
    await indonesian.close();

    sql(
      `update public.locations set description_en = null where id = '${fullVenue.ids.radiology}'`,
    );
    await superAdmin.publications.publish(venueId);
    const fallback = await visitorProfile(browser, venueId, 'en');
    const profileFallback = fallback.getByRole('article', { name: 'Radiologi' });
    await expect(profileFallback).toContainText('Rontgen dan CT scan.');
    await expect(profileFallback).toContainText('Examination');
    await fallback.screenshot({ path: shot('04-visitor-en-jatuh-ke-id') });
    await fallback.close();
  });
});
