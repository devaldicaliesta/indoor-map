import type { Venue } from '@indoor/domain';
import type { Browser, Page } from '@playwright/test';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';
import { at } from '../../../support/editor-draw';
import { pyramidGlb } from '../../../support/glb';
import { sql } from '../../../support/license';

const shot = (name: string) => `evidence/T-571/${name}.png`;
const THREE_REQUEST = /models-layer|\/three\.module|\/deps\/three(\.js|[_-])|\/three\/build\//;

async function placeModel(page: Page, editor: EditorPage, dx: number, dy: number) {
  await editor.tool('Titik').click();
  await page
    .getByRole('radiogroup', { name: 'Jenis fitur yang digambar' })
    .getByRole('radio', { name: 'Objek 3D' })
    .click();
  const point = await at(editor, dx, dy);
  await page.mouse.click(point.x, point.y);
  await expect(editor.saveStatus('Tersimpan')).toBeVisible();
  await editor.tool('Pilih').click();
  await page.mouse.click(point.x, point.y);
  await expect(editor.properties.getByRole('heading', { name: 'Objek 3D' })).toBeVisible();
}

async function commitField(page: Page, label: string, value: string) {
  const field = page.getByLabel(label, { exact: true });
  await field.fill(value);
  await field.press('Enter');
}

function watchThree(page: Page) {
  const seen: string[] = [];
  page.on('request', (request) => {
    if (THREE_REQUEST.test(request.url())) seen.push(request.url());
  });
  return seen;
}

async function openVisitor(browser: Browser, url: string) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const threeRequests = watchThree(page);
  await page.goto(url);
  const map = page.getByTestId('venue-map');
  await expect(map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
  await expect(map).toHaveAttribute('data-camera', 'idle');
  return { page, map, threeRequests };
}

test.describe('T-571 Elemen 3D', () => {
  test('objek pustaka dan GLB unggahan tampil di Visitor 3D, tersembunyi di 2D dan Info Point paksa 2D', async ({
    page,
    browser,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    test.setTimeout(180_000);
    const venueId = fullVenue.venueId as Venue['id'];
    await loginAs('admin');
    await new AdminShell(page).selectVenue(fullVenue.name);
    const editor = new EditorPage(page);
    await editor.goto();

    await placeModel(page, editor, -60, 40);
    await page.locator('#feature-model').click();
    await page.getByRole('option', { name: 'Bangku', exact: true }).click();
    await commitField(page, 'Skala', '2,5');
    await commitField(page, 'Rotasi (°)', '450');
    await commitField(page, 'Tinggi dasar (m)', '-1');
    await expect(page.getByText('Tinggi dasar antara 0 dan 200 m.')).toBeVisible();
    await commitField(page, 'Tinggi dasar (m)', '0,5');
    await expect(page.getByLabel('Rotasi (°)', { exact: true })).toHaveValue('90');
    await expect(editor.saveStatus('Tersimpan')).toBeVisible();
    await page.screenshot({ path: shot('01-editor-objek-pustaka') });

    await placeModel(page, editor, 60, 40);
    const fileInput = page.getByLabel('Berkas model GLB');
    await fileInput.setInputFiles({
      name: 'rusak.glb',
      mimeType: 'model/gltf-binary',
      buffer: Buffer.from('bukan model glb sama sekali'),
    });
    await expect(page.getByText('Berkas bukan model GLB (glTF biner).')).toBeVisible();
    await fileInput.setInputFiles({
      name: 'besar.glb',
      mimeType: 'model/gltf-binary',
      buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
    });
    await expect(page.getByText('Model terlalu besar. Maksimal 5 MB.')).toBeVisible();
    await page.screenshot({ path: shot('02-editor-unggah-ditolak') });
    await fileInput.setInputFiles({
      name: 'Patung Lobi.glb',
      mimeType: 'model/gltf-binary',
      buffer: pyramidGlb(),
    });
    await expect(page.getByText('Model diunggah')).toBeVisible();
    await expect(page.locator('#feature-model')).toContainText('patung-lobi');
    await expect(editor.saveStatus('Tersimpan')).toBeVisible();
    await page.screenshot({ path: shot('03-editor-glb-unggahan') });

    const rows = sql(
      `select props::text from public.features
       where venue_id = '${venueId}' and kind = 'model3d' order by props->>'model'`,
    )
      .split('\n')
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    expect(rows).toEqual([
      { model: 'builtin:bench', modelScale: 2.5, modelRotation: 90, baseHeight: 0.5 },
      { model: expect.stringMatching(new RegExp(`^models/${venueId}/patung-lobi-\\d+\\.glb$`)) },
    ]);

    await page.getByRole('button', { name: '3D', exact: true }).click();
    await expect(editor.canvas).toHaveAttribute('data-models', '2', { timeout: 30_000 });
    await page.screenshot({ path: shot('04-editor-3d') });

    await superAdmin.publications.publish(venueId);
    const published = await superAdmin.snapshots.latest(venueId);
    const snapshotModels = published?.features.features.filter(
      (feature) => feature.properties.kind === 'model3d',
    );
    expect(snapshotModels?.map((feature) => feature.properties.model).sort()).toEqual([
      'builtin:bench',
      expect.stringMatching(/^models\/.+\.glb$/),
    ]);

    const visitor = await openVisitor(browser, `${env.visitorUrl}/v/${venueId}`);
    await visitor.page.screenshot({ path: shot('05-visitor-2d-tanpa-objek') });
    expect(visitor.threeRequests).toEqual([]);
    await expect(visitor.map).not.toHaveAttribute('data-models', /.*/);

    await visitor.page.getByRole('button', { name: '3D', exact: true }).click();
    await expect(visitor.map).toHaveAttribute('data-models', '2', { timeout: 30_000 });
    await expect(visitor.map).toHaveAttribute('data-camera', 'idle');
    expect(visitor.threeRequests.length).toBeGreaterThan(0);
    await visitor.page.screenshot({ path: shot('06-visitor-3d-objek') });
    await visitor.page.getByRole('button', { name: 'Perbesar' }).click();
    await visitor.page.getByRole('button', { name: 'Perbesar' }).click();
    await expect(visitor.map).toHaveAttribute('data-camera', 'idle');
    await visitor.page.screenshot({ path: shot('06b-visitor-3d-objek-dekat') });

    await visitor.page.getByRole('button', { name: '2D', exact: true }).click();
    await expect(visitor.map).toHaveAttribute('data-models', '0');
    await visitor.page.close();

    const infoPointId = fullVenue.ids.lobbyInfoPoint;
    sql(`update public.info_points set force_2d = true where id = '${infoPointId}'`);
    await superAdmin.publications.publish(venueId);
    const code = sql(`select code from public.info_points where id = '${infoPointId}'`);
    const kiosk = await openVisitor(browser, `${env.visitorUrl}/ip/${code}?venue=${venueId}`);
    await expect(kiosk.page.getByRole('button', { name: '3D', exact: true })).toHaveCount(0);
    await expect(kiosk.map).not.toHaveAttribute('data-models', /.*/);
    expect(kiosk.threeRequests).toEqual([]);
    await kiosk.page.screenshot({ path: shot('07-info-point-paksa-2d') });
    await kiosk.page.close();
  });
});
