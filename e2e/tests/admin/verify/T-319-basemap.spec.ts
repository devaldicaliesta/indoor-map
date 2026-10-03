import type { Venue } from '@indoor/domain';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';

const shot = (name: string) => `evidence/T-319/${name}.png`;
const TILE_HOST = 'https://tile.peta-uji.test';

// 1×1 piksel abu-abu muda (PNG) sebagai tile palsu; lingkungan uji tanpa internet.
const TILE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4//8/AAX+Av4N70a4AAAAAElFTkSuQmCC',
  'base64',
);

test.describe('T-319 Peta dasar opsional', () => {
  test('Super Admin mengisi URL tile; Visitor memuat tile dengan atribusi; tanpa internet peta tetap utuh', async ({
    page,
    browser,
    loginAs,
    superAdmin,
    publishedVenue,
  }) => {
    const { venue } = publishedVenue;
    const original = await superAdmin.systemSettings.get();
    try {
      await loginAs('super_admin');
      await page.goto('/settings?tab=system');
      const url = page.getByLabel('URL tile');
      const attribution = page.getByLabel('Atribusi');
      const save = page.getByRole('button', { name: 'Simpan pengaturan' });
      await url.fill(`${TILE_HOST}/{z}/{x}.png`);
      await save.click();
      await expect(page.getByText('URL tile harus memuat {z}, {x}, dan {y}.')).toBeVisible();
      await expect(page.getByText(/Tulis atribusi penyedia tile/)).toBeVisible();
      await page.screenshot({ path: shot('01-validasi') });
      await url.fill(`${TILE_HOST}/{z}/{x}/{y}.png`);
      await attribution.fill('© Peta Uji');
      await save.click();
      await expect
        .poll(async () => (await superAdmin.systemSettings.get()).basemapTileUrl)
        .toBe(`${TILE_HOST}/{z}/{x}/{y}.png`);
      await superAdmin.publications.publish(venue.id as Venue['id']);

      // Visitor dengan server tile tersedia.
      const visitor = await browser.newPage({
        baseURL: env.visitorUrl,
        viewport: { width: 1280, height: 800 },
      });
      const tiles: string[] = [];
      await visitor.route(`${TILE_HOST}/**`, (route) => {
        tiles.push(route.request().url());
        return route.fulfill({ status: 200, contentType: 'image/png', body: TILE_PNG });
      });
      await visitor.goto(`/v/${venue.id}`);
      await expect(visitor.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
        timeout: 30_000,
      });
      await expect.poll(() => tiles.length).toBeGreaterThan(0);
      expect(tiles[0]).toMatch(new RegExp(`^${TILE_HOST}/\\d+/\\d+/\\d+\\.png$`));
      await expect(visitor.getByText('© Peta Uji')).toBeAttached();
      await visitor.screenshot({ path: shot('02-visitor-dengan-peta-dasar') });

      // Tanpa internet: tile gagal, peta gedung dan pencarian tetap berjalan.
      await visitor.unroute(`${TILE_HOST}/**`);
      await visitor.route(`${TILE_HOST}/**`, (route) => route.abort('internetdisconnected'));
      await visitor.reload();
      await expect(visitor.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
        timeout: 30_000,
      });
      await visitor.getByRole('searchbox', { name: 'Cari lokasi' }).fill('radiologi');
      await expect(
        visitor.locator('#search-results li').filter({ hasText: 'Radiologi' }),
      ).toHaveCount(1);
      await visitor.screenshot({ path: shot('03-visitor-tanpa-internet') });
      await visitor.close();
    } finally {
      await superAdmin.systemSettings.update({
        basemapTileUrl: original.basemapTileUrl,
        basemapAttribution: original.basemapAttribution,
      });
    }
  });
});
