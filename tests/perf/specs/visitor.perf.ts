import { devices, expect, type Page, test } from '@playwright/test';
import { perfEnv } from '../env';
import { MID_RANGE_CPU, median, record, seeded, throttle } from '../support';

const RUNS = 5;

/** Milidetik sejak navigasi dimulai sampai peta selesai menggambar data venue. */
async function timeToMapReady(page: Page, url: string): Promise<number> {
  await page.goto(url, { waitUntil: 'commit' });
  await page.waitForFunction(
    () =>
      document.querySelector('[data-testid="venue-map"]')?.getAttribute('data-ready') === 'true',
    undefined,
    { polling: 'raf', timeout: 60_000 },
  );
  return page.evaluate(() => Math.round(performance.now()));
}

test.use({ ...devices['Pixel 7'] });

test('muat awal dan kunjungan ulang Visitor di 4G, HP kelas menengah', async ({ browser }) => {
  const venue = seeded();
  const url = `${perfEnv.visitorUrl}/v/${venue.venueId}?lang=id`;
  const result: Record<string, { runs: number[]; median: number }> = {};
  for (const network of ['4g', 'slow-4g'] as const) {
    const first: number[] = [];
    const repeat: number[] = [];
    for (let run = 0; run < RUNS; run++) {
      // Konteks baru = pengunjung baru (tanpa cache dan service worker).
      const context = await browser.newContext({ ...devices['Pixel 7'], ignoreHTTPSErrors: true });
      const page = await context.newPage();
      await throttle(page, network, MID_RANGE_CPU);
      first.push(await timeToMapReady(page, url));
      // Kunjungan ulang setelah service worker aktif dan aset tersimpan.
      await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
      await page.waitForTimeout(2_000);
      const again = await context.newPage();
      await throttle(again, network, MID_RANGE_CPU);
      repeat.push(await timeToMapReady(again, url));
      await context.close();
    }
    result[`${network}-first`] = { runs: first, median: median(first) };
    result[`${network}-repeat`] = { runs: repeat, median: median(repeat) };
  }
  record('visitor-load', result);
  expect(result['4g-first']?.median).toBeDefined();
});

test('hitung dan tampilkan rute antar-lantai terjauh', async ({ page }) => {
  const venue = seeded();
  const url = `${perfEnv.visitorUrl}/v/${venue.venueId}?o=${venue.originCode}&loc=${venue.targetLocationId}&lang=id`;
  const runs: number[] = [];
  for (let run = 0; run < RUNS; run++) {
    await page.goto(url);
    await expect(page.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
      timeout: 60_000,
    });
    const cdp = await throttle(page, null, MID_RANGE_CPU);
    const button = page.getByRole('button', { name: 'Rute ke sini' });
    await expect(button).toBeVisible({ timeout: 30_000 });
    // Dari ketukan sampai daftar langkah rute tergambar (hitung rute + instruksi + render).
    runs.push(
      await button.evaluate(async (el) => {
        const started = performance.now();
        (el as HTMLButtonElement).click();
        await new Promise<void>((resolve) => {
          const check = () =>
            document.querySelector('[aria-label="Langkah rute"]')
              ? resolve()
              : requestAnimationFrame(check);
          check();
        });
        return Math.round(performance.now() - started);
      }),
    );
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  }
  record('route', { cpuRate: MID_RANGE_CPU, runs, median: median(runs) });
});
