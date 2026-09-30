import type { MapFeatureProperties } from '../feature';
import { normalizeUnitCode } from '../feature';
import type { Geometry, MultiPolygon, Polygon, Position } from '../geometry';
import {
  distanceToRing,
  openRing,
  type PreparedPolygon,
  type Pt,
  pointInRing,
  polygonArea,
  polygonIntersectionArea,
  prepareRing,
  projector,
  ringSelfIntersects,
  segmentsCross,
} from './planar';

/** Irisan dua unit atau bagian fitur di luar gedung yang lebih kecil dari ini diabaikan (FR-MAP-09). */
export const OVERLAP_TOLERANCE_M2 = 0.5;
/** Titik/ujung garis sejauh ini dari tepi footprint masih dianggap di dalam (dinding luar). */
export const BOUNDARY_TOLERANCE_M = 0.1;

export const GEOMETRY_ISSUE_CODES = [
  'polygon_not_closed',
  'polygon_self_intersection',
  'unit_overlap',
  'outside_floor',
  'duplicate_unit_code',
] as const;
export type GeometryIssueCode = (typeof GEOMETRY_ISSUE_CODES)[number];
export type IssueSeverity = 'error' | 'warning';

/** Satu temuan validasi; `featureIds` menunjuk fitur yang perlu diperbaiki. */
export interface ValidationIssue {
  code: GeometryIssueCode;
  severity: IssueSeverity;
  featureIds: string[];
  message: string;
}

export interface ValidatedFeature {
  geometry: Geometry;
  properties: Pick<MapFeatureProperties, 'id' | 'kind' | 'unitCode' | 'name'>;
}

export interface GeometryValidationOptions {
  /** Batas lantai (footprint gedung); `null` = tidak diperiksa (Area Luar, footprint belum ada). */
  boundary: Polygon | MultiPolygon | null;
}

const areaFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 });
const SHAPE_NOUN: Record<Geometry['type'], string> = {
  Point: 'Titik',
  LineString: 'Garis',
  Polygon: 'Poligon',
  MultiPolygon: 'Poligon',
};

function labelOf(f: ValidatedFeature): string {
  const p = f.properties;
  if (p.unitCode) return `Unit ${p.unitCode}`;
  if (p.name) return `“${p.name}”`;
  return `${SHAPE_NOUN[f.geometry.type]} tanpa nama`;
}

function polygonsOf(geometry: Geometry): Position[][][] {
  if (geometry.type === 'Polygon') return [geometry.coordinates];
  if (geometry.type === 'MultiPolygon') return geometry.coordinates;
  return [];
}

const isClosedRing = (ring: readonly Position[]) => {
  const first = ring[0];
  const last = ring.at(-1);
  return (
    ring.length >= 4 &&
    first !== undefined &&
    last !== undefined &&
    first[0] === last[0] &&
    first[1] === last[1]
  );
};

type Checked =
  | { ok: true; parts: PreparedPolygon[] }
  | { ok: false; code: 'polygon_not_closed' | 'polygon_self_intersection' };

/** Poligon diperiksa lebih dulu; hanya poligon sah yang ikut dihitung luas irisannya. */
function checkPolygon(geometry: Geometry, project: (p: Position) => Pt): Checked {
  const parts: PreparedPolygon[] = [];
  for (const rings of polygonsOf(geometry)) {
    if (rings.length === 0 || !rings.every(isClosedRing))
      return { ok: false, code: 'polygon_not_closed' };
    const projected = rings.map((r) => r.map(project));
    if (projected.some((r) => openRing(r).length < 3))
      return { ok: false, code: 'polygon_not_closed' };
    if (projected.some((r) => ringSelfIntersects(openRing(r))))
      return { ok: false, code: 'polygon_self_intersection' };
    const [outer, ...holes] = projected.map(prepareRing);
    if (!outer || holes.some((h) => h === null))
      return { ok: false, code: 'polygon_self_intersection' };
    parts.push({ outer, holes: holes as NonNullable<(typeof holes)[number]>[] });
  }
  return { ok: true, parts };
}

