import { areaM2, type Polygon } from '@indoor/domain';
import { expect, TEST_CENTER, test } from '../../fixtures';
import { AdminShell } from '../../pages/admin-shell';
import { EditorPage } from '../../pages/editor-page';

// Persegi 140 × 140 px di tengah kanvas. Lantai kosong dibuka di pusat footprint dengan
// zoom 18 (±0,297 m per piksel di lintang ini), jadi sisinya ±41,6 m dan luasnya ±1.730 m².
const SQUARE = [
  [-70, -70],
  [70, -70],
  [70, 70],
  [-70, 70],
] as const;

test.describe('Gambar unit', () => {
  test('Editor menggambar poligon, unit tersimpan dengan kode otomatis', async ({
    page,
    loginAs,
    testVenue,
    superAdmin,
  }) => {
    const { venue, floor } = testVenue;
    await loginAs('editor');
    await new AdminShell(page).selectVenue(venue.name);
    const editor = new EditorPage(page);
    await editor.goto();

    await editor.tool('Poligon').click();
    await editor.drawPolygon(SQUARE);
    await expect(editor.saveStatus('Tersimpan')).toBeVisible();

    // Yang dibaca dari server, bukan hanya yang tampil di layar.
    await expect
      .poll(async () => {
        const { features } = await superAdmin.features.listByFloor(floor.id);
        return features.map((f) => [f.properties.kind, f.properties.unitCode]);
      })
      .toEqual([['unit', 'UJI-GF-001']]);
    const [unit] = (await superAdmin.features.listByFloor(floor.id)).features;
    const geometry = unit?.geometry as Polygon;
    expect(geometry.type).toBe('Polygon');
    const ring = geometry.coordinates[0] ?? [];
    expect(ring).toHaveLength(SQUARE.length + 1);
    const area = areaM2(geometry);
    expect(area).toBeGreaterThan(1550);
    expect(area).toBeLessThan(1900);
    const corners = ring.slice(0, -1);
    const lng = corners.reduce((sum, p) => sum + p[0], 0) / corners.length;
    const lat = corners.reduce((sum, p) => sum + p[1], 0) / corners.length;
    expect(Math.abs(lng - TEST_CENTER[0])).toBeLessThan(0.00005);
    expect(Math.abs(lat - TEST_CENTER[1])).toBeLessThan(0.00005);

    // Setelah muat ulang unit tetap ada dan bisa dipilih lewat daftar fitur.
    await page.reload();
    await editor.waitReady();
    await editor.selectFromList(floor.name, 'UJI-GF-001');
    await expect(editor.properties.getByRole('heading', { level: 2 })).toHaveText(
      /^Unit\s*UJI-GF-001$/,
    );
  });

  test('Viewer hanya bisa memilih, tidak bisa menggambar', async ({ page, loginAs, testVenue }) => {
    await loginAs('viewer');
    await new AdminShell(page).selectVenue(testVenue.venue.name);
    const editor = new EditorPage(page);
    await editor.goto();

    await expect(editor.tool('Pilih')).toBeEnabled();
    for (const name of ['Poligon', 'Garis', 'Titik'] as const) {
      await expect(editor.tool(name)).toBeDisabled();
    }
  });
});
