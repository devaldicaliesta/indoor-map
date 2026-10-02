import { expect, test } from '../../fixtures';
import { VisitorPage } from '../../pages/visitor-page';

test.describe('Cari dan jelajah di Visitor', () => {
  test('salah ketik tetap menemukan lokasi, detail dibuka, kode bisa dicari', async ({
    page,
    publishedVenue,
  }) => {
    const visitor = new VisitorPage(page);
    await visitor.goto(publishedVenue.venue.id);

    await visitor.search.fill('radilogi');
    await expect(visitor.results).toHaveCount(1);
    await expect(visitor.results.first()).toContainText('Radiologi');
    await expect(visitor.results.first()).toContainText('Pemeriksaan · Gedung Uji · GF');

    await visitor.results.first().getByRole('button').click();
    await expect(visitor.profile).toContainText('Radiologi');
    await expect(visitor.profile).toContainText('Gedung Uji · GF · UJI-GF-001');
    await expect(visitor.profile).toContainText('Rontgen dan CT scan.');
    // Sejak T-215 rute aktif.
    await expect(visitor.profile.getByRole('button', { name: 'Rute ke sini' })).toBeEnabled();

    await visitor.back();
    await expect(visitor.results).toHaveCount(1);
    for (const code of ['rad-01', 'UJI-GF-001']) {
      await visitor.search.fill(code);
      await expect(visitor.results.first()).toContainText('Radiologi');
    }
    await visitor.search.fill('uji-gf-002');
    await expect(visitor.results).toHaveCount(1);
    await expect(visitor.results.first()).toContainText('Unit · Gedung Uji · GF');
  });

  test('kategori menampilkan anggotanya; direktori A–Z berisi semua lokasi', async ({
    page,
    publishedVenue,
  }) => {
    const visitor = new VisitorPage(page);
    await visitor.goto(publishedVenue.venue.id);

    await visitor.chip('Pemeriksaan').click();
    const category = visitor.list('Pemeriksaan');
    await expect(category).toContainText('1 lokasi');
    await expect(category.getByRole('listitem')).toHaveText([/Radiologi/]);

    await visitor.chip('A–Z').click();
    const directory = visitor.list('Semua lokasi A–Z');
    await expect(directory).toContainText('1 lokasi');
    await directory.getByRole('button', { name: /Radiologi/ }).click();
    await expect(visitor.profile).toContainText('Gedung Uji · GF · UJI-GF-001');
  });

  test('mengetuk unit di peta membuka detailnya', async ({ page, publishedVenue }) => {
    const visitor = new VisitorPage(page);
    await visitor.goto(publishedVenue.venue.id);

    // Memilih dari hasil cari membingkai unit di tengah area peta yang terlihat.
    await visitor.search.fill('uji-gf-002');
    await visitor.results.first().getByRole('button').click();
    await expect(visitor.profile).toContainText('UJI-GF-002');
    await visitor.back();
    await visitor.clearSearch.click();
    await expect(visitor.profile).toHaveCount(0);
    await visitor.tapFocusedPoint();
    await expect(visitor.profile).toContainText('UJI-GF-002');
    await expect(visitor.profile).toContainText('Unit · Gedung Uji · GF');

    // Unit yang ditempati lokasi membuka profil lokasinya.
    await visitor.back();
    await visitor.search.fill('radiologi');
    await visitor.results.first().getByRole('button').click();
    await visitor.back();
    await visitor.clearSearch.click();
    await visitor.tapFocusedPoint();
    await expect(visitor.profile).toContainText('Radiologi');
  });
});
