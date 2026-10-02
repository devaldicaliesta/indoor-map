import { DataError } from '@indoor/data';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';

const shot = (name: string) => `evidence/T-102/${name}.png`;

async function capture(page: Page, name: string) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await page.screenshot({ path: shot(name), fullPage: true });
}

/** Menggambar persegi di peta footprint: 4 sudut lalu klik titik awal untuk menutup. */
async function drawSquare(page: Page, map: Locator) {
  const box = await map.boundingBox();
  if (!box) throw new Error('peta footprint tidak tampil');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const corners: [number, number][] = [
    [cx - 70, cy - 50],
    [cx + 70, cy - 50],
    [cx + 70, cy + 50],
    [cx - 70, cy + 50],
    [cx - 70, cy - 50],
  ];
  for (const [x, y] of corners) await page.mouse.click(x, y);
}

test.describe('T-102 Gedung dan Area Luar', () => {
  test('TC-VEN CRUD gedung dengan footprint, default, validasi; Area Luar selalu ada', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    const { venue } = testVenue;
    await loginAs('admin');
    await new AdminShell(page).selectVenue(venue.name);
    await page.goto('/venues');
    const outdoorRow = page.getByRole('row').filter({ hasText: 'Selalu ada' });
    await expect(outdoorRow).toContainText('Area Luar');
    await expect(outdoorRow.getByRole('button', { name: 'Hapus' })).toHaveCount(0);
    await capture(page, '01-daftar-gedung');

    // Validasi.
    await page.getByRole('button', { name: 'Tambah gedung' }).click();
    const dialog = page.getByRole('dialog', { name: 'Tambah gedung' });
    await dialog.getByLabel('Kode').fill('R I!');
    await dialog.getByRole('button', { name: /Simpan|Tambah/ }).click();
    await expect(dialog.getByText('Nama gedung wajib diisi.')).toBeVisible();
    await expect(
      dialog.getByText('Kode hanya huruf, angka, dan tanda hubung, maksimal 12 karakter.'),
    ).toBeVisible();
    await capture(page, '06-error-validasi');

    // Tambah dengan footprint digambar di peta.
    await dialog.getByLabel('Nama').fill('Gedung Rawat Inap Ümmü & Paviliun Anak');
    await dialog.getByLabel('Kode').fill('RI-2');
    await dialog.getByRole('button', { name: 'Gambar footprint' }).click();
    const map = dialog.locator('.maplibregl-canvas');
    await drawSquare(page, map);
    await expect(dialog.getByRole('button', { name: 'Gambar ulang' })).toBeVisible();
    await capture(page, '02-footprint-digambar');
    await dialog.getByRole('button', { name: /Simpan|Tambah/ }).click();
    await expect(page.getByText('Gedung ditambahkan')).toBeVisible();
    const row = page.getByRole('row').filter({ hasText: 'RI-2' });
    await expect(row.getByText('Digambar')).toBeVisible();
    await capture(page, '03-gedung-ditambahkan');

    const added = (await superAdmin.buildings.list(venue.id)).find((b) => b.code === 'RI-2');
    expect(added?.name).toBe('Gedung Rawat Inap Ümmü & Paviliun Anak');
    expect(added?.footprint?.coordinates[0]).toHaveLength(5);

    // Jadikan default.
    await row.getByRole('button', { name: 'Jadikan default' }).click();
    await expect(row.getByText('Default')).toBeVisible();
    await expect
      .poll(async () => (await superAdmin.venues.get(venue.id)).defaultBuildingId)
      .toBe(added?.id);

    // Ubah.
    await row.getByRole('button', { name: 'Ubah' }).click();
    const edit = page.getByRole('dialog', { name: /^Ubah / });
    await edit.getByLabel('Nama').fill('Gedung Rawat Inap');
    await edit.getByRole('button', { name: /Simpan/ }).click();
    await expect(page.getByText('Gedung disimpan')).toBeVisible();
    await page.reload();
    await expect(page.getByRole('cell', { name: 'Gedung Rawat Inap', exact: true })).toBeVisible();
    await capture(page, '04-diubah-default');

    // Hapus.
    await page
      .getByRole('row')
      .filter({ hasText: 'RI-2' })
      .getByRole('button', { name: 'Hapus' })
      .click();
    const del = page.getByRole('dialog', { name: 'Hapus Gedung Rawat Inap?' });
    await capture(page, '05-konfirmasi-hapus');
    await del.getByRole('button', { name: 'Hapus gedung' }).click();
    await expect(page.getByText('Gedung Rawat Inap dihapus')).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'RI-2' })).toHaveCount(0);
    expect((await superAdmin.buildings.list(venue.id)).some((b) => b.code === 'RI-2')).toBe(false);

    // Area Luar tidak bisa dihapus, juga lewat server.
    const outdoor = await superAdmin.buildings.outdoorLayer(venue.id);
    const outcome = await superAdmin.floors.remove(outdoor.floorId).then(
      () => null,
      (error: unknown) => error,
    );
    expect(outcome).toBeInstanceOf(DataError);
    expect((await superAdmin.buildings.outdoorLayer(venue.id)).floorId).toBe(outdoor.floorId);
  });
});
