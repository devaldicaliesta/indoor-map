import { EMPTY_OPENING_HOURS, type VenueId } from '@indoor/domain';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';

const shot = (name: string) => `evidence/T-309/${name}.png`;

test.describe('T-309 Preview', () => {
  test('preview HP dan Info Point, 2D dan 3D, menampilkan draft yang belum dipublish', async ({
    page,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    const venueId = fullVenue.venueId as VenueId;
    const before = await superAdmin.systemSettings.publicVisitorUrl();
    await superAdmin.systemSettings.update({ publicVisitorUrl: env.visitorUrl });
    try {
      // Lokasi baru hanya ada di draft: tidak pernah dipublish.
      const [type] = await superAdmin.categories.listTypes(venueId);
      if (!type) throw new Error('venue tanpa tipe lokasi');
      await superAdmin.locations.save(
        venueId,
        type.id,
        null,
        {
          code: 'DRAFT-01',
          name: 'Klinik Draft Preview',
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

      const venue = await superAdmin.venues.get(venueId);
      await loginAs('admin');
      await new AdminShell(page).selectVenue(venue.name);
      await page.goto('/publish');
      const panel = page.getByRole('region', { name: 'Preview draft' });
      await panel.getByRole('button', { name: 'Buka preview' }).click();

      const phone = panel.locator('iframe[title="Preview HP 2D"]');
      await expect(phone).toHaveAttribute('width', '390');
      const visitor = phone.contentFrame();
      await expect(visitor.getByRole('status').filter({ hasText: 'Preview draft' })).toBeVisible();
      await visitor.getByRole('searchbox', { name: 'Cari lokasi' }).fill('Klinik Draft');
      await expect(
        visitor.getByRole('button', { name: /Klinik Draft Preview/ }).first(),
      ).toBeVisible();
      await page.screenshot({ path: shot('01-hp-2d-draft') });

      await panel.getByRole('button', { name: '3D' }).click();
      const phone3d = panel.locator('iframe[title="Preview HP 3D"]');
      await expect(phone3d.contentFrame().getByTestId('venue-map')).toBeVisible();
      await page.screenshot({ path: shot('02-hp-3d') });

      await panel.getByRole('button', { name: 'Info Point' }).click();
      const kiosk = panel.locator('iframe[title="Preview Info Point 3D"]');
      await expect(kiosk).toHaveAttribute('width', '1080');
      await expect(kiosk).toHaveAttribute('src', /[?&]ip=/);
      await expect(panel.getByLabel('Posisi Info Point')).toBeVisible();
      await expect(kiosk.contentFrame().getByTestId('venue-map')).toBeVisible();
      await page.screenshot({ path: shot('03-info-point-3d') });

      await panel.getByRole('button', { name: '2D' }).click();
      await expect(
        panel
          .locator('iframe[title="Preview Info Point 2D"]')
          .contentFrame()
          .getByTestId('venue-map'),
      ).toBeVisible();
      await page.screenshot({ path: shot('04-info-point-2d') });

      // Preview tidak menerbitkan apa pun.
      expect(await superAdmin.publications.active(venueId)).toBeNull();
    } finally {
      await superAdmin.systemSettings.update({ publicVisitorUrl: before });
    }
  });
});
