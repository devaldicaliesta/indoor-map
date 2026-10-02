import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';
import { at } from '../../../support/editor-draw';

const shot = (name: string) => `evidence/T-208/${name}.png`;

test.describe('T-208 Tampilan graf', () => {
  test('sakelar node/edge, gaya tidak aksesibel, node terisolasi, legenda diciutkan', async ({
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
    const legend = page.getByRole('region', { name: 'Graf jalur' });
    await expect(legend).toBeVisible();

    // Dua jalur terpisah: satu bagian terkecil jadi terisolasi.
    await editor.tool('Jalur').click();
    const a = await at(editor, -120, 0);
    await page.mouse.click(a.x, a.y);
    const b = await at(editor, 120, 0);
    await page.mouse.dblclick(b.x, b.y);
    await expect(page.getByText(/1 edge jalur/)).toBeVisible();
    await editor.tool('Jalur').click();
    const c = await at(editor, -60, 100);
    await page.mouse.click(c.x, c.y);
    const d = await at(editor, -20, 100);
    await page.mouse.dblclick(d.x, d.y);
    await expect(page.getByText(/2 edge jalur/)).toBeVisible();
    await expect(legend.getByRole('listitem').filter({ hasText: 'Terisolasi' })).toHaveText(
      /Terisolasi\s*2\b/,
    );

    // Edge panjang jadi tidak aksesibel (garis putus-putus).
    await editor.tool('Pilih').click();
    const empty = await at(editor, 150, -150);
    const deselect = () => page.mouse.click(empty.x, empty.y);
    const nodePanel = page.getByRole('region', { name: 'Properti node jalur' });
    const mid = await at(editor, 60, 0);
    await page.mouse.click(mid.x, mid.y);
    const edgePanel = page.getByRole('region', { name: 'Properti edge jalur' });
    await edgePanel.getByRole('checkbox', { name: /Bisa dilalui kursi roda/ }).uncheck();
    await expect
      .poll(async () =>
        Object.values((await superAdmin.navGraph.listByFloor(floor.id)).edges).map(
          (e) => e.accessible,
        ),
      )
      .toContain(false);
    await deselect();
    await expect(edgePanel).toBeHidden();
    await page.screenshot({ path: shot('01-legenda-dan-gaya') });

    // Sembunyikan edge: tidak bisa dipilih lagi; tampilkan: bisa.
    await legend.getByRole('checkbox', { name: 'Edge' }).uncheck();
    await page.mouse.click(mid.x, mid.y);
    // Klik berikutnya ke node yang masih tampil membuktikan klik tadi sudah diproses.
    await page.mouse.click(c.x, c.y);
    await expect(nodePanel).toBeVisible();
    await expect(edgePanel).toBeHidden();
    await deselect();
    await page.screenshot({ path: shot('02-edge-disembunyikan') });
    await legend.getByRole('checkbox', { name: 'Edge' }).check();
    await expect(async () => {
      await page.mouse.click(mid.x, mid.y);
      await expect(edgePanel).toBeVisible({ timeout: 1000 });
    }).toPass();
    await deselect();

    // Sembunyikan node: ujung jalur tidak terpilih sebagai node.
    await legend.getByRole('checkbox', { name: 'Node' }).uncheck();
    await page.mouse.click(b.x, b.y);
    const shortMid = await at(editor, -40, 100);
    await page.mouse.click(shortMid.x, shortMid.y);
    await expect(edgePanel).toBeVisible();
    await expect(nodePanel).toBeHidden();
    await deselect();
    await page.screenshot({ path: shot('03-node-disembunyikan') });
    await legend.getByRole('checkbox', { name: 'Node' }).check();
    // Layer baru tampil setelah frame peta berikutnya; klik diulang sampai node terpilih.
    await expect(async () => {
      await page.mouse.click(b.x, b.y);
      await expect(nodePanel).toBeVisible({ timeout: 1000 });
    }).toPass();
    await deselect();

    // Legenda diciutkan; sakelar tetap ada.
    await legend.getByRole('button', { name: 'Sembunyikan legenda' }).click();
    const list = legend.getByRole('list', { includeHidden: true });
    await expect(list).toHaveCount(1);
    await expect(list).toBeHidden();
    await expect(legend.getByRole('checkbox', { name: 'Node' })).toBeVisible();
    await page.screenshot({ path: shot('04-legenda-diciutkan') });
  });
});
