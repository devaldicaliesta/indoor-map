import type { Venue } from '@indoor/domain';
import { expect, test } from '../../../fixtures';
import { VisitorPage } from '../../../pages/visitor-page';

const shot = (name: string) => `evidence/T-118/${name}.png`;

test.describe('T-118 Visitor: peta, gedung, lantai', () => {
  test('lantai default, pindah lantai dan gedung; target sentuh ≥ 44 px', async ({
    page,
    fullVenue,
    superAdmin,
  }) => {
    await superAdmin.publications.publish(fullVenue.venueId as Venue['id']);
    const visitor = new VisitorPage(page);
    await visitor.goto(fullVenue.venueId);
    const building = page.getByRole('combobox', { name: 'Gedung' });
    await expect(building).toHaveText('Gedung Utama');
    const floor = (name: string) => visitor.floors.getByRole('button', { name, exact: true });
    await expect(floor('GF')).toHaveAttribute('aria-pressed', 'true');
    await expect(visitor.floors.getByRole('button')).toHaveText(['L2', 'L1', 'GF']);
    const gf = await visitor.map.getAttribute('data-floor-id');
    for (const name of ['L2', 'L1', 'GF']) {
      const box = await floor(name).boundingBox();
      expect(Math.min(box?.width ?? 0, box?.height ?? 0)).toBeGreaterThanOrEqual(44);
    }
    await page.screenshot({ path: shot('01-gedung-utama-gf') });

    // Pindah lantai: lantai aktif berubah, peta memuat lantai lain.
    await floor('L1').click();
    await expect(floor('L1')).toHaveAttribute('aria-pressed', 'true');
    await expect(visitor.map).not.toHaveAttribute('data-floor-id', gf ?? '');
    await expect(visitor.map).toHaveAttribute('data-camera', 'idle');
    await page.screenshot({ path: shot('02-lantai-l1') });

    // Pindah gedung: daftar lantai mengikuti gedung itu.
    await building.click();
    await expect(page.getByRole('option')).toContainText(['Gedung Utama', 'Gedung Timur']);
    await page.getByRole('option', { name: 'Gedung Timur' }).click();
    await expect(building).toHaveText('Gedung Timur');
    // Gedung satu lantai: pemilih lantai tidak ditampilkan.
    await expect(visitor.floors.getByRole('button')).toHaveCount(0);
    await expect(visitor.map).toHaveAttribute('data-camera', 'idle');
    await page.screenshot({ path: shot('03-gedung-timur') });

    // Area Luar tidak menjadi pilihan sendiri: tampil bersama lantai dasar (spesifikasi T-118).
    await building.click();
    await expect(page.getByRole('option', { name: /Area Luar/ })).toHaveCount(0);
    await page.keyboard.press('Escape');

    for (const control of [building]) {
      const box = await control.boundingBox();
      expect(Math.min(box?.width ?? 0, box?.height ?? 0)).toBeGreaterThanOrEqual(44);
    }
  });
});
