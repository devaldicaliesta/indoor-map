import { type ChildProcess, spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Venue } from '@indoor/domain';
import type { Browser, Page } from '@playwright/test';
import { env } from '../../../env';
import { expect, test } from '../../../fixtures';
import { VisitorPage } from '../../../pages/visitor-page';
import { sql } from '../../../support/license';

const shot = (name: string) => `evidence/T-501/${name}.png`;
const repoRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const LEGACY_NAME = /indoor map/i;
const DESKTOP = { width: 1280, height: 800 };

/** Ikon PanduArah bawaan di header Visitor (dipakai saat venue belum punya logo). */
const defaultIcon = (page: Page) => page.locator('header svg[data-brand="symbol"]');

/** Logo contoh venue fiktif untuk test: monogram di kotak berwarna, dirender jadi PNG. */
async function renderVenueLogo(browser: Browser): Promise<Buffer> {
  // Tanpa emulasi HP: halaman HP tanpa meta viewport ditata 980 px sehingga logo mengecil.
  const page = await browser.newPage({
    viewport: { width: 240, height: 240 },
    isMobile: false,
    hasTouch: false,
  });
  await page.setContent(
    `<body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="240" height="240">
      <rect width="240" height="240" rx="36" fill="#0b6e4f"/>
      <path d="M70 60h28v46h44V60h28v120h-28v-48H98v48H70z" fill="#fff"/></svg></body>`,
  );
  const png = await page.screenshot({ omitBackground: true });
  await page.close();
  return png;
}

