import { readFileSync, writeFileSync } from 'node:fs';
import type { VenueId } from '@indoor/domain';
import { type ExportFeatureCollection, validateImdf } from '@indoor/domain/export';
import type { Page } from '@playwright/test';
import { strFromU8, unzipSync } from 'fflate';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';

const evidence = (name: string) => `evidence/T-594/${name}`;

/** Unduh zip dari dialog export lalu buka isinya sebagai JSON per nama berkas. */
async function download(page: Page, path: string) {
  const downloading = page.waitForEvent('download');
  await page.getByRole('dialog').getByRole('button', { name: 'Unduh zip' }).click();
  const file = await downloading;
  await file.saveAs(path);
  const entries = unzipSync(new Uint8Array(readFileSync(path)));
  const files = Object.fromEntries(
    Object.entries(entries).map(([name, bytes]) => [name, JSON.parse(strFromU8(bytes)) as unknown]),
  );
  return { name: file.suggestedFilename(), files };
}

test.describe('T-594 Export GeoJSON dan IMDF', () => {
  test('TC-OPS-12, TC-OPS-13: Admin mengekspor versi aktif ke GeoJSON dan IMDF', async ({
    page,
    loginAs,
    superAdmin,
    fullVenue,
  }, testInfo) => {
    test.setTimeout(180_000);
    const venueId = fullVenue.venueId as VenueId;
    await superAdmin.publications.publish(venueId, 'Rilis untuk export');
    const snapshot = await superAdmin.publications.activeSnapshot(venueId);
    if (!snapshot) throw new Error('versi aktif tidak terbaca');

    await loginAs('admin');
    await new AdminShell(page).selectVenue(fullVenue.name);
    await page.goto('/publish');
    const exportButton = page.getByRole('button', { name: 'Export data' });
    await expect(exportButton).toBeVisible();
    await page.screenshot({ path: evidence('01-publish-tombol-export.png'), fullPage: true });

    // GeoJSON: geometri sama persis dengan snapshot versi aktif.
    await exportButton.click();
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: `Export data peta v${snapshot.version}` }),
    ).toBeVisible();
    await expect(dialog.getByRole('radio', { name: 'GeoJSON' })).toBeChecked();
    await page.screenshot({ path: evidence('02-dialog-geojson.png') });
    const geojson = await download(page, testInfo.outputPath('geojson.zip'));
    expect(geojson.name).toMatch(new RegExp(`-v${snapshot.version}-geojson\\.zip$`));
    expect(Object.keys(geojson.files).sort()).toEqual([
      'buildings.geojson',
      'features.geojson',
      'graph.geojson',
      'locations.geojson',
      'venue.json',
    ]);
    const features = geojson.files['features.geojson'] as ExportFeatureCollection;
    expect(features.features.map((f) => [f.id, f.geometry])).toEqual(
      snapshot.features.features.map((f) => [f.id, f.geometry]),
    );
    const graph = geojson.files['graph.geojson'] as ExportFeatureCollection;
    expect(graph.features.filter((f) => f.properties.element === 'edge')).toHaveLength(
      snapshot.graph.edges.length,
    );
    await expect(page.getByText('Export selesai').last()).toBeVisible();
    await expect(dialog).toBeHidden();

    // IMDF: alamat wajib diperiksa per kolom sebelum paket dibuat.
    await exportButton.click();
    await dialog.getByRole('radio', { name: 'IMDF' }).check();
    await dialog.getByLabel('Alamat', { exact: true }).fill('');
    await dialog.getByLabel('Kode negara').fill('IDN');
    await dialog.getByLabel('Kode provinsi (opsional)').fill('Jakarta');
    await dialog.getByRole('button', { name: 'Unduh zip' }).click();
    await expect(dialog.getByText('Isi alamat venue.')).toBeVisible();
    await expect(dialog.getByText('Isi kota atau kabupaten.')).toBeVisible();
    await expect(dialog.getByText('Kode negara dua huruf ISO 3166-1, misalnya ID.')).toBeVisible();
    await expect(dialog.getByLabel('Kode negara')).toHaveAttribute('aria-invalid', 'true');
    await page.screenshot({ path: evidence('03-imdf-validasi-alamat.png') });

    await dialog.getByLabel('Alamat', { exact: true }).fill('Jl. Medan Merdeka Barat No. 12');
    await dialog.getByLabel('Kota/kabupaten').fill('Jakarta Pusat');
    await dialog.getByLabel('Kode provinsi (opsional)').fill('id-jk');
    await dialog.getByLabel('Kode negara').fill('id');
    await dialog.getByLabel('Kode pos (opsional)').fill('10110');
    await page.screenshot({ path: evidence('04-imdf-alamat-terisi.png') });
    const imdf = await download(page, testInfo.outputPath('imdf.zip'));
    expect(imdf.name).toMatch(new RegExp(`-v${snapshot.version}-imdf\\.zip$`));
    const issues = validateImdf(imdf.files);
    writeFileSync(
      evidence('06-validator-imdf.txt'),
      [
        `Paket: ${imdf.name}`,
        ...Object.entries(imdf.files).map(([name, value]) => {
          const count = (value as { features?: unknown[] }).features?.length;
          return `${name}: ${count === undefined ? 'manifest' : `${count} fitur`}`;
        }),
        `Temuan validator: ${issues.length}`,
        ...issues.map((i) => `${i.file} ${i.id ?? ''} ${i.message}`),
        '',
      ].join('\n'),
    );
    expect(issues).toEqual([]);
    expect(imdf.files['address.geojson']).toMatchObject({
      features: [{ properties: { locality: 'Jakarta Pusat', province: 'ID-JK', country: 'ID' } }],
    });
    await expect(dialog).toBeHidden();
    await expect(page.getByText(imdf.name)).toBeVisible();
    await page.screenshot({ path: evidence('05-imdf-terunduh.png') });
  });

  test('Editor tidak melihat tombol export', async ({ page, loginAs, superAdmin, fullVenue }) => {
    await superAdmin.publications.publish(fullVenue.venueId as VenueId);
    await loginAs('editor');
    await new AdminShell(page).selectVenue(fullVenue.name);
    await page.goto('/publish');
    await expect(page.getByRole('heading', { name: 'Versi published' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Export data' })).toHaveCount(0);
    await page.screenshot({ path: evidence('07-editor-tanpa-export.png'), fullPage: true });
  });
});
