import type { Venue } from '@indoor/domain';
import { expect, test } from '../../../fixtures';
import { VisitorPage } from '../../../pages/visitor-page';

const shot = (name: string) => `evidence/T-119/${name}.png`;
const collator = new Intl.Collator('id', { sensitivity: 'base', numeric: true });

test.describe('T-119 Visitor: cari, kategori, detail, A–Z', () => {
  test('salah ketik, kode unit/lokasi, chip kategori, detail, direktori A–Z terurut', async ({
    page,
    fullVenue,
    superAdmin,
  }) => {
    await superAdmin.publications.publish(fullVenue.venueId as Venue['id']);
    const visitor = new VisitorPage(page);
    await visitor.goto(fullVenue.venueId);

    // Salah ketik tetap menemukan.
    await visitor.search.fill('radilogi');
    await expect(visitor.results.filter({ hasText: 'Radiologi' })).toHaveCount(1);
    await page.screenshot({ path: shot('01-salah-ketik') });

    // Kode lokasi dan kode unit.
    await visitor.search.fill('RAD-01');
    await expect(visitor.results.filter({ hasText: 'Radiologi' })).toHaveCount(1);
    await visitor.search.fill('GF-A0');
    await expect(visitor.results.first()).toBeVisible();
    await page.screenshot({ path: shot('02-kode-unit') });

    // Detail lokasi.
    await visitor.search.fill('radiologi');
    await visitor.results.filter({ hasText: 'Radiologi' }).first().click();
    await expect(visitor.profile).toContainText('Radiologi');
    await expect(visitor.profile.getByRole('button', { name: 'Rute ke sini' })).toBeVisible();
    await page.screenshot({ path: shot('03-detail') });
    await visitor.back();
    await visitor.clearSearch.click();

    // Chip kategori: semua anggota di daftar.
    await visitor.chip('Pemeriksaan').click();
    const category = visitor.list('Pemeriksaan');
    await expect(category).toContainText('Radiologi');
    await expect(category).toContainText('Laboratorium');
    await page.screenshot({ path: shot('04-kategori') });
    // Chip yang sama menutup kategori.
    await visitor.chip('Pemeriksaan').click();
    await expect(category).toBeHidden();

    // A–Z: lokasi aktif terurut abjad; lokasi nonaktif permanen tidak tampil.
    await visitor.chip('A–Z').click();
    const directory = visitor.list('Semua lokasi A–Z');
    await expect(directory).toBeVisible();
    const names = await directory
      .getByRole('button')
      .evaluateAll((els) => els.map((el) => el.querySelector('span')?.textContent?.trim() ?? ''));
    expect(names.length).toBeGreaterThan(2);
    expect(names).toEqual([...names].sort(collator.compare));
    await expect(directory).not.toContainText('Apotek Lama');
    await page.screenshot({ path: shot('05-direktori-az') });

    // Tidak ada hasil: arahan ke A–Z.
    await visitor.chip('A–Z').click();
    await visitor.search.fill('qwertyzz');
    await expect(page.getByText('Tidak ada hasil untuk “qwertyzz”').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Buka daftar A–Z' })).toBeVisible();
  });
});
