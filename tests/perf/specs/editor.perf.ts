import { expect, type Page, test } from '@playwright/test';
import { perfEnv } from '../env';
import { median, record, seeded } from '../support';

/** Frame per detik selama penunjuk diseret bolak-balik dari tengah kanvas (±1,5 detik). */
async function dragFps(page: Page, canvas: ReturnType<Page['getByTestId']>): Promise<number> {
  const box = await canvas.boundingBox();
  if (!box) throw new Error('kanvas tidak tampil');
  await page.evaluate(() => {
    const w = window as unknown as { __frames: number; __counting: boolean };
    w.__frames = 0;
    w.__counting = true;
    const tick = () => {
      if (!w.__counting) return;
      w.__frames += 1;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  const started = Date.now();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  for (let i = 1; i <= 30; i++) await page.mouse.move(cx + i * 4, cy + i * 2);
  for (let i = 30; i >= 0; i--) await page.mouse.move(cx + i * 4, cy + i * 2);
  await page.mouse.up();
  const seconds = (Date.now() - started) / 1000;
  const frames = await page.evaluate(() => {
    const w = window as unknown as { __frames: number; __counting: boolean };
    w.__counting = false;
    return w.__frames;
  });
  return frames / seconds;
}

test.use({ viewport: { width: 1440, height: 900 } });

test('editor lancar dengan 1.000 fitur di satu lantai', async ({ page }) => {
  const venue = seeded();
  await page.goto(`${perfEnv.adminUrl}/login`);
  await page.getByLabel('Email').fill(perfEnv.email);
  await page.getByLabel('Password').fill(perfEnv.password);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await page.getByRole('combobox', { name: 'Venue aktif' }).click();
  await page.getByRole('option', { name: venue.denseVenueName, exact: true }).click();

  const opened = Date.now();
  await page.goto(`${perfEnv.adminUrl}/map-editor`);
  const canvas = page.getByTestId('editor-map');
  await expect(canvas).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
  await expect(page.getByText('1.000 fitur', { exact: true })).toBeVisible();
  const loadMs = Date.now() - opened;

  const pan: number[] = [];
  for (let run = 0; run < 3; run++) pan.push(await dragFps(page, canvas));

  // Fitur terpilih dari daftar diletakkan di tengah peta; seret dari tengah = geser fitur.
  const search = page.getByRole('searchbox', { name: /Cari fitur di lantai/ });
  await search.fill('GF-481');
  await search.press('Enter');
  await expect(page.getByRole('region', { name: 'Properti fitur' })).toBeVisible();
  await page.waitForTimeout(1_000);
  const move = [await dragFps(page, canvas)];
  await page.screenshot({ path: 'results/editor-1000.png' });

  await page.getByRole('radio', { name: 'L1', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Fitur L1' })).toBeVisible();
  await expect(canvas).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
  const baseline: number[] = [];
  for (let run = 0; run < 3; run++) baseline.push(await dragFps(page, canvas));
  record('editor', {
    features: 1000,
    loadMs,
    panFps: pan,
    panMedian: median(pan),
    moveFps: move,
    emptyFloorFps: baseline,
    emptyFloorMedian: median(baseline),
    ratio: median(pan) / median(baseline),
  });
  expect(median(pan) / median(baseline)).toBeGreaterThan(0.35);
});
