import type { DataClient } from '@indoor/data';
import { EMPTY_OPENING_HOURS, LOCATION_STATUSES, type Venue } from '@indoor/domain';
import type { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';

const shot = (name: string) => `evidence/T-116/${name}.png`;

async function capture(page: Page, name: string) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await page.screenshot({ path: shot(name), fullPage: true });
}

/** 24 lokasi tambahan bervariasi (status, nama panjang/aksen/karakter khusus) tanpa unit. */
async function seedLocations(superAdmin: DataClient, venueId: Venue['id']) {
  const [type] = await superAdmin.categories.listTypes(venueId);
  if (!type) throw new Error('tipe lokasi tidak ada');
  const names = [
    'Klinik Anak & Tumbuh Kembang',
    "Poliklinik Jantung 'Sehat'",
    'Café Lumière',
    'ATM Center',
    'Ruang Laktasi',
    'Kantin Karyawan',
    'Instalasi Gawat Darurat Terpadu dan Pusat Trauma Regional Timur',
    'Farmasi Rawat Jalan',
    'Ruang Rapat Melati',
    'Musala Al-Ikhlas',
    'Kasir 1',
    'Kasir 2',
    'Gizi',
    'Rekam Medis',
    'Hemodialisa',
    'Fisioterapi',
    'Bank Darah',
    'ICU',
    'NICU',
    'Radioterapi',
    'Toko Bunga Ümmü',
    'Pendaftaran Online',
    '3D Printing Lab',
    'Laundry <Linen>',
  ];
  for (const [i, name] of names.entries()) {
    await superAdmin.locations.save(
      venueId,
      type.id,
      null,
      {
        code: `L-${String(i + 1).padStart(2, '0')}`,
        name,
        description: '',
        categoryIds: [],
        unitIds: [],
        primaryUnitId: null,
        customFields: {},
        status: LOCATION_STATUSES[i % LOCATION_STATUSES.length] ?? 'active',
        openingDate:
          LOCATION_STATUSES[i % LOCATION_STATUSES.length] === 'coming_soon' ? '2026-12-01' : null,
        hours: EMPTY_OPENING_HOURS,
      },
      { keepPhotoPaths: [], newPhotos: [] },
    );
  }
}

test.describe('T-116 Lokasi dasar, kategori, tautan unit', () => {
  test('daftar + cari, tambah dengan unit dan kategori, validasi, ubah, hapus', async ({
    page,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    await seedLocations(superAdmin, venueId);
    await loginAs('editor');
    await new AdminShell(page).selectVenue(fullVenue.name);
    await page.goto('/locations');
    await expect(page.getByRole('cell', { name: /Radiologi/ })).toBeVisible();
    // Nama sangat panjang membungkus; kolom Aksi tetap terlihat tanpa gulir mendatar.
    const overflow = await page
      .locator('[data-slot="table-container"]')
      .evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await capture(page, '01-daftar-lokasi');

    // Cari nama/kode.
    const search = page.getByRole('searchbox', { name: 'Cari lokasi' });
    await search.fill('rad');
    await expect(page.getByText('Radiologi', { exact: true })).toBeVisible();
    await expect(page.getByText('Radioterapi', { exact: true })).toBeVisible();
    await expect(page.getByText('Kasir 1', { exact: true })).toHaveCount(0);
    await search.fill('L-07');
    await expect(page.getByText(/Instalasi Gawat Darurat/)).toBeVisible();
    await capture(page, '02-cari');
    await search.fill('');

    // Tambah: nama kosong ditolak, lalu isi dengan kategori dan unit.
    await page.getByRole('button', { name: 'Tambah lokasi' }).click();
    const sheet = page.getByRole('dialog', { name: /Tambah lokasi/ });
    await sheet.getByRole('button', { name: 'Tambah lokasi', exact: true }).click();
    await expect(sheet.getByText('Nama lokasi wajib diisi.')).toBeVisible();
    await capture(page, '06-error-nama');
    await sheet.getByLabel('Nama').fill('Klinik Mata Ümmü & Optik');
    await sheet.getByLabel('Kode (opsional)').fill('MATA-01');
    await sheet.getByRole('combobox', { name: 'Tipe lokasi' }).click();
    await page.getByRole('option', { name: 'Layanan' }).click();
    await sheet
      .getByRole('group', { name: 'Kategori' })
      .getByRole('checkbox', { name: 'Pemeriksaan' })
      .check();
    await sheet.getByLabel('Tambah unit').fill('GF-A05');
    await page
      .getByRole('option', { name: /GF-A05/ })
      .first()
      .click();
    await expect(sheet.getByRole('button', { name: 'Lepas unit GF-A05' })).toBeVisible();
    await capture(page, '02b-form-terisi');
    await sheet.getByRole('button', { name: 'Tambah lokasi', exact: true }).click();
    await expect(page.getByText('Lokasi ditambahkan')).toBeVisible();
    const row = page.getByRole('row').filter({ hasText: 'Klinik Mata Ümmü & Optik' });
    await expect(row).toContainText('GF-A05');
    await expect(row).toContainText('Pemeriksaan');
    await capture(page, '03-tersimpan');

    const saved = (await superAdmin.locations.list(venueId)).find((l) => l.code === 'MATA-01');
    expect(saved?.name).toBe('Klinik Mata Ümmü & Optik');
    expect(saved?.units.map((u) => u.unitCode)).toEqual(['GF-A05']);

    // Ubah.
    await row.getByRole('button', { name: 'Ubah' }).click();
    const edit = page.getByRole('dialog', { name: /Ubah|Klinik Mata/ });
    await edit.getByLabel('Nama').fill('Klinik Mata');
    await edit.getByRole('button', { name: 'Simpan lokasi', exact: true }).click();
    await expect(page.getByText('Lokasi disimpan')).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'MATA-01' })).toContainText('Klinik Mata');
    await capture(page, '04-diubah');

    // Hapus.
    await page
      .getByRole('row')
      .filter({ hasText: 'MATA-01' })
      .getByRole('button', { name: 'Hapus' })
      .click();
    await page.getByRole('dialog').getByRole('button', { name: /Hapus/ }).last().click();
    await expect(page.getByRole('row').filter({ hasText: 'MATA-01' })).toHaveCount(0);
    await expect
      .poll(async () =>
        (await superAdmin.locations.list(venueId)).some((l) => l.code === 'MATA-01'),
      )
      .toBe(false);
    await capture(page, '05-dihapus');
  });
});
