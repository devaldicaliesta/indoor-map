// Edge Function publish (mode minimal): Admin/Super Admin menerbitkan draft venue sebagai
// snapshot JSON di bucket `snapshots`. Validasi, ringkasan perubahan, riwayat, dan rollback
// menyusul di R3 (T-307 s.d. T-310) tanpa mengubah format snapshot.
import { buildSnapshot } from '../../../packages/domain/src/snapshot-builder.ts';
import { CORS_HEADERS, fail, reply, serviceHeaders, url } from '../_shared/auth.ts';
import { type CallerRest, callerRest, PublishError } from './rest.ts';
import { readSource } from './source.ts';

// Sampai fitur dibaca dari lisensi (T-405), semua fitur opsional aktif.
const ENABLED_FEATURES = ['3d', 'info_point'];

// Versi bernomor tidak pernah berubah isinya; latest.json selalu diperiksa ulang ke server
// (ETag) agar kunjungan berikutnya memakai versi terbaru tanpa mengunduh ulang isi yang sama.
const IMMUTABLE = 'public, max-age=31536000, immutable';
const REVALIDATE = 'no-cache';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface Reservation {
  publication_id: string;
  version: number;
  published_at: string;
}

async function upload(path: string, body: string, cacheControl: string) {
  const response = await fetch(`${url}/storage/v1/object/snapshots/${path}`, {
    method: 'POST',
    headers: { ...serviceHeaders, 'x-upsert': 'true', 'cache-control': cacheControl },
    body,
  });
  if (!response.ok) {
    throw new PublishError(502, 'unknown', `Snapshot gagal disimpan: ${await response.text()}`);
  }
}

async function publish(rest: CallerRest, venueId: string) {
  const [reservation] = await rest.rpc<Reservation[]>('publish_begin', { p_venue_id: venueId });
  if (!reservation) throw new PublishError(502, 'unknown', 'Nomor versi tidak didapat.');
  const { publication_id: id, version } = reservation;
  const publishedAt = new Date(reservation.published_at).toISOString();

  let body: string;
  try {
    const source = await readSource(rest, venueId, {
      version,
      publishedAt,
      enabledFeatures: ENABLED_FEATURES,
    });
    body = JSON.stringify(buildSnapshot(source));
    await upload(`${venueId}/v${version}.json`, body, IMMUTABLE);
    await rest.rpc('publish_commit', { p_publication_id: id });
  } catch (error) {
    await rest.rpc('publish_abort', { p_publication_id: id }).catch(() => undefined);
    throw error;
  }

  try {
    await upload(`${venueId}/latest.json`, body, REVALIDATE);
  } catch {
    throw new PublishError(
      502,
      'unknown',
      `Versi ${version} sudah aktif, tetapi Visitor belum bisa memuatnya. Terbitkan ulang.`,
    );
  }
  return { version, publishedAt, sizeBytes: new TextEncoder().encode(body).length };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return fail(405, 'invalid', 'Metode tidak didukung.');

  const input = (await request.json().catch(() => null)) as { venueId?: unknown } | null;
  const venueId = typeof input?.venueId === 'string' ? input.venueId : '';
  if (!UUID.test(venueId)) return fail(400, 'invalid', 'Venue yang akan diterbitkan tidak valid.');

  try {
    const rest = callerRest(request.headers.get('Authorization') ?? '');
    return reply(200, await publish(rest, venueId));
  } catch (error) {
    if (error instanceof PublishError) return fail(error.status, error.code, error.message);
    const message = error instanceof Error ? error.message : String(error);
    return fail(500, 'unknown', `Publish gagal: ${message}`);
  }
});
