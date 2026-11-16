import { signedInDb } from '@indoor/data/testing/full-venue';
import { MODEL_LIBRARY } from '@indoor/domain';
import { expect, test } from '@playwright/test';
import { perfEnv } from '../env';
import { dragFps, median, record, seeded } from '../support';

const OBJECTS = 200;

test.use({ viewport: { width: 1440, height: 900 } });

test('200 objek 3D menurunkan FPS editor 3D paling banyak 20%', async ({ page }) => {
  const venue = seeded();
  const db = await signedInDb(perfEnv.apiUrl, perfEnv.anonKey, perfEnv);
  const found = await db.from('venues').select('id').eq('name', venue.denseVenueName).single();
  if (found.error) throw new Error(found.error.message);
  const venueId = found.data.id;
  const busiest = await db
    .from('features')
    .select('floor_id')
    .eq('venue_id', venueId)
    .eq('kind', 'unit')
    .limit(1)
    .single();
  if (busiest.error) throw new Error(busiest.error.message);
  const floorId = busiest.data.floor_id;
  await db.from('features').delete().eq('venue_id', venueId).eq('kind', 'model3d');

  await page.goto(`${perfEnv.adminUrl}/login`);
  await page.getByLabel('Email').fill(perfEnv.email);
  await page.getByLabel('Password').fill(perfEnv.password);
  await page.getByRole('button', { name: 'Masuk' }).click();
  await page.getByRole('combobox', { name: 'Venue aktif' }).click();
  await page.getByRole('option', { name: venue.denseVenueName, exact: true }).click();

  const canvas = page.getByTestId('editor-map');
  async function measure3d(): Promise<number[]> {
    await page.goto(`${perfEnv.adminUrl}/map-editor`);
    await expect(canvas).toHaveAttribute('data-ready', 'true', { timeout: 60_000 });
    await page.getByRole('button', { name: '3D', exact: true }).click();
    await page.waitForTimeout(2_000);
    const runs: number[] = [];
    for (let run = 0; run < 3; run++) runs.push(await dragFps(page, canvas));
    return runs;
  }

  const without = await measure3d();

  const units = await db
    .from('features')
    .select('geom')
    .eq('floor_id', floorId)
    .eq('kind', 'unit')
    .limit(OBJECTS);
  if (units.error) throw new Error(units.error.message);
  const rows = units.data.map((unit, index) => {
    const ring = (unit.geom as { coordinates: number[][][] }).coordinates[0] ?? [];
    const [lng = 0, lat = 0] = ring[0] ?? [];
    return {
      venue_id: venueId,
      floor_id: floorId,
      kind: 'model3d' as const,
      geom: { type: 'Point', coordinates: [lng, lat] },
      props: {
        model: `builtin:${MODEL_LIBRARY[index % MODEL_LIBRARY.length]}`,
        modelRotation: (index * 37) % 360,
      },
    };
  });
  const inserted = await db.from('features').insert(rows as never);
  if (inserted.error) throw new Error(inserted.error.message);

  const withModels = await measure3d();
  await expect(canvas).toHaveAttribute('data-models', String(rows.length));
  await page.screenshot({ path: 'results/editor-models-200.png' });
  await db.from('features').delete().eq('venue_id', venueId).eq('kind', 'model3d');

  const ratio = median(withModels) / median(without);
  record('editor-models', {
    objects: rows.length,
    withoutFps: without,
    withoutMedian: median(without),
    withModelsFps: withModels,
    withModelsMedian: median(withModels),
    ratio,
  });
  expect(ratio).toBeGreaterThanOrEqual(0.8);
});
