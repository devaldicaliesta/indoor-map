import type { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';

const shot = (name: string) => `evidence/T-103/${name}.png`;

async function capture(page: Page, name: string) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await page.screenshot({ path: shot(name), fullPage: true });
}

test.describe('T-103 Lantai dan default tampilan', () => {
  test('TC-VEN CRUD lantai (basement), urutan level, validasi, default', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    const { venue, building } = testVenue;
    await loginAs('admin');
    await new AdminShell(page).selectVenue(venue.name);
    await page.goto('/venues');
    await page
      .getByRole('row')
      .filter({ hasText: 'UJI' })
      .getByRole('button', { name: 'Lantai' })
      .click();
    const sheet = page.getByRole('dialog', { name: 'Lantai Gedung Uji' });
    await expect(sheet.getByRole('cell', { name: 'GF', exact: true })).toBeVisible();

    const name = sheet.getByLabel('Nama tampilan');
    const level = sheet.getByLabel('Level');
    const height = sheet.getByLabel('Tinggi (m)');
    const add = sheet.getByRole('button', { name: 'Tambah lantai' });

    // Validasi: nama kosong, level pecahan, tinggi di luar rentang.
    await name.fill('');
    await level.fill('1.5');
    await height.fill('40');
    await add.click();
    await expect(sheet.getByText('Isi nama tampilan, misalnya GF atau L1.')).toBeVisible();
    await expect(sheet.getByText(/Level bilangan bulat/)).toBeVisible();
    await expect(sheet.getByText(/^Tinggi .* m\.$/)).toBeVisible();
    await capture(page, '06-error-validasi');

    // Tambah tiga lantai tidak berurutan: tabel harus urut menurut level.
    for (const [n, l, h] of [
      ['L2', '2', '3.5'],
      ['B1', '-1', '3'],
      ['L1 Mezanin Ümmü', '1', '4.2'],
    ] as const) {
      await name.fill(n);
      await level.fill(l);
      await height.fill(h);
      await add.click();
      await expect(page.getByText(`Lantai ${n} ditambahkan`)).toBeVisible();
    }
    const levels = await sheet.locator('tbody tr td:first-child').allTextContents();
    const numbers = levels.map(Number);
    expect(
      [...numbers].sort((a, b) => b - a).join() === numbers.join() ||
        [...numbers].sort((a, b) => a - b).join() === numbers.join(),
    ).toBe(true);
    expect(numbers).toEqual(expect.arrayContaining([-1, 0, 1, 2]));
    // Semua kolom (Level sampai Hapus) terlihat tanpa gulir mendatar di panel.
    const overflow = await sheet
      .locator('[data-slot="table-container"]')
      .evaluate((el) => el.scrollWidth - el.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(
      sheet.getByRole('row').filter({ hasText: 'B1' }).getByRole('button', { name: 'Hapus' }),
    ).toBeInViewport();
    await capture(page, '03-lantai-urut-level');

    const stored = await superAdmin.floors.list(building.id);
    expect(stored.find((f) => f.name === 'B1')).toMatchObject({ level: -1, heightM: 3 });

    // Default tampilan.
    const b1 = sheet.getByRole('row').filter({ hasText: 'B1' });
    await b1.getByRole('button', { name: 'Jadikan default' }).click();
    await expect(b1.getByText('Default')).toBeVisible();
    await expect
      .poll(async () => (await superAdmin.buildings.list(venue.id))[0]?.defaultFloorId)
      .toBe(stored.find((f) => f.name === 'B1')?.id);

    // Ubah.
    const l2 = sheet.getByRole('row').filter({ hasText: 'L2' });
    await l2.getByRole('button', { name: 'Ubah' }).click();
    await name.fill('L2 Atap');
    await sheet.getByRole('button', { name: 'Simpan lantai' }).click();
    await expect(page.getByText('Lantai L2 Atap disimpan')).toBeVisible();
    await capture(page, '04-diubah-default');

    // Hapus.
    await sheet
      .getByRole('row')
      .filter({ hasText: 'L2 Atap' })
      .getByRole('button', { name: 'Hapus' })
      .click();
    await page
      .getByRole('dialog', { name: 'Hapus lantai L2 Atap?' })
      .getByRole('button', { name: /Hapus/ })
      .click();
    await expect(page.getByText('Lantai L2 Atap dihapus')).toBeVisible();
    await expect(sheet.getByRole('cell', { name: 'L2 Atap' })).toHaveCount(0);
    expect((await superAdmin.floors.list(building.id)).some((f) => f.name === 'L2 Atap')).toBe(
      false,
    );
    await capture(page, '05-dihapus');
  });
});
