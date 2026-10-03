import type { Venue } from '@indoor/domain';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';

const shot = (name: string) => `evidence/T-315/${name}.png`;

test.describe('T-315 Warna kategori dan unit berwarna', () => {
  test('Admin memberi warna kategori; Visitor memakai warna itu untuk unit dan legenda chip', async ({
    page,
    browser,
    loginAs,
    superAdmin,
    publishedVenue,
  }) => {
    const { venue } = publishedVenue;
    await loginAs('admin');
    await new AdminShell(page).selectVenue(venue.name);
    await page.goto('/locations?tab=types');
    await page
      .getByRole('row')
      .filter({ hasText: 'Pemeriksaan' })
      .getByRole('button', { name: 'Ubah' })
      .click();
    const dialog = page.getByRole('dialog', { name: 'Ubah Pemeriksaan' });
    const color = dialog.getByLabel('Warna di peta (opsional)');
    await color.fill('merah');
    await dialog.getByRole('button', { name: 'Simpan kategori' }).click();
    await expect(dialog.getByText('Format warna #rrggbb.')).toBeVisible();
    await color.fill('#d2452f');
    await page.screenshot({ path: shot('01-dialog-warna') });
    await dialog.getByRole('button', { name: 'Simpan kategori' }).click();
    await expect(dialog).toBeHidden();
    const categories = await superAdmin.categories.list(venue.id);
    expect(categories.find((c) => c.name === 'Pemeriksaan')?.color).toBe('#d2452f');

    // Setelah publish: chip kategori di Visitor berlatar pastel warna yang sama (legenda).
    await superAdmin.publications.publish(venue.id as Venue['id']);
    const visitor = await browser.newPage({
      baseURL: env.visitorUrl,
      viewport: { width: 1280, height: 800 },
    });
    await visitor.goto(`/v/${venue.id}`);
    await expect(visitor.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    const chip = visitor
      .getByRole('navigation', { name: 'Kategori dan fasilitas' })
      .getByRole('button', { name: 'Pemeriksaan', exact: true });
    await expect(chip.locator('span[aria-hidden="true"]').first()).toHaveCSS(
      'background-color',
      'rgb(242, 203, 197)',
    );
    await expect(visitor.getByTestId('venue-map')).toHaveAttribute('data-camera', 'idle');
    await visitor.screenshot({ path: shot('02-visitor-unit-berwarna') });
    await visitor.close();
  });
});
