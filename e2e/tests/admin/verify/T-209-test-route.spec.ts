import { expect, test } from '../../../fixtures';
import { TestRoutePanel } from '../../../support/test-route';

const shot = (name: string) => `evidence/T-209/${name}.png`;

test.describe('T-209 Test route di Admin', () => {
  test('asal/tujuan lintas lantai, chip lantai, langkah memindah lantai, kursi roda, bahasa EN', async ({
    page,
    loginAs,
    fullVenue,
  }) => {
    const route = new TestRoutePanel(page);
    await route.open(loginAs, fullVenue.name);
    const floor = (name: string) =>
      page.getByRole('radiogroup', { name: 'Lantai' }).getByRole('radio', { name });

    // GF → L2: hanya lewat tangga, ada chip GF dan L2.
    await route.route('GF-A01', 'L2-B08');
    await expect(route.summary).toBeVisible();
    const steps = (await route.stepTexts()).join(' | ');
    expect(steps).toMatch(/tangga/i);
    expect(steps).toMatch(/L2/);
    await expect(route.steps.first()).toContainText('GF');
    await expect(route.steps.last()).toContainText('L2-B08');
    await page.screenshot({ path: shot('01-rute-lintas-lantai') });

    // Pilih langkah terakhir: editor pindah ke L2.
    await route.steps.last().getByRole('button').click();
    await expect(floor('L2')).toHaveAttribute('aria-checked', 'true');
    await expect(route.panel.getByText(/Langkah \d+ dari \d+/)).toBeVisible();
    await expect(route.summary).toBeVisible();
    await page.screenshot({ path: shot('02-langkah-di-L2') });
    // Langkah sebelumnya/berikutnya.
    await route.panel.getByRole('button', { name: 'Langkah sebelumnya' }).click();
    await expect(route.steps.locator('[aria-current="step"]')).toHaveCount(1);

    // Kursi roda: GF → L2 tidak ada rute aksesibel (lift hanya GF–L1).
    await route.accessible(true);
    await expect(route.panel.getByRole('alert')).toBeVisible();
    await expect(route.panel.getByRole('alert')).toContainText(/L2/);
    await page.screenshot({ path: shot('03-kursi-roda-gagal') });
    await route.pick('Ke', 'L1-B08');
    await expect(route.summary).toBeVisible();
    await expect.poll(async () => (await route.stepTexts()).join(' | ')).toMatch(/lift/i);

    // Instruksi bahasa Inggris.
    await route.panel
      .getByRole('radiogroup', { name: 'Bahasa instruksi' })
      .getByRole('radio', { name: 'en' })
      .click();
    await expect.poll(async () => (await route.stepTexts()).join(' | ')).toMatch(/elevator|lift/i);
    await expect.poll(async () => (await route.stepTexts()).at(-1) ?? '').toMatch(/arrive/i);
    await page.screenshot({ path: shot('04-instruksi-en') });
  });
});
