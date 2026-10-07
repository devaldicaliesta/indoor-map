import { expect, type Locator, type Page } from '@playwright/test';

/** DataTable Admin (`@indoor/ui`): cari, filter, filter aktif, dan pagination satu tabel. */
export class DataTablePage {
  readonly root: Locator;
  readonly search: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly activeFilters: Locator;
  readonly position: Locator;
  readonly pageSize: Locator;
  readonly next: Locator;
  readonly previous: Locator;

  constructor(
    readonly page: Page,
    readonly label: string,
  ) {
    this.root = page.locator(`[data-slot="data-table"][data-label="${label}"]`);
    this.search = this.root.getByRole('searchbox', { name: `Cari ${label.toLowerCase()}` });
    this.table = this.root.getByRole('table', { name: label });
    this.rows = this.table.locator('tbody tr');
    this.activeFilters = this.root.getByRole('list', { name: 'Filter aktif' });
    this.position = this.root.getByRole('status');
    this.pageSize = this.root.getByRole('combobox', { name: 'Baris per halaman' });
    this.next = this.root.getByRole('button', { name: 'Halaman berikutnya' });
    this.previous = this.root.getByRole('button', { name: 'Halaman sebelumnya' });
  }

  /** Data selesai dimuat (bukan kerangka, bukan permintaan yang masih berjalan). */
  async ready() {
    await expect(this.root).toHaveAttribute('data-state', 'ready', { timeout: 15_000 });
  }

  async total(): Promise<number> {
    await this.ready();
    return Number(await this.root.getAttribute('data-total'));
  }

  /** Menunggu jumlah baris yang cocok (tabel klien diperbarui tanpa keadaan memuat). */
  async expectTotal(total: number) {
    await expect(this.root).toHaveAttribute('data-total', String(total));
    await this.ready();
  }

  async searchFor(text: string) {
    await this.search.fill(text);
    await this.search.press('Enter');
    await this.ready();
  }

  /** Filter pilihan tunggal (select). */
  async choose(filter: string, option: string) {
    await this.root.getByRole('combobox', { name: filter, exact: true }).click();
    await this.page.getByRole('option', { name: option, exact: true }).click();
    await this.ready();
  }

  /** Filter banyak pilihan (menu centang); menu ditutup setelah semua dicentang. */
  async check(filter: string, options: readonly string[]) {
    await this.root.getByRole('button', { name: filter, exact: true }).click();
    for (const option of options) {
      await this.page.getByRole('menuitemcheckbox', { name: option, exact: true }).click();
    }
    await this.page.keyboard.press('Escape');
    await this.ready();
  }

  async dateRange(filter: string, from: string, to: string) {
    await this.root.getByLabel(`${filter} dari`).fill(from);
    await this.root.getByLabel(`${filter} sampai`).fill(to);
    await this.ready();
  }

  async removeFilter(text: string | RegExp) {
    await this.activeFilters.getByRole('button', { name: text }).click();
    await this.ready();
  }

  async setPageSize(size: number) {
    await this.pageSize.click();
    await this.page.getByRole('option', { name: String(size), exact: true }).click();
    await this.ready();
  }

  pageButton(n: number): Locator {
    return this.root.getByRole('button', { name: `Halaman ${n}`, exact: true });
  }

  async goToPage(n: number) {
    await this.pageButton(n).click();
    await expect(this.pageButton(n)).toHaveAttribute('aria-current', 'page');
    await this.ready();
  }

  /** Isi kolom pertama setiap baris halaman ini (biasanya kode atau nama). */
  async firstColumn(): Promise<string[]> {
    await this.ready();
    return this.rows.locator('td:first-child').allInnerTexts();
  }
}