function intersectionArea(a: readonly PreparedPolygon[], b: readonly PreparedPolygon[]): number {
  let area = 0;
  for (const pa of a) for (const pb of b) area += polygonIntersectionArea(pa, pb);
  return area;
}

const totalArea = (parts: readonly PreparedPolygon[]) =>
  parts.reduce((s, p) => s + polygonArea(p), 0);

function insideBoundary(p: Pt, boundary: readonly PreparedPolygon[]): boolean {
  return boundary.some((b) => {
    const nearEdge = [b.outer, ...b.holes].some(
      (r) => distanceToRing(p, r.ring) <= BOUNDARY_TOLERANCE_M,
    );
    if (nearEdge) return true;
    return pointInRing(p, b.outer.ring) && !b.holes.some((h) => pointInRing(p, h.ring));
  });
}

function lineLeavesBoundary(points: readonly Pt[], boundary: readonly PreparedPolygon[]): boolean {
  if (!points.every((p) => insideBoundary(p, boundary))) return true;
  const edges = boundary.flatMap((b) => [b.outer, ...b.holes]).map((r) => r.ring);
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i] as Pt;
    const c = points[i + 1] as Pt;
    for (const ring of edges)
      for (let k = 0; k < ring.length; k++)
        if (segmentsCross(a, c, ring[k] as Pt, ring[(k + 1) % ring.length] as Pt)) return true;
  }
  return false;
}

/** Titik acuan proyeksi: posisi pertama yang ada (semua fitur satu lantai berdekatan). */
function originOf(features: readonly ValidatedFeature[], boundary: Geometry | null): Position {
  const first = (g: Geometry): Position | undefined =>
    g.type === 'Point'
      ? g.coordinates
      : g.type === 'LineString'
        ? g.coordinates[0]
        : polygonsOf(g)[0]?.[0]?.[0];
  for (const g of [boundary, ...features.map((f) => f.geometry)]) {
    const p = g ? first(g) : undefined;
    if (p) return p;
  }
  return [0, 0];
}

/**
 * Validasi geometri satu lantai (FR-MAP-09): poligon tidak tertutup atau memotong diri,
 * unit tumpang tindih lebih dari 0,5 m², fitur di luar batas lantai, dan kode unit ganda.
 * Tidak pernah memblokir penyimpanan draft; publish (R3) memakai temuan `error`.
 */
export function validateFloorGeometry(
  features: readonly ValidatedFeature[],
  options: GeometryValidationOptions,
): ValidationIssue[] {
  const project = projector(originOf(features, options.boundary));
  const issues: ValidationIssue[] = [];
  const valid = new Map<string, PreparedPolygon[]>();

  for (const f of features) {
    if (f.geometry.type !== 'Polygon' && f.geometry.type !== 'MultiPolygon') continue;
    const checked = checkPolygon(f.geometry, project);
    if (checked.ok) {
      valid.set(f.properties.id, checked.parts);
      continue;
    }
    issues.push({
      code: checked.code,
      severity: 'error',
      featureIds: [f.properties.id],
      message:
        checked.code === 'polygon_not_closed'
          ? `${labelOf(f)} tidak tertutup: poligon butuh minimal 3 titik dan titik akhir sama dengan titik awal.`
          : `${labelOf(f)} memotong dirinya sendiri. Geser titiknya agar tepi tidak bersilangan.`,
    });
  }

  issues.push(...overlapIssues(features, valid));
  if (options.boundary) issues.push(...outsideIssues(features, valid, options.boundary, project));
  issues.push(...duplicateCodeIssues(features));
  return issues;
}

