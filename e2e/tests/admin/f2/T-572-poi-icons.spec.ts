import { PICTOGRAM_KEYS, searchPictograms } from '@indoor/domain';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';
import { at } from '../../../support/editor-draw';

const shot = (name: string) => `evidence/T-572/${name}.png`;

test.describe('T-572 Pustaka ikon POI', () => {
  test('TC-PAR-05 pemilih ikon: cari ID/EN dan alias, filter kategori, tampil di peta', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    const { venue, floor } = testVenue;
    await loginAs('admin');
    await new AdminShell(page).selectVenue(venue.name);
    await page.goto('/settings');
    await page.getByRole('button', { name: 'Tambah jenis' }).first().click();
    const dialog = page.getByRole('dialog', { name: 'Tambah jenis fasilitas' });
    const icons = dialog.getByRole('radiogroup', { name: 'Ikon bawaan' }).getByRole('radio');
    const status = dialog.getByRole('status');
    const search = dialog.getByRole('searchbox', { name: 'Cari ikon' });

    expect(PICTOGRAM_KEYS.length).toBeGreaterThanOrEqual(150);
    await expect(status).toHaveText(`${PICTOGRAM_KEYS.length} ikon`);
    await expect(icons).toHaveCount(PICTOGRAM_KEYS.length);
    await expect(dialog).toHaveCSS('opacity', '1');
    await page.screenshot({ path: shot('01-pemilih-semua-ikon') });

    for (const query of ['apotek', 'Pharmacy', 'obat']) {
      await search.fill(query);
      await expect(dialog.getByRole('radio', { name: 'Apotek', exact: true })).toBeVisible();
      await expect(icons).toHaveCount(searchPictograms({ query }).length);
    }
    await page.screenshot({ path: shot('02-cari-alias-obat') });

    await search.fill('zzz-tidak-ada');
    await expect(dialog.getByText('Tidak ada ikon yang cocok. Coba kata lain.')).toBeVisible();
    await search.fill('');

    await dialog.getByRole('combobox', { name: 'Kategori ikon' }).click();
    await page.getByRole('option', { name: 'Kesehatan' }).click();
    const health = searchPictograms({ category: 'kesehatan' });
    await expect(icons).toHaveCount(health.length);
    await expect(status).toHaveText(`${health.length} ikon`);
    await search.fill('lab');
    await expect(icons).toHaveCount(1);
    await search.fill('');
    await page.screenshot({ path: shot('03-filter-kesehatan') });

    await dialog.getByRole('radio', { name: 'Apotek', exact: true }).check();
    await expect(status).toContainText('dipilih: Apotek');
    await dialog.getByLabel('Nama').fill('Apotek Rawat Jalan');
    await expect(dialog.getByRole('img', { name: 'Pratinjau ikon di peta' })).toBeVisible();
    await page.screenshot({ path: shot('04-dipilih-pratinjau') });
    await dialog.getByRole('button', { name: 'Tambah jenis' }).click();
    await expect(dialog).toBeHidden();
    const types = await superAdmin.facilityTypes.list(venue.id);
    expect(types.find((t) => t.name === 'Apotek Rawat Jalan')?.icon).toEqual({
      kind: 'builtin',
      key: 'pharmacy',
    });

    await page.goto('/map-editor');
    const editor = new EditorPage(page);
    await editor.waitReady();
    await editor.tool('Titik').click();
    await page
      .getByRole('radiogroup', { name: 'Jenis fitur yang digambar' })
      .getByRole('radio', { name: 'Fasilitas' })
      .click();
    await page.getByRole('combobox', { name: 'Jenis fasilitas' }).click();
    await page.getByRole('option', { name: 'Apotek Rawat Jalan' }).click();
    await expect(page.getByRole('listbox')).toBeHidden();
    const spot = await at(editor, 0, 0);
    await page.mouse.click(spot.x, spot.y);
    await expect(editor.saveStatus('Tersimpan')).toBeVisible();
    await expect
      .poll(async () =>
        (await superAdmin.features.listByFloor(floor.id)).features.map((f) => f.properties.kind),
      )
      .toEqual(['facility']);
    await editor.tool('Pilih').click();
    await page.screenshot({
      path: shot('05-ikon-di-peta'),
      clip: { x: spot.x - 60, y: spot.y - 60, width: 120, height: 120 },
    });
  });
});
