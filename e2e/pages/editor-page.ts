import { expect, type Locator, type Page } from '@playwright/test';

export type EditorTool = 'Pilih' | 'Poligon' | 'Garis' | 'Titik';

export class EditorPage {
  readonly canvas: Locator;
  readonly properties: Locator;

  constructor(readonly page: Page) {
    this.canvas = page.getByTestId('editor-map');
    this.properties = page.getByRole('region', { name: 'Properti fitur' });
  }

  async goto() {
    await this.page.goto('/map-editor');
    await this.waitReady();
  }

  /** Menunggu peta dan fitur lantai selesai dimuat (atribut `data-ready` di kanvas). */
  async waitReady() {
    await expect(this.canvas).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
  }

  tool(name: EditorTool) {
    return this.page.getByRole('toolbar', { name: 'Alat gambar' }).getByRole('button', { name });
  }

  /** Status simpan otomatis di bilah atas editor. */
  saveStatus(text: 'Menyimpan…' | 'Tersimpan' | 'Draft tersimpan') {
    return this.page.getByText(text, { exact: true });
  }

  /** Cari di daftar fitur lantai lalu Enter: fitur pertama yang cocok dipilih. */
  async selectFromList(floorName: string, query: string) {
    const search = this.page.getByRole('searchbox', { name: `Cari fitur di lantai ${floorName}` });
    await search.fill(query);
    await search.press('Enter');
  }

  /**
   * Klik tiap titik (piksel relatif terhadap pusat kanvas), lalu titik pertama lagi untuk
   * menutup poligon seperti yang dilakukan pengguna.
   */
  async drawPolygon(offsets: readonly (readonly [number, number])[]) {
    const box = await this.canvas.boundingBox();
    if (!box) throw new Error('Kanvas editor tidak terlihat.');
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    const first = offsets[0];
    if (!first) throw new Error('Poligon butuh minimal tiga titik.');
    for (const [dx, dy] of [...offsets, first]) await this.page.mouse.click(cx + dx, cy + dy);
  }
}
