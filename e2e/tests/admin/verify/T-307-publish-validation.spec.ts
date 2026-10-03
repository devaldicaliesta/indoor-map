import { EMPTY_OPENING_HOURS, FeatureIdSchema } from '@indoor/domain';
import { expect, TEST_CENTER, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';

const shot = (name: string) => `evidence/T-307/${name}.png`;

test.describe('T-307 Validasi publish lengkap', () => {
  test('Error dan Peringatan dikelompokkan, Error memblokir publish, klik temuan membuka lantai dan menyorot fitur', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    const { venue, floor } = testVenue;
    // Unit tanpa titik masuk dan lokasi aktif tanpa unit: dua Error.
    const unitId = FeatureIdSchema.parse(crypto.randomUUID());
    const [x, y] = TEST_CENTER;
    const h = 0.00008;
    await superAdmin.features.save(venue.id, {
      type: 'Feature',
      id: unitId,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [x - h, y + h],
            [x + h, y + h],
            [x + h, y - h],
            [x - h, y - h],
            [x - h, y + h],
          ],
        ],
      },
      properties: {
        id: unitId,
        kind: 'unit',
        floorId: floor.id,
        unitCode: 'VAL-001',
        unitStatus: 'occupied',
      },
    });
    const [type] = await superAdmin.categories.listTypes(venue.id);
    if (!type) throw new Error('venue uji tanpa tipe lokasi');
    await superAdmin.locations.save(
      venue.id,
      type.id,
      null,
      {
        code: 'VAL-L1',
        name: 'Klinik Tanpa Unit',
        description: '',
        categoryIds: [],
        unitIds: [],
        primaryUnitId: null,
        customFields: {},
        status: 'active',
        openingDate: null,
        hours: EMPTY_OPENING_HOURS,
      },
      { keepPhotoPaths: [], newPhotos: [] },
    );

    await loginAs('admin');
    await new AdminShell(page).selectVenue(venue.name);
    await page.goto('/publish');
    const panel = page.getByRole('region', { name: 'Validasi draft' });
    await expect(panel.getByText(/Periksa draft sebelum menerbitkan/)).toBeVisible();
    await panel.getByRole('button', { name: 'Validasi' }).click();
    const errors = panel.getByRole('region', { name: /^Error \(\d+\)$/ });
    await expect(errors).toBeVisible();
    await expect(
      errors.getByRole('listitem').filter({ hasText: 'belum punya titik masuk' }),
    ).toHaveCount(1);
    await expect(
      errors
        .getByRole('listitem')
        .filter({ hasText: 'Lokasi aktif “Klinik Tanpa Unit” belum menempati unit' }),
    ).toHaveCount(1);
    await page.screenshot({ path: shot('01-temuan-error') });

    // Publish ditolak server; tidak ada versi published.
    await page.getByRole('button', { name: 'Terbitkan', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Terbitkan' }).click();
    await expect(dialog.getByText(/Publish dibatalkan: \d+ Error validasi/)).toBeVisible();
    expect(await superAdmin.publications.active(venue.id)).toBeNull();
    await page.screenshot({ path: shot('02-publish-ditolak') });
    await dialog.getByRole('button', { name: 'Batal' }).click();

    // Klik temuan: editor di lantai itu dengan unit terpilih.
    await errors
      .getByRole('listitem')
      .filter({ hasText: 'belum punya titik masuk' })
      .getByRole('link', { name: 'Buka di editor' })
      .click();
    await expect(page).toHaveURL(new RegExp(`/map-editor\\?.*floor=${floor.id}`));
    const properties = page.getByRole('region', { name: /Properti/ }).first();
    await expect(properties.getByRole('textbox', { name: /Kode unit/ })).toHaveValue('VAL-001');
    await expect(page).not.toHaveURL(/feature=/);
    await page.screenshot({ path: shot('03-fitur-disorot') });

    // Lokasi: tautan membuka lokasinya.
    await page.goto('/publish');
    await panel.getByRole('button', { name: 'Validasi' }).click();
    await errors
      .getByRole('listitem')
      .filter({ hasText: 'Klinik Tanpa Unit' })
      .getByRole('link', { name: 'Buka lokasi' })
      .click();
    await expect(page.getByRole('dialog', { name: /Klinik Tanpa Unit/ })).toBeVisible();
  });
});
