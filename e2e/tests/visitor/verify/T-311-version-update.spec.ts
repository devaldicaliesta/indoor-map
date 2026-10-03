import { EMPTY_OPENING_HOURS, type Venue } from '@indoor/domain';
import { expect, test } from '../../../fixtures';
import { VisitorPage } from '../../../pages/visitor-page';

const shot = (name: string) => `evidence/T-311/${name}.png`;

test.describe('T-311 Visitor: pembaruan versi', () => {
  test('rute yang terbuka tidak berubah setelah publish; refresh memuat versi baru', async ({
    page,
    fullVenue,
    superAdmin,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    await superAdmin.publications.publish(venueId);
    const visitor = new VisitorPage(page);
    await visitor.goto(venueId);

    await page.getByRole('button', { name: 'English' }).click();
    await page.getByRole('searchbox').fill('L1-B08');
    await visitor.results.filter({ hasText: 'L1-B08' }).first().click();
    await visitor.profile.getByRole('button', { name: 'Directions to here' }).click();
    await page.getByRole('searchbox').fill('GF-B08');
    await visitor.results.filter({ hasText: 'GF-B08' }).first().click();
    await visitor.profile.getByRole('button', { name: "I'm here" }).click();
    const route = page.getByRole('region', { name: 'Route' });
    await expect(route).toBeVisible();
    const before = await route.innerText();
    await page.screenshot({ path: shot('01-rute-versi-1') });

    // Admin menerbitkan versi 2 berisi lokasi baru selagi rute terbuka.
    const snapshotRequests: string[] = [];
    page.on('request', (r) => {
      if (r.url().endsWith('/latest.json')) snapshotRequests.push(r.url());
    });
    const [type] = await superAdmin.categories.listTypes(venueId);
    if (!type) throw new Error('venue tanpa tipe lokasi');
    await superAdmin.locations.save(
      venueId,
      type.id,
      null,
      {
        code: 'V2-01',
        name: 'Klinik Versi Dua',
        description: '',
        categoryIds: [],
        unitIds: [],
        primaryUnitId: null,
        customFields: {},
        status: 'coming_soon',
        openingDate: '2099-01-01',
        hours: EMPTY_OPENING_HOURS,
      },
      { keepPhotoPaths: [], newPhotos: [] },
    );
    expect((await superAdmin.publications.publish(venueId)).version).toBe(2);

    // Tanpa refresh: rute sama persis dan snapshot tidak diunduh ulang.
    await page.waitForTimeout(3000);
    await expect(route).toBeVisible();
    expect(await route.innerText()).toBe(before);
    expect(snapshotRequests).toEqual([]);
    await page.screenshot({ path: shot('02-rute-tetap-setelah-publish') });

    // Refresh: versi baru terpakai.
    await page.reload();
    await page.getByRole('searchbox').fill('Klinik Versi Dua');
    await expect(visitor.results.filter({ hasText: 'Klinik Versi Dua' })).toHaveCount(1);
    expect(snapshotRequests.length).toBeGreaterThan(0);
    await page.screenshot({ path: shot('03-refresh-versi-2') });
  });
});
