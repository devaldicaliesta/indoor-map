import { createDataClient, type DataClient } from '@indoor/data';
import { insertVenue, signedInDb } from '@indoor/data/testing/full-venue';
import type { Venue } from '@indoor/domain';
import { concertVenue } from '@indoor/domain/fixtures/demo-venues/index.ts';
import { expect, type Page, test } from '@playwright/test';
import { ACCOUNTS } from '../../../accounts';
import { env } from '../../../env';

const shot = (name: string) => `evidence/T-321/${name}.png`;

/**
 * Orang mini (ilustrasi keramaian) di peta Visitor: tampil bawaan, bergerak, bisa dimatikan,
 * dan diam saat pengguna meminta gerak dikurangi.
 */
test.describe
  .serial('T-321 Orang mini di peta', () => {
    let data: DataClient;
    let venueId: Venue['id'];

    test.beforeAll(async () => {
      test.setTimeout(240_000);
      const credentials = { email: ACCOUNTS.super_admin.email, password: env.password };
      const db = await signedInDb(env.supabaseUrl, env.anonKey, credentials);
      data = createDataClient({ url: env.supabaseUrl, anonKey: env.anonKey });
      await data.auth.signIn(credentials.email, credentials.password);
      const source = concertVenue();
      const ring = source.buildings[0]?.footprint?.coordinates[0] ?? [];
      const xs = ring.map((p) => p[0]);
      const ys = ring.map((p) => p[1]);
      const center: [number, number] = [
        (Math.min(...xs) + Math.max(...xs)) / 2,
        (Math.min(...ys) + Math.max(...ys)) / 2,
      ];
      const name = `${source.venue.name} ${Date.now().toString(36)}`;
      const inserted = await insertVenue(db, name, source, center);
      venueId = inserted.venueId as Venue['id'];
      await data.publications.publish(venueId);
    });

    test.afterAll(async () => {
      if (venueId) await data.venues.remove(venueId);
    });

    async function open(page: Page) {
      await page.goto(`/v/${venueId}`);
      const map = page.getByTestId('venue-map');
      await expect(map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
      // Dekatkan ke zoom ruang agar orang terlihat.
      await page.getByRole('button', { name: 'Perbesar' }).click();
      await expect(map).toHaveAttribute('data-camera', 'idle');
    }

    /** Dua gambar kanvas berjarak `ms` saat kamera diam. */
    async function twoFrames(page: Page, ms = 1500) {
      const canvas = page.locator('[data-testid="venue-map"] canvas').first();
      await expect(page.getByTestId('venue-map')).toHaveAttribute('data-camera', 'idle');
      // Graf jalur dimuat terpisah; beri waktu orang muncul dan label selesai memudar.
      await page.waitForTimeout(2500);
      const first = await canvas.screenshot();
      await page.waitForTimeout(ms);
      return [first, await canvas.screenshot()] as const;
    }

    test('tampil bawaan dan bergerak; tombol mematikan dan menyalakan lagi (2D dan 3D)', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await open(page);
      const toggle = page.getByRole('button', { name: /Ilustrasi orang di peta/ });
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByTestId('venue-map')).toHaveAttribute('data-people', 'on');
      const [a, b] = await twoFrames(page);
      expect(a.equals(b), 'orang berjalan: gambar berubah tanpa kamera bergerak').toBe(false);
      await page.screenshot({ path: shot('01-orang-mini-2d') });

      await page.getByRole('button', { name: '3D', exact: true }).click();
      const [c, d] = await twoFrames(page);
      expect(c.equals(d)).toBe(false);
      await page.screenshot({ path: shot('02-orang-mini-3d') });
      await page.getByRole('button', { name: '2D', exact: true }).click();

      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-pressed', 'false');
      await expect(page.getByTestId('venue-map')).toHaveAttribute('data-people', 'off');
      const [e, f] = await twoFrames(page);
      expect(e.equals(f), 'tanpa orang peta diam').toBe(true);
      await page.screenshot({ path: shot('03-orang-dimatikan') });

      await toggle.click();
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      const [g, h] = await twoFrames(page);
      expect(g.equals(h)).toBe(false);
      expect(g.equals(f), 'orang tampil lagi').toBe(false);
    });

    test('gerak dikurangi: orang tetap tampil tetapi diam; label tombol dwibahasa', async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 390, height: 844 });
      await open(page);
      const toggle = page.getByRole('button', { name: /Ilustrasi orang di peta/ });
      await expect(toggle).toHaveAttribute('aria-pressed', 'true');
      const [a, b] = await twoFrames(page);
      expect(a.equals(b), 'orang diam saat prefers-reduced-motion').toBe(true);
      await toggle.click();
      const [off] = await twoFrames(page, 0);
      expect(off.equals(a), 'orang yang diam tetap digambar').toBe(false);
      await page.screenshot({ path: shot('04-hp-gerak-dikurangi') });

      await page.goto(`/v/${venueId}?lang=en`);
      await expect(
        page.getByRole('button', { name: /People illustration on the map/ }),
      ).toBeVisible();
      const box = await page.getByRole('button', { name: /People illustration/ }).boundingBox();
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
    });
  });
