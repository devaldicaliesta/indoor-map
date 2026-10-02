import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';
import { drawUnit, square, unitsOn } from '../../../support/editor-draw';

const shot = (name: string) => `evidence/T-111/${name}.png`;

test.describe('T-111 Undo/redo', () => {
  test('urungkan dan ulangi lewat tombol dan keyboard; hasilnya tersimpan di server', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    const { venue, floor } = testVenue;
    await loginAs('editor');
    await new AdminShell(page).selectVenue(venue.name);
    const editor = new EditorPage(page);
    await editor.goto();
    const toolbar = page.getByRole('toolbar', { name: 'Alat gambar' });
    const undo = toolbar.getByRole('button', { name: 'Urungkan' });
    const redo = toolbar.getByRole('button', { name: 'Ulangi' });
    await expect(undo).toBeDisabled();
    await expect(redo).toBeDisabled();

    await drawUnit(page, editor, square(-120, -80));
    await drawUnit(page, editor, square(0, -80));
    await expect.poll(async () => (await unitsOn(superAdmin, floor.id)).length).toBe(2);
    await page.screenshot({ path: shot('01-dua-unit') });

    // Tombol: urungkan unit kedua, lalu ulangi.
    await undo.click();
    await expect.poll(async () => (await unitsOn(superAdmin, floor.id)).length).toBe(1);
    await expect(redo).toBeEnabled();
    await page.screenshot({ path: shot('02-diurungkan') });
    await redo.click();
    await expect.poll(async () => (await unitsOn(superAdmin, floor.id)).length).toBe(2);
    await expect(redo).toBeDisabled();

    // Keyboard: Ctrl+Z dua kali menghapus keduanya, Ctrl+Shift+Z dan Ctrl+Y mengembalikan.
    await editor.tool('Pilih').click();
    await page.keyboard.press('Control+z');
    await page.keyboard.press('Control+z');
    await expect.poll(async () => (await unitsOn(superAdmin, floor.id)).length).toBe(0);
    await expect(undo).toBeDisabled();
    await page.keyboard.press('Control+Shift+z');
    await page.keyboard.press('Control+y');
    await expect.poll(async () => (await unitsOn(superAdmin, floor.id)).length).toBe(2);
    await expect(editor.saveStatus('Tersimpan')).toBeVisible();
    await page.screenshot({ path: shot('03-diulangi-keyboard') });

    // Hasil akhir bertahan setelah muat ulang.
    await page.reload();
    await editor.waitReady();
    await expect(page.getByText('2 fitur', { exact: true })).toBeVisible();
  });
});
