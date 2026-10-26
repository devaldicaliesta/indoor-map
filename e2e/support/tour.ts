import { type BrowserContext, expect, type Locator, type Page } from '@playwright/test';
import { sql } from './license';

/** Server dev E2E mematikan tur otomatis (`VITE_TOUR_AUTOSTART=off`); spec tur menyalakannya per perangkat. */
export async function enableAutoTours(context: BrowserContext) {
  await context.addInitScript(() => {
    try {
      localStorage.setItem('indoor.tour.auto', 'on');
    } catch {
      // Spec penyimpanan diblokir mengatur ini sendiri.
    }
  });
}

/** Akun seed dianggap belum pernah melihat tur apa pun. */
export function resetTourProgress(email: string) {
  sql(`delete from public.tour_progress
       where user_id = (select user_id from public.profiles where email = '${email}')`);
}

export function tourProgress(email: string): string[] {
  const rows = sql(`select tour_key from public.tour_progress
       where user_id = (select user_id from public.profiles where email = '${email}')
       order by tour_key`);
  return rows ? rows.split('\n') : [];
}

export class TourPopover {
  readonly root: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly progress: Locator;
  readonly next: Locator;
  readonly previous: Locator;
  readonly skip: Locator;

  constructor(readonly page: Page) {
    this.root = page.locator('.driver-popover');
    this.title = this.root.locator('.driver-popover-title');
    this.description = this.root.locator('.driver-popover-description');
    this.progress = this.root.locator('.driver-popover-progress-text');
    this.next = this.root.locator('.driver-popover-next-btn');
    this.previous = this.root.locator('.driver-popover-prev-btn');
    this.skip = this.root.locator('.indoor-tour-skip');
  }

  /** Judul setiap langkah dari awal sampai akhir, lalu tur ditutup lewat "Selesai". */
  async walkTitles(): Promise<string[]> {
    await expect(this.root).toBeVisible();
    const total = Number((await this.progress.textContent())?.match(/(\d+)\D*$/)?.[1] ?? 0);
    const titles: string[] = [];
    for (let i = 1; i <= total; i++) {
      await expect(this.progress).toContainText(String(i));
      titles.push((await this.title.textContent()) ?? '');
      await this.next.click();
    }
    await expect(this.root).toHaveCount(0);
    return titles;
  }
}

function luminance(rgb: string): number {
  const [r, g, b] = (rgb.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map((v) => {
    const c = Number(v) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Rasio kontras WCAG warna teks elemen terhadap latar (warna latar diberikan). */
export async function contrastOn(element: Locator, background: Locator): Promise<number> {
  const fg = await element.evaluate((el) => getComputedStyle(el).color);
  const bg = await background.evaluate((el) => getComputedStyle(el).backgroundColor);
  const [a, b] = [luminance(fg), luminance(bg)].sort((x, y) => y - x) as [number, number];
  return (a + 0.05) / (b + 0.05);
}
