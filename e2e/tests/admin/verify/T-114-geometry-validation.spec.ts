import { FeatureIdSchema, type Polygon } from '@indoor/domain';
import { expect, TEST_CENTER, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';

const shot = (name: string) => `evidence/T-114/${name}.png`;

const [CX, CY] = TEST_CENTER;
const rect = (x: number, y: number, w: number, h: number): Polygon => ({
  type: 'Polygon',
  coordinates: [
    [
      [CX + x, CY + y],
      [CX + x + w, CY + y],
      [CX + x + w, CY + y + h],
      [CX + x, CY + y + h],
      [CX + x, CY + y],
    ],
  ],
});

test.describe('T-114 Validasi geometri', () => {
  test('temuan per jenis tampil; klik temuan memilih fiturnya; perbaikan menghilangkan temuan', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    const { venue, floor } = testVenue;
    const unit = (code: string, geometry: Polygon) => {
      const id = FeatureIdSchema.parse(crypto.randomUUID());
      return superAdmin.features.save(venue.id, {
        type: 'Feature',
        id,
        geometry,
        properties: { id, kind: 'unit', floorId: floor.id, unitCode: code, unitStatus: 'occupied' },
      });
    };
    // Tumpang tindih (A dan B), di luar gedung (LUAR), memotong diri (KUPU), sehat (OK).
    await unit('UJI-A', rect(-0.0003, 0, 0.0001, 0.0001));
    await unit('UJI-B', rect(-0.00025, 0.00005, 0.0001, 0.0001));
    await unit('UJI-LUAR', rect(0.0006, 0, 0.0001, 0.0001));
    await unit('UJI-KUPU', {
      type: 'Polygon',
      coordinates: [
        [
          [CX, CY - 0.0003],
          [CX + 0.0001, CY - 0.0002],
          [CX + 0.0001, CY - 0.0003],
          [CX, CY - 0.0002],
          [CX, CY - 0.0003],
        ],
      ],
    });
    await unit('UJI-OK', rect(0.0001, 0.0001, 0.0001, 0.0001));

    await loginAs('editor');
    await new AdminShell(page).selectVenue(venue.name);
    const editor = new EditorPage(page);
    await editor.goto();

    const summary = page.getByRole('button', { name: /temuan validasi geometri/ });
    await expect(summary).toBeVisible();
    await summary.click();
    const menu = page.getByRole('menu');
    await expect(menu.getByText(/^Unit tumpang tindih · 1$/)).toBeVisible();
    await expect(menu.getByText(/^Di luar batas gedung · \d+$/)).toBeVisible();
    await expect(menu.getByText(/^Poligon memotong diri · 1$/)).toBeVisible();
    await page.screenshot({ path: shot('01-ringkasan-temuan') });

    // Klik temuan "di luar gedung": fiturnya terpilih.
    await menu
      .getByRole('menuitem')
      .filter({ hasText: /UJI-LUAR/ })
      .click();
    await expect(editor.properties.getByRole('heading', { level: 2 })).toHaveText(/UJI-LUAR/);
    await page.screenshot({ path: shot('02-temuan-dipilih') });

    // Daftar fitur menandai fitur bermasalah.
    await page.getByRole('searchbox', { name: 'Cari fitur di lantai GF' }).fill('UJI-');
    await page.screenshot({ path: shot('03-daftar-bertanda') });

    // Perbaiki: hapus fitur bermasalah lewat daftar → "Geometri valid".
    const list = page.getByRole('navigation', { name: 'Fitur lantai GF' });
    for (const code of ['UJI-B', 'UJI-LUAR', 'UJI-KUPU']) {
      await list.getByRole('button', { name: new RegExp(`^${code}`) }).click();
      await page.keyboard.press('Delete');
    }
    await expect(page.getByText('Geometri valid')).toBeVisible();
    await expect(editor.saveStatus('Tersimpan')).toBeVisible();
    await page.screenshot({ path: shot('04-geometri-valid') });
  });
});
