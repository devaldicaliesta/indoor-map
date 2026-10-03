import type { Venue } from '@indoor/domain';
import { env } from '../../env';
import { expect, test } from '../../fixtures';
import { AdminShell } from '../../pages/admin-shell';
import { currentLicenseId, devLicenseFile, restoreLicense, sql } from '../../support/license';

const shot = (name: string) => `evidence/T-407/${name}.png`;

test.describe.configure({ mode: 'serial' });

test.describe('T-407 Info Point di Admin', () => {
  let original = '';

  test.beforeAll(() => {
    original = currentLicenseId();
  });

  test.afterAll(() => {
    restoreLicense(original);
  });

  test('tambah Info Point, salin URL, kuota ditegakkan', async ({
    page,
    context,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    const { publicVisitorUrl } = await superAdmin.systemSettings.get();
    await superAdmin.systemSettings.update({ publicVisitorUrl: env.visitorUrl });
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const used = Number(sql('select count(*) from public.info_points'));
    // Masih ada tempat untuk tepat satu Info Point.
    await superAdmin.license.activateManual(
      await devLicenseFile({
        quota: { venues: 100000, buildings: 100000, floors: 100000, infoPoints: used + 1 },
      }),
    );
    try {
      await loginAs('editor');
      await new AdminShell(page).selectVenue(fullVenue.name);
      await page.goto('/origin-points');
      await page.getByRole('tab', { name: 'Info Point' }).click();

      await page.getByRole('button', { name: 'Tambah Info Point' }).click();
      const dialog = page.getByRole('dialog', { name: 'Tambah Info Point' });
      await dialog.getByLabel('Kode').fill('IP-E2E');
      await dialog.getByLabel('Nama').fill('Layar Lobi E2E');
      await dialog.getByLabel('Gedung dan lantai').click();
      await page.getByRole('option', { name: /GF/ }).first().click();
      const map = dialog.getByTestId('origin-map');
      await expect(map.locator('canvas')).toBeVisible();
      await map.click();
      await dialog.getByRole('button', { name: 'Putar +15°' }).click();
      await dialog.getByLabel(/Kembali ke awal/).fill('10');
      await dialog.getByRole('button', { name: 'Simpan' }).click();
      await expect(dialog.getByText('Durasi idle 15–600 detik.')).toBeVisible();
      await dialog.getByLabel(/Kembali ke awal/).fill('90');
      await dialog.getByLabel('Paksa 2D (perangkat lemah)').check();
      await page.screenshot({ path: shot('01-dialog-tambah') });
      await dialog.getByRole('button', { name: 'Simpan' }).click();
      await expect(page.getByText('Info Point disimpan dan ditempelkan ke jalur')).toBeVisible();

      const row = page.getByRole('row').filter({ hasText: 'Layar Lobi E2E' });
      await expect(row).toContainText('15°');
      await expect(row).toContainText('2D (dipaksa) · ID · idle 90 s');
      await expect(row.getByText('Tidak menempel ke jalur')).toHaveCount(0);
      await row.getByRole('button', { name: 'Salin URL Info Point' }).click();
      const url = await page.evaluate(() => navigator.clipboard.readText());
      expect(url).toBe(`${env.visitorUrl}/ip/IP-E2E?venue=${venueId}`);

      // Kuota penuh: tombol tambah nonaktif dan server menolak.
      await expect(page.getByRole('button', { name: 'Tambah Info Point' })).toBeDisabled();
      await expect(page.getByText(/Kuota paket tercapai \(Info Point/)).toBeVisible();
      await page.screenshot({ path: shot('02-daftar-kuota-penuh') });
      expect(sql(`select node_id is not null from public.info_points where code = 'IP-E2E'`)).toBe(
        't',
      );

      // URL membuka rute Info Point Visitor (mode lengkapnya dibuat di T-408).
      const visitor = await context.newPage();
      await visitor.goto(url);
      await expect(visitor).toHaveURL(/\/ip\/IP-E2E/);
      await visitor.close();
    } finally {
      await superAdmin.systemSettings.update({ publicVisitorUrl });
    }
  });
});
