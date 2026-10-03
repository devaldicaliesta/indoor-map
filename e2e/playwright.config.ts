import { defineConfig, devices } from '@playwright/test';
import { env } from './env';

const CI = Boolean(process.env.CI);

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
      // Mengubah lisensi instalasi (berlaku untuk semua test), jadi berjalan setelah proyek lain.
      name: 'license',
      testMatch: 'license/**/*.spec.ts',
      dependencies: ['admin', 'visitor'],
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: [
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
  ],
});
