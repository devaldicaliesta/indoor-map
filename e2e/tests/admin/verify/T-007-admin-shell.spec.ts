import type { AppRole } from '@indoor/domain';
import type { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';

const shot = (name: string) => `evidence/T-007/${name}.png`;

/** Gambar diambil setelah semua kerangka memuat hilang. */
async function capture(page: Page, name: string) {
  await expect(page.locator('[data-slot="skeleton"]')).toHaveCount(0);
  await page.screenshot({ path: shot(name) });
}
const ALL = [
  'Venue',
  'Editor Peta',
  'Lokasi',
  'Penutupan',
  'Titik Asal',
  'Publish',
  'Pengaturan',
  'Pengguna',
  'Lisensi',
];
const WITHOUT_ADMIN_ONLY = ALL.filter((m) => m !== 'Pengguna' && m !== 'Lisensi');

// Tabel role di docs/01-produk.md; menu yang hanya bisa dibaca diberi penanda "baca".
const read = (menus: string[], readOnly: string[]) =>
  menus.map((m) => (readOnly.includes(m) ? `${m}baca` : m));
const MENUS: Record<AppRole, string[]> = {
  super_admin: ALL,
  admin: WITHOUT_ADMIN_ONLY,
  editor: read(WITHOUT_ADMIN_ONLY, ['Venue', 'Penutupan', 'Pengaturan']),
  operator: read(['Editor Peta', 'Penutupan'], ['Editor Peta']),
  viewer: read(WITHOUT_ADMIN_ONLY, WITHOUT_ADMIN_ONLY),
};

test.describe('T-007 Kerangka Admin', () => {
  for (const [role, menus] of Object.entries(MENUS) as [AppRole, string[]][]) {
    test(`TC-AUTH-10 menu ${role}`, async ({ page, loginAs }) => {
      await loginAs(role);
      const nav = page.getByRole('navigation', { name: 'Menu utama' });
      await expect(nav.getByRole('link')).toHaveText(menus);
      // Desktop tanpa menu hamburger.
      await expect(page.getByRole('button', { name: /^menu$/i })).toHaveCount(0);
      await capture(page, `01-menu-${role}`);

      // Menu terlarang lewat URL langsung tidak membuka halamannya.
      const shown = menus.map((m) => m.replace(/baca$/, ''));
      for (const hidden of ALL.filter((m) => !shown.includes(m)).slice(0, 2)) {
        const path = { Pengguna: '/users', Lisensi: '/license', Venue: '/venues' }[hidden];
        if (!path) continue;
        await page.goto(path);
        await expect(
          page.getByText(/tidak (memiliki|punya) (izin|akses)|Tidak berizin/i).first(),
        ).toBeVisible();
      }
    });
  }

  test('TC-VEN-06 pemilih venue terisi, pindah venue memperbarui halaman, pilihan diingat', async ({
    page,
    loginAs,
    variedVenues,
  }) => {
    const [campus, office, airport, factory] = variedVenues;
    if (!campus || !office || !airport || !factory) throw new Error('fixture kurang');
    await loginAs('super_admin');
    const shell = new AdminShell(page);
    await shell.venuePicker.click();
    for (const v of variedVenues)
      await expect(page.getByRole('option', { name: v.name })).toBeVisible();
    await capture(page, '02-pemilih-venue');
    await page.keyboard.press('Escape');

    await shell.selectVenue(campus.name);
    await page.goto('/venues');
    await expect(page.getByRole('cell', { name: 'Gedung Rektorat' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Laboratorium Terpadu' })).toBeVisible();
    await capture(page, '03-venue-kampus');

    await shell.selectVenue(office.name);
    await expect(page.getByRole('cell', { name: 'Menara A' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Gedung Rektorat' })).toHaveCount(0);
    // Nama panjang terpotong dengan elipsis dan tetap terbaca lengkap lewat title.
    await expect(shell.venuePicker).toHaveAttribute('title', office.name);
    const clipped = await shell.venuePicker
      .locator('[data-slot="select-value"]')
      .evaluate((el) => getComputedStyle(el).textOverflow);
    expect(clipped).toBe('ellipsis');
    await capture(page, '04-venue-kantor-nama-panjang');

    await page.goto('/locations');
    await shell.selectVenue(factory.name);
    await expect(page.getByText('Belum ada lokasi')).toBeVisible();
    await capture(page, '05-lokasi-pabrik');

    await shell.selectVenue(airport.name);
    await page.reload();
    await expect(shell.venuePicker).toHaveText(airport.name);
    await page.goto('/venues');
    await expect(page.getByRole('cell', { name: 'Terminal Keberangkatan' })).toBeVisible();
    await capture(page, '06-diingat-setelah-muat-ulang');
  });

  test('peringatan layar sempit (< 1280 px)', async ({ page, loginAs }) => {
    await page.setViewportSize({ width: 1100, height: 800 });
    await loginAs('admin');
    await expect(page.getByText(/Admin dirancang untuk layar lebar/)).toBeVisible();
    await capture(page, '07-layar-sempit');
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByText(/Admin dirancang untuk layar lebar/)).toHaveCount(0);
  });

  test('sidebar bisa diciutkan dan dilebarkan; pilihan diingat', async ({ page, loginAs }) => {
    await loginAs('admin');
    const sidebar = page.locator('aside').first();
    const nav = page.getByRole('navigation', { name: 'Menu utama' });
    await expect(sidebar).toHaveJSProperty('offsetWidth', 240);

    const collapse = page.getByRole('button', { name: 'Ciutkan menu' });
    await expect(collapse).toHaveAttribute('aria-expanded', 'true');
    await collapse.click();
    await expect(sidebar).toHaveJSProperty('offsetWidth', 56);
    // Menu halaman aktif tetap disorot saat diciutkan.
    await expect(nav.getByRole('link', { name: 'Venue' })).toHaveClass(/bg-signal-soft/);
    // Nama menu tetap dibacakan (teks tersembunyi) dan muncul sebagai tooltip.
    await expect(nav.getByRole('link', { name: 'Lokasi' })).toBeVisible();
    await expect(nav.getByText('Lokasi')).toHaveClass(/sr-only/);
    await nav.getByRole('link', { name: 'Lokasi' }).hover();
    await expect(page.getByRole('tooltip', { name: 'Lokasi' })).toBeVisible();
    await capture(page, '08-sidebar-diciutkan');

    await page.reload();
    await expect(sidebar).toHaveJSProperty('offsetWidth', 56);
    await nav.getByRole('link', { name: 'Lokasi' }).click();
    await expect(page).toHaveURL(/\/locations$/);

    const expand = page.getByRole('button', { name: 'Lebarkan menu' });
    await expand.focus();
    await page.keyboard.press('Enter');
    await expect(sidebar).toHaveJSProperty('offsetWidth', 240);
    await expect(nav.getByText('Lokasi')).not.toHaveClass(/sr-only/);
    await capture(page, '09-sidebar-dilebarkan');
  });
});
