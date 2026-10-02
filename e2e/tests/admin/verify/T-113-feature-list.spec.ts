import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';

const shot = (name: string) => `evidence/T-113/${name}.png`;

test.describe('T-113 Panel daftar fitur', () => {
  test('grup per jenis, cari kode/jenis, pilih → properti dan peta fokus, Esc mengosongkan', async ({
    page,
    loginAs,
    fullVenue,
  }) => {
    await loginAs('editor');
    await new AdminShell(page).selectVenue(fullVenue.name);
    const editor = new EditorPage(page);
    await editor.goto();
    const list = page.getByRole('navigation', { name: 'Fitur lantai GF' });
    const search = page.getByRole('searchbox', { name: 'Cari fitur di lantai GF' });

    // Grup tertutup berisi judul dan jumlah; membuka grup menampilkan isinya terurut.
    const units = list.getByRole('button', { name: /^Unit\s*\d+$/ });
    await expect(units).toBeVisible();
    await units.click();
    await expect(list.getByRole('button', { name: 'GF-A01' })).toBeVisible();
    await page.screenshot({ path: shot('01-grup-dibuka') });

    // Cari kode unit: hanya yang cocok; huruf kecil tetap ketemu.
    await search.fill('gf-b0');
    await expect(list.getByRole('button', { name: /^GF-B0/ }).first()).toBeVisible();
    await expect(list.getByRole('button', { name: /^GF-A0/ })).toHaveCount(0);
    // Cari jenis: "eskalator" menampilkan kedua eskalator.
    await search.fill('eskalator');
    await expect(list.getByRole('button', { name: /Eskalator\s*2/ })).toBeVisible();
    await page.screenshot({ path: shot('02-cari-jenis') });

    // Pilih dari daftar: panel properti menampilkan fitur, peta berpindah ke sana.
    const canvas = editor.canvas.locator('canvas').first();
    await search.fill('GF-B03');
    const before = await canvas.screenshot();
    await list.getByRole('button', { name: 'GF-B03' }).click();
    await expect(editor.properties.getByRole('heading', { level: 2 })).toHaveText(/GF-B03/);
    await expect(list.getByRole('button', { name: 'GF-B03' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    await expect.poll(async () => (await canvas.screenshot()).equals(before)).toBe(false);
    await page.screenshot({ path: shot('03-dipilih-peta-fokus') });

    // Esc di kotak cari mengosongkan pencarian (tidak membatalkan pilihan).
    await search.focus();
    await page.keyboard.press('Escape');
    await expect(search).toHaveValue('');
    await expect(editor.properties.getByRole('heading', { level: 2 })).toHaveText(/GF-B03/);
    await search.fill('tidak-ada-xyz');
    await expect(list.getByRole('button', { name: /^Unit/ })).toHaveCount(0);
    await page.screenshot({ path: shot('04-tidak-ada-hasil') });
  });
});
