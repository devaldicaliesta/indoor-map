import { visibleModules } from '@indoor/domain';
import type { Page } from '@playwright/test';
import { expect, test } from '../../fixtures';
import { AdminShell } from '../../pages/admin-shell';

const shot = (name: string) => `evidence/T-312/${name}.png`;

const PATHS: Record<string, string> = {
  venues: '/venues',
  map_editor: '/map-editor',
  locations: '/locations',
  closures: '/closures',
  origin_points: '/origin-points',
  publish: '/publish',
  settings: '/settings',
};

// Label kontrol yang mengubah data.
const WRITE =
  /^(Tambah|Simpan|Hapus|Ubah|Terbitkan|Aktifkan|Unggah|Impor|Undang|Akhiri|Gambar|Sambung|Validasi|Pindah|Ambil alih|Buat|Kunci|Jadwalkan|Kembalikan|Ganti)/i;

/** Tombol aktif yang labelnya kontrol ubah, di halaman yang sedang tampil. */
async function activeWriteControls(page: Page): Promise<string[]> {
  const labels = await page
    .locator('main button:not([disabled]), main [role="button"]:not([aria-disabled="true"])')
    .evaluateAll((nodes) =>
      nodes
        .filter((n) => (n as HTMLElement).offsetParent !== null)
        .map((n) => (n.getAttribute('aria-label') ?? n.textContent ?? '').trim()),
    );
  return labels.filter((label) => WRITE.test(label));
}

test.describe('T-312 Role Viewer', () => {
  test('kontrol: Admin melihat kontrol ubah di menu yang sama', async ({
    page,
    loginAs,
    fullVenue,
  }) => {
    await loginAs('admin');
    await new AdminShell(page).selectVenue(fullVenue.name);
    const found: string[] = [];
    for (const path of ['/venues', '/locations', '/origin-points', '/publish']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      found.push(...(await activeWriteControls(page)));
    }
    expect(found).toEqual(expect.arrayContaining(['Tambah lokasi', 'Terbitkan']));
  });

  test('Viewer membuka semua menu tanpa satu pun kontrol ubah yang aktif', async ({
    page,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    await superAdmin.publications.publish(fullVenue.venueId as never);
    await loginAs('viewer');
    await new AdminShell(page).selectVenue(fullVenue.name);

    const modules = visibleModules('viewer');
    expect(modules.every((m) => m.access === 'read')).toBe(true);
    const found: Record<string, string[]> = {};
    for (const { module } of modules) {
      const path = PATHS[module];
      if (!path) continue;
      await page.goto(path);
      await expect(page.getByRole('main')).toBeVisible();
      await page.waitForLoadState('networkidle');
      const tabs = page.getByRole('main').getByRole('tab');
      const tabCount = await tabs.count();
      if (tabCount === 0) {
        found[module] = await activeWriteControls(page);
      } else {
        for (let i = 0; i < tabCount; i++) {
          const tab = tabs.nth(i);
          const name = (await tab.textContent())?.trim() ?? String(i);
          await tab.click();
          await page.waitForLoadState('networkidle');
          found[`${module}/${name}`] = await activeWriteControls(page);
        }
      }
      await page.screenshot({ path: shot(`viewer-${module}`) });
    }
    expect(Object.keys(found).length).toBeGreaterThanOrEqual(7);
    expect(Object.entries(found).filter(([, labels]) => labels.length > 0)).toEqual([]);
  });
});
