import { expect, type Locator, type Page } from '@playwright/test';

/** Visitor di HP: kolom cari mengambang, peta penuh, dan bottom sheet. */
export class VisitorPage {
  readonly map: Locator;
  readonly search: Locator;
  readonly clearSearch: Locator;
  readonly results: Locator;
  readonly profile: Locator;
  readonly floors: Locator;

  constructor(readonly page: Page) {
    this.map = page.getByTestId('venue-map');
    this.search = page.getByRole('searchbox', { name: 'Cari lokasi' });
    this.clearSearch = page.getByRole('button', { name: 'Hapus pencarian' });
    this.results = page.locator('#search-results li');
    this.profile = page.locator('article');
    this.floors = page.getByRole('group', { name: 'Lantai' });
  }

  async goto(venueId: string) {
    await this.page.goto(`/v/${venueId}`);
    await expect(this.map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
  }

  chip(name: string): Locator {
    return this.page
      .getByRole('navigation', { name: 'Kategori dan fasilitas' })
      .getByRole('button', {
        name,
        exact: true,
      });
  }

  list(name: string): Locator {
    return this.page.getByRole('region', { name, exact: true });
  }

  async back() {
    await this.page.getByRole('button', { name: 'Kembali', exact: true }).click();
  }

  /**
   * Mengetuk tengah area peta yang tidak tertutup header dan sheet setengah, tempat kamera
   * membingkai pilihan terakhir dari daftar atau hasil cari.
   */
  async tapFocusedPoint() {
    await expect(this.map).toHaveAttribute('data-camera', 'idle');
    const box = await this.map.boundingBox();
    if (!box) throw new Error('Peta belum tampil.');
    const viewport = this.page.viewportSize() ?? { width: box.width, height: box.height };
    // Sama dengan ruang tepi kamera di Visitor: header 68 + 12, pemilih gedung 44 + 12,
    // kolom kontrol kanan 44 + 24, sheet setengah + 12.
    const top = 68 + 12 + 44 + 12;
    const bottom = Math.round(viewport.height / 2) + 12;
    const x = box.x + (12 + box.width - 68) / 2;
    const y = box.y + (top + box.height - bottom) / 2;
    await this.page.touchscreen.tap(x, y);
  }
}
