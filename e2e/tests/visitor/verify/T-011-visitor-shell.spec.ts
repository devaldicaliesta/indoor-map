import { type ChildProcess, spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { VisitorPage } from '../../../pages/visitor-page';

const shot = (name: string) => `evidence/T-011/${name}.png`;
const repoRoot = fileURLToPath(new URL('../../../../', import.meta.url));

const sheet = (page: Page) => page.locator('section[data-snap]');
const handle = (page: Page) => page.getByRole('button', { name: /Ubah tinggi panel|Resize panel/ });

async function settled(page: Page, snap: 'peek' | 'half' | 'full') {
  await expect(sheet(page)).toHaveAttribute('data-snap', snap);
  // Tinggi akhir setelah transisi 300 ms; dibandingkan dengan tinggi snap yang diharapkan.
  const viewport = page.viewportSize()?.height ?? 740;
  const expected = { peek: 96, half: Math.round(viewport / 2), full: viewport - 72 }[snap];
  await expect
    .poll(async () => Math.round((await sheet(page).boundingBox())?.height ?? 0))
    .toBe(expected);
}

test.describe('T-011 Kerangka Visitor', () => {
  test('HP 360: bottom sheet 3 tinggi lewat keyboard dan drag; bahasa tanpa reload dan diingat', async ({
    page,
    publishedVenue,
  }) => {
    const hosts = new Set<string>();
    page.on('request', (r) => hosts.add(new URL(r.url()).host));

    const visitor = new VisitorPage(page);
    await visitor.goto(publishedVenue.venue.id);
    const start = (await sheet(page).getAttribute('data-snap')) ?? '';
    expect(['peek', 'half']).toContain(start);
    await page.screenshot({ path: shot('01-hp-awal') });

    // Keyboard: panah atas/bawah menaikkan/menurunkan satu tingkat.
    await handle(page).focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await settled(page, 'peek');
    await expect(handle(page)).toHaveAttribute('aria-expanded', 'false');
    await page.screenshot({ path: shot('02-hp-sheet-intip') });
    await page.keyboard.press('ArrowUp');
    await settled(page, 'half');
    await expect(handle(page)).toHaveAttribute('aria-expanded', 'true');
    await page.screenshot({ path: shot('03-hp-sheet-setengah') });
    await page.keyboard.press('ArrowUp');
    await settled(page, 'full');
    await expect(visitor.search).toBeInViewport();
    await page.screenshot({ path: shot('04-hp-sheet-penuh') });
    // Enter berputar: penuh → intip.
    await page.keyboard.press('Enter');
    await settled(page, 'peek');

    // Drag pegangan ke atas ±300 px berhenti di snap terdekat (setengah = 370 px).
    const box = await handle(page).boundingBox();
    if (!box) throw new Error('pegangan tidak tampil');
    const x = box.x + box.width / 2;
    await page.mouse.move(x, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(x, box.y - 150, { steps: 5 });
    await page.mouse.move(x, box.y - 280, { steps: 5 });
    await page.mouse.up();
    await settled(page, 'half');

    // Target sentuh pegangan dan tombol bahasa ≥ 44 px (lebar pegangan; tinggi area seret 24 px).
    const english = page.getByRole('button', { name: 'English' });
    if (!(await english.isVisible()))
      await page
        .getByRole('button', { name: /bahasa|language/i })
        .first()
        .click();
    await expect(english).toBeVisible();
    const target = await english.boundingBox();
    expect(Math.min(target?.width ?? 0, target?.height ?? 0)).toBeGreaterThanOrEqual(44);

    // Bahasa berganti tanpa memuat ulang dan diingat.
    let navigations = 0;
    page.on('framenavigated', (f) => {
      if (f === page.mainFrame()) navigations += 1;
    });
    await english.click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(visitor.page.getByRole('searchbox', { name: 'Search locations' })).toBeVisible();
    expect(navigations).toBe(0);
    await page.screenshot({ path: shot('05-hp-english') });
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.getByRole('button', { name: 'Bahasa Indonesia' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');

    const allowed = new Set([new URL(env.visitorUrl).host, new URL(env.supabaseUrl).host]);
    const foreign = [...hosts].filter((h) => !allowed.has(h) && !h.startsWith('localhost'));
    expect(foreign, 'tidak ada request ke domain pihak ketiga').toEqual([]);
  });

  test('desktop 1280: panel kiri, tanpa bottom sheet', async ({ browser, publishedVenue }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    try {
      await page.goto(`${env.visitorUrl}/v/${publishedVenue.venue.id}`);
      await expect(page.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
        timeout: 30_000,
      });
      await expect(sheet(page)).toHaveCount(0);
      await expect(page.getByRole('searchbox', { name: 'Cari lokasi' })).toBeVisible();
      const search = await page.getByRole('searchbox', { name: 'Cari lokasi' }).boundingBox();
      expect(search?.x ?? 999).toBeLessThan(420);
      await page.screenshot({ path: shot('06-desktop') });
    } finally {
      await context.close();
    }
  });

  test('PWA: build produksi installable (manifest, service worker, ikon)', async ({ browser }) => {
    test.setTimeout(240_000);
    const outDir = mkdtempSync(join(tmpdir(), 'visitor-pwa-'));
    const run = (args: string[]) =>
      spawn('pnpm', ['--filter', '@indoor/visitor', 'exec', 'vite', ...args], {
        cwd: repoRoot,
        stdio: 'ignore',
      });
    await new Promise<void>((resolve, reject) => {
      const build = run(['build', '--outDir', outDir, '--emptyOutDir']);
      build.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`build ${code}`))));
    });
    const port = 4174;
    const preview: ChildProcess = run([
      'preview',
      '--outDir',
      outDir,
      '--port',
      String(port),
      '--strictPort',
    ]);
    const context = await browser.newContext({ viewport: { width: 360, height: 740 } });
    try {
      const base = `http://localhost:${port}`;
      await expect
        .poll(
          () =>
            fetch(base).then(
              (r) => r.ok,
              () => false,
            ),
          { timeout: 30_000 },
        )
        .toBe(true);
      const page = await context.newPage();
      await page.goto(base);
      const manifestHref = await page.locator('link[rel="manifest"]').getAttribute('href');
      expect(manifestHref).toBeTruthy();
      const manifest = (await (await fetch(new URL(manifestHref ?? '', base))).json()) as {
        display: string;
        icons: { sizes: string; purpose?: string }[];
      };
      expect(manifest.display).toBe('standalone');
      expect(manifest.icons.map((i) => i.sizes)).toEqual(
        expect.arrayContaining(['192x192', '512x512']),
      );
      expect(manifest.icons.some((i) => i.purpose === 'maskable')).toBe(true);
      await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));

      const cdp = await context.newCDPSession(page);
      const { installabilityErrors } = (await cdp.send('Page.getInstallabilityErrors')) as {
        installabilityErrors: { errorId: string }[];
      };
      expect(installabilityErrors.map((e) => e.errorId)).toEqual([]);
      await page.screenshot({ path: shot('07-pwa-build-produksi') });
    } finally {
      await context.close();
      preview.kill();
    }
  });
});
