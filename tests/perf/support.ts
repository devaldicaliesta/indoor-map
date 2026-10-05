import { readFileSync, writeFileSync } from 'node:fs';
import type { CDPSession, Page } from '@playwright/test';

export interface SeededVenue {
  venueId: string;
  originCode: string;
  targetLocationId: string;
  targetName: string;
  insertedMs: number;
  publishMs: number;
  snapshotBytes: number;
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
