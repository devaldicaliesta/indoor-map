import { createDataClient, type DataClient } from '@indoor/data';
import { insertVenue, signedInDb } from '@indoor/data/testing/full-venue';
import type { SnapshotSource, Venue } from '@indoor/domain';
import {
  campusVenue,
  hospitalVenue,
  mallVenue,
} from '@indoor/domain/fixtures/demo-venues/index.ts';
import { expect, type Page, test } from '@playwright/test';
import { ACCOUNTS } from '../../../accounts';
import { env } from '../../../env';
import { VisitorPage } from '../../../pages/visitor-page';

const shot = (name: string) => `evidence/T-320/${name}.png`;

interface Demo {
  id: Venue['id'];
  name: string;
  location: (name: string) => string;
}

const centerOf = (source: SnapshotSource): [number, number] => {
  const ring = source.buildings[0]?.footprint?.coordinates[0] ?? [];
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
};

test.describe
  .serial('T-320 Validasi tampilan dengan data kaya', () => {
    const demos: Record<'mall' | 'hospital' | 'campus', Demo> = {} as never;
    let data: DataClient;

    test.beforeAll(async () => {
      test.setTimeout(240_000);
      const credentials = { email: ACCOUNTS.super_admin.email, password: env.password };
      const db = await signedInDb(env.supabaseUrl, env.anonKey, credentials);
      data = createDataClient({ url: env.supabaseUrl, anonKey: env.anonKey });
      await data.auth.signIn(credentials.email, credentials.password);
      const suffix = Date.now().toString(36);
      for (const [key, make] of [
        ['mall', mallVenue],
        ['hospital', hospitalVenue],
        ['campus', campusVenue],
      ] as const) {
        const source = make();
        const name = `${source.venue.name} ${suffix}`;
        const inserted = await insertVenue(db, name, source, centerOf(source));
        const id = inserted.venueId as Venue['id'];
        await data.publications.publish(id);
        // Nama yang berulang di beberapa lantai: yang pertama (lantai terendah) dipakai.
      const byName = new Map<string, string>();
      for (const l of source.locations) {
        if (!byName.has(l.name)) byName.set(l.name, inserted.remap(l.id));
      }
        demos[key] = {
          id,
          name,
          location: (n) => {
            const found = byName.get(n);
            if (!found) throw new Error(`lokasi ${n} tidak ada`);
            return found;
          },
        };
      }
    });

    test.afterAll(async () => {
      for (const demo of Object.values(demos)) await data.venues.remove(demo.id);
    });

    async function open(page: Page, demo: Demo, query = '') {
      await page.goto(`/v/${demo.id}${query}`);
      await expect(page.getByTestId('venue-map')).toHaveAttribute('data-ready', 'true', {
        timeout: 30_000,
      });
      await expect(page.getByTestId('venue-map')).toHaveAttribute('data-camera', 'idle');
    }

    test('mal: cari, ganti lantai, rute GF → L2 lewat konektor, 2D dan 3D di HP', async ({
      page,
    }) => {
      const mall = demos.mall;
      const visitor = new VisitorPage(page);
      await open(page, mall);
      await page.screenshot({ path: shot('mal-01-hp-2d') });
      await visitor.search.fill('kopi');
      await expect(visitor.results.filter({ hasText: 'Kopi Kenangan Pagi' }).first()).toBeVisible();
      await visitor.clearSearch.click();
      await visitor.floors.getByRole('button', { name: 'L2', exact: true }).click();
      await expect(visitor.floors.getByRole('button', { name: 'L2', exact: true })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await page.getByRole('button', { name: '3D', exact: true }).click();
      await expect(page.getByTestId('venue-map')).toHaveAttribute('data-camera', 'idle');
      await page.screenshot({ path: shot('mal-02-hp-3d-l2') });

      await open(
        page,
        mall,
        `?from=${mall.location('Sepatu Jaya')}&to=${mall.location('Dapur Peranakan L2')}`,
      );
      const route = page.getByRole('region', { name: 'Rute' });
      const steps = route.getByRole('list', { name: 'Langkah rute' }).getByRole('listitem');
      await expect(steps.last()).toContainText('Dapur Peranakan L2');
      expect((await steps.allTextContents()).join(' | ')).toMatch(/(lift|eskalator).*L2|L1.*L2/i);
      await page.screenshot({ path: shot('mal-03-hp-rute') });
    });

    test('mal di desktop: legenda kategori, 3D, rute', async ({ browser }) => {
      const mall = demos.mall;
      const page = await browser.newPage({
        baseURL: env.visitorUrl,
        viewport: { width: 1440, height: 900 },
      });
      await open(page, mall);
      const chips = page.getByRole('navigation', { name: 'Kategori dan fasilitas' });
      await expect(chips.getByRole('button', { name: 'Restoran', exact: true })).toBeVisible();
      await page.screenshot({ path: shot('mal-04-desktop-2d') });
      await page.getByRole('button', { name: '3D', exact: true }).click();
      await expect(page.getByTestId('venue-map')).toHaveAttribute('data-camera', 'idle');
      await page.screenshot({ path: shot('mal-05-desktop-3d') });
      await page.close();
    });

    test('rumah sakit: alias rontgen, IGD 24 jam, rute kursi roda ke L3 lewat lift', async ({
      page,
    }) => {
      const rs = demos.hospital;
      const visitor = new VisitorPage(page);
      await open(page, rs);
      await visitor.search.fill('rontgen');
      await expect(visitor.results.filter({ hasText: 'Radiologi' }).first()).toBeVisible();
      await visitor.search.fill('IGD');
      await expect(visitor.results.filter({ hasText: 'IGD' }).first()).toContainText('Buka 24 jam');
      await page.screenshot({ path: shot('rs-01-hp-cari') });

      const ward = 'Kamar Rawat L3-B01'.replace('L3-B01', 'B01');
      void ward;
      const target = (await data.locations.list(rs.id)).find(
        (l) => l.name.startsWith('Kamar Rawat') && l.code?.includes('-L3-'),
      );
      if (!target) throw new Error('kamar rawat L3 tidak ada');
      await open(page, rs, `?from=${rs.location('IGD')}&to=${target.id}&a11y=1`);
      const route = page.getByRole('region', { name: 'Rute' });
      await expect(route.getByRole('checkbox', { name: /Rute aksesibel/ })).toBeChecked();
      const text = (
        await route
          .getByRole('list', { name: 'Langkah rute' })
          .getByRole('listitem')
          .allTextContents()
      ).join(' | ');
      expect(text).toMatch(/lift/i);
      expect(text).not.toMatch(/tangga/i);
      await page.screenshot({ path: shot('rs-02-hp-rute-kursi-roda') });
    });

    test('kampus: rute antar gedung lewat Area Luar', async ({ page }) => {
      const campus = demos.campus;
      await open(
        page,
        campus,
        `?from=${campus.location('Ruang Dosen 101')}&to=${campus.location('Kantin A')}`,
      );
      const route = page.getByRole('region', { name: 'Rute' });
      const text = (
        await route
          .getByRole('list', { name: 'Langkah rute' })
          .getByRole('listitem')
          .allTextContents()
      ).join(' | ');
      expect(text).toMatch(/Keluar dari Gedung Rektorat[\s\S]*Masuk ke Gedung Kuliah Bersama/);
      await page.screenshot({ path: shot('kampus-01-hp-rute-antar-gedung') });
    });
  });
