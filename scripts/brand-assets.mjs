// Membuat semua turunan logo PanduArah dari satu sumber, packages/ui/src/brand/panduarah-logo.svg
// (hasil jiplak vektor docs/brand/panduarah-logo.webp): SVG simbol dan varian putih, path untuk
// komponen React, favicon dan ikon PWA, serta PNG logo untuk email. PNG dirender dengan Chromium
// milik Playwright (paket e2e), jadi tidak ada dependency baru.
//
//   node scripts/brand-assets.mjs
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const brandDir = join(root, 'packages/ui/src/brand');
const source = readFileSync(join(brandDir, 'panduarah-logo.svg'), 'utf8');

const attr = (tag, name) => new RegExp(`\\s${name}="([^"]+)"`).exec(tag)?.[1] ?? '';
const viewBox = attr(/<svg[^>]*>/.exec(source)?.[0] ?? '', 'viewBox')
  .split(' ')
  .map(Number);
const symbolView = attr(/<view id="symbol"[^>]*>/.exec(source)?.[0] ?? '', 'viewBox')
  .split(' ')
  .map(Number);
const paths = Object.fromEntries(
  [...source.matchAll(/<path [^>]*>/g)].map(([tag]) => [
    attr(tag, 'id'),
    { fill: attr(tag, 'fill'), d: attr(tag, 'd') },
  ]),
);
const [, , width, height] = viewBox;
const symbolWidth = symbolView[2];
if (!width || !height || !symbolWidth || Object.keys(paths).length !== 3) {
  throw new Error('panduarah-logo.svg harus berisi viewBox, <view id="symbol"> dan tiga path.');
}

const SYMBOL_PARTS = ['symbol-blue', 'symbol-yellow'];
const WHITE = '#FFFFFF';

function svg(parts, viewWidth, fillOf) {
  const body = parts
    .map((id) => `  <path id="${id}" fill="${fillOf(id)}" fill-rule="evenodd" d="${paths[id].d}"/>`)
    .join('\n');
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${viewWidth}" height="${height}" viewBox="0 0 ${viewWidth} ${height}">`,
    '  <title>PanduArah</title>',
    body,
    '</svg>',
    '',
  ].join('\n');
}

const symbol = svg(SYMBOL_PARTS, symbolWidth, (id) => paths[id].fill);
const outputs = {
  'packages/ui/src/brand/panduarah-symbol.svg': symbol,
  'packages/ui/src/brand/panduarah-symbol-white.svg': svg(SYMBOL_PARTS, symbolWidth, () => WHITE),
  'packages/ui/src/brand/panduarah-logo-white.svg': svg(Object.keys(paths), width, () => WHITE),
  'apps/admin/public/favicon.svg': symbol,
  'apps/visitor/public/icons/favicon.svg': symbol,
  // Satu konstanta per bagian agar Visitor yang hanya memakai simbol tidak ikut memuat tulisan.
  // Warnanya ada di token --brand-* (tokens.css), bukan di sini.
  'packages/ui/src/brand/logo-paths.ts': [
    '// Dibuat scripts/brand-assets.mjs dari panduarah-logo.svg; jangan diubah manual.',
    `export const LOGO_WIDTH = ${width};`,
    `export const LOGO_HEIGHT = ${height};`,
    `export const SYMBOL_WIDTH = ${symbolWidth};`,
    '',
    ...Object.entries(paths).map(
      ([id, { d }]) => `export const ${id.toUpperCase().replace('-', '_')} =\n  '${d}';\n`,
    ),
  ].join('\n'),
};
for (const [file, content] of Object.entries(outputs)) {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), content);
  console.log(`tulis ${file}`);
}

// PNG: simbol di tengah kanvas persegi. `fill` = bagian sisi terpendek yang diisi simbol.
// Ikon maskable: simbol di dalam lingkaran aman 80% (diagonal simbol ≤ 0,8 sisi).
const maskableFill = 0.8 / Math.hypot(1, symbolWidth / height);
const pngs = [
  { file: 'apps/admin/public/favicon.png', size: 192, fill: 0.9 },
  { file: 'apps/visitor/public/icons/icon-192.png', size: 192, fill: 0.88 },
  { file: 'apps/visitor/public/icons/icon-512.png', size: 512, fill: 0.88 },
  {
    file: 'apps/visitor/public/icons/icon-maskable-512.png',
    size: 512,
    fill: maskableFill,
    background: WHITE,
  },
  // iOS membulatkan sudut ikon dan mengganti latar transparan dengan hitam.
  {
    file: 'apps/visitor/public/icons/apple-touch-icon.png',
    size: 180,
    fill: 0.72,
    background: WHITE,
  },
];

// Email: logo lengkap 2× ukuran tampil, latar putih agar tulisan hitam tetap terbaca di klien
// email bermode gelap.
const EMAIL_HEIGHT = 47;
const emailWidth = Math.round((EMAIL_HEIGHT * width) / height);

const require = createRequire(join(root, 'e2e/package.json'));
const { chromium } = require('@playwright/test');
const browser = await chromium.launch();
const page = await browser.newPage();

async function render(markup, w, h, background) {
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(
    `<!doctype html><body style="margin:0;background:${background ?? 'transparent'}">` +
      `<div style="display:grid;place-items:center;width:${w}px;height:${h}px">${markup}</div>`,
  );
  return page.screenshot({
    omitBackground: !background,
    clip: { x: 0, y: 0, width: w, height: h },
  });
}

const sized = (markup, w, h) =>
  markup.replace(/width="\d+" height="\d+"/, `width="${w}" height="${h}"`);

for (const icon of pngs) {
  const scale = Math.min(icon.size / symbolWidth, icon.size / height) * icon.fill;
  const markup = sized(symbol, symbolWidth * scale, height * scale);
  writeFileSync(join(root, icon.file), await render(markup, icon.size, icon.size, icon.background));
  console.log(`tulis ${icon.file}`);
}

const logo = readFileSync(join(brandDir, 'panduarah-logo.svg'), 'utf8');
const emailPng = await render(
  sized(logo, emailWidth * 2, EMAIL_HEIGHT * 2),
  emailWidth * 2,
  EMAIL_HEIGHT * 2,
  WHITE,
);
await browser.close();

writeFileSync(
  join(root, 'supabase/functions/_shared/brand-logo.ts'),
  [
    '// Dibuat scripts/brand-assets.mjs dari packages/ui/src/brand/panduarah-logo.svg; jangan diubah manual.',
    '',
    '/** Logo PanduArah untuk kepala email: PNG 2× berlatar putih, dikirim sebagai gambar inline. */',
    'export const BRAND_LOGO = {',
    "  cid: 'logo@panduarah',",
    "  filename: 'panduarah.png',",
    "  contentType: 'image/png',",
    `  width: ${emailWidth},`,
    `  height: ${EMAIL_HEIGHT},`,
    `  base64: '${emailPng.toString('base64')}',`,
    '} as const;',
    '',
  ].join('\n'),
);
console.log('tulis supabase/functions/_shared/brand-logo.ts');

// Berkas TypeScript hasil generate dirapikan dengan Biome agar `pnpm check` tetap hijau.
spawnSync(
  join(root, 'node_modules/.bin/biome'),
  [
    'format',
    '--write',
    'packages/ui/src/brand/logo-paths.ts',
    'supabase/functions/_shared/brand-logo.ts',
  ],
  { cwd: root, stdio: 'inherit' },
);
