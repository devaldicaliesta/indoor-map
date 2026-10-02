import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';
import { at } from '../../../support/editor-draw';

const shot = (name: string) => `evidence/T-208/${name}.png`;

test.describe('T-208 Tampilan graf', () => {
  test('sakelar node/edge, gaya tidak aksesibel, node terisolasi, legenda diciutkan', async ({
    page,
    loginAs,
    testVenue,
  }) => {
    const { venue } = testVenue;
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
    await expect(legend.getByRole('listitem').filter({ hasText: 'Terisolasi' })).toContainText('2');

    // Edge panjang jadi tidak aksesibel (garis putus-putus).
    await editor.tool('Pilih').click();
    const empty = await at(editor, 150, -150);
    const deselect = () => page.mouse.click(empty.x, empty.y);
    const mid = await at(editor, 60, 0);
    await page.mouse.click(mid.x, mid.y);
    const edgePanel = page.getByRole('region', { name: 'Properti edge jalur' });
    await edgePanel.getByRole('checkbox', { name: /Bisa dilalui kursi roda/ }).uncheck();
    await deselect();
    await expect(edgePanel).toBeHidden();
    await page.screenshot({ path: shot('01-legenda-dan-gaya') });

    // Sembunyikan edge: tidak bisa dipilih lagi; tampilkan: bisa.
    await legend.getByRole('checkbox', { name: 'Edge' }).uncheck();
    await page.mouse.click(mid.x, mid.y);
    await expect(edgePanel).toBeHidden();
    await page.screenshot({ path: shot('02-edge-disembunyikan') });
    await legend.getByRole('checkbox', { name: 'Edge' }).check();
    await page.mouse.click(mid.x, mid.y);
    await expect(edgePanel).toBeVisible();
    await deselect();

    // Sembunyikan node: ujung jalur tidak terpilih sebagai node.
    const nodePanel = page.getByRole('region', { name: 'Properti node jalur' });
    await legend.getByRole('checkbox', { name: 'Node' }).uncheck();
    await page.mouse.click(b.x, b.y);
    await expect(nodePanel).toBeHidden();
    await page.screenshot({ path: shot('03-node-disembunyikan') });
    await legend.getByRole('checkbox', { name: 'Node' }).check();
    await page.mouse.click(b.x, b.y);
    await expect(nodePanel).toBeVisible();
    await deselect();

    // Legenda diciutkan; sakelar tetap ada.
    await legend.getByRole('button', { name: 'Sembunyikan legenda' }).click();
    await expect(legend.getByRole('list', { includeHidden: true })).toBeHidden();
    await expect(legend.getByRole('checkbox', { name: 'Node' })).toBeVisible();
    await page.screenshot({ path: shot('04-legenda-diciutkan') });
  });
});
