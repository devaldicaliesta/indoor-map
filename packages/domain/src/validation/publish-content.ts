// Dipakai juga Edge Function `publish` (Deno): hanya impor berekstensi `.ts` tanpa zod.
import { INSTRUCTION_ACTION_LABELS } from '../instruction-labels.ts';
import { INSTRUCTION_ACTIONS } from '../snapshot.ts';
import type { SnapshotSource } from '../snapshot-source.ts';
import { validateFloorGeometry } from './geometry.ts';
import {
  byFloor,
  finding,
  type Labels,
  type PublishContext,
  type PublishFinding,
} from './publish-finding.ts';

export function geometryFindings(source: SnapshotSource): PublishFinding[] {
  const footprints = new Map(source.buildings.map((b) => [b.id, b.footprint]));
  const floors = new Map(source.floors.map((f) => [f.id, f]));
  const findings: PublishFinding[] = [];
  for (const [floorId, features] of byFloor(source.features)) {
    const floor = floors.get(floorId);
    const boundary = floor?.buildingId ? (footprints.get(floor.buildingId) ?? null) : null;
    const issues = validateFloorGeometry(
      features.map((f) => ({
        geometry: f.geometry,
        properties: { id: f.id, kind: f.kind, unitCode: f.unitCode, name: f.name },
      })),
      { boundary },
    );
    for (const issue of issues) {
      findings.push(
        finding(issue.code, issue.severity, issue.message, {
          floorId,
          featureIds: issue.featureIds,
        }),
      );
    }
  }
  return findings;
}

export function locationFindings(
  source: SnapshotSource,
  context: PublishContext,
): PublishFinding[] {
  const types = new Map(source.locationTypes.map((t) => [t.id, t]));
  const findings: PublishFinding[] = [];
  for (const location of source.locations) {
    if (location.status === 'active' && location.unitIds.length === 0) {
      findings.push(
        finding(
          'location_without_unit',
          'error',
          `Lokasi aktif “${location.name}” belum menempati unit di peta.`,
          { locationId: location.id },
        ),
      );
    }
    if (location.status !== 'inactive_permanent') {
      const empty = (types.get(location.locationTypeId)?.fields ?? [])
        .filter((f) => f.isRequired && isEmptyValue(location.customFields[f.key]))
        .map((f) => f.label);
      if (empty.length) {
        findings.push(
          finding(
            'required_field_empty',
            'warning',
            `Lokasi “${location.name}”: field wajib ${empty.join(', ')} masih kosong.`,
            { locationId: location.id },
          ),
        );
      }
    }
    if (
      location.status === 'coming_soon' &&
      location.openingDate &&
      location.openingDate < context.today
    ) {
      findings.push(
        finding(
          'opening_date_passed',
          'warning',
          `Lokasi “${location.name}” masih “segera buka” padahal tanggal bukanya ${location.openingDate} sudah lewat.`,
          { locationId: location.id },
        ),
      );
    }
  }
  return findings;
}

function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function instructionFindings(source: SnapshotSource): PublishFinding[] {
  const rows = new Map(source.instructionTemplates.map((t) => [t.action, t]));
  const missing = INSTRUCTION_ACTIONS.filter((a) => !rows.get(a)?.en.trim()).map(
    (a) => INSTRUCTION_ACTION_LABELS[a],
  );
  return missing.length
    ? [
        finding(
          'instruction_en_empty',
          'warning',
          `Template instruksi belum berbahasa Inggris: ${missing.join(', ')}. Visitor EN memakai teks Indonesia.`,
        ),
      ]
    : [];
}

export function planFindings(context: PublishContext, label: Labels): PublishFinding[] {
  return context.floorPlans
    .filter((p) => !p.georeferenced)
    .map((p) =>
      finding(
        'plan_not_georeferenced',
        'warning',
        `Denah ${label(p.floorId)} belum digeoreferensi.`,
        { floorId: p.floorId },
      ),
    );
}
