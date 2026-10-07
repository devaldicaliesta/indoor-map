import type { FloorId, Venue } from '@indoor/domain';
import type { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { DataTablePage } from '../../../pages/data-table';
import { drawPlan } from '../../../support/plan-files';

const shot = (name: string) => `evidence/T-503/${name}.png`;

/** Kolom template impor lokasi (T-305); kolom lain dibiarkan kosong. */
const IMPORT_HEADER = [
  'kode_lokasi',
  'nama',
  'kategori',
  'deskripsi',
  'status',
  'tanggal_buka',
  'kode_unit',
];

function csv(rows: Record<string, string>[]): Buffer {
  const lines = [IMPORT_HEADER, ...rows.map((r) => IMPORT_HEADER.map((h) => r[h] ?? ''))];
  return Buffer.from(lines.map((l) => l.join(',')).join('\n'));
}

const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();

/**
 * Satu tabel di daftar periksa: DataTable dengan kolom cari dan filter yang sesuai kolomnya
 * (label filter; rentang tanggal memakai label "… dari").
 */
async function checkTable(page: Page, label: string, filters: readonly string[], name: string) {
  const table = new DataTablePage(page, label);
  await table.ready();
  await expect(table.search).toBeVisible();
  for (const filter of filters) {
    await expect(table.root.getByLabel(filter, { exact: true })).toBeVisible();
  }
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  // Satu halaman bisa memuat dua tabel (field dan kategori): tabelnya ditandai di gambar.
  await table.root.evaluate((el) => {
    (el as HTMLElement).style.outline = '3px solid #fec409';
    (el as HTMLElement).style.outlineOffset = '6px';
  });
  await page.screenshot({ path: shot(name), fullPage: true });
  await table.root.evaluate((el) => {
    (el as HTMLElement).style.outline = '';
  });
  return label;
}

test.describe('T-503 Daftar periksa 17 tabel Admin', () => {
  test('TC-TBL-10 setiap tabel memakai DataTable dengan cari dan filter sesuai kolomnya', async ({
    page,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    test.setTimeout(240_000);
    const venueId = fullVenue.venueId as Venue['id'];
    // Gedung dengan lantai terbanyak agar tabel Lantai berisi beberapa baris.
    const floorsOf = (id: string) => fullVenue.source.floors.filter((f) => f.buildingId === id);
    const [mainBuilding] = [...fullVenue.source.buildings].sort(
      (a, b) => floorsOf(b.id).length - floorsOf(a.id).length,
    );
    const groundFloor = fullVenue.source.floors.find(
      (f) => f.buildingId === mainBuilding?.id && f.level === 0,
    );
    const [lift, escalator] = fullVenue.source.graph.connectors;
    if (!mainBuilding || !groundFloor || !lift || !escalator) {
      throw new Error('Venue lengkap tanpa gedung, lantai GF, atau konektor.');
    }

    // Data agar setiap tabel berisi: dua versi denah, penutupan tiga keadaan, satu versi terbit.
    await page.goto('about:blank');
    for (const label of ['Denah GF v1', 'Denah GF v2']) {
      const png = await drawPlan(page, 'image/png', label);
      await superAdmin.floorPlans.upload(groundFloor.id as FloorId, {
        source: new File([png], `${label.toLowerCase().replaceAll(' ', '-')}.png`, {
          type: 'image/png',
        }),
      });
    }
    const closure = (id: string, reason: string, startsAt: string, endsAt: string | null) =>
      superAdmin.closures.create(venueId, {
        target: { kind: 'connector', id },
        reason,
        startsAt,
        endsAt,
      });
    await closure(lift.id, 'Perawatan berkala lift', hoursFromNow(-1), null);
    await closure(escalator.id, 'Pembersihan eskalator', hoursFromNow(26), hoursFromNow(30));
    await closure(lift.id, 'Pemeriksaan kabel lift', hoursFromNow(-72), hoursFromNow(-48));
    await superAdmin.publications.publish(venueId, 'Rilis pertama venue lengkap');

    await loginAs('super_admin');
    await new AdminShell(page).selectVenue(fullVenue.name);
    const checked: string[] = [];

    await page.goto('/venues?tab=venues');
    checked.push(await checkTable(page, 'Venue', ['Tipe venue', 'Zona waktu'], '20-tabel-venue'));

    await page.goto('/venues');
    checked.push(await checkTable(page, 'Gedung', ['Footprint'], '21-tabel-gedung'));
    await page
      .getByRole('row')
      .filter({ hasText: mainBuilding.name })
      .getByRole('button', { name: 'Lantai', exact: true })
      .click();
    checked.push(await checkTable(page, 'Lantai', ['Gedung'], '22-tabel-lantai'));
    await page
      .getByRole('dialog', { name: `Lantai ${mainBuilding.name}` })
      .getByRole('row')
      .filter({ has: page.getByRole('cell', { name: groundFloor.name, exact: true }) })
      .getByRole('button', { name: 'Denah' })
      .click();
    await expect(
      page.getByRole('dialog', { name: `Denah lantai ${groundFloor.name}` }),
    ).toBeVisible();
    checked.push(
      await checkTable(
        page,
        'Riwayat denah',
        ['Format', 'Diunggah dari'],
        '23-tabel-riwayat-denah',
      ),
    );

    await page.goto('/locations');
    checked.push(
      await checkTable(
        page,
        'Lokasi',
        ['Status', 'Kategori', 'Tipe', 'Gedung', 'Lantai', 'Tautan unit'],
        '24-tabel-lokasi',
      ),
    );
    await page.getByRole('button', { name: 'Import' }).click();
    const sheet = page.getByRole('dialog', { name: 'Import lokasi' });
    await expect(sheet.getByLabel('Berkas')).toBeEnabled();
    await sheet.getByLabel('Tipe lokasi').click();
    await page.getByRole('option', { name: 'Layanan' }).click();
    await sheet.getByLabel('Berkas').setInputFiles({
      name: 'lokasi-baru.csv',
      mimeType: 'text/csv',
      buffer: csv([
        { kode_lokasi: 'DEMO-01', nama: 'Klinik Gigi Ümmü', status: 'aktif' },
        { kode_lokasi: 'DEMO-02', nama: 'Kafe Lobi Timur', status: 'aktif' },
        { kode_lokasi: 'DEMO-03', nama: '' },
        { kode_lokasi: 'DEMO-04', nama: 'Unit Tidak Ada', kode_unit: 'ZZ-99' },
      ]),
    });
    checked.push(await checkTable(page, 'Pratinjau impor', ['Hasil'], '25-tabel-pratinjau-impor'));
    await page.keyboard.press('Escape');

    // Tipe "Layanan" punya field kustom dan kategori.
    await page.goto('/locations?tab=types');
    await page
      .getByRole('navigation', { name: 'Tipe lokasi' })
      .getByRole('button', { name: /Layanan/ })
      .click();
    checked.push(await checkTable(page, 'Field', ['Jenis', 'Sifat'], '26-tabel-kolom-kustom'));
    checked.push(await checkTable(page, 'Kategori', ['Pemakaian'], '27-tabel-kategori'));

    await page.goto('/settings');
    checked.push(
      await checkTable(
        page,
        'Jenis fasilitas',
        ['Keselamatan', 'Pemakaian'],
        '28-tabel-jenis-fasilitas',
      ),
    );
    await page.goto('/settings?tab=instructions');
    checked.push(await checkTable(page, 'Template instruksi', ['Status'], '29-tabel-instruksi'));
    await page.goto('/settings?tab=audit');
    checked.push(
      await checkTable(
        page,
        'Log audit',
        ['Aksi', 'Pengguna', 'Tanggal dari'],
        '30-tabel-log-audit',
      ),
    );

    await page.goto('/closures');
    checked.push(
      await checkTable(page, 'Penutupan', ['Status', 'Berlaku dari'], '31-tabel-penutupan'),
    );
    await page.goto('/origin-points');
    checked.push(await checkTable(page, 'Titik asal', ['Lantai', 'Jalur'], '32-tabel-titik-asal'));
    await page.goto('/origin-points?tab=info-points');
    checked.push(
      await checkTable(page, 'Info Point', ['Lantai', 'Mode', 'Jalur'], '33-tabel-info-point'),
    );
    await page.goto('/publish');
    checked.push(
      await checkTable(page, 'Riwayat versi', ['Terbit dari'], '34-tabel-riwayat-publish'),
    );
    await page.goto('/users');
    checked.push(await checkTable(page, 'Pengguna', ['Role', 'Status'], '35-tabel-pengguna'));
    await page.goto('/license');
    checked.push(await checkTable(page, 'Kuota lisensi', ['Status kuota'], '36-tabel-lisensi'));

    expect(new Set(checked).size).toBe(17);
  });
});
