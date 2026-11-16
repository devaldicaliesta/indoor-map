import type { Venue } from '@indoor/domain';
import type { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { VisitorPage } from '../../../pages/visitor-page';

const shot = (name: string) => `evidence/T-552/${name}.png`;
const WALK_MPS = 1.2;
const ACCESSIBLE_MPS = 0.8;

async function summary(page: Page) {
  const route = page.getByRole('region', { name: /^(Rute|Route)$/ });
  await expect(route.getByTestId('route-duration')).toBeVisible();
  const duration = (await route.getByTestId('route-duration').textContent()) ?? '';
  const distance = (await route.getByTestId('route-distance').textContent()) ?? '';
  return {
    duration,
    minutes: Number(duration.replace(/\D/g, '')),
    meters: Number(distance.replace(/\D/g, '')),
  };
}

function expectConsistent(minutes: number, meters: number, speed: number) {
  const walking = Math.max(1, Math.ceil(meters / speed / 60));
  expect(minutes).toBeGreaterThanOrEqual(walking);
  expect(minutes).toBeLessThanOrEqual(walking + 2);
}

test.describe('T-552 Estimasi waktu tempuh', () => {
  test('TC-NVX-04: menit rute biasa dan aksesibel konsisten dengan jarak, ID dan EN', async ({
    page,
    fullVenue,
    superAdmin,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    await superAdmin.publications.publish(venueId);
    const snapshot = await superAdmin.snapshots.latest(venueId);
    const origin = snapshot.originPoints.find((p) => p.name === 'Lobi Utama');
    if (!origin) throw new Error('Lobi Utama tidak ada di snapshot');
    const upper = snapshot.floors.find((f) => f.level === 1 && f.buildingId !== null);
    const unit = snapshot.features.features.find(
      (f) =>
        f.properties.floorId === upper?.id &&
        f.properties.kind === 'unit' &&
        f.geometry.type === 'Polygon',
    );
    if (!upper || unit?.geometry.type !== 'Polygon') throw new Error('Unit L1 tidak ada');
    const ring = (unit.geometry.coordinates[0] ?? []).slice(0, -1);
    const lng = ring.reduce((sum, c) => sum + (c[0] ?? 0), 0) / ring.length;
    const lat = ring.reduce((sum, c) => sum + (c[1] ?? 0), 0) / ring.length;
    const visitor = new VisitorPage(page);
    const base = `/v/${venueId}?o=${origin.code}&to=${lng.toFixed(7)},${lat.toFixed(7)},${upper.id}`;

    await page.goto(base);
    await expect(visitor.map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
    const normal = await summary(page);
    expect(normal.duration).toMatch(/^± \d+ menit$/);
    expect(normal.meters).toBeGreaterThan(0);
    expectConsistent(normal.minutes, normal.meters, WALK_MPS);
    await page.screenshot({ path: shot('01-rute-biasa-id') });

    await page.getByLabel('Rute aksesibel (kursi roda)').check();
    await expect.poll(async () => (await summary(page)).minutes).toBeGreaterThan(normal.minutes);
    const accessible = await summary(page);
    expectConsistent(accessible.minutes, accessible.meters, ACCESSIBLE_MPS);
    expect(accessible.minutes).toBeGreaterThan(normal.minutes);
    await page.screenshot({ path: shot('02-rute-aksesibel-id') });

    await page.goto(`${base}&lang=en`);
    await expect(visitor.map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
    const english = await summary(page);
    expect(english.duration).toMatch(/^about \d+ min$/);
    expect(english.minutes).toBe(normal.minutes);
    expect(english.meters).toBe(normal.meters);
    await page.screenshot({ path: shot('03-rute-biasa-en') });
  });
});
