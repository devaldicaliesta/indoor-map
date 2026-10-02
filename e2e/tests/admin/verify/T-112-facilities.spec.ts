import type { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';
import { at } from '../../../support/editor-draw';

const shot = (name: string) => `evidence/T-112/${name}.png`;

async function capture(page: Page, name: string) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await page.screenshot({ path: shot(name), fullPage: true });
}

/** Ikon PNG 96 × 96 (tanda tambah) yang digambar di browser. */
async function iconPng(page: Page): Promise<Buffer> {
  const base64 = await page.evaluate(() => {
    const c = document.createElement('canvas');
    c.width = 96;
    c.height = 96;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('canvas 2d tidak tersedia');
    // Siluet berlatar transparan: ikon peta dirender dari kanal alfa (warna diganti tema).
    ctx.fillStyle = '#000000';
    ctx.fillRect(38, 10, 20, 76);
    ctx.fillRect(10, 38, 76, 20);
    return c.toDataURL('image/png').split(',')[1] ?? '';
  });
  return Buffer.from(base64, 'base64');
}

test.describe('T-112 Fasilitas dan jenis fasilitas', () => {
  test('CRUD jenis (ikon bawaan/unggahan, keselamatan), fasilitas di peta, jenis dipakai tidak bisa dihapus', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    const { venue, floor } = testVenue;
    await loginAs('admin');
    await new AdminShell(page).selectVenue(venue.name);
    await page.goto('/settings');
    await expect(page.getByText('Belum ada jenis fasilitas')).toBeVisible();
    await capture(page, '01-kosong');

    const add = async () => {
      await page.getByRole('button', { name: 'Tambah jenis' }).first().click();
      return page.getByRole('dialog', { name: 'Tambah jenis fasilitas' });
    };

    // Validasi nama kosong.
    let dialog = await add();
    await dialog.getByRole('button', { name: 'Tambah jenis' }).click();
    await expect(dialog.getByText('Nama jenis wajib diisi.')).toBeVisible();

    // Jenis dengan ikon bawaan.
    await dialog.getByLabel('Nama').fill('Ruang Laktasi Ümmü');
    await dialog
      .getByRole('radiogroup', { name: 'Ikon bawaan' })
      .getByRole('radio', { name: 'P3K' })
      .click();
    await capture(page, '02-form-ikon-bawaan');
    await dialog.getByRole('button', { name: 'Tambah jenis' }).click();
    await expect(page.getByText('Jenis fasilitas ditambahkan')).toBeVisible();

    // Fasilitas keselamatan dengan ikon unggahan.
    dialog = await add();
    await dialog.getByLabel('Nama').fill('APAR & Hidran');
    await dialog.getByLabel('Atau unggah ikon sendiri').setInputFiles({
      name: 'apar.png',
      mimeType: 'image/png',
      buffer: await iconPng(page),
    });
    await dialog.getByRole('checkbox', { name: /Fasilitas keselamatan/ }).check();
    await expect(dialog.getByRole('img', { name: 'Pratinjau ikon di peta' })).toBeVisible();
    await capture(page, '02b-form-keselamatan-unggah');
    await dialog.getByRole('button', { name: 'Tambah jenis' }).click();
    await expect(dialog).toBeHidden();

    // Nama ganda ditolak.
    dialog = await add();
    await dialog.getByLabel('Nama').fill('ruang laktasi ümmü');
    await dialog.getByRole('button', { name: 'Tambah jenis' }).click();
    await expect(dialog.getByText('Nama ini sudah dipakai jenis lain di venue ini.')).toBeVisible();
    await capture(page, '06-error-nama-ganda');
    await page.keyboard.press('Escape');

    const apar = page.getByRole('row').filter({ hasText: 'APAR & Hidran' });
    await expect(apar.getByRole('img', { name: 'Ikon APAR & Hidran' })).toBeVisible();
    await capture(page, '03-daftar-jenis');
    const types = await superAdmin.facilityTypes.list(venue.id);
    expect(types.find((t) => t.name === 'APAR & Hidran')).toMatchObject({ isSafety: true });
    expect(types.find((t) => t.name === 'Ruang Laktasi Ümmü')).toMatchObject({ isSafety: false });
    // Ikon unggahan tersimpan di Storage dan bisa dimuat sebagai PNG.
    const uploaded = types.find((t) => t.name === 'APAR & Hidran')?.icon;
    expect(uploaded?.kind).toBe('upload');
    if (uploaded?.kind !== 'upload') throw new Error('ikon unggahan tidak tersimpan');
    const iconResponse = await fetch(superAdmin.facilityTypes.iconUrl(uploaded.path));
    expect(iconResponse.status, superAdmin.facilityTypes.iconUrl(uploaded.path)).toBe(200);
    expect(iconResponse.headers.get('content-type')).toContain('image/png');

    // Ubah nama.
    await page
      .getByRole('row')
      .filter({ hasText: 'Ruang Laktasi Ümmü' })
      .getByRole('button', { name: 'Ubah' })
      .click();
    const edit = page.getByRole('dialog', { name: 'Ubah Ruang Laktasi Ümmü' });
    await edit.getByLabel('Nama').fill('Ruang Laktasi');
    await edit.getByRole('button', { name: 'Simpan jenis' }).click();
    await expect(page.getByText('Jenis fasilitas disimpan')).toBeVisible();

    // Tempatkan fasilitas APAR di Editor Peta.
    await page.goto('/map-editor');
    const editor = new EditorPage(page);
    await editor.waitReady();
    await editor.tool('Titik').click();
    await page
      .getByRole('radiogroup', { name: 'Jenis fitur yang digambar' })
      .getByRole('radio', { name: 'Fasilitas' })
      .click();
    await page.getByRole('combobox', { name: 'Jenis fasilitas' }).click();
    await page.getByRole('option', { name: 'APAR & Hidran' }).click();
    await expect(page.getByRole('listbox')).toBeHidden();
    const spot = await at(editor, 0, 0);
    await page.mouse.click(spot.x, spot.y);
    await expect(editor.saveStatus('Tersimpan')).toBeVisible();
    await page.screenshot({ path: shot('04-fasilitas-di-peta') });
    await expect
      .poll(async () =>
        (await superAdmin.features.listByFloor(floor.id)).features.map((f) => f.properties.kind),
      )
      .toEqual(['facility']);

    // Jenis yang dipakai tidak bisa dihapus; yang tidak dipakai bisa.
    await page.goto('/settings');
    await expect(apar.getByRole('cell', { name: '1' })).toBeVisible();
    await apar.getByRole('button', { name: 'Hapus' }).click();
    const inUse = page.getByRole('dialog', { name: 'APAR & Hidran masih dipakai' });
    await expect(inUse.getByRole('button', { name: 'Hapus jenis' })).toHaveCount(0);
    await expect(inUse).toHaveCSS('opacity', '1');
    await capture(page, '05-masih-dipakai');
    await inUse
      .locator('[data-slot="dialog-footer"]')
      .getByRole('button', { name: 'Tutup' })
      .click();
    await page
      .getByRole('row')
      .filter({ hasText: 'Ruang Laktasi' })
      .getByRole('button', { name: 'Hapus' })
      .click();
    await page
      .getByRole('dialog', { name: 'Hapus jenis Ruang Laktasi?' })
      .getByRole('button', { name: 'Hapus jenis' })
      .click();
    await expect(page.getByText('Jenis Ruang Laktasi dihapus')).toBeVisible();
    expect((await superAdmin.facilityTypes.list(venue.id)).map((t) => t.name)).toEqual([
      'APAR & Hidran',
    ]);
  });
});
