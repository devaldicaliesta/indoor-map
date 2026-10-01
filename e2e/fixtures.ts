import { createDataClient, type DataClient } from '@indoor/data';
import {
  type AppRole,
  type Building,
  FeatureIdSchema,
  type Floor,
  type Polygon,
  type Venue,
} from '@indoor/domain';
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

/** Persegi unit di sebelah barat (dx < 0) atau timur (dx > 0) pusat gedung uji, ±22 × 22 m. */
function unitSquare(dx: number): Polygon {
  const [x, y] = [TEST_CENTER[0] + dx, TEST_CENTER[1]];
  const h = 0.0001;
  return {
    type: 'Polygon',
    coordinates: [
      [
        [x - h, y + h],
        [x + h, y + h],
        [x + h, y - h],
        [x - h, y - h],
        [x - h, y + h],
      ],
    ],
  };
}

export interface PublishedVenue extends TestVenue {
  /** Unit UJI-GF-001, ditempati lokasi Radiologi (RAD-01) berkategori Pemeriksaan. */
  radiologyUnitId: string;
  /** Unit UJI-GF-002 tanpa lokasi. */
  vacantUnitId: string;
}

interface Fixtures {
  /** Klien data sebagai Super Admin untuk menyiapkan dan memeriksa data uji. */
  superAdmin: DataClient;
  /** Venue uji milik satu test (gedung UJI dengan lantai GF); dihapus setelah test selesai. */
  testVenue: TestVenue;
  /** Venue uji dengan dua unit dan satu lokasi yang sudah diterbitkan untuk Visitor. */
  publishedVenue: PublishedVenue;
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

  publishedVenue: async ({ superAdmin, testVenue }, use) => {
    const { venue, floor } = testVenue;
    const unit = (id: string, code: string, dx: number) =>
      superAdmin.features.save(venue.id, {
        type: 'Feature',
        id,
        geometry: unitSquare(dx),
        properties: { id, kind: 'unit', floorId: floor.id, unitCode: code, unitStatus: 'occupied' },
      });
    const radiologyUnitId = FeatureIdSchema.parse(crypto.randomUUID());
    const vacantUnitId = FeatureIdSchema.parse(crypto.randomUUID());
    await unit(radiologyUnitId, 'UJI-GF-001', -0.0001);
    await unit(vacantUnitId, 'UJI-GF-002', 0.0001);
    const [type] = await superAdmin.categories.listTypes(venue.id);
    if (!type) throw new Error('Venue uji tidak punya tipe lokasi bawaan.');
    const category = await superAdmin.categories.create(venue.id, type.id, {
      name: 'Pemeriksaan',
      icon: null,
      sortOrder: 0,
    });
    await superAdmin.locations.save(
      venue.id,
      type.id,
      null,
      {
        code: 'RAD-01',
        name: 'Radiologi',
        description: 'Rontgen dan CT scan.',
        categoryIds: [category.id],
        unitIds: [radiologyUnitId],
        primaryUnitId: radiologyUnitId,
      },
      { keepPhotoPaths: [], newPhotos: [] },
    );
    await superAdmin.publications.publish(venue.id);
    await use({ ...testVenue, radiologyUnitId, vacantUnitId });
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
