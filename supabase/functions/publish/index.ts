// Edge Function publish: Admin/Super Admin menerbitkan draft venue sebagai snapshot JSON di
// bucket `snapshots`, setelah lolos validasi (`mode: "validate"` hanya mengembalikan temuan).
// Ringkasan perubahan, riwayat, dan rollback menyusul (T-308 s.d. T-310).
import { buildSnapshot } from '../../../packages/domain/src/snapshot-builder.ts';
import {
  hasBlockingFindings,
  type PublishFinding,
  validateVenue,
  venueToday,
} from '../../../packages/domain/src/validation/publish.ts';
import { CORS_HEADERS, fail, reply, serviceHeaders, url } from '../_shared/auth.ts';
import { type CallerRest, callerRest, PublishError } from './rest.ts';
import { readFloorPlans, readSource } from './source.ts';

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

/** Draft venue dan temuan validasinya. */
async function validate(rest: CallerRest, venueId: string) {
  const source = await readSource(rest, venueId, {
    version: 0,
    publishedAt: new Date().toISOString(),
    enabledFeatures: ENABLED_FEATURES,
  });
  const findings = validateVenue(source, {
    today: venueToday(new Date(), source.venue.timezone),
    floorPlans: await readFloorPlans(
      rest,
      source.floors.map((f) => f.id),
    ),
  });
  return { source, findings };
}

class BlockedError extends PublishError {
  constructor(readonly findings: PublishFinding[]) {
    const errors = findings.filter((f) => f.severity === 'error').length;
    super(422, 'invalid', `Publish dibatalkan: ${errors} Error validasi harus diperbaiki dulu.`);
  }
}

async function publish(rest: CallerRest, venueId: string) {
  // Pemesanan versi lebih dulu: izin Admin/Super Admin diperiksa di sana. Publish yang ditolak
  // validasi membatalkan pesanannya, sehingga nomor versi dipakai lagi oleh publish berikutnya.
  const [reservation] = await rest.rpc<Reservation[]>('publish_begin', { p_venue_id: venueId });
  if (!reservation) throw new PublishError(502, 'unknown', 'Nomor versi tidak didapat.');
  const { publication_id: id, version } = reservation;
  const publishedAt = new Date(reservation.published_at).toISOString();

  let body: string;
  try {
    const { source, findings } = await validate(rest, venueId);
    if (hasBlockingFindings(findings)) throw new BlockedError(findings);
    body = JSON.stringify(buildSnapshot({ ...source, version, publishedAt }));
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

  const input = (await request.json().catch(() => null)) as {
    venueId?: unknown;
    mode?: unknown;
  } | null;
  const venueId = typeof input?.venueId === 'string' ? input.venueId : '';
  if (!UUID.test(venueId)) return fail(400, 'invalid', 'Venue yang akan diterbitkan tidak valid.');

  try {
    const rest = callerRest(request.headers.get('Authorization') ?? '');
    if (input?.mode === 'validate') {
      const { findings } = await validate(rest, venueId);
      return reply(200, { findings });
    }
    return reply(200, await publish(rest, venueId));
  } catch (error) {
    if (error instanceof BlockedError) {
      return reply(error.status, {
        code: error.code,
        message: error.message,
        findings: error.findings,
      });
    }
    if (error instanceof PublishError) return fail(error.status, error.code, error.message);
    const message = error instanceof Error ? error.message : String(error);
    return fail(500, 'unknown', `Publish gagal: ${message}`);
  }
});
