import { ACCOUNTS } from '../../../accounts';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';

const shot = (name: string) => `evidence/T-310/${name}.png`;

test.describe('T-310 Publish berversi, riwayat, rollback', () => {
  test('publish dengan catatan, riwayat versi, rollback dari dialog; Editor tanpa tombol', async ({
    page,
    loginAs,
    superAdmin,
    publishedVenue,
  }) => {
    const { venue } = publishedVenue;
    await loginAs('admin');
    await new AdminShell(page).selectVenue(venue.name);
    await page.goto('/publish');
    await expect(page.getByRole('button', { name: 'Terbitkan (dev)' })).toHaveCount(0);

    await page.getByRole('button', { name: 'Terbitkan', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/Catatan rilis/).fill('Perbaikan jalur lobi');
    await page.screenshot({ path: shot('01-dialog-publish') });
    await dialog.getByRole('button', { name: 'Terbitkan' }).click();
    await expect(page.getByText('Versi 2 diterbitkan')).toBeVisible();

    const history = page.getByRole('region', { name: 'Riwayat versi' });
    const row = (version: number) =>
      history
        .getByRole('row')
        .filter({ has: page.getByRole('cell', { name: new RegExp(`^v${version}\\b`) }) });
    await expect(row(2)).toContainText('Perbaikan jalur lobi');
    await expect(row(2)).toContainText('Aktif');
    await expect(row(2)).toContainText('Publish');
    await expect(row(1)).toContainText('Super Admin Lokal');

    await row(1).getByRole('button', { name: 'Aktifkan kembali' }).click();
    await expect(dialog.getByText(/Draft di editor tidak berubah/)).toBeVisible();
    await dialog.getByLabel(/Catatan rilis/).fill('Kembali ke v1');
    await page.screenshot({ path: shot('02-dialog-rollback') });
    await dialog.getByRole('button', { name: 'Aktifkan v1' }).click();
    await expect(page.getByText('Versi 3 aktif')).toBeVisible();
    await expect(row(3)).toContainText('Rollback dari v1');
    await expect(row(3)).toContainText('Kembali ke v1');
    await expect(row(3)).toContainText('Aktif');
    await expect(row(3).getByRole('button', { name: 'Aktifkan kembali' })).toHaveCount(0);
    await page.screenshot({ path: shot('03-riwayat') });
    expect((await superAdmin.publications.active(venue.id))?.version).toBe(3);

    // Editor melihat riwayat tanpa tombol publish dan rollback.
    await new AdminShell(page).signOut(ACCOUNTS.admin.name);
    await loginAs('editor');
    await new AdminShell(page).selectVenue(venue.name);
    await page.goto('/publish');
    await expect(history.getByRole('row')).toHaveCount(4);
    await expect(page.getByRole('button', { name: 'Terbitkan', exact: true })).toHaveCount(0);
    await expect(history.getByRole('button', { name: 'Aktifkan kembali' })).toHaveCount(0);
    await page.screenshot({ path: shot('04-editor-baca-saja') });
  });
});
