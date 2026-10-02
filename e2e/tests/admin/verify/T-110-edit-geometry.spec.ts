import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';
import { at, drawUnit, ring, square, unitsOn } from '../../../support/editor-draw';

const shot = (name: string) => `evidence/T-110/${name}.png`;

test.describe('T-110 Edit geometri, multi-select, snapping', () => {
  test('geser titik sudut, snapping aktif/mati, multi-select hapus, Delete', async ({
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

    // Unit A, lalu unit B yang titik pertamanya 4 px dari sudut kanan atas A: menempel (snap).
    await drawUnit(page, editor, square(-120, -100));
    await drawUnit(page, editor, [
      [-56, -96],
      [10, -100],
      [10, -40],
      [-60, -40],
    ]);
    let [a, b] = await unitsOn(superAdmin, floor.id);
    // Sudut kanan atas A (lintang terbesar, bujur terbesar) persis ada di cincin B.
    const corner = (f: typeof a, pick: 'ne' | 'sw') => {
      const pts = ring(f);
      const lngs = pts.map((p) => p[0] ?? 0);
      const lats = pts.map((p) => p[1] ?? 0);
      return pick === 'ne'
        ? [Math.max(...lngs), Math.max(...lats)]
        : [Math.min(...lngs), Math.min(...lats)];
    };
    expect(ring(b)).toContainEqual(corner(a, 'ne'));

    // Snap mati: titik 4 px dari sudut tidak menempel.
    await page.getByRole('button', { name: /^Snap: aktif/ }).click();
    await expect(page.getByRole('button', { name: /^Snap: mati/ })).toBeVisible();
    await drawUnit(page, editor, [
      [-116, -36],
      [-60, -36],
      [-60, 20],
      [-120, 20],
    ]);
    const [, , c] = await unitsOn(superAdmin, floor.id);
    expect(ring(c)).not.toContainEqual(corner(a, 'sw'));
    await page.getByRole('button', { name: /^Snap: mati/ }).click();
    await page.screenshot({ path: shot('01-tiga-unit-snap') });

    // Geser titik sudut kiri atas A sejauh 30 px ke kiri-atas.
    // Dipilih dengan klik di kanvas (memilih dari daftar memindahkan kamera ke fitur).
    await editor.tool('Pilih').click();
    const inside = await at(editor, -90, -70);
    await page.mouse.click(inside.x, inside.y);
    await expect(editor.properties.getByRole('heading', { level: 2 })).toHaveText(
      new RegExp(String(a?.properties.unitCode)),
    );
    const from = await at(editor, -120, -100);
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(from.x - 15, from.y - 15, { steps: 4 });
    await page.mouse.move(from.x - 30, from.y - 30, { steps: 4 });
    await page.mouse.up();
    await expect(editor.saveStatus('Tersimpan')).toBeVisible();
    await expect
      .poll(async () => ring((await unitsOn(superAdmin, floor.id))[0]))
      .not.toContainEqual([corner(a, 'sw')[0], corner(a, 'ne')[1]]);
    [a, b] = await unitsOn(superAdmin, floor.id);
    await page.screenshot({ path: shot('02-titik-digeser') });

    // Multi-select lewat Shift+klik di daftar, lalu hapus dua sekaligus.
    await page.keyboard.press('Escape');
    const list = page.getByRole('navigation', { name: 'Fitur lantai GF' });
    await page.getByRole('searchbox', { name: 'Cari fitur di lantai GF' }).fill('UJI-GF');
    await list.getByRole('button', { name: String(a?.properties.unitCode) }).click();
    await list
      .getByRole('button', { name: String(b?.properties.unitCode) })
      .click({ modifiers: ['Shift'] });
    const multi = page.getByRole('region', { name: 'Seleksi ganda' });
    await expect(multi).toBeVisible();
    await page.screenshot({ path: shot('03-seleksi-ganda') });
    await multi.getByRole('button', { name: 'Hapus 2 fitur' }).click();
    await expect(editor.saveStatus('Tersimpan')).toBeVisible();
    await expect.poll(async () => (await unitsOn(superAdmin, floor.id)).length).toBe(1);

    // Delete pada satu fitur terpilih.
    const [last] = await unitsOn(superAdmin, floor.id);
    // Fokus di tombol daftar (bukan kotak cari, tempat Delete menghapus teks).
    await list.getByRole('button', { name: String(last?.properties.unitCode) }).click();
    await page.keyboard.press('Delete');
    await expect.poll(async () => (await unitsOn(superAdmin, floor.id)).length).toBe(0);
    await page.screenshot({ path: shot('04-semua-dihapus') });
  });
});
