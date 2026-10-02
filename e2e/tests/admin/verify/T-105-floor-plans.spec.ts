import type { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { drawPlan, multiPagePdf } from '../../../support/plan-files';

const shot = (name: string) => `evidence/T-105/${name}.png`;

async function capture(page: Page, name: string) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await page.screenshot({ path: shot(name), fullPage: true });
}

test.describe('T-105 Unggah denah PNG/JPG/PDF', () => {
  test('TC-PLAN unggah PNG → JPG → PDF halaman 2, riwayat versi, tipe salah ditolak', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    const { venue, floor } = testVenue;
    await loginAs('admin');
    await new AdminShell(page).selectVenue(venue.name);
    await page.goto('/venues');
    await page
      .getByRole('row')
      .filter({ hasText: 'UJI' })
      .getByRole('button', { name: 'Lantai' })
      .click();
    await page
      .getByRole('row')
      .filter({ hasText: 'GF' })
      .getByRole('button', { name: 'Denah' })
      .click();
    const dialog = page.getByRole('dialog', { name: 'Denah lantai GF' });
    await capture(page, '01-belum-ada-denah');

    const file = dialog.getByLabel('Berkas denah');
    const activate = dialog.getByRole('button', { name: 'Jadikan denah aktif' });

    // Tipe salah dan DWG ditolak sebelum diunggah.
    await dialog.getByRole('button', { name: 'Unggah denah' }).click();
    await file.setInputFiles({
      name: 'catatan.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('bukan denah'),
    });
    await expect(
      dialog.getByText('Tipe berkas tidak didukung. Unggah PNG, JPG, PDF, atau DXF.'),
    ).toBeVisible();
    await expect(activate).toBeDisabled();
    await file.setInputFiles({ name: 'denah.dwg', mimeType: '', buffer: Buffer.from('AC1032') });
    await expect(dialog.getByText(/DWG tidak didukung/)).toBeVisible();
    await capture(page, '06-tipe-salah');

    // PNG.
    await file.setInputFiles({
      name: 'denah-gf.png',
      mimeType: 'image/png',
      buffer: await drawPlan(page, 'image/png', 'GF versi 1 (PNG)'),
    });
    await expect(dialog.getByRole('img', { name: 'Pratinjau denah-gf.png' })).toBeVisible();
    await activate.click();
    await expect(page.getByText('Denah lantai GF diperbarui')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Ganti denah' })).toBeVisible();
    await capture(page, '02-png-aktif');

    // JPG mengganti; PNG masuk riwayat.
    await dialog.getByRole('button', { name: 'Ganti denah' }).click();
    await file.setInputFiles({
      name: 'denah-gf.jpg',
      mimeType: 'image/jpeg',
      buffer: await drawPlan(page, 'image/jpeg', 'GF versi 2 (JPG)'),
    });
    await activate.click();
    await expect(dialog.locator('table').last().getByRole('cell', { name: /png/i })).toBeVisible();
    await expect.poll(async () => (await superAdmin.floorPlans.list(floor.id)).length).toBe(2);

    // PDF dua halaman: pilih halaman 2.
    await dialog.getByRole('button', { name: 'Ganti denah' }).click();
    await file.setInputFiles({
      name: 'denah-gedung.pdf',
      mimeType: 'application/pdf',
      buffer: multiPagePdf(['Denah L1 (halaman 1)', 'Denah GF (halaman 2)']),
    });
    const pageSelect = dialog.getByRole('combobox', { name: 'Halaman PDF' });
    await expect(pageSelect).toHaveText('Halaman 1 dari 2');
    await pageSelect.click();
    await page.getByRole('option', { name: 'Halaman 2 dari 2' }).click();
    await expect(dialog.getByRole('img', { name: 'Pratinjau denah-gedung.pdf' })).toBeVisible();
    await capture(page, '03-pdf-pilih-halaman');
    await activate.click();
    await expect(dialog.getByRole('button', { name: 'Ganti denah' })).toBeVisible();

    // Riwayat: dua versi lama (PNG, JPG); aktif PDF halaman 2.
    const history = dialog.locator('table').last();
    await expect(history.getByRole('cell', { name: /png/i })).toBeVisible();
    await expect(history.getByRole('cell', { name: /jpg|jpeg/i })).toBeVisible();
    await capture(page, '04-riwayat-versi');

    const plans = await superAdmin.floorPlans.list(floor.id);
    expect(plans).toHaveLength(3);
    const active = plans.find((p) => p.isActive);
    expect(active).toMatchObject({ sourceFormat: 'pdf', pdfPage: 2 });
    expect(
      plans
        .filter((p) => !p.isActive)
        .map((p) => p.sourceFormat)
        .sort(),
    ).toEqual(
      expect.arrayContaining([expect.stringMatching(/png/), expect.stringMatching(/jpe?g/)]),
    );
  });
});
