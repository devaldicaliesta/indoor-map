import { expect, test } from '../../../fixtures';
import { TestRoutePanel } from '../../../support/test-route';

const shot = (name: string) => `evidence/T-201/${name}.png`;

test.describe('T-201 Routing: graf dan A*', () => {
  test('rute satu lantai: jarak masuk akal, langkah berurutan, simetris, dekat lebih pendek', async ({
    page,
    loginAs,
    fullVenue,
  }) => {
    const route = new TestRoutePanel(page);
    await route.open(loginAs, fullVenue.name);
    await expect(route.panel.getByText(/Pilih asal dan tujuan/)).toBeVisible();

    await route.route('GF-A01', 'GF-B08');
    const far = await route.distance();
    expect(far).toBeGreaterThan(5);
    const steps = await route.stepTexts();
    expect(steps.length).toBeGreaterThanOrEqual(2);
    expect(steps.at(-1)).toMatch(/GF-B08|tiba|sampai/i);
    await page.screenshot({ path: shot('01-rute-satu-lantai') });

    // Tukar asal dan tujuan: jarak sama.
    await route.panel.getByRole('button', { name: 'Tukar asal dan tujuan' }).click();
    await expect(route.summary).toBeVisible();
    await expect.poll(() => route.distance()).toBeCloseTo(far, 0);

    // Tujuan bersebelahan lebih dekat.
    await route.pick('Ke', 'GF-A02');
    await route.pick('Dari', 'GF-A01');
    await expect(route.summary).toBeVisible();
    await expect.poll(() => route.distance()).toBeLessThan(far);
    await page.screenshot({ path: shot('02-rute-pendek') });
  });
});
