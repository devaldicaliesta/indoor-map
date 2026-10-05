import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  outputDir: './test-results',
  timeout: 600_000,
  workers: 1,
  reporter: [['list']],
  use: {
    // Instalasi uji memakai CA internal Caddy.
    ignoreHTTPSErrors: true,
    launchOptions: { args: ['--ignore-certificate-errors'] },
  },
  projects: [
    { name: 'seed', testMatch: /seed\.setup\.ts/ },
    { name: 'perf', testMatch: /\.perf\.ts/, use: { ...devices['Desktop Chrome'] } },
  ],
});
