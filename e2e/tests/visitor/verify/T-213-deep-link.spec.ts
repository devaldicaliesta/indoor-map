import { linkedMapView, type Venue } from '@indoor/domain';
import { expect, test } from '../../../fixtures';
import { VisitorPage } from '../../../pages/visitor-page';

const shot = (name: string) => `evidence/T-213/${name}.png`;

test.describe('T-213 Spesifikasi deep link', () => {
  test('lokasi + bahasa, rute + aksesibel, lantai, parameter rusak diabaikan', async ({
    page,
    fullVenue,
    superAdmin,
  }) => {
    const venueId = fullVenue.venueId as Venue['id'];
    await superAdmin.publications.publish(venueId);
    const snapshot = await superAdmin.snapshots.latestWithGraph(venueId);
    const location = (name: string) => {
      const found = snapshot.locations.find((l) => l.name === name);
      if (!found) throw new Error(`${name} tidak ada di snapshot`);
      return found.id;
    };
    const floorL1 = snapshot.floors.find((f) => f.name === 'L1' && f.buildingId);
    if (!floorL1) throw new Error('L1 tidak ada di snapshot');
    const visitor = new VisitorPage(page);
    const open = async (query: string) => {
      await page.goto(`/v/${venueId}?${query}`);
      await expect(visitor.map).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
    };

    // Lokasi + bahasa Inggris: profil terbuka, teks EN.
    await open(`loc=${location('Radiologi')}&lang=en`);
    await expect(visitor.profile).toContainText('Radiologi');
    await expect(visitor.profile.getByRole('button', { name: 'Directions to here' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.screenshot({ path: shot('01-lokasi-en') });

    // Rute titik → lokasi dengan mode aksesibel.
    const radiology = snapshot.locations.find((l) => l.name === 'Radiologi');
    const unitFloor = snapshot.features.features.find((f) => f.id === radiology?.primaryUnitId)
      ?.properties.floorId;
    const start = snapshot.graph.nodes.find((n) => n.floorId === unitFloor && n.role === 'path');
    if (!start) throw new Error('node jalur di lantai Radiologi tidak ada');
    const [lng, lat] = start.coordinates;
    await open(`from=${lng},${lat},${start.floorId}&to=${location('Radiologi')}&a11y=1`);
    const route = page.getByRole('region', { name: 'Rute' });
    await expect(route.getByRole('definition').first()).toHaveText('Titik di peta');
    await expect(route.getByRole('definition').nth(2)).toHaveText('Radiologi');
    await expect(route.getByRole('checkbox', { name: /Rute aksesibel/ })).toBeChecked();
    await expect(route.getByRole('list', { name: 'Langkah rute' })).toBeVisible();
    await page.screenshot({ path: shot('02-rute-aksesibel') });

    // Lokasi asal yang belum ada di peta: nama tetap tampil, alasan gagal disebut.
    await open(`from=${location('Laboratorium')}&to=${location('Radiologi')}`);
    await expect(route.getByRole('definition').first()).toHaveText('Laboratorium');
    await expect(route.getByRole('alert')).toContainText('Titik asal tidak terhubung');

    // Lantai.
    await open(`f=${floorL1.id}`);
    await expect(visitor.floors.getByRole('button', { name: 'L1', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.screenshot({ path: shot('03-lantai-l1') });

    // Gedung saja: lantai default gedung itu.
    const east = snapshot.buildings.find((b) => b.name === 'Gedung Timur');
    if (!east) throw new Error('Gedung Timur tidak ada di snapshot');
    await open(`b=${east.id}`);
    await expect(page.getByRole('combobox', { name: 'Gedung' })).toHaveText('Gedung Timur');
    // Gedung Timur satu lantai: pemilih lantai tidak tampil, lantai yang dibuka lantai gedung itu.
    expect(linkedMapView(snapshot, { buildingId: east.id })?.buildingId).toBe(east.id);
    await expect(visitor.floors.getByRole('button')).toHaveCount(0);

    // Parameter rusak dibuang satu per satu; sisanya tetap dipakai.
    await open(`loc=bukan-uuid&lang=xx&a11y=2&f=${floorL1.id}`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'id');
    await expect(visitor.search).toBeVisible();
    await expect(visitor.floors.getByRole('button', { name: 'L1', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.screenshot({ path: shot('04-parameter-rusak') });
  });
});
