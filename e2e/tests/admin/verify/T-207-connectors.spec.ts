import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';
import { at } from '../../../support/editor-draw';

const shot = (name: string) => `evidence/T-207/${name}.png`;

test.describe('T-207 Editor konektor dan aksesibilitas', () => {
  test('tambah lift (lantai dilayani) dan eskalator (arah), validasi, ubah, hapus dari semua lantai', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    const { venue, building } = testVenue;
    await superAdmin.floors.create(building.id, { name: 'L1', level: 1, heightM: 4 });
    await superAdmin.floors.create(building.id, { name: 'L2', level: 2, heightM: 4 });
    const connectors = () => superAdmin.connectors.listByVenue(venue.id);

    await loginAs('editor');
    await new AdminShell(page).selectVenue(venue.name);
    const editor = new EditorPage(page);
    await editor.goto();

    // Lift: validasi minimal dua lantai, lalu GF + L1 + L2.
    await editor.tool('Konektor').click();
    const liftAt = await at(editor, -80, 0);
    await page.mouse.click(liftAt.x, liftAt.y);
    const dialog = page.getByRole('dialog', { name: 'Konektor baru' });
    await dialog
      .getByRole('radiogroup', { name: 'Jenis konektor' })
      .getByRole('radio', { name: 'Lift' })
      .click();
    const floors = dialog.getByRole('group', { name: 'Lantai yang dilayani' });
    // Lantai tetangga tercentang otomatis; lepas agar hanya satu lantai.
    await floors.getByRole('checkbox', { name: /L1/ }).uncheck();
    await dialog.getByRole('button', { name: 'Tambah konektor' }).click();
    await expect(dialog.getByText('Pilih minimal dua lantai.')).toBeVisible();
    await page.screenshot({ path: shot('06-error-lantai') });
    await floors.getByRole('checkbox', { name: /L1/ }).check();
    await floors.getByRole('checkbox', { name: /L2/ }).check();
    await dialog.getByLabel('Nama').fill('Lift Pasien Ümmü');
    await page.screenshot({ path: shot('01-form-lift') });
    await dialog.getByRole('button', { name: 'Tambah konektor' }).click();
    await expect(page.getByText('Konektor ditambahkan')).toBeVisible();
    await expect.poll(async () => (await connectors()).length).toBe(1);
    const lift = (await connectors())[0];
    expect(lift).toMatchObject({ kind: 'elevator', name: 'Lift Pasien Ümmü', accessible: true });
    expect(lift?.stops).toHaveLength(3);

    // Eskalator: arah wajib, tepat dua lantai, otomatis tidak aksesibel.
    await editor.tool('Konektor').click();
    const escAt = await at(editor, 80, 0);
    await page.mouse.click(escAt.x, escAt.y);
    await dialog
      .getByRole('radiogroup', { name: 'Jenis konektor' })
      .getByRole('radio', { name: 'Eskalator' })
      .click();
    await dialog.getByRole('combobox', { name: 'Lantai lain' }).click();
    await page.getByRole('option', { name: /L1/ }).click();
    await dialog.getByRole('button', { name: 'Tambah konektor' }).click();
    await expect(dialog.getByText('Pilih arah eskalator.')).toBeVisible();
    await dialog.getByRole('combobox', { name: 'Arah' }).click();
    await page.getByRole('option').filter({ hasText: /naik/i }).first().click();
    await expect(
      dialog.getByRole('checkbox', { name: /Bisa dilalui kursi roda/ }),
    ).not.toBeChecked();
    await page.screenshot({ path: shot('02-form-eskalator') });
    await dialog.getByRole('button', { name: 'Tambah konektor' }).click();
    await expect.poll(async () => (await connectors()).length).toBe(2);
    const escalator = (await connectors()).find((c) => c.kind === 'escalator');
    expect(escalator).toMatchObject({ accessible: false });
    expect(escalator?.direction).toBeTruthy();
    expect(escalator?.stops).toHaveLength(2);
    await page.screenshot({ path: shot('03-dua-konektor') });

    // Ubah lift: tandai tidak aksesibel.
    await editor.tool('Pilih').click();
    await page.mouse.click(liftAt.x, liftAt.y);
    await page.getByRole('button', { name: 'Ubah konektor' }).click();
    const edit = page.getByRole('dialog', { name: 'Ubah Lift Pasien Ümmü' });
    await edit.getByRole('checkbox', { name: /Bisa dilalui kursi roda/ }).uncheck();
    await edit.getByRole('button', { name: 'Simpan konektor' }).click();
    await expect(page.getByText('Konektor disimpan')).toBeVisible();
    await expect
      .poll(async () => (await connectors()).find((c) => c.kind === 'elevator')?.accessible)
      .toBe(false);

    // Hapus lift dari semua lantai (konfirmasi dua langkah).
    await page.getByRole('button', { name: 'Hapus konektor' }).click();
    await page.getByRole('button', { name: 'Hapus dari semua lantai' }).click();
    await expect(page.getByText('Konektor dihapus')).toBeVisible();
    await expect.poll(async () => (await connectors()).map((c) => c.kind)).toEqual(['escalator']);
    await page.screenshot({ path: shot('04-lift-dihapus') });
  });
});
