import { defineConfig, devices } from '@playwright/test';

// Matriks kompatibilitas. Edge memakai mesin Chromium (Playwright tidak membawa Edge di Linux);
// Safari/iOS diwakili WebKit. Perangkat nyata dan versi lama dicatat di docs/laporan-performa.md.
const tls = { ignoreHTTPSErrors: true };

export default defineConfig({
  testDir: './specs',
  testMatch: /\.compat\.ts/,
  outputDir: './test-results',
  timeout: 120_000,
  workers: 2,
  reporter: [['list'], ['json', { outputFile: 'results/compat.json' }]],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        ...tls,
        launchOptions: { args: ['--ignore-certificate-errors'] },
      },
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        ...tls,
      },
    },
    { name: 'webkit', use: { ...devices['Desktop Safari'], ...tls } },
    {
      name: 'android',
      use: {
        ...devices['Pixel 7'],
        ...tls,
        launchOptions: { args: ['--ignore-certificate-errors'] },
      },
    },
    { name: 'iphone', use: { ...devices['iPhone 13'], ...tls } },
  ],
});
