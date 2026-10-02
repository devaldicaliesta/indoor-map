import type { Venue } from '@indoor/domain';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';

const shot = (name: string) => `evidence/T-211/${name}.png`;

/** Tanggal lokal `YYYY-MM-DDTHH:mm` beberapa hari lagi; jauh dari batas zona waktu. */
function inDays(days: number, time: string): string {
  const d = new Date(Date.now() + days * 86_400_000);
  return `${d.toISOString().slice(0, 10)}T${time}`;
}

test.describe('T-211 Penutupan dan role Operator', () => {
  test('Operator: tutup lift (dampak, validasi), ubah selesai, akhiri; jadwal lalu batalkan; peta hanya baca', async ({
    page,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    const current = () => superAdmin.closures.listCurrent(venueId, new Date());
    await loginAs('operator');
    await new AdminShell(page).selectVenue(fullVenue.name);
    await page.goto('/closures');
    const active = page.getByRole('region', { name: 'Sedang berlaku' });
    const scheduled = page.getByRole('region', { name: 'Terjadwal' });
    await expect(active.getByText('Tidak ada penutupan yang sedang berlaku.')).toBeVisible();

    // Tutup lift: alasan wajib, dampak lantai terlihat.
    const pickTarget = async (name: RegExp) => {
      await page.getByLabel('Konektor atau area').click();
      await page.getByRole('option', { name }).first().click();
      await page.getByRole('button', { name: 'Tutup sementara' }).click();
    };
    await pickTarget(/Lift/);
    const dialog = page.getByRole('dialog', { name: 'Tutup sementara' });
    await expect(
      dialog.getByText('Rute aksesibel ke L1 Gedung Utama tidak tersedia selama penutupan.'),
    ).toBeVisible();
    await dialog.getByRole('button', { name: 'Simpan penutupan' }).click();
    await expect(dialog.getByLabel('Alasan')).toHaveAttribute('aria-invalid', 'true');
    await dialog.getByLabel('Alasan').fill('Perawatan lift');
    await page.screenshot({ path: shot('01-dialog-dampak') });
    await dialog.getByRole('button', { name: 'Simpan penutupan' }).click();
    await expect(page.getByText('Penutupan disimpan')).toBeVisible();
    await expect(active.getByRole('cell', { name: 'Perawatan lift' })).toBeVisible();
    await expect(active.getByText('Sampai diakhiri')).toBeVisible();
    await expect.poll(async () => (await current()).length).toBe(1);
    await page.screenshot({ path: shot('02-sedang-berlaku') });

    // Ubah waktu selesai.
    await active.getByRole('button', { name: 'Ubah waktu selesai' }).click();
    const ends = page.getByRole('dialog', { name: 'Ubah waktu selesai' });
    await ends
      .getByRole('textbox')
      .or(ends.locator('input[type="datetime-local"]'))
      .first()
      .fill(inDays(3, '17:00'));
    await ends.getByRole('button', { name: /Simpan/ }).click();
    await expect(page.getByText('Waktu selesai diubah')).toBeVisible();
    await expect(active.getByText('Sampai diakhiri')).toBeHidden();
    await expect.poll(async () => (await current())[0]?.endsAt ?? null).not.toBeNull();

    // Akhiri sekarang.
    await active.getByRole('button', { name: 'Akhiri sekarang' }).click();
    await expect(page.getByText('Penutupan diakhiri')).toBeVisible();
    await expect(active.getByText('Tidak ada penutupan yang sedang berlaku.')).toBeVisible();
    await expect.poll(async () => (await current()).length).toBe(0);

    // Penutupan terjadwal lalu dibatalkan.
    await pickTarget(/Eskalator/);
    await dialog.getByLabel('Alasan').fill('Pembersihan eskalator');
    await dialog.getByLabel('Mulai').fill(inDays(2, '08:00'));
    await dialog.getByLabel('Selesai (opsional)').fill(inDays(2, '12:00'));
    await dialog.getByRole('button', { name: 'Simpan penutupan' }).click();
    await expect(scheduled.getByRole('cell', { name: 'Pembersihan eskalator' })).toBeVisible();
    await page.screenshot({ path: shot('03-terjadwal') });
    await scheduled.getByRole('button', { name: 'Batalkan' }).click();
    await expect(page.getByText('Penutupan dibatalkan')).toBeVisible();
    await expect(scheduled.getByText('Tidak ada penutupan terjadwal.')).toBeVisible();

    // Peta hanya baca untuk Operator.
    const editor = new EditorPage(page);
    await editor.goto();
    await expect(editor.tool('Poligon')).toBeDisabled();
    await expect(editor.tool('Jalur')).toBeDisabled();
    await expect(editor.tool('Pilih')).toBeEnabled();
    await page.screenshot({ path: shot('04-editor-hanya-baca') });
  });
});
