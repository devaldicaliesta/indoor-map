import type { Browser } from '@playwright/test';
import { ACCOUNTS } from '../../../accounts';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { LoginPage } from '../../../pages/login-page';
import {
  contrastOn,
  enableAutoTours,
  resetTourProgress,
  TourPopover,
  tourProgress,
} from '../../../support/tour';

const shot = (name: string) => `evidence/T-599/${name}.png`;
const ADMIN = ACCOUNTS.admin.email;
const VIEWER = ACCOUNTS.viewer.email;

/** Browser baru (perangkat lain) dengan tur otomatis menyala, sudah masuk dan memilih venue. */
async function openLocations(browser: Browser, email: string, venueName: string) {
  const context = await browser.newContext({
    baseURL: env.adminUrl,
    viewport: { width: 1440, height: 900 },
    // Tanpa animasi: driver.js mengabaikan tombol panah selama transisi langkah.
    reducedMotion: 'reduce',
  });
  await enableAutoTours(context);
  const page = await context.newPage();
  const login = new LoginPage(page);
  await login.goto();
  await login.signIn(email, env.password);
  await expect(page).not.toHaveURL(/\/login/);
  await new AdminShell(page).selectVenue(venueName);
  await page.goto('/locations');
  return { context, page, tour: new TourPopover(page) };
}

test.describe.configure({ mode: 'serial' });

test.describe('T-599 Tur halaman Admin (Lokasi)', () => {
  test('TC-TUR-01/02/03/09: mulai sendiri sekali, dilewati, tidak muncul lagi di perangkat lain, diulang lewat tombol, keyboard dan kontras', async ({
    browser,
    publishedVenue,
  }) => {
    resetTourProgress(ADMIN);
    const first = await openLocations(browser, ADMIN, publishedVenue.venue.name);
    const { page, tour } = first;

    // TC-TUR-01: tur mulai sendiri pertama kali halaman dibuka.
    await expect(tour.title).toHaveText('Halaman Lokasi');
    await expect(tour.progress).toHaveText('1 dari 7');
    await page.screenshot({ path: shot('01-admin-tur-mulai-sendiri') });

    // TC-TUR-09: keyboard (panah, Tab, Esc) dan kontras AA.
    await page.keyboard.press('ArrowRight');
    await expect(tour.title).toHaveText('Lokasi dan tipe lokasi');
    await page.keyboard.press('ArrowRight');
    await expect(tour.title).toHaveText('Cari dan saring');
    await page.keyboard.press('ArrowLeft');
    await expect(tour.title).toHaveText('Lokasi dan tipe lokasi');
    await expect(tour.next).toBeFocused();
    const reachable: string[] = [];
    for (let i = 0; i < 3; i++) {
      await page.keyboard.press('Tab');
      reachable.push(await page.evaluate(() => document.activeElement?.textContent ?? ''));
    }
    expect(new Set(reachable)).toEqual(new Set(['Lewati', 'Kembali', 'Lanjut']));
    for (const text of [tour.title, tour.description, tour.progress, tour.skip, tour.previous]) {
      expect(await contrastOn(text, tour.root)).toBeGreaterThanOrEqual(4.5);
    }
    expect(await contrastOn(tour.next, tour.next)).toBeGreaterThanOrEqual(4.5);
    await page.keyboard.press('ArrowRight');
    await page.screenshot({ path: shot('02-admin-langkah-cari-saring') });

    // Dilewati (Esc): status tersimpan di server untuk akun ini.
    await page.keyboard.press('Escape');
    await expect(tour.root).toHaveCount(0);
    await expect.poll(() => tourProgress(ADMIN)).toEqual(['locations@1']);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Lokasi', exact: true })).toBeVisible();
    await page.waitForTimeout(1_500);
    await expect(tour.root).toHaveCount(0);

    // TC-TUR-02: browser lain, akun sama: tidak muncul lagi.
    const other = await openLocations(browser, ADMIN, publishedVenue.venue.name);
    await expect(other.page.getByRole('button', { name: 'Tur halaman' })).toBeVisible();
    await other.page.waitForTimeout(1_500);
    await expect(other.tour.root).toHaveCount(0);

    // TC-TUR-03: tombol "Tur halaman" mengulang dari langkah pertama, sampai "Selesai".
    await other.page.getByRole('button', { name: 'Tur halaman' }).click();
    await expect(other.tour.progress).toHaveText('1 dari 7');
    const titles = await other.tour.walkTitles();
    expect(titles).toEqual([
      'Halaman Lokasi',
      'Lokasi dan tipe lokasi',
      'Cari dan saring',
      'Tambah lokasi',
      'Import',
      'Halaman tabel',
      'Ulangi tur',
    ]);
    await first.context.close();
    await other.context.close();
  });

  test('TC-TUR-04/05: Viewer tidak ditunjukkan tombol tulis; tabel kosong melewati langkah pagination', async ({
    browser,
    publishedVenue,
    superAdmin,
  }) => {
    resetTourProgress(VIEWER);
    const viewer = await openLocations(browser, VIEWER, publishedVenue.venue.name);
    await expect(viewer.tour.progress).toHaveText('1 dari 5');
    const titles = await viewer.tour.walkTitles();
    expect(titles).not.toContain('Tambah lokasi');
    expect(titles).not.toContain('Import');
    expect(titles).toContain('Halaman tabel');
    await viewer.page.getByRole('button', { name: 'Tur halaman' }).click();
    await viewer.tour.next.click();
    await viewer.tour.next.click();
    await viewer.page.screenshot({ path: shot('03-viewer-tanpa-tombol-tulis') });
    await viewer.context.close();

    // Venue tanpa lokasi: tabel kosong tanpa pagination, tur tetap berjalan sampai akhir.
    const venue = await superAdmin.venues.create({
      name: `E2E Tur Kosong ${Date.now().toString(36)}`,
      address: null,
      center: null,
      timezone: 'Asia/Jakarta',
    });
    try {
      const empty = await openLocations(browser, ADMIN, venue.name);
      await expect(empty.page.getByText('Belum ada lokasi')).toBeVisible();
      await empty.page.getByRole('button', { name: 'Tur halaman' }).click();
      await expect(empty.tour.progress).toHaveText('1 dari 6');
      const emptyTitles = await empty.tour.walkTitles();
      expect(emptyTitles).not.toContain('Halaman tabel');
      await empty.context.close();
    } finally {
      await superAdmin.venues.remove(venue.id);
    }
  });
});
