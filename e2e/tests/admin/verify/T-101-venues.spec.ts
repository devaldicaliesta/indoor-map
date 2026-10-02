import type { DataClient } from '@indoor/data';
import type { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';

const shot = (name: string) => `evidence/T-101/${name}.png`;

async function capture(page: Page, name: string) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await page.screenshot({ path: shot(name), fullPage: true });
}

/** Logo PNG 128 × 128 yang digambar di browser (bukan berkas biner di repo). */
async function makeLogo(page: Page): Promise<Buffer> {
  const base64 = await page.evaluate(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d tidak tersedia');
    ctx.fillStyle = '#0f6b5c';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(52, 20, 24, 88);
    ctx.fillRect(20, 52, 88, 24);
    return canvas.toDataURL('image/png').split(',')[1] ?? '';
  });
  return Buffer.from(base64, 'base64');
}

async function removeByName(superAdmin: DataClient, ...names: string[]) {
  for (const v of await superAdmin.venues.listDetailed()) {
    if (names.includes(v.name)) await superAdmin.venues.remove(v.id);
  }
}

test.describe('T-101 Venue dan multi-venue', () => {
  test('TC-VEN buat lewat wizard (logo, template), validasi, ubah, hapus dengan konfirmasi', async ({
    page,
    loginAs,
    superAdmin,
    variedVenues,
  }) => {
    const suffix = Date.now().toString(36).slice(-5);
    const name = `RS Ümmü Café & Klinik 'Sehat' ${suffix}`;
    const renamed = `RS Ümmü Sehat Sentosa ${suffix}`;
    try {
      await loginAs('super_admin');
      await page.goto('/venues');
      await page.getByRole('tab', { name: 'Semua venue' }).click();
      for (const v of variedVenues)
        await expect(page.getByRole('cell', { name: v.name })).toBeVisible();
      await capture(page, '01-daftar-venue');

      // Validasi per kolom.
      await page.getByRole('button', { name: 'Tambah venue' }).click();
      const dialog = page.getByRole('dialog', { name: 'Tambah venue' });
      await dialog.getByLabel('Titik pusat').fill('bukan koordinat');
      await dialog.getByRole('button', { name: 'Lanjut' }).click();
      await expect(dialog.getByText('Nama venue wajib diisi.')).toBeVisible();
      await expect(
        dialog.getByText('Tempel koordinat seperti -6.175400, 106.827200.'),
      ).toBeVisible();
      await capture(page, '06-error-validasi');

      // Langkah 1: data dasar + logo.
      await dialog.getByLabel('Nama').fill(name);
      await dialog
        .getByLabel('Alamat')
        .fill('Jl. Prof. Dr. Soepomo No. 12, Tebet, Jakarta Selatan 12810');
      await dialog.getByLabel('Titik pusat').fill('-5.147665, 119.432731');
      await dialog.getByRole('combobox', { name: 'Zona waktu' }).click();
      await page
        .getByRole('option', { name: /Makassar/ })
        .first()
        .click();
      await dialog.getByLabel('Logo').setInputFiles({
        name: 'logo.png',
        mimeType: 'image/png',
        buffer: await makeLogo(page),
      });
      await capture(page, '02-form-langkah-1');
      await dialog.getByRole('button', { name: 'Lanjut' }).click();
      await expect(dialog.getByText('Nama venue wajib diisi.')).toHaveCount(0);

      // Langkah 2: tipe venue dengan pratinjau isi template.
      await dialog.getByRole('radio', { name: 'Rumah sakit' }).check();
      await capture(page, '02b-pilih-tipe');
      await dialog.getByRole('button', { name: 'Lanjut' }).click();
      await expect(dialog.getByText('Langkah 3 dari 3 · Konfirmasi')).toBeVisible();
      await expect(dialog.getByText(name)).toBeVisible();
      await dialog.getByRole('button', { name: 'Buat venue' }).click();
      await expect(page.getByText('Venue dibuat')).toBeVisible();
      await expect(dialog).toBeHidden();
      const shell = new AdminShell(page);
      await expect(shell.venuePicker).toHaveText(name);
      const row = page.getByRole('row').filter({ hasText: name });
      await expect(row.locator('img')).toHaveJSProperty('complete', true);
      expect(await row.locator('img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(
        128,
      );
      await capture(page, '03-tersimpan');

      // Database: nilai tersimpan, logo diunggah, isi template tersalin.
      const created = (await superAdmin.venues.listDetailed()).find((v) => v.name === name);
      expect(created).toMatchObject({
        address: 'Jl. Prof. Dr. Soepomo No. 12, Tebet, Jakarta Selatan 12810',
        timezone: 'Asia/Makassar',
      });
      expect(created?.logoPath).toBeTruthy();
      expect(created?.center?.coordinates).toEqual([119.432731, -5.147665]);
      if (!created) throw new Error('venue tidak tersimpan');
      expect((await superAdmin.categories.listTypes(created.id)).length).toBeGreaterThan(0);
      expect((await superAdmin.facilityTypes.list(created.id)).length).toBeGreaterThan(0);

      // Ubah: nilai baru tampil dan terbaca setelah muat ulang.
      await row.getByRole('button', { name: 'Ubah' }).click();
      const edit = page.getByRole('dialog', { name: `Ubah ${name}` });
      await edit.getByLabel('Nama').fill(renamed);
      await edit.getByRole('button', { name: 'Simpan venue' }).click();
      await expect(edit).toBeHidden();
      await page.reload();
      await page.getByRole('tab', { name: 'Semua venue' }).click();
      await expect(page.getByRole('cell', { name: renamed, exact: true })).toBeVisible();
      await capture(page, '04-diubah');

      // Hapus: tombol aktif hanya setelah nama diketik persis.
      await page
        .getByRole('row')
        .filter({ hasText: renamed })
        .getByRole('button', { name: 'Hapus' })
        .click();
      const del = page.getByRole('dialog', { name: `Hapus ${renamed}?` });
      const confirm = del.getByRole('button', { name: 'Hapus venue' });
      await expect(confirm).toBeDisabled();
      await del.getByRole('textbox').fill(renamed.toLowerCase());
      await expect(confirm).toBeDisabled();
      await del.getByRole('textbox').fill(renamed);
      await capture(page, '05-konfirmasi-hapus');
      await confirm.click();
      await expect(page.getByText(`${renamed} dihapus`)).toBeVisible();
      await expect(page.getByRole('cell', { name: renamed, exact: true })).toHaveCount(0);
      expect((await superAdmin.venues.listDetailed()).some((v) => v.id === created.id)).toBe(false);
      await capture(page, '05b-dihapus');
    } finally {
      await removeByName(superAdmin, name, renamed);
    }
  });

  test('TC-VEN-07 keadaan kosong tab Gedung untuk venue tanpa gedung', async ({
    page,
    loginAs,
    variedVenues,
  }) => {
    const factory = variedVenues.find((v) => v.timezone === 'Asia/Jayapura');
    if (!factory) throw new Error('fixture venue tanpa gedung tidak ada');
    await loginAs('admin');
    await new AdminShell(page).selectVenue(factory.name);
    await page.goto('/venues');
    await expect(page.getByRole('button', { name: 'Tambah gedung' })).toBeVisible();
    await capture(page, '07-gedung-kosong');
  });
});
