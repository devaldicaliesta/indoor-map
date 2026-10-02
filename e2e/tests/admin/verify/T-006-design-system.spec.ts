import { execFileSync } from 'node:child_process';
import type { Page } from '@playwright/test';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { contrastFailures } from '../../../support/contrast';
import { type CheckResult, renderSummary, repoRoot } from '../../../support/repo-checks';

// T-006: token desain, font lokal, kontras AA, bentuk (radius, bayangan, gradien) di galeri /_ui.
const shot = (name: string) => `evidence/T-006/${name}.png`;
const results: CheckResult[] = [];

/** Keluarga font yang benar-benar termuat (font yang tidak dipakai halaman tidak diunduh). */
const loadedFonts = (page: Page) =>
  page.evaluate(() =>
    [...document.fonts]
      .filter((f) => f.status === 'loaded')
      .map((f) => f.family.replaceAll('"', '')),
  );

function record(id: string, check: string, ok: boolean) {
  results.push({ id, check, ok });
  expect(ok, `${id} ${check}`).toBe(true);
}

test.describe('T-006 Sistem desain', () => {
  test.describe.configure({ mode: 'serial' });

  test('galeri /_ui: kontras, font lokal, bentuk, tinggi tombol, fokus', async ({ page }) => {
    const external: string[] = [];
    const fontHosts: string[] = [];
    page.on('request', (r) => {
      const host = new URL(r.url()).hostname;
      if (r.resourceType() === 'font') fontHosts.push(host);
      if (!['localhost', '127.0.0.1'].includes(host)) external.push(r.url());
    });
    await page.goto('/_ui');
    await page.evaluate(() => document.fonts.ready);
    // Gaya peta mengunci gulir dokumen, jadi viewport dibesarkan agar seluruh galeri terekam.
    const galleryHeight = await page.evaluate(
      () => document.querySelector('main')?.scrollHeight ?? 900,
    );
    await page.setViewportSize({ width: 1440, height: galleryHeight + 48 });
    await page.screenshot({ path: shot('01-galeri-ui'), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 900 });

    const failures = await contrastFailures(page);
    record(
      'TC-NFR-07a',
      `semua teks di /_ui lolos WCAG AA${failures.length ? `: ${JSON.stringify(failures.slice(0, 3))}` : ''}`,
      failures.length === 0,
    );

    const loaded = await loadedFonts(page);
    record(
      'T006-font-1',
      `Admin memuat IBM Plex Sans dan IBM Plex Mono (${[...new Set(loaded)].join(', ')})`,
      loaded.includes('IBM Plex Sans') && loaded.includes('IBM Plex Mono'),
    );
    record(
      'T006-font-2',
      `berkas font dari server app sendiri, tanpa request ke luar (luar: ${external.length})`,
      external.length === 0 && fontHosts.length > 0 && fontHosts.every((h) => h === 'localhost'),
    );

    const shapes = await page.evaluate(() => {
      const bad = { radius: [] as string[], gradient: [] as string[], shadow: [] as string[] };
      for (const el of document.querySelectorAll<HTMLElement>('body *')) {
        const s = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (r.width === 0) continue;
        const radius = Number.parseFloat(s.borderTopLeftRadius);
        // Titik/lingkaran (lebar = tinggi) boleh bulat penuh.
        const circle = Math.abs(r.width - r.height) < 1 && radius >= r.width / 2 - 1;
        if (radius > 8 && !circle) bad.radius.push(`${el.tagName}.${el.className}`.slice(0, 60));
        if (s.backgroundImage.includes('gradient')) bad.gradient.push(el.tagName);
        const blur = [...s.boxShadow.matchAll(/(-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px/g)].map((m) =>
          Number(m[3]),
        );
        if (blur.some((b) => b > 12)) bad.shadow.push(`${el.tagName}.${el.className}`.slice(0, 60));
      }
      return bad;
    });
    record(
      'T006-radius',
      `radius ≤ 8 px (kecuali lingkaran): ${shapes.radius.slice(0, 3).join(', ')}`,
      shapes.radius.length === 0,
    );
    record('T006-gradient', 'tanpa gradien', shapes.gradient.length === 0);
    record(
      'T006-shadow',
      `bayangan blur ≤ 12 px: ${shapes.shadow.slice(0, 3).join(', ')}`,
      shapes.shadow.length === 0,
    );

    const height = await page
      .getByRole('button')
      .first()
      .evaluate((b) => b.getBoundingClientRect().height);
    record(
      'T006-button-admin',
      `tinggi tombol Admin 36 px (${height} px)`,
      Math.round(height) === 36,
    );

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const outline = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement as Element);
      return { style: s.outlineStyle, width: s.outlineWidth };
    });
    record(
      'TC-NFR-08a',
      `fokus keyboard terlihat (outline ${outline.width} ${outline.style})`,
      outline.style === 'solid' && outline.width === '2px',
    );
    await page.screenshot({ path: shot('02-fokus-keyboard') });
  });

  test('Visitor: font Atkinson dan tombol 44 px', async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await page.goto(`${env.visitorUrl}/`);
    await page.evaluate(() => document.fonts.ready);
    record(
      'T006-visitor-font',
      'Visitor memuat Atkinson Hyperlegible',
      (await loadedFonts(page)).includes('Atkinson Hyperlegible'),
    );
    const height = await page
      .getByRole('button', { name: 'EN' })
      .evaluate((b) => b.getBoundingClientRect().height);
    record(
      'T006-button-visitor',
      `target sentuh Visitor 44 px (${height} px)`,
      Math.round(height) === 44,
    );
    const failures = await contrastFailures(page);
    record('TC-NFR-07b', 'teks beranda Visitor lolos WCAG AA', failures.length === 0);
    await page.screenshot({ path: shot('03-visitor-token') });
    await page.close();
  });

  test('tanpa warna hex di komponen dan app', () => {
    const hits = execFileSync(
      'git',
      [
        'grep',
        '-nE',
        '#[0-9a-fA-F]{6}\\b',
        '--',
        'packages/ui/src/components/*.tsx',
        'apps/admin/src/**/*.tsx',
        'apps/visitor/src/**/*.tsx',
      ],
      { cwd: repoRoot, encoding: 'utf8' },
    )
      .split('\n')
      .filter((l) => l && !l.includes('.test.') && !l.includes('/dev/'))
      // Hanya komponen (.tsx): latar putih raster PDF/DXF/QR dan contoh di pesan galat bukan gaya UI.
      // Nilai awal <input type="color"> wajib hex; bukan gaya tampilan.
      .filter((l) => !l.includes('type-dialog.tsx'));
    record('T006-hex', `warna lewat token (temuan: ${hits.length})`, hits.length === 0);
  });

  test('ringkasan bukti', async ({ page }) => {
    await renderSummary(page, 'T-006 · Sistem desain', results);
    await expect(page.getByText('Gagal', { exact: true })).toHaveCount(0);
    await page.screenshot({ path: shot('04-ringkasan'), fullPage: true });
  });
});
