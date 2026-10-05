// Penulisan berkas snapshot di bucket untuk Visitor, dipakai publish dan license-service.
import type { Snapshot } from '../../../packages/domain/src/snapshot.ts';
import { splitSnapshot } from '../../../packages/domain/src/snapshot-split.ts';
import { serviceHeaders, url } from './auth.ts';

// Versi bernomor tidak pernah berubah isinya; latest.json selalu diperiksa ulang ke server
// (ETag) agar kunjungan berikutnya memakai versi terbaru tanpa mengunduh ulang isi yang sama.
export const IMMUTABLE = 'public, max-age=31536000, immutable';
export const REVALIDATE = 'no-cache';

export async function putSnapshotFile(path: string, body: string, cacheControl: string) {
  const response = await fetch(`${url}/storage/v1/object/snapshots/${path}`, {
    method: 'POST',
    headers: { ...serviceHeaders, 'x-upsert': 'true', 'cache-control': cacheControl },
    body,
  });
  if (!response.ok) throw new Error(`${path} gagal disimpan: ${await response.text()}`);
}

/**
 * `latest.json` tanpa graf + `v{n}.graph.json`. Graf ditulis lebih dulu agar Visitor yang membaca
 * `latest.json` baru selalu menemukan berkas grafnya.
 */
export async function writeLatest(venueId: string, snapshot: Snapshot) {
  const { core, graph } = splitSnapshot(snapshot);
  await putSnapshotFile(`${venueId}/${core.graphPath}`, JSON.stringify(graph), IMMUTABLE);
  await putSnapshotFile(`${venueId}/latest.json`, JSON.stringify(core), REVALIDATE);
}
