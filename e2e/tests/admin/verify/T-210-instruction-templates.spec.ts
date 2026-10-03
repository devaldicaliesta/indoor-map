import { DEFAULT_INSTRUCTION_TEMPLATES } from '@indoor/domain';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';

const shot = (name: string) => `evidence/T-210/${name}.png`;

test.describe('T-210 Template instruksi', () => {
  test('ubah teks ID/EN, pratinjau, validasi placeholder, tampil di test route, dikembalikan', async ({
    page,
    loginAs,
    fullVenue,
  }) => {
    await loginAs('admin');
    await new AdminShell(page).selectVenue(fullVenue.name);
    const openInstructions = async () => {
      await page.goto('/settings');
      await page.getByRole('tab', { name: 'Instruksi' }).click();
      await expect(page.getByLabel('Tiba (Indonesia)')).toBeEnabled();
    };
    await openInstructions();
    const arriveId = page.getByLabel('Tiba (Indonesia)');
    const arriveEn = page.getByLabel('Tiba (Inggris)');
    const save = page.getByRole('button', { name: 'Simpan instruksi' });
    const original = { id: await arriveId.inputValue(), en: await arriveEn.inputValue() };
    await expect(save).toBeDisabled();
    await page.screenshot({ path: shot('01-tabel-instruksi') });

    // Placeholder tidak dikenal dan ID kosong ditolak.
    await arriveId.fill('Sampai di {tujuan}');
    await expect(arriveId).toHaveAttribute('aria-invalid', 'true');
    await expect(save).toBeDisabled();
    await page.screenshot({ path: shot('02-placeholder-salah') });
    await arriveId.fill('');
    await expect(arriveId).toHaveAttribute('aria-invalid', 'true');

    // Teks baru dengan pratinjau.
    await arriveId.fill('Sudah sampai di {destination}');
    await arriveEn.fill('You have reached {destination}');
    await expect(page.getByText('Sudah sampai di Ruang 201')).toBeVisible();
    await expect(page.getByText('You have reached Room 201')).toBeVisible();
    await page.screenshot({ path: shot('03-pratinjau') });
    await save.click();
    await expect(page.getByText('Instruksi disimpan')).toBeVisible();

    // Langsung dipakai test route (ID lalu EN).
    const editor = new EditorPage(page);
    await editor.goto();
    await page.getByRole('tab', { name: 'Uji rute' }).click();
    const panel = page.getByRole('region', { name: 'Uji rute' });
    for (const [end, query] of [
      ['Dari', 'GF-A01'],
      ['Ke', 'GF-B08'],
    ] as const) {
      await panel.getByRole('combobox', { name: end }).fill(query);
      await page
        .getByRole('listbox', { name: `Saran ${end.toLowerCase()}` })
        .getByRole('option', { name: query })
        .first()
        .click();
    }
    const steps = panel.getByRole('list', { name: 'Langkah' }).getByRole('listitem');
    await expect(steps.last()).toContainText('Sudah sampai di GF-B08');
    await panel
      .getByRole('radiogroup', { name: 'Bahasa instruksi' })
      .getByRole('radio', { name: 'en' })
      .click();
    await expect(steps.last()).toContainText('You have reached GF-B08');
    await page.screenshot({ path: shot('04-test-route') });

    // Kembali ke bawaan: tombol per aksi mengisi teks bawaan, tersimpan lewat Simpan instruksi.
    await openInstructions();
    const resetArrive = page.getByRole('button', { name: 'Kembalikan Tiba ke bawaan' });
    await expect(resetArrive).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Kembalikan Mulai ke bawaan' })).toBeDisabled();
    await resetArrive.click();
    await expect(arriveId).toHaveValue(DEFAULT_INSTRUCTION_TEMPLATES.arrive.id);
    await expect(arriveEn).toHaveValue(DEFAULT_INSTRUCTION_TEMPLATES.arrive.en);
    await expect(resetArrive).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Semua ke bawaan' })).toBeDisabled();
    await save.click();
    await expect(page.getByText('Instruksi disimpan')).toBeVisible();
    await page.reload();
    await page.getByRole('tab', { name: 'Instruksi' }).click();
    await expect(arriveId).toHaveValue(original.id);
    await expect(arriveEn).toHaveValue(original.en);
    await page.screenshot({ path: shot('05-dikembalikan') });
  });
});
