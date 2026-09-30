import { createDataClient, type DataClient } from '@indoor/data';
import type { AppRole, Building, Floor, Polygon, Venue } from '@indoor/domain';
import { test as base, expect } from '@playwright/test';
import { ACCOUNTS } from './accounts';
import { env } from './env';
import { LoginPage } from './pages/login-page';

export interface TestVenue {
  venue: Venue;
  building: Building;
  floor: Floor;
}

/** Pusat footprint gedung uji; editor membuka lantai dengan pusat peta di sini. */
export const TEST_CENTER = [106.8272, -6.1754] as const;
const HALF = 0.0004;
const FOOTPRINT: Polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [TEST_CENTER[0] - HALF, TEST_CENTER[1] + HALF],
      [TEST_CENTER[0] + HALF, TEST_CENTER[1] + HALF],
      [TEST_CENTER[0] + HALF, TEST_CENTER[1] - HALF],
      [TEST_CENTER[0] - HALF, TEST_CENTER[1] - HALF],
      [TEST_CENTER[0] - HALF, TEST_CENTER[1] + HALF],
    ],
  ],
};

interface Fixtures {
  /** Klien data sebagai Super Admin untuk menyiapkan dan memeriksa data uji. */
  superAdmin: DataClient;
  /** Venue uji milik satu test (gedung UJI dengan lantai GF); dihapus setelah test selesai. */
  testVenue: TestVenue;
  /** Masuk ke Admin lewat halaman login sebagai role tertentu. */
  loginAs: (role: AppRole) => Promise<void>;
}

export const test = base.extend<Fixtures>({
  // biome-ignore lint/correctness/noEmptyPattern: Playwright membaca dependensi fixture dari destrukturisasi argumen pertama.
  superAdmin: async ({}, use) => {
    const data = createDataClient({ url: env.supabaseUrl, anonKey: env.anonKey });
    await data.auth.signIn(ACCOUNTS.super_admin.email, env.password);
    await use(data);
    await data.auth.signOut();
  },

  testVenue: async ({ superAdmin }, use, testInfo) => {
    const venue = await superAdmin.venues.create({
      name: `E2E ${testInfo.workerIndex}-${Date.now().toString(36)}`,
      address: null,
      center: { type: 'Point', coordinates: [...TEST_CENTER] },
      timezone: 'Asia/Jakarta',
    });
    try {
      const building = await superAdmin.buildings.create(venue.id, {
        name: 'Gedung Uji',
        code: 'UJI',
        footprint: FOOTPRINT,
      });
      const floor = await superAdmin.floors.create(building.id, {
        name: 'GF',
        level: 0,
        heightM: 4,
      });
      await use({ venue, building, floor });
    } finally {
      await superAdmin.venues.remove(venue.id);
    }
  },

  loginAs: async ({ page }, use) => {
    await use(async (role) => {
      const login = new LoginPage(page);
      await login.goto();
      await login.signIn(ACCOUNTS[role].email, env.password);
      await expect(page).not.toHaveURL(/\/login/);
    });
  },
});

export { expect };
