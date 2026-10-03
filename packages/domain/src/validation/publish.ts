// Validasi publish: dipakai Admin (tombol Validasi) dan Edge Function `publish` (Deno), jadi
// hanya impor berekstensi `.ts` tanpa zod. Aturan dibagi per berkas: geometri/lokasi/instruksi
// (`publish-content.ts`) dan graf/konektor/akses lift (`publish-graph.ts`).
import type { SnapshotSource } from '../snapshot-source.ts';
import type { IssueSeverity } from './geometry.ts';
import {
  geometryFindings,
  instructionFindings,
  locationFindings,
  planFindings,
} from './publish-content.ts';
import { floorLabels, type PublishContext, type PublishFinding } from './publish-finding.ts';
import { entranceFindings, graphFindings, liftFindings } from './publish-graph.ts';

export {
  PUBLISH_FINDING_CODES,
  type PublishContext,
  type PublishFinding,
  type PublishFindingCode,
} from './publish-finding.ts';

const SEVERITY_ORDER: Record<IssueSeverity, number> = { error: 0, warning: 1 };

/** Tanggal `YYYY-MM-DD` saat `now` di zona waktu venue (format en-CA = ISO). */
export function venueToday(now: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

/** Error memblokir publish; Peringatan tidak. */
export function hasBlockingFindings(findings: readonly PublishFinding[]): boolean {
  return findings.some((f) => f.severity === 'error');
}

/**
 * Semua aturan validasi publish atas draft venue. Error memblokir publish, Peringatan tidak.
 * Kuota pemakaian dan status lisensi ditambahkan di R4 (T-404, T-406).
 */
export function validateVenue(source: SnapshotSource, context: PublishContext): PublishFinding[] {
  const label = floorLabels(source);
  const buildingOf = new Map(source.floors.map((f) => [f.id, f.buildingId]));
  return [
    ...geometryFindings(source),
    ...entranceFindings(source, label),
    ...locationFindings(source, context),
    ...graphFindings(source, label),
    ...liftFindings(source, label),
    ...instructionFindings(source),
    ...planFindings(context, label),
  ]
    .map((f) => ({ ...f, buildingId: f.floorId ? (buildingOf.get(f.floorId) ?? null) : null }))
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
