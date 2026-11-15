import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { FloorId } from '@indoor/domain';
import type { APIRequestContext } from '@playwright/test';
import { ACCOUNTS } from '../../accounts';
import { env } from '../../env';
import { expect, TEST_CENTER, test } from '../../fixtures';
import { AdminShell } from '../../pages/admin-shell';
import { EditorPage } from '../../pages/editor-page';
import { currentLicenseId, devLicenseFile, restoreLicense } from '../../support/license';

const shot = (name: string) => `evidence/T-548/${name}.png`;
const PLAN = fileURLToPath(
  new URL('../../../services/cad-converter/tests/fixtures/medium.png', import.meta.url),
);
const PLAN_ROOMS = 8;
const PX_PER_M = 40;
const cadUrl = (process.env.VITE_CAD_CONVERTER_URL ?? '').replace(/\/+$/, '');

function cornersAroundCenter(widthPx: number, heightPx: number): [number, number][] {
  const mPerDegLat = 111_195.08;
  const mPerDegLng = mPerDegLat * Math.cos((TEST_CENTER[1] * Math.PI) / 180);
  const halfW = widthPx / PX_PER_M / mPerDegLng / 2;
  const halfH = heightPx / PX_PER_M / mPerDegLat / 2;
  const [x, y] = TEST_CENTER;
  return [
    [x - halfW, y + halfH],
    [x + halfW, y + halfH],
    [x + halfW, y - halfH],
    [x - halfW, y - halfH],
  ];
}

async function superAdminToken(request: APIRequestContext): Promise<string> {
  const response = await request.post(`${env.supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: { apikey: env.anonKey },
    data: { email: ACCOUNTS.super_admin.email, password: env.password },
  });
  expect(response.ok()).toBe(true);
  return ((await response.json()) as { access_token: string }).access_token;
}

test.describe.configure({ mode: 'serial' });

test.describe('T-548 Scan otomatis denah gambar', () => {
  test.skip(!cadUrl, 'Layanan cad-converter belum diatur');
  let original = '';

  test.beforeAll(() => {
    original = currentLicenseId();
  });

  test.afterAll(() => {
    restoreLicense(original);
  });

  test('scan denah aktif, pilih hasil, impor sebagai draft, lalu urungkan sekali', async ({
    page,
    loginAs,
    testVenue,
    superAdmin,
  }) => {
    test.setTimeout(120_000);
    const { venue, floor } = testVenue;
    await superAdmin.license.activateManual(
      await devLicenseFile({ features: ['3d', 'info_point', 'cad_import'] }),
    );
    const plan = await superAdmin.floorPlans.upload(floor.id as FloorId, {
      source: new File([readFileSync(PLAN)], 'denah-gf.png', { type: 'image/png' }),
    });
    await superAdmin.floorPlans.savePlacement(plan.id, {
      corners: cornersAroundCenter(1800, 1200),
      opacity: 0.6,
    });

    await loginAs('admin');
    await new AdminShell(page).selectVenue(venue.name);
    const editor = new EditorPage(page);
    await editor.goto();
    await page.getByRole('button', { name: 'Scan denah', exact: true }).click();
    const panel = page.getByRole('region', { name: 'Scan denah' });
    await expect(panel.getByText('Kepekaan')).toBeVisible();
    await panel.getByRole('button', { name: 'Scan', exact: true }).click();

    const summary = panel.getByRole('status');
    await expect(summary).toContainText(`${PLAN_ROOMS} ruang dan`, { timeout: 30_000 });
    const results = panel.getByRole('list', { name: 'Hasil scan' });
    await expect(results.getByRole('checkbox')).not.toHaveCount(0);
    await page.screenshot({ path: shot('01-hasil-scan') });

    await panel.getByRole('button', { name: 'Kosongkan' }).click();
    await expect(panel.getByRole('button', { name: 'Impor 0 sebagai draft' })).toBeDisabled();
    await panel.getByRole('button', { name: 'Pilih semua' }).click();
    const total = await results.getByRole('checkbox').count();
    await results.getByRole('checkbox').first().uncheck();
    await panel.getByRole('button', { name: `Impor ${total - 1} sebagai draft` }).click();
    await expect(page.getByText(`${total - 1} fitur diimpor sebagai draft.`)).toBeVisible();
    await expect(panel.getByText('Kepekaan')).toBeVisible();
    await expect(editor.saveStatus('Tersimpan')).toBeVisible({ timeout: 20_000 });

    const kinds = async () => {
      const { features } = await superAdmin.features.listByFloor(floor.id);
      return features.map((f) => f.properties.kind).sort();
    };
    await expect.poll(async () => (await kinds()).length).toBe(total - 1);
    const imported = await kinds();
    expect(imported.filter((kind) => kind === 'unit')).toHaveLength(PLAN_ROOMS - 1);
    expect(new Set(imported)).toEqual(new Set(['unit', 'wall']));
    const { features } = await superAdmin.features.listByFloor(floor.id);
    const codes = features.map((f) => f.properties.unitCode).filter(Boolean);
    expect(new Set(codes).size).toBe(codes.length);
    await page.getByRole('button', { name: 'Tutup scan denah' }).click();
    await page.screenshot({ path: shot('02-diimpor-sebagai-draft') });

    await page
      .getByRole('toolbar', { name: 'Alat gambar' })
      .getByRole('button', { name: 'Urungkan' })
      .click();
    await expect(editor.saveStatus('Tersimpan')).toBeVisible({ timeout: 20_000 });
    await expect.poll(async () => (await kinds()).length).toBe(0);
    await page.screenshot({ path: shot('03-impor-diurungkan') });
  });

  test('tanpa cad_import: panel terkunci dan layanan menolak /scan (403)', async ({
    page,
    loginAs,
    testVenue,
    request,
  }) => {
    restoreLicense(original);
    await loginAs('admin');
    await new AdminShell(page).selectVenue(testVenue.venue.name);
    await new EditorPage(page).goto();
    await page.getByRole('button', { name: 'Scan denah', exact: true }).click();
    await expect(
      page
        .getByRole('region', { name: 'Scan denah' })
        .getByText('Impor denah CAD (DXF) tidak termasuk paket lisensi ini.'),
    ).toBeVisible();
    await page.screenshot({ path: shot('04-tanpa-fitur') });

    const response = await request.post(`${cadUrl}/scan`, {
      headers: { Authorization: `Bearer ${await superAdminToken(request)}` },
      data: readFileSync(PLAN),
    });
    expect(response.status()).toBe(403);
    expect(await response.json()).toMatchObject({ code: 'feature_locked' });
  });
});
