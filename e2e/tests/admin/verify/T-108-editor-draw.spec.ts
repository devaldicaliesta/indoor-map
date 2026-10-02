import { FeatureIdSchema, type Polygon } from '@indoor/domain';
import type { Page } from '@playwright/test';
import { env } from '../../../env';
import { expect, TEST_CENTER, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';

const shot = (name: string) => `evidence/T-108/${name}.png`;

/** Klik titik-titik relatif terhadap pusat kanvas; `double` menyelesaikan garis dengan klik ganda. */
async function clickPath(
  page: Page,
  editor: EditorPage,
  points: [number, number][],
  finish: 'double' | 'none',
) {
  const box = await editor.canvas.boundingBox();
  if (!box) throw new Error('kanvas tidak tampil');
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  for (const [dx, dy] of points) await page.mouse.click(cx + dx, cy + dy);
  const last = points.at(-1);
  if (finish === 'double' && last) await page.mouse.dblclick(cx + last[0], cy + last[1]);
}

/** Rata-rata frame per detik selama peta diseret 1,5 detik. */
async function dragFps(page: Page, editor: EditorPage): Promise<number> {
  const box = await editor.canvas.boundingBox();
  if (!box) throw new Error('kanvas tidak tampil');
  await page.evaluate(() => {
    const w = window as unknown as { __frames: number; __counting: boolean };
    w.__frames = 0;
    w.__counting = true;
    const tick = () => {
      if (!w.__counting) return;
      w.__frames += 1;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const start = Date.now();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 30; i++) await page.mouse.move(cx + i * 6, cy + i * 3);
  for (let i = 30; i >= 0; i--) await page.mouse.move(cx + i * 6, cy + i * 3);
  await page.mouse.up();
  const seconds = (Date.now() - start) / 1000;
  const frames = await page.evaluate(() => {
    const w = window as unknown as { __frames: number; __counting: boolean };
    w.__counting = false;
    return w.__frames;
  });
  return frames / seconds;
}

test.describe('T-108 Editor peta: kanvas, alat gambar, draft', () => {
  test('poligon, garis, titik tersimpan otomatis; tetap setelah muat ulang; Visitor tidak berubah', async ({
    page,
    loginAs,
    superAdmin,
    publishedVenue,
    browser,
  }) => {
    const { venue, floor } = publishedVenue;
    await loginAs('editor');
    await new AdminShell(page).selectVenue(venue.name);
    const editor = new EditorPage(page);
    await editor.goto();
    const before = (await superAdmin.features.listByFloor(floor.id)).features.length;

    await editor.tool('Poligon').click();
    await editor.drawPolygon([
      [-60, 90],
      [60, 90],
      [60, 160],
      [-60, 160],
    ]);
    await expect(editor.saveStatus('Tersimpan')).toBeVisible();

    await editor.tool('Garis').click();
    await clickPath(
      page,
      editor,
      [
        [-150, -150],
        [150, -150],
      ],
      'double',
    );
    await expect(editor.saveStatus('Tersimpan')).toBeVisible();

    await editor.tool('Titik').click();
    await clickPath(page, editor, [[0, 60]], 'none');
    await expect(editor.saveStatus('Tersimpan')).toBeVisible();
    await page.screenshot({ path: shot('01-digambar') });

    await expect
      .poll(async () => (await superAdmin.features.listByFloor(floor.id)).features.length)
      .toBe(before + 3);
    const features = (await superAdmin.features.listByFloor(floor.id)).features;
    const types = features.map((f) => f.geometry.type).sort();
    expect(types).toEqual(expect.arrayContaining(['LineString', 'Point', 'Polygon']));
    const line = features.find((f) => f.geometry.type === 'LineString');
    expect(line?.geometry.type === 'LineString' && line.geometry.coordinates.length).toBe(2);

    // Muat ulang: semua fitur tetap tampil (hitungan di bilah status).
    await page.reload();
    await editor.waitReady();
    await expect(page.getByText(`${before + 3} fitur`, { exact: true })).toBeVisible();
    await page.screenshot({ path: shot('02-setelah-muat-ulang') });

    // Visitor masih memakai snapshot terbit: jumlah unit tidak bertambah sebelum publish.
    const snapshot = await superAdmin.snapshots.latest(venue.id);
    const publishedUnits = snapshot.features.features.filter(
      (f) => f.properties.kind === 'unit',
    ).length;
    expect(publishedUnits).toBe(2);
    const visitor = await browser.newPage({ viewport: { width: 360, height: 740 } });
    try {
      await visitor.goto(`${env.visitorUrl}/v/${venue.id}`);
      await expect(visitor.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
        timeout: 30_000,
      });
      await visitor.screenshot({ path: shot('03-visitor-tanpa-draft') });
    } finally {
      await visitor.close();
    }
  });

  test('NFR-PERF-03 geser peta dengan 1.000 fitur di satu lantai', async ({
    page,
    loginAs,
    superAdmin,
    testVenue,
  }) => {
    test.setTimeout(240_000);
    const { venue, floor } = testVenue;
    // 1.000 unit kecil 40 × 25 dalam grid di sekitar pusat gedung uji.
    const size = 0.000018;
    const jobs = Array.from({ length: 1000 }, (_, i) => {
      const x = TEST_CENTER[0] - 0.00038 + (i % 40) * size;
      const y = TEST_CENTER[1] - 0.00022 + Math.floor(i / 40) * size;
      const geometry: Polygon = {
        type: 'Polygon',
        coordinates: [
          [
            [x, y],
            [x + size * 0.9, y],
            [x + size * 0.9, y + size * 0.9],
            [x, y + size * 0.9],
            [x, y],
          ],
        ],
      };
      const id = FeatureIdSchema.parse(crypto.randomUUID());
      return () =>
        superAdmin.features.save(venue.id, {
          type: 'Feature',
          id,
          geometry,
          properties: {
            id,
            kind: 'unit',
            floorId: floor.id,
            unitCode: `P-${String(i).padStart(4, '0')}`,
            unitStatus: 'occupied',
          },
        });
    });
    for (let i = 0; i < jobs.length; i += 50)
      await Promise.all(jobs.slice(i, i + 50).map((job) => job()));

    // Pembanding di lingkungan yang sama (kontainer tanpa GPU memakai SwiftShader): lantai L1
    // kosong. Lantai GF tidak dibuka dulu agar tidak terkunci untuk pengisian data di atas.
    const { building } = testVenue;
    await superAdmin.floors.create(building.id, { name: 'L1', level: 1, heightM: 4 });
    await loginAs('editor');
    await new AdminShell(page).selectVenue(venue.name);
    const editor = new EditorPage(page);
    await editor.goto();
    await page.getByRole('radio', { name: 'L1', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Fitur L1' })).toBeVisible();
    await editor.waitReady();
    const baseline = await dragFps(page, editor);

    const opened = Date.now();
    await page.getByRole('radio', { name: 'GF', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Fitur GF' })).toBeVisible();
    await editor.waitReady();
    const loadSeconds = (Date.now() - opened) / 1000;
    await expect(page.getByText('1.000 fitur', { exact: true })).toBeVisible();
    const fps = await dragFps(page, editor);
    await page.screenshot({ path: shot('04-1000-fitur') });
    test.info().annotations.push({
      type: 'perf',
      description: `muat ${loadSeconds.toFixed(1)} s, geser ${fps.toFixed(1)} fps (L1 kosong ${baseline.toFixed(1)} fps)`,
    });
    // Ambang relatif terhadap lantai kosong, agar tidak bergantung GPU mesin uji; angka dicatat di README.
    expect(fps / baseline).toBeGreaterThan(0.35);
    expect(loadSeconds).toBeLessThan(15);
  });
});
