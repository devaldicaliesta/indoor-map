// Video motion graphic landing page (T-505): halaman animasi apps/landing/motion dibangun Vite,
// digambar per frame di Chromium Playwright (30 fps, deterministik, berulang mulus), lalu
// dikodekan ke WebM VP8 dengan ffmpeg bawaan Playwright. Tanpa server dev dan tanpa dependency
// baru. Hasil: apps/landing/public/media/panduarah-motion.webm + poster JPEG.
//
//   node scripts/landing-motion.mjs
import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(root, 'apps/landing/public/media');
const FPS = 30;
const DURATION_MS = 15_000;
const POSTER_MS = 10_800;
const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function ffmpegPath() {
  const base = join(
    process.env.LOCALAPPDATA ?? join(process.env.HOME ?? '', '.cache'),
    'ms-playwright',
  );
  const folder = existsSync(base) ? readdirSync(base).find((d) => d.startsWith('ffmpeg')) : null;
  if (!folder)
    throw new Error(
      'ffmpeg Playwright tidak ada: jalankan `pnpm --filter @indoor/e2e exec playwright install ffmpeg`.',
    );
  const exe = readdirSync(join(base, folder)).find((f) => f.startsWith('ffmpeg'));
  return join(base, folder, exe);
}

const build = mkdtempSync(join(tmpdir(), 'landing-motion-'));
const built = spawnSync(
  'pnpm',
  [
    '--filter',
    '@indoor/landing',
    'exec',
    'vite',
    'build',
    '--config',
    'vite.motion.config.ts',
    '--outDir',
    build,
    '--emptyOutDir',
  ],
  { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' },
);
if (built.status !== 0) throw new Error('Build halaman animasi gagal.');

const require = createRequire(join(root, 'e2e/package.json'));
const { chromium } = require('@playwright/test');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
// Berkas hasil build disajikan lewat route Playwright, jadi tidak perlu server.
await page.route('http://motion.local/**', (route) => {
  const path = new URL(route.request().url()).pathname.replace(/^\/+/, '') || 'index.html';
  const file = join(build, path.startsWith('motion/') ? path : path);
  if (!existsSync(file)) return route.fulfill({ status: 404 });
  return route.fulfill({
    body: readFileSync(file),
    contentType: TYPES[extname(file)] ?? 'application/octet-stream',
  });
});
await page.goto('http://motion.local/motion/index.html?record');
await page.waitForFunction(() => window.motionReady === true, null, { timeout: 30_000 });

// `MOTION_STILLS=4000,7000`: hanya menyimpan gambar diam pada waktu itu (untuk memeriksa adegan).
const stills = (process.env.MOTION_STILLS ?? '').split(',').filter(Boolean).map(Number);
if (stills.length) {
  for (const ms of stills) {
    await page.evaluate((at) => window.seekMotion(at), ms);
    await page.screenshot({
      path: join(tmpdir(), `panduarah-motion-${ms}.jpg`),
      type: 'jpeg',
      quality: 85,
    });
  }
  await browser.close();
  rmSync(build, { recursive: true, force: true });
  process.stdout.write(`Gambar diam di ${tmpdir()}
`);
  process.exit(0);
}

// ffmpeg Playwright tidak punya protokol pipe: frame JPEG disambung ke satu berkas lalu dibaca
// demuxer image2pipe.
const frameFile = join(build, 'frames.mjpeg');
const frames = Math.round((DURATION_MS / 1000) * FPS);
for (let i = 0; i < frames; i++) {
  await page.evaluate((ms) => window.seekMotion(ms), (i * 1000) / FPS);
  appendFileSync(frameFile, await page.screenshot({ type: 'jpeg', quality: 92 }));
}
const encoded = spawnSync(
  ffmpegPath(),
  [
    '-hide_banner',
    '-y',
    '-f',
    'image2pipe',
    '-framerate',
    String(FPS),
    '-c:v',
    'mjpeg',
    '-i',
    frameFile,
    '-c:v',
    'libvpx',
    '-b:v',
    '1600k',
    '-crf',
    '8',
    '-auto-alt-ref',
    '0',
    '-deadline',
    'good',
    '-pix_fmt',
    'yuv420p',
    join(OUT, 'panduarah-motion.webm'),
  ],
  { stdio: 'inherit' },
);
if (encoded.status !== 0) throw new Error(`ffmpeg gagal (${encoded.status}).`);

await page.evaluate((ms) => window.seekMotion(ms), POSTER_MS);
await page.screenshot({
  path: join(OUT, 'panduarah-motion-poster.jpg'),
  type: 'jpeg',
  quality: 80,
});
await browser.close();
rmSync(build, { recursive: true, force: true });
process.stdout.write(`Video ${frames} frame ditulis ke ${OUT}\n`);
