import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';
import { at, drawUnit, square } from '../../../support/editor-draw';

const shot = (name: string) => `evidence/T-206/${name}.png`;

test.describe('T-206 Titik masuk unit/fasilitas', () => {
  test('sambung manual, saran otomatis disetujui, hapus titik masuk', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    const { venue, floor } = testVenue;
    const entrances = async () =>
      Object.values((await superAdmin.navGraph.listByFloor(floor.id)).nodes).filter(
        (n) => n.role === 'entrance',
      );
    await loginAs('editor');
    await new AdminShell(page).selectVenue(venue.name);
    const editor = new EditorPage(page);
    await editor.goto();

    // Dua unit di atas jalur mendatar.
    await drawUnit(page, editor, square(-110, -100, 70));
    await drawUnit(page, editor, square(40, -100, 70));
    await editor.tool('Jalur').click();
    const left = await at(editor, -130, 20);
    await page.mouse.click(left.x, left.y);
    const right = await at(editor, 130, 20);
    await page.mouse.dblclick(right.x, right.y);
    await expect(page.getByText(/1 edge jalur/)).toBeVisible();

    // Manual: pilih unit kiri, Hubungkan ke jalur, klik jalur.
    await editor.tool('Pilih').click();
    const unitLeft = await at(editor, -75, -65);
    await page.mouse.click(unitLeft.x, unitLeft.y);
    await editor.properties.getByRole('button', { name: 'Hubungkan ke jalur' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: /Klik jalur untuk menyambung/ }),
    ).toBeVisible();
    await page.screenshot({ path: shot('01-mode-menyambung') });
    const onPath = await at(editor, -75, 20);
    await page.mouse.click(onPath.x, onPath.y);
    await expect(editor.properties.getByText('1 titik masuk terhubung ke jalur.')).toBeVisible();
    await expect.poll(async () => (await entrances()).length).toBe(1);
    await page.screenshot({ path: shot('02-terhubung-manual') });

    // Saran otomatis untuk unit kanan.
    await page.keyboard.press('Escape');
    await page.getByRole('tab', { name: /Titik masuk/ }).click();
    const panel = page.getByRole('region', { name: 'Titik masuk' });
    await expect(
      panel.getByText('1 dari 2 unit dan fasilitas belum terhubung ke jalur.'),
    ).toBeVisible();
    await panel.getByRole('button', { name: 'Hubungkan titik masuk' }).click();
    await expect(panel.getByRole('heading', { name: 'Saran (1)' })).toBeVisible();
    await page.screenshot({ path: shot('03-saran') });
    await panel.getByRole('button', { name: 'Setujui semua' }).click();
    await expect(
      panel.getByText('Semua unit dan fasilitas sudah terhubung ke jalur.'),
    ).toBeVisible();
    await expect.poll(async () => (await entrances()).length).toBe(2);
    await page.screenshot({ path: shot('04-semua-terhubung') });

    // Hapus titik masuk unit kiri lewat node-nya.
    // Titik masuk unit kiri = bujur terkecil.
    const [first] = (await entrances()).sort(
      (a, b) => (a.coordinates[0] ?? 0) - (b.coordinates[0] ?? 0),
    );
    if (!first) throw new Error('titik masuk tidak ada');
    await page.getByRole('tab', { name: 'Fitur' }).click();
    const entranceNode = await at(editor, -75, -30);
    await page.mouse.click(entranceNode.x, entranceNode.y);
    const nodePanel = page.getByRole('region', { name: 'Properti node jalur' });
    await expect(nodePanel.getByRole('heading', { level: 2 })).toHaveText(/Titik masuk/);
    await nodePanel.getByRole('button', { name: 'Hapus node' }).click();
    await expect.poll(async () => (await entrances()).length).toBe(1);
    expect((await entrances()).map((n) => n.id)).not.toContain(first.id);
    await page.screenshot({ path: shot('05-setelah-hapus') });
  });
});
