// Edge Function license-service: menyamakan `latest.json` setiap venue dengan keadaan lisensi.
// Lisensi kedaluwarsa melewati masa tenggang atau dicabut → isinya diganti penanda layanan tidak
// aktif (Visitor menampilkan pesan). Lisensi berlaku lagi → dipulihkan dari versi aktif `v{n}.json`.
// Dipanggil database (pg_net) tanpa JWT; keadaan selalu dibaca ulang dari database, jadi panggilan
// dari luar hanya menerapkan keadaan yang memang berlaku. Versi bernomor tidak pernah disentuh.
import type { Snapshot } from '../../../packages/domain/src/snapshot.ts';
import { reply, serviceHeaders, url } from '../_shared/auth.ts';
import { putSnapshotFile, REVALIDATE, writeLatest } from '../_shared/snapshot-files.ts';

/** Isi `latest.json` saat layanan dihentikan; dikenali Visitor lewat `serviceInactive`. */
const INACTIVE = JSON.stringify({ serviceInactive: true });

async function rpc<T>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify(args),
  });
  if (!response.ok) throw new Error(`${name} gagal (${response.status}).`);
  // Fungsi `returns void` dibalas tanpa isi.
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

async function readVersion(venueId: string, version: number): Promise<Snapshot> {
  const response = await fetch(`${url}/storage/v1/object/snapshots/${venueId}/v${version}.json`, {
    headers: serviceHeaders,
  });
  if (!response.ok) throw new Error(`v${version}.json venue ${venueId} tidak terbaca.`);
  return (await response.json()) as Snapshot;
}

Deno.serve(async () => {
  try {
    const [status] = await rpc<{ state: string }[]>('license_status');
    const active = status?.state !== 'expired' && status?.state !== 'revoked';
    const venues = await rpc<{ venue_id: string; version: number }[]>('license_service_state');
    for (const { venue_id, version } of venues) {
      // Dipulihkan dari versi lengkap; berkas grafnya ikut ditulis (versi lama belum memilikinya).
      if (active) await writeLatest(venue_id, await readVersion(venue_id, version));
      else await putSnapshotFile(`${venue_id}/latest.json`, INACTIVE, REVALIDATE);
    }
    await rpc('license_service_mark', { p_suspended: !active });
    return reply(200, { active, venues: venues.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // biome-ignore lint/suspicious/noConsole: dipanggil database tanpa pembaca balasan; log Edge Runtime satu-satunya jejak.
    console.error(`license-service: ${message}`);
    return reply(500, { message: 'Sinkron layanan gagal.' });
  }
});
