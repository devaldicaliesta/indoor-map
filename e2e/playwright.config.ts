import { defineConfig, devices } from '@playwright/test';
import { env } from './env';

const CI = Boolean(process.env.CI);

// Landing page adalah situs vendor yang berdiri sendiri: bila hanya proyek landing yang
// dijalankan, server Admin dan Visitor tidak perlu dinyalakan.
const args = process.argv.slice(2);
const projectArgs = args.flatMap((arg, i) =>
  arg.startsWith('--project=') ? [arg.slice(10)] : arg === '--project' ? [args[i + 1] ?? ''] : [],
);
const onlyLanding = projectArgs.length > 0 && projectArgs.every((name) => name === 'landing');

const appServers = [
  {
    command: 'pnpm --filter @indoor/admin dev',
    url: env.adminUrl,
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
  {
    command: 'pnpm --filter @indoor/visitor dev',
    url: env.visitorUrl,
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
  {
    command: 'pnpm --filter @indoor/vendor dev',
    url: env.vendorUrl,
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
];

export default defineConfig({
  testDir: './tests',
  globalSetup: './global-setup.ts',
  fullyParallel: true,
  forbidOnly: CI,
  // Satu percobaan ulang di CI agar test yang tidak stabil tercatat "flaky" di laporan,
  // bukan disembunyikan: test itu tetap harus diperbaiki.
  retries: CI ? 1 : 0,
  workers: CI ? 1 : '50%',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: env.adminUrl,
    locale: 'id-ID',
    timezoneId: 'Asia/Jakarta',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      // Landing page vendor (T-505): desktop 1280 × 800; spec mengganti ke HP 360 px bila perlu.
      name: 'landing',
      testMatch: 'landing/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: env.landingUrl,
        viewport: { width: 1280, height: 800 },
        launchOptions: {
          args: [
            '--use-angle=swiftshader',
            '--enable-unsafe-swiftshader',
            '--ignore-gpu-blocklist',
          ],
        },
      },
    },
    {
      name: 'visitor',
      testMatch: 'visitor/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: env.visitorUrl,
        // HP terkecil yang didukung Visitor.
        viewport: { width: 360, height: 740 },
        isMobile: true,
        hasTouch: true,
        launchOptions: {
          args: [
            '--use-angle=swiftshader',
            '--enable-unsafe-swiftshader',
            '--ignore-gpu-blocklist',
          ],
        },
      },
    },
    {
      // Dasbor vendor trial ter-hosting (T-617): desktop, dipakai staf vendor.
      name: 'vendor',
      testMatch: 'vendor/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: env.vendorUrl,
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'admin',
      testMatch: 'admin/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        // Admin dirancang untuk layar ≥ 1280 px.
        viewport: { width: 1440, height: 900 },
        launchOptions: {
          // MapLibre butuh WebGL; tanpa GPU (CI, kontainer) Chromium memakai SwiftShader.
          args: [
            '--use-angle=swiftshader',
            '--enable-unsafe-swiftshader',
            '--ignore-gpu-blocklist',
          ],
        },
      },
    },
    {
      // Mengubah lisensi instalasi (berlaku untuk semua test), jadi berjalan setelah proyek lain,
      // satu berkas pada satu waktu (vendor-stub memakai port 8091).
      name: 'license',
      testMatch: 'license/**/*.spec.ts',
      dependencies: ['admin', 'visitor'],
      fullyParallel: false,
      workers: 1,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: [
    {
      // Landing diuji dari build produksi (seperti di hosting statis), bukan dev server: worker
      // MapLibre yang tidak ikut di-bundle hanya terlihat di build produksi.
      command:
        'pnpm --filter @indoor/landing build && pnpm --filter @indoor/landing preview --port 5175',
      url: env.landingUrl,
      reuseExistingServer: !CI,
      timeout: 120_000,
    },
    ...(onlyLanding ? [] : appServers),
  ],
});
