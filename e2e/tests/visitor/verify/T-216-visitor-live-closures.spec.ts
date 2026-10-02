import type { Venue } from '@indoor/domain';
import { expect, test } from '../../../fixtures';
import { VisitorPage } from '../../../pages/visitor-page';

const shot = (name: string) => `evidence/T-216/${name}.png`;

test.describe('T-216 Visitor: penutupan live', () => {
  test('penutupan baru tampil tanpa muat ulang dan rute dihitung ulang; diakhiri, rute kembali', async ({
    page,
    fullVenue,
    superAdmin,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    await superAdmin.publications.publish(venueId);
    const snapshot = await superAdmin.snapshots.latest(venueId);
    const lift = snapshot.graph.connectors.find((c) => c.kind === 'elevator');
    if (!lift) throw new Error('lift tidak ada di data uji');

    // Jam palsu yang tetap berjalan: polling penutupan (60 detik) bisa dimajukan.
    await page.clock.install();
    const visitor = new VisitorPage(page);
    await visitor.goto(venueId);
    const route = page.getByRole('region', { name: 'Rute' });
    const steps = route.getByRole('list', { name: 'Langkah rute' }).getByRole('listitem');
    await visitor.search.fill('L1-B08');
    await visitor.results.filter({ hasText: 'L1-B08' }).first().click();
    await visitor.profile.getByRole('button', { name: 'Rute ke sini' }).click();
    await visitor.search.fill('GF-B08');
    await visitor.results.filter({ hasText: 'GF-B08' }).first().click();
    await visitor.profile.getByRole('button', { name: 'Saya di sini' }).click();
    await route.getByRole('checkbox', { name: /Rute aksesibel/ }).check();
    await expect(steps.filter({ hasText: /lift/i })).toHaveCount(1);
    await page.screenshot({ path: shot('01-rute-lewat-lift') });

    // Admin menutup lift; Visitor tidak dimuat ulang.
    const closure = await superAdmin.closures.create(venueId, {
      target: { kind: 'connector', id: lift.id },
      reason: 'Perawatan lift',
      startsAt: new Date(Date.now() - 60_000).toISOString(),
      endsAt: null,
    });
    await page.clock.fastForward('01:05');
    const alert = route.getByRole('alert');
    await expect(alert).toBeVisible({ timeout: 15_000 });
    await expect(route).toContainText('Perawatan lift');
    await expect(steps).toHaveCount(0);
    await page.screenshot({ path: shot('02-lift-ditutup-live') });

    // Penutupan diakhiri: rute lewat lift kembali tanpa muat ulang.
    await superAdmin.closures.setEndsAt(closure.id, new Date().toISOString());
    await page.clock.fastForward('01:05');
    await expect(steps.filter({ hasText: /lift/i })).toHaveCount(1, { timeout: 15_000 });
    await expect(alert).toBeHidden();
    await page.screenshot({ path: shot('03-penutupan-berakhir') });
  });
});
