import { expect, test } from '../../../fixtures';

// Memastikan data uji lengkap bisa dibuat dan diterbitkan; dipakai semua spec verifikasi.
test('data uji lengkap terisi dan bisa diterbitkan', async ({ fullVenue, superAdmin }) => {
  const venueId = fullVenue.venueId as Parameters<typeof superAdmin.buildings.list>[0];
  expect((await superAdmin.buildings.list(venueId)).map((b) => b.code).sort()).toEqual([
    'GT',
    'GU',
  ]);
  const result = await superAdmin.publications.publish(venueId);
  expect(result.version).toBe(1);
  const snapshot = await superAdmin.snapshots.latestWithGraph(venueId);
  expect(snapshot.graph.connectors.map((c) => c.kind).sort()).toEqual(
    [...fullVenue.source.graph.connectors.map((c) => c.kind)].sort(),
  );
  expect(snapshot.locations.map((l) => l.name)).not.toContain('Apotek Lama');
  expect(snapshot.originPoints).toHaveLength(1);
});
