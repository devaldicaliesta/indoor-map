import { writeFileSync } from 'node:fs';
import { createDataClient } from '@indoor/data';
import { createFullVenue, insertVenue, signedInDb } from '@indoor/data/testing/full-venue';
import type { Venue } from '@indoor/domain';
import { expect, test } from '@playwright/test';
import { perfEnv } from '../env';
import { DENSE_FLOOR, LARGE, largeVenueSource } from '../src/large-venue';

const PREFIX = 'Perf ';

test('isi venue besar dan lantai padat lalu publish', async () => {
  const db = await signedInDb(perfEnv.apiUrl, perfEnv.anonKey, perfEnv);
  // Venue dari seed sebelumnya dihapus agar kuota lisensi tidak habis.
  const old = await db.from('venues').select('id').like('name', `${PREFIX}%`);
  if (old.error) throw new Error(old.error.message);
  for (const { id } of old.data) {
    const removed = await db.from('venues').delete().eq('id', id);
    if (removed.error) throw new Error(removed.error.message);
  }
  const data = createDataClient({ url: perfEnv.apiUrl, anonKey: perfEnv.anonKey });
  await data.auth.signIn(perfEnv.email, perfEnv.password);
  const tag = Date.now().toString(36);

  const source = largeVenueSource(LARGE);
  const started = Date.now();
  const large = await insertVenue(db, `${PREFIX}Venue Besar ${tag}`, source, [106.8207, -6.1807]);
  const insertedMs = Date.now() - started;
  const publishStarted = Date.now();
  const published = await data.publications.publish(large.venueId as Venue['id']);
  const publishMs = Date.now() - publishStarted;
  expect(published.version).toBeGreaterThan(0);
  // Kode QR titik asal diturunkan saat publish, jadi dibaca dari snapshot yang terbit.
  const latest = await fetch(
    `${perfEnv.apiUrl}/storage/v1/object/public/snapshots/${large.venueId}/latest.json`,
  );
  const latestText = await latest.text();
  const snapshot = JSON.parse(latestText) as { originPoints: { code: string }[] };

  const denseName = `${PREFIX}Lantai Padat ${tag}`;
  const dense = await insertVenue(
    db,
    denseName,
    largeVenueSource(DENSE_FLOOR),
    [106.8207, -6.1807],
  );
  // Lantai kosong di gedung yang sama: pembanding FPS di mesin yang sama (tanpa GPU = SwiftShader).
  const building = dense.remap(largeVenueSource(DENSE_FLOOR).buildings[0]?.id ?? '');
  const empty = await db
    .from('floors')
    .insert({ venue_id: dense.venueId, building_id: building, name: 'L1', level: 1, height_m: 4 });
  if (empty.error) throw new Error(empty.error.message);

  // Venue contoh kecil (fixture E2E) untuk alur fungsional matriks browser dan audit aksesibilitas.
  const sample = await createFullVenue(db, `${PREFIX}Contoh ${tag}`);
  await data.publications.publish(sample.venueId as Venue['id']);
  const sampleSnapshot = (await (
    await fetch(
      `${perfEnv.apiUrl}/storage/v1/object/public/snapshots/${sample.venueId}/latest.json`,
    )
  ).json()) as { originPoints: { code: string }[]; infoPoints: { code: string }[] };

  writeFileSync(
    'results/venue.json',
    JSON.stringify(
      {
        venueId: large.venueId,
        originCode: snapshot.originPoints[0]?.code,
        targetLocationId: large.remap(source.locations.at(-1)?.id ?? ''),
        targetName: source.locations.at(-1)?.name,
        insertedMs,
        publishMs,
        latestBytes: latestText.length,
        denseVenueName: denseName,
        sample: {
          venueId: sample.venueId,
          name: sample.name,
          originCode: sampleSnapshot.originPoints[0]?.code,
          infoPointCode: sampleSnapshot.infoPoints[0]?.code,
        },
      },
      null,
      2,
    ),
  );
});
