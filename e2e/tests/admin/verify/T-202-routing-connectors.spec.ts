import { expect, test } from '../../../fixtures';
import { TestRoutePanel } from '../../../support/test-route';

const shot = (name: string) => `evidence/T-202/${name}.png`;

test.describe('T-202 Routing: konektor', () => {
  test('rute lintas lantai lewat konektor; GF→L2 lewat tangga; chip lantai berganti', async ({
    page,
    loginAs,
    fullVenue,
  }) => {
    const route = new TestRoutePanel(page);
    await route.open(loginAs, fullVenue.name);

    // GF → L1: lewat lift, eskalator, atau tangga.
    await route.route('GF-A01', 'L1-B08');
    await expect(route.summary).toBeVisible();
    const toL1 = (await route.stepTexts()).join(' | ');
    expect(toL1).toMatch(/lift|eskalator|tangga/i);
    await expect(route.steps.filter({ hasText: /GU L1/ }).first()).toBeVisible();
    await page.screenshot({ path: shot('01-gf-ke-l1') });

    // GF → L2: lift dan eskalator hanya GF–L1, jadi naik lewat tangga (GF–L2).
    await route.pick('Ke', 'L2-B08');
    await expect.poll(async () => (await route.stepTexts()).join(' | ')).toMatch(/L2-B08/);
    const toL2 = (await route.stepTexts()).join(' | ');
    expect(toL2).toMatch(/tangga/i);
    await expect(route.steps.filter({ hasText: /GU L2/ }).first()).toBeVisible();
    await page.screenshot({ path: shot('02-gf-ke-l2-tangga') });

    // Lintas gedung lewat jalur Area Luar.
    await route.pick('Ke', 'GT-B03');
    await expect.poll(async () => (await route.stepTexts()).join(' | ')).toMatch(/GT-B03/);
    expect((await route.stepTexts()).join(' | ')).toMatch(
      /Keluar dari Gedung Utama[\s\S]*Masuk ke Gedung Timur/,
    );
    await page.screenshot({ path: shot('03-lintas-gedung') });
  });
});
