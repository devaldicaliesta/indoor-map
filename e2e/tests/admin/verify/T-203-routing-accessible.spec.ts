import type { Venue } from '@indoor/domain';
import { expect, test } from '../../../fixtures';
import { TestRoutePanel } from '../../../support/test-route';

const shot = (name: string) => `evidence/T-203/${name}.png`;

test.describe('T-203 Routing: aksesibel, penutupan, titik masuk', () => {
  test('mode kursi roda menghindari tangga/eskalator; tanpa rute aksesibel muncul alasan; penutupan dihindari', async ({
    page,
    loginAs,
    superAdmin,
    fullVenue,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    const route = new TestRoutePanel(page);
    await route.open(loginAs, fullVenue.name);

    // Biasa: GF → L1 lewat eskalator (lebih dekat). Kursi roda: lewat lift.
    await route.route('GF-A01', 'L1-B08');
    expect((await route.stepTexts()).join(' | ')).toMatch(/eskalator/i);
    await route.accessible(true);
    await expect(route.summary).toContainText('kursi roda');
    await expect.poll(async () => (await route.stepTexts()).join(' | ')).toMatch(/lift/i);
    const accessibleSteps = (await route.stepTexts()).join(' | ');
    expect(accessibleSteps).not.toMatch(/eskalator|tangga/i);
    // Titik masuk unit dipakai: rute berakhir di unit tujuan.
    expect(accessibleSteps).toMatch(/Tiba di L1-B08/);
    await page.screenshot({ path: shot('01-kursi-roda-lift') });

    // GF → L2 hanya lewat tangga: tidak ada rute aksesibel, alasan ditampilkan.
    await route.pick('Ke', 'L2-B08');
    const alert = route.panel.getByRole('alert');
    await expect(alert).toContainText(/L2/);
    await page.screenshot({ path: shot('02-tanpa-rute-aksesibel') });

    // Penutupan lift: rute kursi roda GF → L1 tidak lagi bisa lewat lift.
    await superAdmin.publications.publish(venueId);
    const snapshot = await superAdmin.snapshots.latestWithGraph(venueId);
    const lift = snapshot.graph.connectors.find((c) => c.kind === 'elevator');
    if (!lift) throw new Error('lift tidak ada di data uji');
    await superAdmin.closures.create(venueId, {
      target: { kind: 'connector', id: lift.id },
      reason: 'Perawatan lift',
      startsAt: new Date(Date.now() - 60_000).toISOString(),
      endsAt: null,
    });
    await page.reload();
    await page.getByRole('tab', { name: 'Uji rute' }).click();
    await route.accessible(true);
    await route.route('GF-A01', 'L1-B08');
    // Penutupan harus disebut, baik sebagai alasan gagal maupun catatan memutar.
    await expect(alert.or(route.panel.getByText(/Memutar: .*Perawatan lift/))).toContainText(
      'Perawatan lift',
    );
    await expect(route.steps.filter({ hasText: /lift/i })).toHaveCount(0);
    await page.screenshot({ path: shot('03-lift-ditutup') });

    // Tanpa mode kursi roda rute tetap ada (eskalator).
    await route.accessible(false);
    await expect(route.summary).toBeVisible();
    await expect.poll(async () => (await route.stepTexts()).join(' | ')).toMatch(/eskalator/i);
  });
});
