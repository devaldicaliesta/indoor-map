import { EMPTY_OPENING_HOURS, FeatureIdSchema } from '@indoor/domain';
import type { Browser } from '@playwright/test';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { VisitorPage } from '../../../pages/visitor-page';

const shot = (name: string) => `evidence/T-117/${name}.png`;

/** Cari di Visitor HP; mengembalikan jumlah hasil yang memuat teks itu. */
async function visitorSearch(browser: Browser, venueId: string, query: string, name: string) {
  const page = await browser.newPage({
    viewport: { width: 360, height: 740 },
    isMobile: true,
    hasTouch: true,
    baseURL: env.visitorUrl,
  });
  try {
    const visitor = new VisitorPage(page);
    await visitor.goto(venueId);
    await visitor.search.fill(query);
    await expect(
      page
        .locator('#search-results')
        .or(page.getByText(/Tidak ada|tidak ditemukan/i))
        .first(),
    ).toBeVisible();
    const count = await visitor.results.filter({ hasText: query }).count();
    await page.screenshot({ path: shot(name) });
    return count;
  } finally {
    await page.close();
  }
}

test.describe('T-117 Snapshot minimal', () => {
  test('perubahan draft tidak tampil di Visitor sampai Publish; setelah Publish tampil', async ({
    page,
    browser,
    loginAs,
    superAdmin,
    publishedVenue,
  }) => {
    const { venue } = publishedVenue;
    const vacantUnitId = FeatureIdSchema.parse(publishedVenue.vacantUnitId);
    const [type] = await superAdmin.categories.listTypes(venue.id);
    if (!type) throw new Error('tipe lokasi tidak ada');
    await superAdmin.locations.save(
      venue.id,
      type.id,
      null,
      {
        code: 'KLB-01',
        name: 'Klinik Kulit Baru',
        description: '',
        categoryIds: [],
        unitIds: [vacantUnitId],
        primaryUnitId: vacantUnitId,
        customFields: {},
        status: 'active',
        openingDate: null,
        hours: EMPTY_OPENING_HOURS,
      },
      { keepPhotoPaths: [], newPhotos: [] },
    );

    expect(
      await visitorSearch(browser, venue.id, 'Klinik Kulit', '01-visitor-sebelum-publish'),
    ).toBe(0);
    expect(await visitorSearch(browser, venue.id, 'Radiologi', '01b-visitor-versi-lama')).toBe(1);

    await loginAs('admin');
    await new AdminShell(page).selectVenue(venue.name);
    await page.goto('/publish');
    await page.getByRole('button', { name: /Terbitkan/ }).click();
    await expect(page.getByText('Versi 2 diterbitkan')).toBeVisible();
    await page.screenshot({ path: shot('02-admin-publish') });
    expect((await superAdmin.publications.active(venue.id))?.version).toBe(2);

    expect(
      await visitorSearch(browser, venue.id, 'Klinik Kulit', '03-visitor-setelah-publish'),
    ).toBe(1);
  });
});
