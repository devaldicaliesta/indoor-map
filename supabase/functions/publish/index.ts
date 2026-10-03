// Edge Function publish: Admin/Super Admin menerbitkan draft venue sebagai snapshot JSON di
// bucket `snapshots` setelah lolos validasi, dengan catatan rilis opsional. Mode lain:
// `validate` (temuan saja), `diff` (ringkasan perubahan terhadap versi aktif), `preview`
// (snapshot draft di memori, tidak pernah ditulis ke Storage), dan `rollback` (isi versi lama
// diterbitkan ulang sebagai versi baru).
import { diffSnapshot } from '../../../packages/domain/src/diff.ts';
import { applyEntitlements } from '../../../packages/domain/src/entitlements.ts';
import type { Snapshot } from '../../../packages/domain/src/snapshot.ts';
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

/** Fitur di lisensi berlaku; tanpa lisensi tidak ada fitur berbayar. */
async function licenseFeatures(): Promise<string[]> {
  const response = await fetch(
    `${url}/rest/v1/licenses?is_current=eq.true&select=features:payload->features`,
    { headers: serviceHeaders },
  );
  if (!response.ok) throw new PublishError(502, 'unknown', 'Fitur lisensi tidak terbaca.');
  const [row] = (await response.json()) as { features: unknown }[];
  return Array.isArray(row?.features)
    ? row.features.filter((f): f is string => typeof f === 'string')
    : [];
}

/** Snapshot draft yang hanya membawa fitur dari paket lisensi. */
const snapshotOf = (source: Parameters<typeof buildSnapshot>[0]) =>
  applyEntitlements(buildSnapshot(source), source.enabledFeatures);

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
    enabledFeatures: await licenseFeatures(),
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

/** Snapshot versi aktif dari bucket; `null` bila venue belum pernah menerbitkan peta. */
/** Nomor versi aktif, dibaca dengan JWT pemanggil (RLS); `null` bila belum pernah publish. */
async function activeVersion(rest: CallerRest, venueId: string): Promise<number | null> {
  const [active] = await rest.select<{ version: number }>(
    'publications',
    `select=version&venue_id=eq.${venueId}&is_active=eq.true&order=version.desc`,
  );
  return active?.version ?? null;
}

/** Snapshot versi tertentu di bucket, dibaca dengan kunci layanan. */
async function readSnapshot(venueId: string, version: number): Promise<Snapshot> {
  const response = await fetch(`${url}/storage/v1/object/snapshots/${venueId}/v${version}.json`, {
    headers: serviceHeaders,
  });
  if (!response.ok) {
    throw new PublishError(502, 'unknown', `Snapshot v${version} tidak bisa dibaca.`);
  }
  return (await response.json()) as Snapshot;
}

async function activeSnapshot(rest: CallerRest, venueId: string): Promise<Snapshot | null> {
  const version = await activeVersion(rest, venueId);
  return version === null ? null : readSnapshot(venueId, version);
}

/** Perubahan draft sejak versi aktif; tidak disimpan, dihitung ulang setiap diminta. */
async function changes(rest: CallerRest, venueId: string) {
  const { source } = await validate(rest, venueId);
  return diffSnapshot(await activeSnapshot(rest, venueId), snapshotOf(source));
}

class BlockedError extends PublishError {
  constructor(readonly findings: PublishFinding[]) {
    const errors = findings.filter((f) => f.severity === 'error').length;
    super(422, 'invalid', `Publish dibatalkan: ${errors} Error validasi harus diperbaiki dulu.`);
  }
}

interface Release {
  notes: string | null;
  /** Versi lama yang diaktifkan kembali; `null` untuk publish draft. */
  sourceVersion: number | null;
}

/**
 * Pesan nomor versi, tulis `v{n}.json`, aktifkan, lalu perbarui `latest.json`. Pemesanan lebih
 * dulu: izin Admin/Super Admin diperiksa di sana. Kegagalan sebelum aktif membatalkan pesanan,
 * sehingga nomor versinya dipakai lagi dan versi aktif tidak berubah.
 */
async function release(
  rest: CallerRest,
  venueId: string,
  { notes, sourceVersion }: Release,
  snapshotBody: (version: number, publishedAt: string) => Promise<string>,
) {
  const [reservation] = await rest.rpc<Reservation[]>('publish_begin', {
    p_venue_id: venueId,
    p_notes: notes,
    p_source_version: sourceVersion,
  });
  if (!reservation) throw new PublishError(502, 'unknown', 'Nomor versi tidak didapat.');
  const { publication_id: id, version } = reservation;
  const publishedAt = new Date(reservation.published_at).toISOString();

  let body: string;
  try {
    body = await snapshotBody(version, publishedAt);
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

/** Draft yang lolos validasi diterbitkan sebagai versi baru. */
function publish(rest: CallerRest, venueId: string, notes: string | null) {
  return release(rest, venueId, { notes, sourceVersion: null }, async (version, publishedAt) => {
    const { source, findings } = await validate(rest, venueId);
    if (hasBlockingFindings(findings)) throw new BlockedError(findings);
    return JSON.stringify(snapshotOf({ ...source, version, publishedAt }));
  });
}

/** Isi versi lama diterbitkan ulang sebagai versi baru; draft tidak disentuh. */
function rollback(rest: CallerRest, venueId: string, sourceVersion: number, notes: string | null) {
  return release(rest, venueId, { notes, sourceVersion }, async (version, publishedAt) => {
    const old = await readSnapshot(venueId, sourceVersion);
    return JSON.stringify(
      applyEntitlements({ ...old, version, publishedAt }, await licenseFeatures()),
    );
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return fail(405, 'invalid', 'Metode tidak didukung.');

  const input = (await request.json().catch(() => null)) as {
    venueId?: unknown;
    mode?: unknown;
    notes?: unknown;
    sourceVersion?: unknown;
  } | null;
  const venueId = typeof input?.venueId === 'string' ? input.venueId : '';
  if (!UUID.test(venueId)) return fail(400, 'invalid', 'Venue yang akan diterbitkan tidak valid.');

  try {
    const rest = callerRest(request.headers.get('Authorization') ?? '');
    if (input?.mode === 'validate') {
      const { findings } = await validate(rest, venueId);
      return reply(200, { findings });
    }
    if (input?.mode === 'preview') {
      // Nomor versi yang akan dipakai bila draft ini dipublish (skema snapshot menolak 0).
      const [{ source }, active] = await Promise.all([
        validate(rest, venueId),
        activeVersion(rest, venueId),
      ]);
      return reply(200, { snapshot: snapshotOf({ ...source, version: (active ?? 0) + 1 }) });
    }
    if (input?.mode === 'diff') return reply(200, { changes: await changes(rest, venueId) });
    const notes = typeof input?.notes === 'string' ? input.notes : null;
    if (input?.mode === 'rollback') {
      const source = input.sourceVersion;
      if (typeof source !== 'number' || !Number.isInteger(source) || source < 1) {
        return fail(400, 'invalid', 'Versi yang akan diaktifkan kembali tidak valid.');
      }
      return reply(200, await rollback(rest, venueId, source, notes));
    }
    return reply(200, await publish(rest, venueId, notes));
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
