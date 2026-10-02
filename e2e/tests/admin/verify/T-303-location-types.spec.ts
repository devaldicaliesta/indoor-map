import type { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';

const shot = (name: string) => `evidence/T-303/${name}.png`;

const FIELDS = [
  { label: 'Telepon', kind: 'Teks', required: true },
  { label: 'Kapasitas', kind: 'Angka', required: false },
  { label: 'Jenis lantai', kind: 'Pilihan', required: false, options: 'Karpet\nKeramik' },
  { label: 'Jam layanan', kind: 'Jam operasional (teks)', required: false },
  { label: 'Foto pintu', kind: 'Gambar', required: false },
  { label: 'Situs', kind: 'Tautan', required: false },
] as const;

async function addField(page: Page, typeName: string, field: (typeof FIELDS)[number]) {
  await page.getByRole('button', { name: 'Tambah field' }).click();
  const dialog = page.getByRole('dialog', { name: `Tambah field ${typeName}` });
  await dialog.getByLabel('Label').fill(field.label);
  await dialog.getByLabel('Jenis').click();
  await page.getByRole('option', { name: field.kind, exact: true }).click();
  if ('options' in field) await dialog.getByLabel('Opsi (satu per baris)').fill(field.options);
  if (field.required) await dialog.getByLabel('Wajib diisi').check();
  await dialog.getByRole('button', { name: 'Simpan' }).click();
  await expect(dialog).toBeHidden();
}

test.describe('T-303 Tipe lokasi dan field kustom', () => {
  test('tambah tipe, enam jenis field, validasi, urutan, field wajib di form lokasi, hapus field', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    const { venue } = testVenue;
    const typeName = 'Ruang Ümum Uji';
    const typeOf = async () =>
      (await superAdmin.locationTypes.list(venue.id)).find((t) => t.name === typeName);
    await loginAs('admin');
    await new AdminShell(page).selectVenue(venue.name);
    await page.goto('/locations?tab=types');

    // Tipe baru.
    await page.getByRole('button', { name: 'Tambah tipe' }).click();
    const typeDialog = page.getByRole('dialog', { name: 'Tambah tipe lokasi' });
    await typeDialog.getByLabel('Nama').fill(typeName);
    await typeDialog.getByRole('button', { name: 'Simpan' }).click();
    await expect(typeDialog).toBeHidden();
    await page
      .getByRole('navigation', { name: 'Tipe lokasi' })
      .getByRole('button', { name: typeName })
      .click();
    await expect(page.getByRole('heading', { name: `Field ${typeName}` })).toBeVisible();

    // Validasi: label kosong dan pilihan tanpa opsi.
    await page.getByRole('button', { name: 'Tambah field' }).click();
    const fieldDialog = page.getByRole('dialog', { name: `Tambah field ${typeName}` });
    await fieldDialog.getByLabel('Jenis').click();
    await page.getByRole('option', { name: 'Pilihan', exact: true }).click();
    await fieldDialog.getByRole('button', { name: 'Simpan' }).click();
    await expect(fieldDialog.getByText('Label wajib diisi.')).toBeVisible();
    await expect(fieldDialog.getByText('Isi minimal satu opsi, satu per baris.')).toBeVisible();
    await page.screenshot({ path: shot('01-validasi-field') });
    await fieldDialog.getByRole('button', { name: 'Batal' }).click();

    // Enam jenis field.
    for (const field of FIELDS) await addField(page, typeName, field);
    await expect
      .poll(async () => (await typeOf())?.fields.map((f) => [f.label, f.type, f.isRequired]))
      .toEqual([
        ['Telepon', 'text', true],
        ['Kapasitas', 'number', false],
        ['Jenis lantai', 'select', false],
        ['Jam layanan', 'opening_hours', false],
        ['Foto pintu', 'image', false],
        ['Situs', 'link', false],
      ]);
    expect((await typeOf())?.fields.find((f) => f.label === 'Jenis lantai')?.options).toEqual([
      'Karpet',
      'Keramik',
    ]);
    await page.screenshot({ path: shot('02-enam-field') });

    // Urutan: Kapasitas naik ke atas.
    await page.getByRole('button', { name: 'Naikkan Kapasitas' }).click();
    await expect
      .poll(async () => (await typeOf())?.fields.slice(0, 2).map((f) => f.label))
      .toEqual(['Kapasitas', 'Telepon']);
    await page.reload();
    await page
      .getByRole('navigation', { name: 'Tipe lokasi' })
      .getByRole('button', { name: typeName })
      .click();
    await expect(page.getByRole('row').nth(1)).toContainText('Kapasitas');
    await page.screenshot({ path: shot('03-urutan') });

    // Field wajib menahan simpan lokasi.
    await page.getByRole('tab', { name: 'Lokasi', exact: true }).click();
    await page.getByRole('button', { name: 'Tambah lokasi' }).click();
    const sheet = page.getByRole('dialog', { name: /Tambah lokasi/ });
    await sheet.getByLabel('Tipe lokasi').click();
    await page.getByRole('option', { name: typeName }).click();
    await sheet.getByLabel('Nama').fill('Ruang Rapat Ümmü');
    await expect(sheet.getByLabel('Jenis lantai')).toBeVisible();
    await sheet.getByRole('button', { name: 'Tambah lokasi', exact: true }).click();
    await expect(sheet.getByText('Telepon wajib diisi.')).toBeVisible();
    await page.screenshot({ path: shot('04-field-wajib') });
    await sheet.getByLabel('Telepon').fill('021 555 0101');
    await sheet.getByRole('button', { name: 'Tambah lokasi', exact: true }).click();
    await expect(page.getByText('Lokasi ditambahkan')).toBeVisible();

    // Hapus field.
    await page.getByRole('tab', { name: 'Tipe lokasi', exact: true }).click();
    await page
      .getByRole('navigation', { name: 'Tipe lokasi' })
      .getByRole('button', { name: typeName })
      .click();
    await page
      .getByRole('row')
      .filter({ hasText: 'Situs' })
      .getByRole('button', { name: /Hapus/ })
      .click();
    await page
      .getByRole('dialog', { name: 'Hapus field “Situs”?' })
      .getByRole('button', { name: /Hapus/ })
      .click();
    await expect(page.getByText('Field dihapus')).toBeVisible();
    await expect.poll(async () => (await typeOf())?.fields.length).toBe(5);
    await page.screenshot({ path: shot('05-field-dihapus') });
  });
});
