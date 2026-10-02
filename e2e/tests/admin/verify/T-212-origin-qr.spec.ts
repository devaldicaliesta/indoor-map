import { readFile } from 'node:fs/promises';
import type { Venue } from '@indoor/domain';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';

const shot = (name: string) => `evidence/T-212/${name}.png`;

test.describe('T-212 QR titik asal', () => {
  test('tambah, ubah arah, unduh PDF/PNG, QR membuka Visitor di titik itu, hapus', async ({
    page,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    // URL publik Visitor berlaku untuk seluruh instalasi: diarahkan ke Visitor lokal, lalu dikembalikan.
    const { publicVisitorUrl } = await superAdmin.systemSettings.get();
    await superAdmin.systemSettings.update({ publicVisitorUrl: env.visitorUrl });
    try {
      await loginAs('editor');
      await new AdminShell(page).selectVenue(fullVenue.name);
      await page.goto('/origin-points');
      // Fixture sudah punya "Lobi Utama".
      await expect(page.getByRole('row').filter({ hasText: 'Lobi Utama' })).toBeVisible();

      // Tambah: nama, lantai, klik peta, arah hadap.
      await page.getByRole('button', { name: 'Tambah titik asal' }).click();
      const dialog = page.getByRole('dialog', { name: 'Tambah titik asal' });
      await dialog.getByLabel('Nama').fill('Lobi Ümum Selatan');
      await dialog.getByLabel('Gedung dan lantai').click();
      await page.getByRole('option', { name: /GF/ }).first().click();
      const map = dialog.getByTestId('origin-map');
      await expect(map.locator('canvas')).toBeVisible();
      await map.click();
      await dialog.getByRole('button', { name: 'Putar +15°' }).click();
      await dialog.getByRole('button', { name: 'Putar +15°' }).click();
      await expect(dialog.getByLabel(/Arah hadap/)).toHaveValue('30');
      await page.screenshot({ path: shot('01-dialog-tambah') });
      await dialog.getByRole('button', { name: 'Simpan' }).click();
      await expect(page.getByText('Titik asal disimpan dan ditempelkan ke jalur')).toBeVisible();
      const row = page.getByRole('row').filter({ hasText: 'Lobi Ümum Selatan' });
      await expect(row).toContainText('30°');
      await expect(row.getByText('Tidak menempel ke jalur')).toHaveCount(0);

      // Ubah arah hadap.
      await row.getByRole('button', { name: 'Ubah' }).click();
      const edit = page.getByRole('dialog', { name: 'Ubah titik asal' });
      await edit.getByLabel(/Arah hadap/).fill('90');
      await edit.getByRole('button', { name: 'Simpan' }).click();
      await expect(row).toContainText('90°');
      await page.screenshot({ path: shot('02-daftar') });

      // Unduh PDF A6 dan PNG.
      for (const [button, ext, magic] of [
        ['PDF A6', '.pdf', '%PDF'],
        ['PNG', '.png', '\x89PNG'],
      ] as const) {
        const [download] = await Promise.all([
          page.waitForEvent('download'),
          row.getByRole('button', { name: button }).click(),
        ]);
        expect(download.suggestedFilename()).toMatch(new RegExp(`^qr-lobi-umum-selatan\\${ext}$`));
        const bytes = await readFile(await download.path());
        expect(bytes.subarray(0, 4).toString('latin1')).toBe(magic);
      }

      // "Coba" membuka tautan yang sama dengan isi QR: Visitor dengan titik asal ini.
      await superAdmin.publications.publish(venueId);
      const [visitor] = await Promise.all([
        page.waitForEvent('popup'),
        row.getByRole('button', { name: 'Coba' }).click(),
      ]);
      expect(visitor.url()).toContain(env.visitorUrl);
      expect(visitor.url()).toMatch(/[?&]o=/);
      await expect(visitor.getByText(/Anda di sini/)).toBeVisible();
      await expect(visitor.getByText('Lobi Ümum Selatan')).toBeVisible();
      await visitor.screenshot({ path: shot('03-visitor-dari-qr') });
      await visitor.close();

      // Hapus.
      await row.getByRole('button', { name: 'Hapus' }).click();
      await page
        .getByRole('dialog', { name: /Hapus titik asal/ })
        .getByRole('button', { name: 'Hapus' })
        .click();
      await expect(page.getByText('Titik asal dihapus')).toBeVisible();
      // Fixture sudah punya "Lobi Utama".
      await expect(page.getByRole('row').filter({ hasText: 'Lobi Utama' })).toBeVisible();
      await page.screenshot({ path: shot('04-dihapus') });
    } finally {
      await superAdmin.systemSettings.update({ publicVisitorUrl });
    }
  });
});
