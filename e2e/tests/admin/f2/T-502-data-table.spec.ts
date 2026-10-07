import type { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { DataTablePage } from '../../../pages/data-table';

const shot = (name: string) => `evidence/T-502/${name}.png`;

/** Bagian "Tabel data" di galeri `/_ui` (137 ruang contoh, status di URL). */
async function openGallery(page: Page, query = '') {
  await page.goto(`/_ui${query}`);
  const table = new DataTablePage(page, 'Ruang');
  await table.root.scrollIntoViewIfNeeded();
  return table;
}

const section = (page: Page) =>
  page.locator('section', { has: page.getByRole('heading', { name: 'Tabel data' }) });

test.describe('T-502 Komponen tabel: cari, filter, pagination', () => {
  test('TC-TBL-04 cari, filter, ukuran, dan halaman tersimpan di URL; muat ulang dan tab baru memulihkannya', async ({
    page,
    context,
  }) => {
    const table = await openGallery(page);
    await table.expectTotal(137);
    await expect(table.position).toHaveText('1–25 dari 137');
    await expect(table.rows).toHaveCount(25);
    await section(page).screenshot({ path: shot('01-tabel-berisi') });

    // Filter banyak pilihan: menu tetap terbuka saat beberapa status dicentang.
    await table.root.getByRole('button', { name: 'Status', exact: true }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Aktif', exact: true }).click();
    await page.getByRole('menuitemcheckbox', { name: 'Segera buka', exact: true }).click();
    await expect(page.getByRole('menuitemcheckbox', { name: 'Aktif', exact: true })).toBeChecked();
    await page.screenshot({ path: shot('02-filter-banyak-pilihan') });
    await page.keyboard.press('Escape');
    await table.ready();
    await table.expectTotal(69);

    await table.searchFor('ruang');
    await table.dateRange('Diperbarui', '2026-09-01', '2026-09-30');
    await table.expectTotal(26);
    await table.setPageSize(10);
    await table.goToPage(2);
    await expect(table.position).toHaveText('11–20 dari 26');
    const pageTwo = await table.firstColumn();
    expect(pageTwo).toHaveLength(10);
    await expect(table.activeFilters.getByRole('listitem')).toHaveText([
      /Kata kunci: “ruang”/,
      /Status: Aktif, Segera buka/,
      /Diperbarui: 1 Sep 2026 – 30 Sep 2026/,
    ]);
    const url = new URL(page.url());
    expect(Object.fromEntries(url.searchParams)).toEqual({
      q: 'ruang',
      status: 'active,coming_soon',
      diperbarui: '2026-09-01..2026-09-30',
      size: '10',
      page: '2',
    });
    await section(page).screenshot({ path: shot('03-cari-filter-halaman-2') });

    await page.reload();
    await table.root.scrollIntoViewIfNeeded();
    await expect(table.search).toHaveValue('ruang');
    await expect(table.pageButton(2)).toHaveAttribute('aria-current', 'page');
    await expect(table.pageSize).toHaveText('10');
    expect(await table.firstColumn()).toEqual(pageTwo);
    await section(page).screenshot({ path: shot('04-setelah-muat-ulang') });

    const copy = await context.newPage();
    const copied = await openGallery(copy, url.search);
    await expect(copied.position).toHaveText('11–20 dari 26');
    expect(await copied.firstColumn()).toEqual(pageTwo);
    await section(copy).screenshot({ path: shot('05-url-disalin-ke-tab-baru') });
    await copy.close();

    // Filter dihapus satu per satu; hasilnya melebar kembali.
    await table.removeFilter(/Hapus filter Diperbarui/);
    await table.expectTotal(34);
    await table.removeFilter(/Hapus filter Kata kunci/);
    await table.expectTotal(69);
    await expect(table.pageButton(1)).toHaveAttribute('aria-current', 'page');
  });

  test('TC-TBL-05 URL rusak dinormalisasi ke nilai sah tanpa galat', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const table = await openGallery(
      page,
      '?page=999&size=7&status=bogus,active&lantai=XX&diperbarui=2026-02-30..2026-13-01',
    );
    // Hanya status "active" yang sah: 35 ruang, halaman 999 → halaman terakhir (2).
    await expect(table.position).toHaveText('26–35 dari 35');
    await expect(table.pageButton(2)).toHaveAttribute('aria-current', 'page');
    await expect(table.pageSize).toHaveText('25');
    await expect
      .poll(() => Object.fromEntries(new URL(page.url()).searchParams))
      .toEqual({ status: 'active', page: '2' });
    await expect(table.activeFilters.getByRole('listitem')).toHaveText([/Status: Aktif$/]);
    expect(errors).toEqual([]);
    await section(page).screenshot({ path: shot('06-url-rusak-dinormalisasi') });
  });

  test('TC-TBL-06 tanpa hasil: keadaan kosong dengan tombol hapus filter; memuat, galat, dan kosong', async ({
    page,
  }) => {
    const table = await openGallery(page);
    await table.searchFor('tidak-ada-ruang-zzz');
    await expect(table.root.getByText('Tidak ada ruang yang cocok.')).toBeVisible();
    await expect(table.table).toHaveCount(0);
    await section(page).screenshot({ path: shot('07-pencarian-tanpa-hasil') });
    await table.root.getByRole('button', { name: 'Hapus filter', exact: true }).click();
    await table.ready();
    await expect(table.search).toHaveValue('');
    await table.expectTotal(137);

    const tabs = page.getByRole('tablist', { name: 'Keadaan contoh' });
    await tabs.getByRole('tab', { name: 'Memuat' }).click();
    await expect(table.root).toHaveAttribute('data-state', 'loading');
    await expect(table.table).toHaveAttribute('aria-busy', 'true');
    await section(page).screenshot({ path: shot('08-keadaan-memuat') });

    await tabs.getByRole('tab', { name: 'Galat' }).click();
    await expect(table.root.getByRole('alert')).toContainText('Data ruang tidak bisa dimuat.');
    await expect(table.root.getByRole('button', { name: 'Coba lagi' })).toBeVisible();
    await section(page).screenshot({ path: shot('09-keadaan-galat') });

    await tabs.getByRole('tab', { name: 'Kosong' }).click();
    await expect(table.root.getByRole('heading', { name: 'Belum ada ruang' })).toBeVisible();
    await expect(table.position).toHaveCount(0);
    await section(page).screenshot({ path: shot('10-keadaan-kosong') });
  });

  test('pagination dengan keyboard: fokus terlihat dan halaman berpindah', async ({ page }) => {
    const table = await openGallery(page, '?size=10');
    await expect(table.position).toHaveText('1–10 dari 137');
    await table.next.focus();
    await page.keyboard.press('Enter');
    await expect(table.position).toHaveText('11–20 dari 137');
    await table.pageButton(14).focus();
    await page.keyboard.press('Enter');
    await expect(table.position).toHaveText('131–137 dari 137');
    await expect(table.next).toBeDisabled();
    await table.previous.focus();
    await expect(table.previous).toBeFocused();
    await section(page).screenshot({ path: shot('11-halaman-terakhir-keyboard') });
  });
});
