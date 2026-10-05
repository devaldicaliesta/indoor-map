import { expect, type Page, test } from '@playwright/test';
import { perfEnv } from '../env';
import { seeded } from '../support';

// Alur utama di setiap browser/perangkat pada matriks (playwright.compat.config.ts).

/**
 * Peta butuh WebGL. Firefox headless di kontainer tanpa GPU tidak menyediakannya; di sana alur
 * non-peta tetap diuji dan ketiadaan WebGL dicatat sebagai anotasi untuk laporan.
 */
async function mapReady(page: Page, testId: string) {
  const webgl = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'));
  if (!webgl) {
    test.info().annotations.push({ type: 'tanpa-webgl', description: 'peta tidak diuji' });
    return;
  }
  await expect(page.getByTestId(testId)).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
}
test('Visitor: peta, cari, rute dari titik asal', async ({ page }, info) => {
  const { sample } = seeded();
  await page.goto(`${perfEnv.visitorUrl}/v/${sample.venueId}?o=${sample.originCode}&lang=id`);
  await mapReady(page, 'venue-map');
  await page.getByRole('searchbox').fill('Radiologi');
  await page
    .getByRole('button', { name: /^Radiologi/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Rute ke sini' }).click();
  await expect(page.getByRole('list', { name: 'Langkah rute' })).toBeVisible();
  await page.screenshot({ path: `results/compat/${info.project.name}-visitor.png` });
});

test('Admin: masuk dan editor peta', async ({ page, isMobile }, info) => {
  test.skip(isMobile, 'Admin untuk desktop (NFR-COMP-03); Penutupan di HP diuji terpisah.');
  const { sample } = seeded();
  await page.goto(`${perfEnv.adminUrl}/login`);
  await page.getByLabel('Email').fill(perfEnv.email);
  await page.getByLabel('Password').fill(perfEnv.password);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await page.getByRole('combobox', { name: 'Venue aktif' }).click();
  await page.getByRole('option', { name: sample.name, exact: true }).click();
  await page.goto(`${perfEnv.adminUrl}/map-editor`);
  await expect(page.getByTestId('editor-map')).toBeVisible();
  await mapReady(page, 'editor-map');
  await page.screenshot({ path: `results/compat/${info.project.name}-admin.png` });
});

test('Admin Penutupan dapat dipakai dari HP', async ({ page, isMobile }, info) => {
  test.skip(!isMobile, 'Khusus HP.');
  const { sample } = seeded();
  await page.goto(`${perfEnv.adminUrl}/login`);
  await page.getByLabel('Email').fill(perfEnv.email);
  await page.getByLabel('Password').fill(perfEnv.password);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto(`${perfEnv.adminUrl}/closures`);
  await expect(page.getByRole('heading', { name: /Penutupan/ }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: `results/compat/${info.project.name}-penutupan.png` });
  expect(sample.name).toBeTruthy();
});
