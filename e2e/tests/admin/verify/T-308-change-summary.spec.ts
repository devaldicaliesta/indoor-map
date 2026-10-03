import { FeatureIdSchema } from '@indoor/domain';
import { expect, TEST_CENTER, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';

const shot = (name: string) => `evidence/T-308/${name}.png`;

test.describe('T-308 Ringkasan perubahan', () => {
  test('ringkasan menyebut jumlah dan daftar perubahan per kelompok sejak versi published', async ({
    page,
    loginAs,
    superAdmin,
    publishedVenue,
  }) => {
    const { venue, floor, vacantUnitId } = publishedVenue;
    await loginAs('admin');
    await new AdminShell(page).selectVenue(venue.name);
    await page.goto('/publish');
    const panel = page.getByRole('region', { name: 'Ringkasan perubahan' });
    await panel.getByRole('button', { name: 'Lihat perubahan' }).click();
    await expect(panel.getByText('Draft sama dengan versi published.')).toBeVisible();
    await page.screenshot({ path: shot('01-tanpa-perubahan') });

    // Satu unit baru dan satu unit dihapus setelah versi published.
    const newUnitId = FeatureIdSchema.parse(crypto.randomUUID());
    const [x, y] = TEST_CENTER;
    const h = 0.00004;
    await superAdmin.features.save(venue.id, {
      type: 'Feature',
      id: newUnitId,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [x - h, y + 0.0003 + h],
            [x + h, y + 0.0003 + h],
            [x + h, y + 0.0003 - h],
            [x - h, y + 0.0003 - h],
            [x - h, y + 0.0003 + h],
          ],
        ],
      },
      properties: {
        id: newUnitId,
        kind: 'unit',
        floorId: floor.id,
        name: 'Ruang Tunggu Baru',
        unitCode: 'BARU-01',
        unitStatus: 'vacant',
      },
    });
    await superAdmin.features.remove(vacantUnitId);

    await panel.getByRole('button', { name: 'Hitung ulang' }).click();
    const features = panel.locator('details').filter({ hasText: /^Fitur peta: \d+ perubahan/ });
    await expect(features.locator('summary')).toHaveText(/Fitur peta: 2 perubahan/);
    await features.locator('summary').click();
    await expect(features.getByRole('heading', { name: 'Ditambah (1)' })).toBeVisible();
    await expect(features.getByRole('heading', { name: 'Dihapus (1)' })).toBeVisible();
    await expect(
      features.getByRole('listitem').filter({ hasText: 'Ruang Tunggu Baru' }),
    ).toHaveCount(1);
    await expect(features.getByRole('listitem').filter({ hasText: 'UJI-GF-002' })).toHaveCount(1);
    await expect(panel.getByText('Lokasi: tidak ada perubahan')).toBeVisible();
    await page.screenshot({ path: shot('02-perubahan-fitur') });
  });
});
