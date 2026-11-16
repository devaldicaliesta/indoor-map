import { readFileSync, writeFileSync } from 'node:fs';
import type { CDPSession, Locator, Page } from '@playwright/test';

export interface SeededVenue {
  venueId: string;
  originCode: string;
  targetLocationId: string;
  targetName: string;
  insertedMs: number;
  publishMs: number;
  latestBytes: number;
  denseVenueName: string;
  sample: { venueId: string; name: string; originCode: string; infoPointCode: string };
}

export const seeded = (): SeededVenue => JSON.parse(readFileSync('results/venue.json', 'utf8'));

/** Profil jaringan Chrome DevTools (throughput dalam byte/detik). */
export const NETWORK = {
  '4g': {
    latency: 60,
    downloadThroughput: (9 * 1024 * 1024) / 8,
    uploadThroughput: (1.5 * 1024 * 1024) / 8,
  },
  'slow-4g': {
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  },
} as const;

/** HP kelas menengah ≈ CPU desktop diperlambat 4× (patokan Lighthouse). */
export const MID_RANGE_CPU = 4;

export async function throttle(
  page: Page,
  network: keyof typeof NETWORK | null,
  cpuRate: number,
): Promise<CDPSession> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  if (network)
    await cdp.send('Network.emulateNetworkConditions', { offline: false, ...NETWORK[network] });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpuRate });
  return cdp;
}

/** Hasil pengukuran ditulis ke results/<nama>.json untuk laporan. */
export function record(name: string, value: unknown) {
  writeFileSync(`results/${name}.json`, JSON.stringify(value, null, 2));
}

export const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? Number.NaN;
};

/** Frame per detik selama penunjuk diseret bolak-balik dari tengah kanvas (±1,5 detik). */
export async function dragFps(page: Page, canvas: Locator): Promise<number> {
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
