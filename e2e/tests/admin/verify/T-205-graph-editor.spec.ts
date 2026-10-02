import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';
import { at } from '../../../support/editor-draw';

const shot = (name: string) => `evidence/T-205/${name}.png`;

test.describe('T-205 Editor graf', () => {
  test('gambar jalur, ubah edge (aksesibel, pisah), hapus node dan edge; tersimpan di server', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    const { venue, floor } = testVenue;
    const graph = async () => {
      const g = await superAdmin.navGraph.listByFloor(floor.id);
      return { nodes: Object.keys(g.nodes).length, edges: Object.values(g.edges) };
    };
    await loginAs('editor');
    await new AdminShell(page).selectVenue(venue.name);
    const editor = new EditorPage(page);
    await editor.goto();

    // Jalur tiga titik: 3 node, 2 edge.
    await editor.tool('Jalur').click();
    for (const [dx, dy] of [
      [-120, 0],
      [0, 0],
    ] as const) {
      const p = await at(editor, dx, dy);
      await page.mouse.click(p.x, p.y);
    }
    const end = await at(editor, 120, 0);
    await page.mouse.dblclick(end.x, end.y);
    await expect.poll(async () => (await graph()).nodes).toBe(3);
    expect((await graph()).edges).toHaveLength(2);
    await expect(page.getByText(/2 edge jalur/)).toBeVisible();
    await page.screenshot({ path: shot('01-jalur-digambar') });

    // Pilih edge pertama: tandai tidak aksesibel, lalu pisah di tengah.
    await editor.tool('Pilih').click();
    const mid = await at(editor, -60, 0);
    await page.mouse.click(mid.x, mid.y);
    const edgePanel = page.getByRole('region', { name: 'Properti edge jalur' });
    await expect(edgePanel).toBeVisible();
    await edgePanel.getByRole('checkbox', { name: /Bisa dilalui kursi roda/ }).uncheck();
    await expect
      .poll(async () => (await graph()).edges.filter((e) => !e.accessible).length)
      .toBe(1);
    await page.screenshot({ path: shot('02-edge-tidak-aksesibel') });
    await edgePanel.getByRole('button', { name: 'Pisah di tengah' }).click();
    await expect.poll(async () => (await graph()).nodes).toBe(4);
    expect((await graph()).edges).toHaveLength(3);

    // Hapus node ujung kanan: edge yang menempel ikut terhapus.
    await page.keyboard.press('Escape');
    await page.mouse.click(end.x, end.y);
    const nodePanel = page.getByRole('region', { name: 'Properti node jalur' });
    await expect(nodePanel).toBeVisible();
    await nodePanel.getByRole('button', { name: 'Hapus node' }).click();
    await expect.poll(async () => (await graph()).nodes).toBe(3);
    expect((await graph()).edges).toHaveLength(2);

    // Hapus edge lewat panel (titik tengah lama kini node hasil pisah, jadi klik di seperempat).
    const quarter = await at(editor, -90, 0);
    await page.mouse.click(quarter.x, quarter.y);
    await expect(edgePanel).toBeVisible();
    await edgePanel.getByRole('button', { name: 'Hapus edge' }).click();
    await expect.poll(async () => (await graph()).edges.length).toBe(1);
    await expect(editor.saveStatus('Tersimpan')).toBeVisible();
    await page.screenshot({ path: shot('03-setelah-hapus') });

    await page.reload();
    await editor.waitReady();
    await expect(page.getByText(/1 edge jalur/)).toBeVisible();
  });
});
