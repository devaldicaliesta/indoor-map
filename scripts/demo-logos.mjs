// Logo venue demo (data contoh, bukan merek nyata) untuk `pnpm db:seed-demo`: lambang sederhana
// di kotak berwarna merek venue dan tulisan pendek, dirender ke PNG 512 × 512 dengan Chromium
// milik Playwright (paket e2e), jadi tidak ada dependency baru. Hasilnya di
// packages/data/test/seed/logos/ dan ikut di-commit agar seed tidak butuh browser.
//
//   node scripts/demo-logos.mjs
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'packages/data/test/seed/logos');
const font = readFileSync(
  join(root, 'packages/ui/src/fonts/ibm-plex-sans-latin-700-normal.woff2'),
).toString('base64');

/** Lambang 24 × 24 (garis putih), digambar di tengah kotak warna. */
const EMBLEMS = {
  mall: '<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
  hospital: '<path d="M10 4h4v6h6v4h-6v6h-4v-6H4v-4h6z"/>',
  campus: '<path d="M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5"/>',
  office: '<path d="M6 21V4h12v17M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-4h4v4"/>',
  airport:
    '<path d="M21 15l-8-4V5a1 1 0 0 0-2 0v6l-8 4v2l8-2v4l-2 1.5V22l3-1 3 1v-1.5L13 19v-4l8 2z"/>',
  factory: '<path d="M3 21V11l5 3v-3l5 3v-3l5 3V5h3v16zM7 18h2M12 18h2"/>',
};

const LOGOS = [
  { key: 'mall', emblem: EMBLEMS.mall, color: '#7b61c9', lines: ['MAL', 'SENTOSA'] },
  { key: 'hospital', emblem: EMBLEMS.hospital, color: '#c8321e', lines: ['RS', 'HARAPAN'] },
  { key: 'campus', emblem: EMBLEMS.campus, color: '#0f4a91', lines: ['KAMPUS', 'CENDEKIA'] },
  { key: 'office', emblem: EMBLEMS.office, color: '#1f6f8b', lines: ['MENARA', 'SINERGI'] },
  { key: 'airport', emblem: EMBLEMS.airport, color: '#0b7a75', lines: ['BANDARA', 'NUSANTARA'] },
  { key: 'factory', emblem: EMBLEMS.factory, color: '#b45f06', lines: ['INDUSTRI', 'PRIMA'] },
];

const SIZE = 512;

function markup({ emblem, color, lines }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}">
    <rect x="16" y="16" width="${SIZE - 32}" height="${SIZE - 32}" rx="96" fill="${color}"/>
    <g transform="translate(156 72) scale(8.33)" fill="none" stroke="#fff" stroke-width="1.8"
       stroke-linecap="round" stroke-linejoin="round">${emblem}</g>
    <g fill="#fff" font-family="Logo" font-weight="700" text-anchor="middle">
      <text x="${SIZE / 2}" y="350" font-size="64" letter-spacing="4">${lines[0]}</text>
      <text x="${SIZE / 2}" y="420" font-size="${lines[1].length > 8 ? 46 : 54}" letter-spacing="3"
        opacity="0.9">${lines[1]}</text>
    </g>
  </svg>`;
}

const require = createRequire(join(root, 'e2e/package.json'));
const { chromium } = require('@playwright/test');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: SIZE, height: SIZE } });
mkdirSync(out, { recursive: true });
for (const logo of LOGOS) {
  await page.setContent(
    `<!doctype html><style>@font-face{font-family:Logo;src:url(data:font/woff2;base64,${font})}` +
      `body{margin:0}</style><body>${markup(logo)}</body>`,
  );
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({
    omitBackground: true,
    clip: { x: 0, y: 0, width: SIZE, height: SIZE },
  });
  writeFileSync(join(out, `${logo.key}.png`), png);
  console.log(`tulis packages/data/test/seed/logos/${logo.key}.png`);
}
await browser.close();
