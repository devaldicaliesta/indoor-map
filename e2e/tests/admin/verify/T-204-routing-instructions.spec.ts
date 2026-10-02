import { expect, test } from '../../../fixtures';
import { TestRoutePanel } from '../../../support/test-route';

const shot = (name: string) => `evidence/T-204/${name}.png`;

test.describe('T-204 Routing: instruksi', () => {
  test('instruksi per langkah ID dan EN; langkah bisa dipilih dan dinavigasi', async ({
    page,
    loginAs,
    fullVenue,
  }) => {
    const route = new TestRoutePanel(page);
    await route.open(loginAs, fullVenue.name);
    await route.route('GF-A01', 'L1-B08');
    const id = await route.stepTexts();
    expect(id[0]).toMatch(/^Mulai dari GF-A01/);
    expect(id.join(' | ')).toMatch(/Jalan lurus \d+ m/);
    expect(id.join(' | ')).toMatch(/Belok (kiri|kanan)/);
    expect(id.at(-1)).toMatch(/^Tiba di L1-B08/);

    // Bahasa instruksi EN: jumlah langkah sama, teks berbahasa Inggris.
    await route.panel
      .getByRole('radiogroup', { name: 'Bahasa instruksi' })
      .getByRole('radio', { name: 'en' })
      .click();
    await expect.poll(async () => (await route.stepTexts())[0]).not.toBe(id[0]);
    const en = await route.stepTexts();
    expect(en).toHaveLength(id.length);
    expect(en.join(' | ')).not.toMatch(/Jalan lurus|Belok|Tiba di/);
    expect(en[0]).toMatch(/^Start/);
    expect(en.join(' | ')).toMatch(/Go straight for \d/);
    expect(en.at(-1)).toMatch(/L1-B08/);
    await page.screenshot({ path: shot('02-instruksi-en') });

    // Navigasi langkah.
    await route.panel
      .getByRole('radiogroup', { name: 'Bahasa instruksi' })
      .getByRole('radio', { name: 'id' })
      .click();
    await route.panel.getByRole('button', { name: 'Langkah berikutnya' }).click();
    await expect(route.panel.getByText(`Langkah 2 dari ${id.length}`)).toBeVisible();
    await expect(route.steps.nth(1).getByRole('button')).toHaveAttribute('aria-current', 'step');
    await route.steps.nth(3).getByRole('button').click();
    await expect(route.panel.getByText(`Langkah 4 dari ${id.length}`)).toBeVisible();
    await page.screenshot({ path: shot('01-instruksi-id-langkah-4') });
  });
});
