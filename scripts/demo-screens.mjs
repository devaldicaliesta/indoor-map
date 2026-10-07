// Tangkapan layar data demo (`pnpm db:seed-demo`) untuk bahan video dan motion graphic: layar
// Admin dan Visitor pada resolusi video (bawaan 1920 × 1080; `DEMO_SCALE=2` untuk 3840 × 2160).
// Butuh Supabase lokal berisi data demo dan `pnpm dev` (Admin :5173, Visitor :5174). Chromium
// dari Playwright paket e2e, jadi tidak ada dependency baru. Hasil di e2e/evidence/demo-data/.
//
//   node scripts/demo-screens.mjs
import { existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = join(root, '.env.local');
if (existsSync(envFile)) process.loadEnvFile(envFile);
const API = process.env.VITE_SUPABASE_URL;
const ANON = process.env.VITE_SUPABASE_ANON_KEY;
const PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const ADMIN = process.env.E2E_ADMIN_URL ?? 'http://localhost:5173';
const VISITOR = process.env.E2E_VISITOR_URL ?? 'http://localhost:5174';
const EMAIL = 'admin@local.test';
const SCALE = Number(process.env.DEMO_SCALE ?? 1);
const OUT = join(root, 'e2e/evidence/demo-data');

async function token() {
  const response = await fetch(`${API}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!response.ok) throw new Error(`Masuk Super Admin gagal: ${response.status}`);
  return (await response.json()).access_token;
}

const jwt = await token();
async function rest(path) {
  const response = await fetch(`${API}/rest/v1/${path}`, {
    headers: { apikey: ANON, Authorization: `Bearer ${jwt}` },
  });
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

const venues = Object.fromEntries(
  (await rest('venues?select=id,name&name=like.*Demo*')).map((v) => [v.name, v.id]),
);
const venueId = (name) => {
  const id = venues[name];
  if (!id) throw new Error(`${name} belum ada; jalankan pnpm db:seed-demo`);
  return id;
};
/** Lokasi pertama (urut nama) yang namanya diawali teks itu. */
async function locationId(venue, prefix) {
  const [row] = await rest(
    `locations?select=id&venue_id=eq.${venueId(venue)}&name=like.${encodeURIComponent(`${prefix}*`)}&order=name&limit=1`,
  );
  if (!row) throw new Error(`lokasi "${prefix}" tidak ada di ${venue}`);
  return row.id;
}

const require = createRequire(join(root, 'e2e/package.json'));
const { chromium } = require('@playwright/test');
const browser = await chromium.launch();
mkdirSync(OUT, { recursive: true });

async function settle(page) {
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await page
    .locator('[data-slot="skeleton"]')
    .first()
    .waitFor({ state: 'detached', timeout: 15_000 })
    .catch(() => undefined);
  // Peta MapLibre butuh beberapa bingkai setelah data tiba (kamera, 3D, label).
  if (await page.locator('.maplibregl-canvas').count()) await page.waitForTimeout(3500);
  else await page.waitForTimeout(600);
}

async function shoot(page, name) {
  await settle(page);
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  console.log(`tulis e2e/evidence/demo-data/${name}.png`);
}

// --- Admin (Super Admin, 1920 × 1080) --------------------------------------------------------
const admin = await browser.newPage({
  baseURL: ADMIN,
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: SCALE,
  locale: 'id-ID',
  timezoneId: 'Asia/Jakarta',
});
await admin.goto('/login');
await admin.getByLabel('Email').fill(EMAIL);
await admin.getByLabel('Password').fill(PASSWORD);
await admin.getByRole('button', { name: 'Masuk' }).click();
await admin.waitForURL((url) => !url.pathname.startsWith('/login'));

async function selectVenue(name) {
  await admin.getByRole('combobox', { name: 'Venue aktif' }).click();
  await admin.getByRole('option', { name, exact: true }).click();
}

await admin.goto('/venues?tab=venues');
await shoot(admin, 'a01-admin-semua-venue');
await selectVenue('Bandara Demo Nusantara');
await admin.goto('/venues');
await shoot(admin, 'a02-admin-gedung-bandara');
await admin.goto('/locations');
await shoot(admin, 'a03-admin-lokasi-bandara');
await admin.goto('/origin-points?tab=info-points');
await shoot(admin, 'a04-admin-info-point-bandara');
await selectVenue('RS Demo Harapan');
await admin.goto('/locations?status=active&size=50');
await shoot(admin, 'a05-admin-lokasi-rumah-sakit');
await admin.goto('/closures');
await shoot(admin, 'a06-admin-penutupan-rumah-sakit');
await selectVenue('Mal Demo Sentosa');
await admin.goto('/publish');
await shoot(admin, 'a07-admin-publish-mal');
await admin.goto('/locations?tab=types');
await shoot(admin, 'a08-admin-tipe-lokasi-mal');
await selectVenue('Menara Demo Sinergi');
await admin.goto('/map-editor');
await shoot(admin, 'a09-admin-editor-menara');
await admin.goto('/users');
await shoot(admin, 'a10-admin-pengguna');
await admin.goto('/settings?tab=audit');
await shoot(admin, 'a11-admin-log-audit');
await admin.close();

// --- Visitor desktop (1920 × 1080) ----------------------------------------------------------
const desktop = await browser.newPage({
  baseURL: VISITOR,
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: SCALE,
  locale: 'id-ID',
});
const VISITS = [
  ['v01-visitor-mal', 'Mal Demo Sentosa'],
  ['v02-visitor-rumah-sakit', 'RS Demo Harapan'],
  ['v03-visitor-kampus', 'Kampus Demo Cendekia'],
  ['v04-visitor-perkantoran', 'Menara Demo Sinergi'],
  ['v05-visitor-bandara', 'Bandara Demo Nusantara'],
  ['v06-visitor-pabrik', 'Kawasan Demo Industri Prima'],
];
for (const [file, venue] of VISITS) {
  await desktop.goto(`/v/${venueId(venue)}`);
  await shoot(desktop, file);
}
const ROUTES = [
  ['v07-rute-bandara-checkin-ke-gerbang', 'Bandara Demo Nusantara', 'Konter', 'Gerbang I'],
  ['v08-rute-rumah-sakit-pendaftaran-ke-radiologi', 'RS Demo Harapan', 'Pendaftaran', 'Radiologi'],
  ['v09-rute-mal-antar-lantai', 'Mal Demo Sentosa', 'Sepatu Jaya', 'Dapur Peranakan'],
];
for (const [file, venue, from, to] of ROUTES) {
  const query = `from=${await locationId(venue, from)}&to=${await locationId(venue, to)}`;
  await desktop.goto(`/v/${venueId(venue)}?${query}`);
  await shoot(desktop, file);
}
await desktop.close();

// --- Visitor HP (390 × 844) dan Info Point potret (1080 × 1920) ------------------------------
const phone = await browser.newPage({
  baseURL: VISITOR,
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: Math.max(2, SCALE),
  isMobile: true,
  hasTouch: true,
  locale: 'id-ID',
});
await phone.goto(`/v/${venueId('Mal Demo Sentosa')}`);
await shoot(phone, 'm01-hp-mal');
await phone.goto(`/v/${venueId('Kawasan Demo Industri Prima')}`);
await shoot(phone, 'm02-hp-pabrik');
await phone.close();

const kiosk = await browser.newPage({
  baseURL: VISITOR,
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: SCALE,
  locale: 'id-ID',
});
// Kode Info Point diberi akhiran id venue saat data demo dimasukkan (kode unik antar-venue).
const [infoPoint] = await rest(
  `info_points?select=code&venue_id=eq.${venueId('Bandara Demo Nusantara')}&code=like.BDR-BERANGKAT*`,
);
await kiosk.goto(`/ip/${infoPoint.code}?venue=${venueId('Bandara Demo Nusantara')}`);
await shoot(kiosk, 'k01-info-point-bandara');
await kiosk.close();
await browser.close();
