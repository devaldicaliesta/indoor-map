import type { Venue } from '@indoor/domain';
import { expect, test } from '../../../fixtures';
import { VisitorPage } from '../../../pages/visitor-page';

const shot = (name: string) => `evidence/T-215/${name}.png`;

test.describe('T-215 Visitor: rute dan instruksi', () => {
  test('rute lintas lantai: lantai dilewati, langkah, mode langkah pindah lantai, aksesibel lewat lift', async ({
    page,
    fullVenue,
    superAdmin,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    await superAdmin.publications.publish(venueId);
    const visitor = new VisitorPage(page);
    await visitor.goto(venueId);
    const route = page.getByRole('region', { name: 'Rute' });
    const steps = route.getByRole('list', { name: 'Langkah rute' }).getByRole('listitem');
    const floorButton = (name: string) => visitor.floors.getByRole('button', { name, exact: true });

    // Tujuan L1-B08, asal GF-B08.
    await visitor.search.fill('L1-B08');
    await visitor.results.filter({ hasText: 'L1-B08' }).first().click();
    await visitor.profile.getByRole('button', { name: 'Rute ke sini' }).click();
    await visitor.search.fill('GF-B08');
    await visitor.results.filter({ hasText: 'GF-B08' }).first().click();
    await visitor.profile.getByRole('button', { name: 'Saya di sini' }).click();

    // Ringkasan: jarak, lantai GF → L1; langkah lewat eskalator, berakhir di tujuan.
    await expect(route.getByText(/^\d[\d.,]* m$/)).toBeVisible();
    await expect(
      route.getByRole('list', { name: 'Lantai yang dilewati' }).getByRole('listitem'),
    ).toHaveText([/GF/, /L1/]);
    await expect(steps.first()).toContainText('GF-B08');
    await expect(steps.last()).toContainText('L1-B08');
    await expect(steps.filter({ hasText: /eskalator/i })).toHaveCount(1);
    await page.screenshot({ path: shot('01-daftar-langkah') });

    // Mode langkah: langkah eskalator memindah peta ke L1; sebelumnya kembali ke GF.
    const total = await steps.count();
    const escalatorIndex = (await steps.allTextContents()).findIndex((t) => /eskalator/i.test(t));
    await steps.nth(escalatorIndex).getByRole('button').click();
    await expect(route.getByText(`Langkah ${escalatorIndex + 1} dari ${total}`)).toBeVisible();
    await expect(floorButton('L1')).toHaveAttribute('aria-pressed', 'true');
    await page.screenshot({ path: shot('02-mode-langkah-l1') });
    await route.getByRole('button', { name: 'Sebelumnya' }).click();
    await expect(route.getByText(`Langkah ${escalatorIndex} dari ${total}`)).toBeVisible();
    await expect(floorButton('GF')).toHaveAttribute('aria-pressed', 'true');
    await route.getByRole('button', { name: 'Semua langkah' }).click();
    await expect(steps).toHaveCount(total);

    // Aksesibel: lewat lift, tanpa eskalator/tangga.
    await route.getByRole('checkbox', { name: /Rute aksesibel/ }).check();
    await expect(steps.filter({ hasText: /lift/i })).toHaveCount(1);
    await expect(steps.filter({ hasText: /eskalator|tangga/i })).toHaveCount(0);
    await page.screenshot({ path: shot('03-aksesibel-lift') });
  });
});
