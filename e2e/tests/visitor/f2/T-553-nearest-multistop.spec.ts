import type { Venue } from '@indoor/domain';
import { expect, test } from '../../../fixtures';
import { VisitorPage } from '../../../pages/visitor-page';

const shot = (name: string) => `evidence/T-553/${name}.png`;

test.describe('T-553 Fasilitas terdekat dan rute multi-tujuan', () => {
  test('TC-NVX-05: "Toilet terdekat" memilih toilet dengan rute terpendek dari titik asal', async ({
    page,
    fullVenue,
    superAdmin,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    await superAdmin.publications.publish(venueId);
    const snapshot = await superAdmin.snapshots.latest(venueId);
    const origin = snapshot.originPoints.find((p) => p.name === 'Lobi Utama');
    if (!origin) throw new Error('Lobi Utama tidak ada di snapshot');
    const visitor = new VisitorPage(page);
    const route = page.getByRole('region', { name: 'Rute' });

    await page.goto(`/v/${venueId}?o=${origin.code}`);
    await expect(visitor.map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
    await visitor.search.fill('toilet');
    await visitor.results.filter({ hasText: 'Toilet' }).first().click();
    const list = page.getByRole('region', { name: 'Toilet' });
    await expect(list.getByRole('listitem')).toHaveCount(3);
    await page.screenshot({ path: shot('01-daftar-toilet') });
    await list.getByRole('button', { name: 'Rute ke Toilet terdekat' }).click();
    await expect(route.getByRole('definition').nth(2)).toHaveText('Toilet');
    await expect(route.getByRole('list', { name: 'Lantai yang dilewati' })).toHaveText('GF');
    const fromLobby = Number(
      ((await route.getByTestId('route-distance').textContent()) ?? '').replace(/\D/g, ''),
    );
    expect(fromLobby).toBeLessThanOrEqual(45);
    await page.screenshot({ path: shot('02-toilet-terdekat-dari-lobi') });

    const upper = snapshot.floors.find((f) => f.level === 2 && f.buildingId !== null);
    const unit = snapshot.features.features.find(
      (f) =>
        f.properties.floorId === upper?.id &&
        f.properties.kind === 'unit' &&
        f.geometry.type === 'Polygon',
    );
    if (!upper || unit?.geometry.type !== 'Polygon') throw new Error('Unit L2 tidak ada');
    const ring = (unit.geometry.coordinates[0] ?? []).slice(0, -1);
    const lng = ring.reduce((sum, c) => sum + (c[0] ?? 0), 0) / ring.length;
    const lat = ring.reduce((sum, c) => sum + (c[1] ?? 0), 0) / ring.length;
    await page.goto(`/v/${venueId}?from=${lng.toFixed(7)},${lat.toFixed(7)},${upper.id}`);
    await expect(visitor.map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
    await visitor.search.fill('toilet');
    await visitor.results.filter({ hasText: 'Toilet' }).first().click();
    await list.getByRole('button', { name: 'Rute ke Toilet terdekat' }).click();
    await expect(route.getByRole('list', { name: 'Lantai yang dilewati' })).toHaveText('L2');
    await page.screenshot({ path: shot('03-toilet-terdekat-dari-l2') });
  });

  test('TC-NVX-06: rute tiga tujuan tampil berurutan dengan langkah per segmen', async ({
    page,
    fullVenue,
    superAdmin,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    await superAdmin.publications.publish(venueId);
    const snapshot = await superAdmin.snapshots.latest(venueId);
    const origin = snapshot.originPoints.find((p) => p.name === 'Lobi Utama');
    if (!origin) throw new Error('Lobi Utama tidak ada di snapshot');
    const visitor = new VisitorPage(page);
    const route = page.getByRole('region', { name: 'Rute' });

    await page.goto(`/v/${venueId}?o=${origin.code}&to=${fullVenue.ids.radiology}`);
    await expect(visitor.map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
    await expect(route.getByRole('list', { name: 'Langkah rute' })).toBeVisible();

    for (const code of ['L1-A06', 'L2-A06']) {
      await route.getByRole('button', { name: 'Tambah tujuan' }).click();
      await route.getByRole('searchbox', { name: 'Cari tujuan berikutnya' }).fill(code);
      await route
        .getByRole('list', { name: 'Pilihan tujuan berikutnya' })
        .getByRole('button', { name: code, exact: true })
        .click();
    }

    const destinations = route.getByRole('list', { name: 'Tujuan berurutan' });
    await expect(destinations.getByRole('listitem')).toHaveText([
      /1\s*Radiologi/,
      /2\s*L1-A06/,
      /3\s*L2-A06/,
    ]);
    const segments = ['Ke Radiologi (1/3)', 'Ke L1-A06 (2/3)', 'Ke L2-A06 (3/3)'];
    for (const name of segments) {
      const segment = route.getByRole('region', { name });
      await expect(segment.getByRole('heading', { name })).toBeVisible();
      await expect(segment.getByRole('listitem').first()).toBeVisible();
    }
    await expect(route.getByRole('region', { name: 'Ke Radiologi (1/3)' })).toContainText(
      'Lobi Utama',
    );
    await expect(route.getByRole('list', { name: 'Lantai yang dilewati' })).toContainText('L2');
    await route.screenshot({ path: shot('04-rute-tiga-tujuan') });

    await destinations.getByRole('button', { name: 'Hapus tujuan L1-A06' }).click();
    await expect(destinations.getByRole('listitem')).toHaveText([/1\s*Radiologi/, /2\s*L2-A06/]);
    await expect(route.getByRole('region', { name: 'Ke L2-A06 (2/2)' })).toBeVisible();
    await page.screenshot({ path: shot('05-tujuan-dihapus') });
  });
});
