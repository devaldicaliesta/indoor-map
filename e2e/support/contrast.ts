import type { Page } from '@playwright/test';

export interface ContrastFailure {
  text: string;
  ratio: number;
  required: number;
  color: string;
  background: string;
}

/**
 * Memeriksa kontras WCAG setiap teks yang tampil di halaman: warna teks dibandingkan dengan latar
 * efektif (latar pertama yang tidak transparan di leluhurnya). Teks besar (≥ 24 px, atau ≥ 18,66 px
 * tebal) cukup 3:1, selainnya 4,5:1. Teks nonaktif dikecualikan sesuai WCAG 1.4.3.
 */
export function contrastFailures(page: Page): Promise<ContrastFailure[]> {
  return page.evaluate(() => {
    const parse = (value: string) => {
      const m = value.match(/rgba?\(([^)]+)\)/);
      if (!m?.[1]) return null;
      const [r = 0, g = 0, b = 0, a = 1] = m[1]
        .split(/[ ,/]+/)
        .filter(Boolean)
        .map(Number);
      return { r, g, b, a };
    };
    const luminance = ({ r, g, b }: { r: number; g: number; b: number }) => {
      const c = [r, g, b].map((v) => {
        const s = v / 255;
        return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * (c[0] ?? 0) + 0.7152 * (c[1] ?? 0) + 0.0722 * (c[2] ?? 0);
    };
    const background = (element: Element) => {
      for (let node: Element | null = element; node; node = node.parentElement) {
        const bg = parse(getComputedStyle(node).backgroundColor);
        if (bg && bg.a > 0.5) return bg;
      }
      return { r: 255, g: 255, b: 255, a: 1 };
    };
    const failures: ContrastFailure[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent?.trim() ?? '';
      const element = node.parentElement;
      if (!text || !element) continue;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      if (style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) continue;
      if (element.closest('[disabled], [aria-disabled="true"], [data-disabled], .sr-only'))
        continue;
      const fg = parse(style.color);
      if (!fg || Number(style.opacity) < 0.5) continue;
      const bg = background(element);
      const [light, dark] = [luminance(fg), luminance(bg)].sort((x, y) => y - x) as [
        number,
        number,
      ];
      const ratio = (light + 0.05) / (dark + 0.05);
      const size = Number.parseFloat(style.fontSize);
      const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700);
      const required = large ? 3 : 4.5;
      if (ratio < required) {
        failures.push({
          text: text.slice(0, 40),
          ratio: Math.round(ratio * 100) / 100,
          required,
          color: style.color,
          background: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
        });
      }
    }
    return failures;
  });
}
