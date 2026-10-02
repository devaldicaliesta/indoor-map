import { fileURLToPath } from 'node:url';
import { expect, test } from '../../fixtures';
import { AdminShell } from '../../pages/admin-shell';

const shot = (name: string) => `test-results/evidence/T-313/${name}.png`;
// Denah 40 × 20 m dalam milimeter: layer DINDING, PINTU, TEKS, FURNITUR, GRID.
const DXF = fileURLToPath(new URL('../../files/denah-contoh.dxf', import.meta.url));

test.describe('Denah dari DXF', () => {
  test.skip(!process.env.VITE_CAD_CONVERTER_URL, 'Layanan cad-converter belum diatur');

  test('DWG ditolak dengan arahan; DXF dipilih layernya, diunggah, lalu ditempatkan', async ({
    page,
    loginAs,
    testVenue,
    superAdmin,
  }) => {
    const { venue, building, floor } = testVenue;
    await loginAs('admin');
    await new AdminShell(page).selectVenue(venue.name);
    await page.goto('/venues');
    await page
      .getByRole('row', { name: new RegExp(building.name) })
      .getByRole('button', { name: 'Lantai' })
      .click();
    await page
      .getByRole('row', { name: new RegExp(floor.name) })
      .getByRole('button', { name: 'Denah' })
      .click();
    await page.getByRole('button', { name: 'Unggah denah' }).click();

    const file = page.getByLabel('Berkas denah');
    await file.setInputFiles({ name: 'denah.dwg', mimeType: '', buffer: Buffer.from('AC1032') });
    await expect(page.getByText(/DWG tidak didukung\. Simpan sebagai DXF atau PDF/)).toBeVisible();
    await page.screenshot({ path: shot('01-dwg-ditolak'), fullPage: true });

    await file.setInputFiles(DXF);
    const layers = page.getByRole('group', { name: 'Layer DXF' });
    await expect(layers.getByRole('checkbox')).toHaveCount(5);
    await expect(page.getByText(/Satuan berkas: milimeter/)).toBeVisible();
    await expect(page.getByRole('img', { name: 'Pratinjau denah-contoh.dxf' })).toBeVisible({
      timeout: 20_000,
    });
    await page.screenshot({ path: shot('02-semua-layer'), fullPage: true });

    // Garis bantu dan furnitur tidak dipakai sebagai acuan menggambar.
    await layers.getByLabel('GRID').uncheck();
    await layers.getByLabel('FURNITUR').uncheck();
    await expect(page.getByText(/Lebar gambar 40 m menjadi skala awal/)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByRole('img', { name: 'Pratinjau denah-contoh.dxf' })).toBeVisible();
    await page.screenshot({ path: shot('03-layer-dipilih'), fullPage: true });

    await page.getByRole('button', { name: 'Jadikan denah aktif' }).click();
    await expect(page.getByText(/dxf · 3 layer/i)).toBeVisible();
    await page.screenshot({ path: shot('04-denah-aktif'), fullPage: true });

    const [plan] = await superAdmin.floorPlans.list(floor.id);
    expect(plan).toMatchObject({
      sourceFormat: 'dxf',
      cadLayers: ['DINDING', 'PINTU', 'TEKS'],
      naturalWidthM: 40,
    });

    await page.getByRole('link', { name: 'Tempatkan di peta' }).click();
    await expect(page).toHaveURL(new RegExp(`/venues/floors/${floor.id}/plan`));
    await expect(page.getByTestId('georef-map')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    await expect(page.getByLabel('Lebar')).toHaveValue('40');
    await page.screenshot({ path: shot('05-georeferensi') });
  });
});