/** Pasangan unit dicari dengan sapuan sumbu x agar lantai 1.000 unit tetap cepat. */
function overlapIssues(
  features: readonly ValidatedFeature[],
  valid: ReadonlyMap<string, PreparedPolygon[]>,
): ValidationIssue[] {
  const units = features
    .filter((f) => f.properties.kind === 'unit' && valid.has(f.properties.id))
    .map((f) => {
      const parts = valid.get(f.properties.id) as PreparedPolygon[];
      const boxes = parts.map((p) => p.outer.box);
      return {
        feature: f,
        parts,
        minX: Math.min(...boxes.map((b) => b[0])),
        maxX: Math.max(...boxes.map((b) => b[2])),
      };
    })
    .sort((a, b) => a.minX - b.minX);
  const issues: ValidationIssue[] = [];
  for (let i = 0; i < units.length; i++) {
    const a = units[i] as (typeof units)[number];
    for (let j = i + 1; j < units.length; j++) {
      const b = units[j] as (typeof units)[number];
      if (b.minX > a.maxX) break;
      const area = intersectionArea(a.parts, b.parts);
      if (area <= OVERLAP_TOLERANCE_M2) continue;
      issues.push({
        code: 'unit_overlap',
        severity: 'error',
        featureIds: [a.feature.properties.id, b.feature.properties.id],
        message: `${labelOf(a.feature)} dan ${labelOf(b.feature)} tumpang tindih ${areaFormat.format(area)} m². Rapikan batas salah satunya.`,
      });
    }
  }
  return issues;
}

function outsideIssues(
  features: readonly ValidatedFeature[],
  valid: ReadonlyMap<string, PreparedPolygon[]>,
  boundary: Polygon | MultiPolygon,
  project: (p: Position) => Pt,
): ValidationIssue[] {
  const checked = checkPolygon(boundary, project);
  // Footprint rusak tidak bisa dijadikan acuan; footprint divalidasi saat digambar (T-102).
  if (!checked.ok) return [];
  const issues: ValidationIssue[] = [];
  for (const f of features) {
    const g = f.geometry;
    let outsideM2: number | null = null;
    let outside = false;
    if (g.type === 'Point') outside = !insideBoundary(project(g.coordinates), checked.parts);
    else if (g.type === 'LineString')
      outside = lineLeavesBoundary(g.coordinates.map(project), checked.parts);
    else {
      const parts = valid.get(f.properties.id);
      if (!parts) continue;
      outsideM2 = Math.max(0, totalArea(parts) - intersectionArea(parts, checked.parts));
      outside = outsideM2 > OVERLAP_TOLERANCE_M2;
    }
    if (!outside) continue;
    const amount = outsideM2 === null ? '' : ` (${areaFormat.format(outsideM2)} m² di luar)`;
    issues.push({
      code: 'outside_floor',
      severity: 'error',
      featureIds: [f.properties.id],
      message: `${labelOf(f)} berada di luar batas gedung${amount}. Pindahkan ke dalam footprint atau perbarui footprint gedung di menu Venue.`,
    });
  }
  return issues;
}

function duplicateCodeIssues(features: readonly ValidatedFeature[]): ValidationIssue[] {
  const byCode = new Map<string, string[]>();
  for (const f of features) {
    if (f.properties.kind !== 'unit' || !f.properties.unitCode) continue;
    const code = normalizeUnitCode(f.properties.unitCode);
    byCode.set(code, [...(byCode.get(code) ?? []), f.properties.id]);
  }
  return [...byCode]
    .filter(([, ids]) => ids.length > 1)
    .map(([code, ids]) => ({
      code: 'duplicate_unit_code' as const,
      severity: 'error' as const,
      featureIds: ids,
      message: `Kode unit ${code} dipakai ${ids.length} unit. Kode unit harus unik di satu venue.`,
    }));
}

/** Temuan per fitur, untuk menandai daftar fitur dan panel properti. */
export function issuesByFeature(
  issues: readonly ValidationIssue[],
): Map<string, ValidationIssue[]> {
  const map = new Map<string, ValidationIssue[]>();
  for (const issue of issues)
    for (const id of issue.featureIds) map.set(id, [...(map.get(id) ?? []), issue]);
  return map;
}
