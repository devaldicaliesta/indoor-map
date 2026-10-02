import { FeatureIdSchema, type Polygon } from '@indoor/domain';
import type { Page } from '@playwright/test';
import { expect, TEST_CENTER, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';

const shot = (name: string) => `evidence/T-109/${name}.png`;

/** Persegi 50 × 50 px di sel grid (kolom, baris) relatif terhadap pusat kanvas. */
const cell = (col: number, row: number): [number, number][] => {
  // Di dalam footprint gedung uji (±145 px dari pusat pada zoom awal) agar tidak ada temuan validasi.
  const x = -130 + col * 95;
  const y = -130 + row * 80;
  return [
    [x, y],
    [x + 50, y],
    [x + 50, y + 50],
    [x, y + 50],
  ];
};

async function pickKind(page: Page, name: string) {
  await page
    .getByRole('radiogroup', { name: 'Jenis fitur yang digambar' })
    .getByRole('radio', { name, exact: true })
    .click();
}

async function clickAt(page: Page, editor: EditorPage, dx: number, dy: number, double = false) {
  const box = await editor.canvas.boundingBox();
  if (!box) throw new Error('kanvas tidak tampil');
  const x = box.x + box.width / 2 + dx;
  const y = box.y + box.height / 2 + dy;
  if (double) await page.mouse.dblclick(x, y);
  else await page.mouse.click(x, y);
}

test.describe('T-109 Jenis fitur dan atribut unit', () => {
  test('TC-MAP semua jenis fitur dalam ruang tergambar dengan gaya berbeda', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    const { venue, floor } = testVenue;
    await loginAs('editor');
    await new AdminShell(page).selectVenue(venue.name);
    const editor = new EditorPage(page);
    await editor.goto();

    const polygons = ['Unit', 'Koridor', 'Lift', 'Eskalator', 'Tangga', 'Area non-akses'];
    for (const [i, kind] of polygons.entries()) {
      await editor.tool('Poligon').click();
      await pickKind(page, kind);
      await editor.drawPolygon(cell(i % 3, Math.floor(i / 3)));
      await expect(editor.saveStatus('Tersimpan')).toBeVisible();
    }
    await editor.tool('Garis').click();
    await clickAt(page, editor, -130, 40);
    await clickAt(page, editor, 120, 40, true);
    for (const [i, kind] of ['Pintu', 'Pintu keluar'].entries()) {
      await editor.tool('Titik').click();
      await pickKind(page, kind);
      await clickAt(page, editor, -100 + i * 120, 100);
      await expect(editor.saveStatus('Tersimpan')).toBeVisible();
    }
    await editor.tool('Pilih').click();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Geometri valid')).toBeVisible();
    await page.screenshot({ path: shot('01-semua-jenis') });

    await expect
      .poll(async () =>
        (await superAdmin.features.listByFloor(floor.id)).features
          .map((f) => f.properties.kind)
          .sort(),
      )
      .toEqual(
        [
          'corridor',
          'door',
          'elevator',
          'escalator',
          'exit',
          'non_walkable',
          'stairs',
          'unit',
          'wall',
        ].sort(),
      );
    const list = page.getByRole('navigation', { name: 'Fitur lantai GF' });
    for (const label of [...polygons, 'Dinding', 'Pintu', 'Pintu keluar']) {
      await expect(list.getByRole('button', { name: new RegExp(`^${label}\\s*1$`) })).toBeVisible();
    }
  });

  test('TC-MAP atribut unit: kode dinormalkan, ganda ditolak menyebut unit bentrok, status, luas', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    const { venue, building, floor } = testVenue;
    // Unit di lantai lain dengan kode yang nanti bentrok.
    const l1 = await superAdmin.floors.create(building.id, { name: 'L1', level: 1, heightM: 4 });
    const square = (dx: number): Polygon => {
      const [x, y] = [TEST_CENTER[0] + dx, TEST_CENTER[1]];
      const h = 0.00008;
      return {
        type: 'Polygon',
        coordinates: [
          [
            [x - h, y + h],
            [x + h, y + h],
            [x + h, y - h],
            [x - h, y - h],
            [x - h, y + h],
          ],
        ],
      };
    };
    const save = (floorId: string, code: string, dx: number) => {
      const id = FeatureIdSchema.parse(crypto.randomUUID());
      return superAdmin.features.save(venue.id, {
        type: 'Feature',
        id,
        geometry: square(dx),
        properties: { id, kind: 'unit', floorId, unitCode: code, unitStatus: 'occupied' },
      });
    };
    await save(l1.id, 'L1-ATRIUM', 0);
    await save(floor.id, 'GF-A', -0.0002);
    await save(floor.id, 'GF-B', 0.0002);

    await loginAs('editor');
    await new AdminShell(page).selectVenue(venue.name);
    const editor = new EditorPage(page);
    await editor.goto();
    await editor.selectFromList('GF', 'GF-A');
    const code = editor.properties.getByLabel('Kode unit');

    // Huruf kecil dan spasi dinormalkan.
    await code.fill('  ri-01 ');
    await code.press('Enter');
    await expect(editor.properties.getByRole('heading', { level: 2 })).toHaveText(/RI-01/);

    // Ganda di lantai sama dan di lantai lain: pesan menyebut unit yang bentrok.
    // Ketik lalu Enter langsung (seperti menempel kode): yang dipilih harus hasil teks terbaru.
    await editor.selectFromList('GF', 'GF-B');
    await expect(editor.properties.getByRole('heading', { level: 2 })).toHaveText(/GF-B/);
    await code.fill('Ri-01');
    await code.press('Enter');
    await expect(
      editor.properties.getByText('Kode RI-01 sudah dipakai unit lain di lantai GF.'),
    ).toBeVisible();
    await page.screenshot({ path: shot('06-kode-ganda') });
    await code.fill('l1-atrium');
    await code.press('Enter');
    await expect(
      editor.properties.getByText('Kode L1-ATRIUM sudah dipakai unit di Gedung Uji lantai L1.'),
    ).toBeVisible();

    // Status dan luas manual.
    await code.fill('GF-B');
    await code.press('Enter');
    await editor.properties.getByRole('combobox', { name: 'Status' }).click();
    await page.getByRole('option', { name: 'Renovasi' }).click();
    const area = editor.properties.getByLabel('Luas (m²)');
    await area.fill('123,5');
    await area.press('Enter');
    await expect(editor.saveStatus('Tersimpan')).toBeVisible();
    await page.screenshot({ path: shot('02-atribut-unit') });

    await expect
      .poll(async () => {
        const units = (await superAdmin.features.listByFloor(floor.id)).features;
        return units
          .map((f) => [f.properties.unitCode, f.properties.unitStatus, f.properties.areaM2 ?? null])
          .sort();
      })
      .toEqual([
        ['GF-B', 'renovation', 123.5],
        ['RI-01', 'occupied', null],
      ]);
  });
});
