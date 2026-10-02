import { readFile } from 'node:fs/promises';
import type { Venue } from '@indoor/domain';
import type { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';

const shot = (name: string) => `evidence/T-305/${name}.png`;

async function download(page: Page, button: string) {
  const [file] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: button }).click(),
  ]);
  return { name: file.suggestedFilename(), bytes: await readFile(await file.path()) };
}

/** CSV mengikuti header template; kolom yang tidak disebut dibiarkan kosong. */
function csv(header: string[], rows: Record<string, string>[]): Buffer {
  const cell = (v: string) => (/[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = [header, ...rows.map((r) => header.map((h) => r[h] ?? ''))];
  return Buffer.from(lines.map((l) => l.map(cell).join(',')).join('\n'));
}

test.describe('T-305 Import CSV/Excel', () => {
  test('template CSV/XLSX, pratinjau baru/perbarui/gagal, simpan hanya baris valid', async ({
    page,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    await loginAs('editor');
    await new AdminShell(page).selectVenue(fullVenue.name);
    await page.goto('/locations');
    await page.getByRole('button', { name: 'Import' }).click();
    const sheet = page.getByRole('dialog', { name: 'Import lokasi' });
    await expect(sheet.getByLabel('Berkas')).toBeEnabled();
    await sheet.getByLabel('Tipe lokasi').click();
    await page.getByRole('option', { name: 'Layanan' }).click();

    // Template: CSV ber-BOM dengan kolom standar, XLSX berupa arsip zip.
    const template = await download(page, 'Template CSV');
    expect(template.name).toMatch(/^template-.*\.csv$/);
    const header =
      template.bytes.toString('utf8').replace(/^﻿/, '').split(/\r?\n/)[0]?.split(',') ?? [];
    expect(header.slice(0, 7)).toEqual([
      'kode_lokasi',
      'nama',
      'kategori',
      'deskripsi',
      'status',
      'tanggal_buka',
      'kode_unit',
    ]);
    const xlsx = await download(page, 'Template XLSX');
    expect(xlsx.name).toMatch(/\.xlsx$/);
    expect(xlsx.bytes.subarray(0, 2).toString('latin1')).toBe('PK');

    // Berkas tanpa kolom wajib ditolak.
    await sheet.getByLabel('Berkas').setInputFiles({
      name: 'salah.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('judul,keterangan\nA,B\n'),
    });
    await expect(sheet.getByText(/Kolom wajib tidak ada: .*nama/)).toBeVisible();
    await page.screenshot({ path: shot('01-kolom-wajib-hilang') });

    // Empat baris: baru, perbarui, dua gagal.
    await sheet.getByLabel('Berkas').setInputFiles({
      name: 'lokasi.csv',
      mimeType: 'text/csv',
      buffer: csv(header, [
        {
          kode_lokasi: 'GIGI-01',
          nama: 'Klinik Gigi Ümmü',
          kategori: 'Pemeriksaan',
          status: 'aktif',
          kode_unit: 'GF-B05',
        },
        { kode_lokasi: 'RAD-01', nama: 'Radiologi', deskripsi: 'Rontgen, CT "scan"; USG' },
        { kode_lokasi: 'SALAH-1', nama: 'Unit Tidak Ada', kode_unit: 'ZZ-99' },
        { kode_lokasi: 'SALAH-2', nama: '' },
      ]),
    });
    await expect(sheet.getByText(/1 baru · 1 memperbarui · 2 gagal dari 4 baris\./)).toBeVisible();
    const failed = sheet.getByRole('row').filter({ hasText: 'Gagal' });
    await expect(failed).toHaveCount(2);
    await expect(failed.filter({ hasText: 'kode_unit' })).toHaveCount(1);
    await expect(failed.filter({ hasText: 'nama' })).toHaveCount(1);
    await page.screenshot({ path: shot('02-pratinjau') });

    await sheet.getByRole('button', { name: 'Simpan 2 baris valid' }).click();
    await expect(page.getByText('2 lokasi diimpor')).toBeVisible();
    await expect(sheet).toBeHidden();
    await expect(page.getByRole('row').filter({ hasText: 'Klinik Gigi Ümmü' })).toContainText(
      'GF-B05',
    );
    await page.screenshot({ path: shot('03-hasil-import') });

    const locations = await superAdmin.locations.list(venueId);
    expect(locations.find((l) => l.code === 'GIGI-01')).toMatchObject({
      name: 'Klinik Gigi Ümmü',
      status: 'active',
    });
    const radiology = locations.find((l) => l.code === 'RAD-01');
    expect(radiology?.description).toBe('Rontgen, CT "scan"; USG');
    // Sel kosong mempertahankan nilai lama: unit Radiologi tetap.
    expect(radiology?.units.length).toBeGreaterThan(0);
    expect(locations.some((l) => l.code === 'SALAH-1' || l.code === 'SALAH-2')).toBe(false);
  });
});
