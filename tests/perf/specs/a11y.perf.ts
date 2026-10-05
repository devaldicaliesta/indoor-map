import { readFileSync } from 'node:fs';
import { expect, type Page, test } from '@playwright/test';
import { perfEnv } from '../env';
import { record, seeded } from '../support';

// axe-core (MPL-2.0) tidak dijadikan dependency repo; berkasnya diberikan lewat AXE_PATH saat
// audit dijalankan (lihat README), menunggu keputusan pemilik di docs/PROGRESS.md.
const axeSource = () => {
  const path = process.env.AXE_PATH;
  if (!path) throw new Error('AXE_PATH (axe.min.js) wajib diisi untuk audit aksesibilitas.');
  return readFileSync(path, 'utf8');
};

interface Violation {
  id: string;
  impact: string | null;
  help: string;
  nodes: { target: string[] }[];
}

async function audit(page: Page, name: string, results: Record<string, Violation[]>) {
  await page.addScriptTag({ content: axeSource() });
  const violations = await page.evaluate(async () => {
    const axe = (
      window as unknown as { axe: { run(o: unknown): Promise<{ violations: Violation[] }> } }
    ).axe;
    const result = await axe.run({
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    });
    return result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.slice(0, 5).map((n) => ({ target: n.target })),
    }));
  });
  results[name] = violations;
}

async function signIn(page: Page) {
  await page.goto(`${perfEnv.adminUrl}/login`);
  await page.getByLabel('Email').fill(perfEnv.email);
  await page.getByLabel('Password').fill(perfEnv.password);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await expect(page.getByRole('combobox', { name: 'Venue aktif' })).toBeVisible();
}

test('audit axe WCAG 2.1 AA: Visitor, Info Point, Admin', async ({ browser }) => {
  const { sample } = seeded();
  const results: Record<string, Violation[]> = {};

  const phone = await browser.newPage({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true,
  });
  const visitor = `${perfEnv.visitorUrl}/v/${sample.venueId}`;
  for (const language of ['id', 'en']) {
    await phone.goto(`${visitor}?o=${sample.originCode}&lang=${language}`);
    await expect(phone.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
      timeout: 60_000,
    });
    await audit(phone, `visitor-awal-${language}`, results);
  }
  await phone.getByRole('searchbox').fill('Radiologi');
  await phone
    .getByRole('button', { name: /^Radiologi/ })
    .first()
    .click();
  await audit(phone, 'visitor-kartu-lokasi', results);
  await phone.getByRole('button', { name: /Directions to here|Rute ke sini/ }).click();
  await audit(phone, 'visitor-rute', results);

  const kiosk = await browser.newPage({
    viewport: { width: 1080, height: 1920 },
    ignoreHTTPSErrors: true,
  });
  await kiosk.goto(`${perfEnv.visitorUrl}/ip/${sample.infoPointCode}?venue=${sample.venueId}`);
  await expect(kiosk.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
    timeout: 60_000,
  });
  await audit(kiosk, 'info-point', results);

  const admin = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  });
  await admin.goto(`${perfEnv.adminUrl}/login`);
  await audit(admin, 'admin-login', results);
  await signIn(admin);
  await admin.getByRole('combobox', { name: 'Venue aktif' }).click();
  await admin.getByRole('option', { name: sample.name, exact: true }).click();
  for (const path of [
    '/venues',
    '/locations',
    '/closures',
    '/origin-points',
    '/publish',
    '/settings',
    '/users',
    '/license',
  ]) {
    await admin.goto(`${perfEnv.adminUrl}${path}`);
    await admin.waitForLoadState('networkidle');
    await audit(admin, `admin${path.replace('/', '-')}`, results);
  }
  await admin.goto(`${perfEnv.adminUrl}/map-editor`);
  await expect(admin.getByTestId('editor-map')).toHaveAttribute('data-ready', 'true', {
    timeout: 60_000,
  });
  await audit(admin, 'admin-map-editor', results);

  record('axe', results);
  const serious = Object.entries(results).flatMap(([page, list]) =>
    list
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map(
        (v) =>
          `${page}: ${v.id} (${v.impact}) ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`,
      ),
  );
  expect(serious, serious.join('\n')).toEqual([]);
});