async function openAbout(page: Page, name: string, text: string) {
  await page.getByRole('button', { name }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText(text);
  await expect(dialog.locator('svg[data-brand="symbol"]')).toBeVisible();
  // Gambar diambil setelah animasi buka dialog dan latar redupnya selesai.
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
  return dialog;
}

test.describe('T-501 Nama produk PanduArah — Visitor dan Info Point', () => {
  test('TC-BRD-01/05 venue tanpa logo memakai ikon PanduArah; beranda, Info Point, halaman tentang ID/EN', async ({
    page,
    browser,
    fullVenue,
    superAdmin,
  }) => {
    test.setTimeout(120_000);
    const venueId = fullVenue.venueId as Venue['id'];
    await superAdmin.publications.publish(venueId);

    // Beranda HP: belum ada venue, nama produk dan ikon PanduArah yang tampil.
    await page.goto('/');
    await expect(page).toHaveTitle('PanduArah');
    await expect(page.getByRole('heading', { name: 'PanduArah' })).toBeVisible();
    await expect(page.locator('body')).not.toContainText(LEGACY_NAME);
    await expect(page.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
      'href',
      '/icons/favicon.svg',
    );
    await page.screenshot({ path: shot('12-visitor-beranda-hp') });

    const desktop = await browser.newPage({ viewport: DESKTOP });
    await desktop.goto(`${env.visitorUrl}/`);
    await expect(defaultIcon(desktop)).toBeVisible();
    await expect(desktop.getByRole('heading', { name: 'PanduArah' })).toBeVisible();
    await desktop.screenshot({ path: shot('13-visitor-beranda-desktop') });

    // Venue tanpa logo: ikon bawaan PanduArah di samping nama venue; judul tab = nama venue.
    await new VisitorPage(desktop).goto(venueId);
    await expect(desktop.getByRole('heading', { name: fullVenue.name })).toBeVisible();
    await expect(defaultIcon(desktop)).toBeVisible();
    await expect(desktop).toHaveTitle(fullVenue.name);
    await expect(desktop.locator('body')).not.toContainText(LEGACY_NAME);
    await desktop.screenshot({ path: shot('14-venue-tanpa-logo-desktop') });

    const about = await openAbout(
      desktop,
      'Informasi peta',
      'Didukung oleh PanduArah — Indoor Navigation',
    );
    await desktop.screenshot({ path: shot('15-tentang-id') });
    await about.getByRole('button', { name: 'Tutup' }).first().click();
    await desktop.locator('button[lang="en"]').click();
    await openAbout(desktop, 'Map information', 'Powered by PanduArah — Indoor Navigation');
    await desktop.screenshot({ path: shot('16-tentang-en') });
    await desktop.close();

    // Info Point potret: venue tanpa logo juga memakai ikon PanduArah, tanpa "Indoor Map".
    const code = sql(
      `select code from public.info_points where id = '${fullVenue.ids.lobbyInfoPoint}'`,
    );
    const kiosk = await browser.newPage({
      viewport: { width: 1080, height: 1920 },
      hasTouch: true,
    });
    await kiosk.goto(`${env.visitorUrl}/ip/${code}?venue=${venueId}`);
    await expect(kiosk.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
      timeout: 30_000,
    });
    await expect(kiosk.locator('html')).toHaveAttribute('data-surface', 'info-point');
    await expect(kiosk.locator('aside svg[data-brand="symbol"]')).toBeVisible();
    await expect(kiosk.locator('body')).not.toContainText(LEGACY_NAME);
    await kiosk.screenshot({ path: shot('17-info-point-potret') });
    await kiosk.close();
  });

  test('TC-BRD-05 venue dengan logo: logo venue tetap utama di HP dan desktop', async ({
    page,
    browser,
    publishedVenue,
    superAdmin,
  }) => {
    const { venue } = publishedVenue;
    const logo = await renderVenueLogo(browser);
    await superAdmin.venues.uploadLogo(
      venue.id,
      new Blob([new Uint8Array(logo)], { type: 'image/png' }),
    );
    await superAdmin.publications.publish(venue.id);

    const visitor = new VisitorPage(page);
    await visitor.goto(venue.id);
    await expect(page.locator('header img')).toBeVisible();
    await expect(defaultIcon(page)).toHaveCount(0);
    await page.screenshot({ path: shot('18-venue-dengan-logo-hp') });

    const desktop = await browser.newPage({ viewport: DESKTOP });
    await new VisitorPage(desktop).goto(venue.id);
    await expect(desktop.locator('aside header img')).toHaveAttribute('src', /venues\/.*\/logo-/);
    await expect(defaultIcon(desktop)).toHaveCount(0);
    await openAbout(desktop, 'Informasi peta', 'Didukung oleh PanduArah');
    await desktop.screenshot({ path: shot('19-venue-dengan-logo-tentang') });
    await desktop.close();
  });

  test('TC-BRD-02 PWA: nama PanduArah, ikon 192/512/maskable/apple-touch tajam dan tidak terpotong', async ({
    browser,
  }) => {
    test.setTimeout(240_000);
    const outDir = mkdtempSync(join(tmpdir(), 'visitor-brand-'));
    const run = (args: string[]) =>
      spawn('pnpm', ['--filter', '@indoor/visitor', 'exec', 'vite', ...args], {
        cwd: repoRoot,
        stdio: 'ignore',
      });
    await new Promise<void>((resolve, reject) => {
      const build = run(['build', '--outDir', outDir, '--emptyOutDir']);
      build.on('exit', (code) => (code === 0 ? resolve() : reject(new Error(`build ${code}`))));
    });
    const port = 4175;
    const preview: ChildProcess = run([
      'preview',
      '--outDir',
      outDir,
      '--port',
      String(port),
      '--strictPort',
    ]);
    const page = await browser.newPage({ viewport: { width: 1100, height: 720 } });
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
      await page.goto(base);
      await expect(page).toHaveTitle('PanduArah');
      const manifestHref = (await page.locator('link[rel="manifest"]').getAttribute('href')) ?? '';
      const manifest = (await (await fetch(new URL(manifestHref, base))).json()) as {
        name: string;
        short_name: string;
        description: string;
        icons: { src: string; sizes: string; purpose?: string }[];
      };
      expect(manifest.name).toBe('PanduArah');
      expect(manifest.short_name).toBe('PanduArah');
      expect(manifest.description).toBe('PanduArah — Indoor Navigation');

      // Setiap ikon diperiksa di kanvas: ukuran sesuai manifest, simbol tidak menyentuh tepi,
      // ikon maskable berada di lingkaran aman 80%, apple-touch tidak transparan.
      const icons = [
        ...manifest.icons.map((icon) => ({ ...icon, purpose: icon.purpose ?? 'any' })),
        { src: '/icons/apple-touch-icon.png', sizes: '180x180', purpose: 'apple-touch' },
      ];
      const measured = await page.evaluate(async (list) => {
        const measure = async (icon: (typeof list)[number]) => {
          const image = new Image();
          image.src = icon.src;
          await image.decode();
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth;
          canvas.height = image.naturalHeight;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('canvas 2D tidak tersedia');
          context.drawImage(image, 0, 0);
          const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
          let edgeInk = 0;
          let transparent = 0;
          let farthest = 0;
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              const i = (y * width + x) * 4;
              const [r, g, b, a] = [
                data[i] ?? 0,
                data[i + 1] ?? 0,
                data[i + 2] ?? 0,
                data[i + 3] ?? 0,
              ];
              if (a < 255) transparent++;
              const ink = a > 32 && r + g + b < 690;
              if (!ink) continue;
              if (x === 0 || y === 0 || x === width - 1 || y === height - 1) edgeInk++;
              farthest = Math.max(farthest, Math.hypot(x + 0.5 - width / 2, y + 0.5 - height / 2));
            }
          }
          return {
            ...icon,
            size: `${width}x${height}`,
            edgeInk,
            transparent,
            radius: farthest / width,
          };
        };
        return Promise.all(list.map(measure));
      }, icons);
      expect(measured.map((icon) => icon.size)).toEqual(icons.map((icon) => icon.sizes));
      for (const icon of measured) expect(icon.edgeInk).toBe(0);
      const maskable = measured.find((icon) => icon.purpose === 'maskable');
      expect(maskable?.radius ?? 1).toBeLessThanOrEqual(0.4);
      expect(measured.find((icon) => icon.purpose === 'apple-touch')?.transparent).toBe(0);

      // Bukti: ikon pada ukuran aslinya, dipotong lingkaran seperti Android dan dibulatkan
      // seperti iOS, di atas latar layar beranda terang dan gelap.
      await page.setContent(`<!doctype html><body style="margin:0;font:14px system-ui">
        ${['#f2f3ef', '#111418']
          .map(
            (
              bg,
            ) => `<div style="display:flex;gap:32px;align-items:center;padding:24px;background:${bg};color:${bg === '#111418' ? '#fff' : '#111418'}">
            <figure style="margin:0"><img src="${base}/icons/icon-512.png" width="192" height="192"><figcaption>512 any</figcaption></figure>
            <figure style="margin:0"><img src="${base}/icons/icon-192.png" width="96" height="96"><figcaption>192 any</figcaption></figure>
            <figure style="margin:0"><img src="${base}/icons/icon-maskable-512.png" width="192" height="192" style="border-radius:50%"><figcaption>maskable (lingkaran)</figcaption></figure>
            <figure style="margin:0"><img src="${base}/icons/apple-touch-icon.png" width="120" height="120" style="border-radius:27px"><figcaption>apple-touch</figcaption></figure>
            <figure style="margin:0"><img src="${base}/icons/favicon.svg" width="32" height="32"><figcaption>favicon</figcaption></figure>
          </div>`,
          )
          .join('')}</body>`);
      await expect
        .poll(() =>
          page
            .locator('img')
            .evaluateAll((imgs) => imgs.every((img) => (img as HTMLImageElement).complete)),
        )
        .toBe(true);
      await page.screenshot({ path: shot('20-ikon-pwa'), fullPage: true });
    } finally {
      await page.close();
      preview.kill();
    }
  });
});
