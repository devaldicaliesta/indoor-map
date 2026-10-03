// Validasi publish: dipakai Admin (tombol Validasi) dan Edge Function `publish` (Deno), jadi
// hanya impor berekstensi `.ts` tanpa zod.
import { INSTRUCTION_ACTION_LABELS } from '../instruction-labels.ts';
import { INSTRUCTION_ACTIONS, type SnapshotNavNode } from '../snapshot.ts';
import type { SnapshotSource, SourceFeature } from '../snapshot-source.ts';
import { GEOMETRY_ISSUE_CODES, type IssueSeverity, validateFloorGeometry } from './geometry.ts';

export const PUBLISH_FINDING_CODES = [
  ...GEOMETRY_ISSUE_CODES,
  'missing_entrance',
  'location_without_unit',
  'unreachable',
  'origin_not_connected',
  'connector_one_sided',
  'escalator_stops',
  'floor_without_lift',
  'required_field_empty',
  'instruction_en_empty',
  'plan_not_georeferenced',
  'opening_date_passed',
] as const;
export type PublishFindingCode = (typeof PUBLISH_FINDING_CODES)[number];

/** Satu temuan; `floorId` dan `featureIds` dipakai Admin untuk membuka lantai dan menyorot. */
export interface PublishFinding {
  code: PublishFindingCode;
  severity: IssueSeverity;
  message: string;
  floorId: string | null;
  featureIds: string[];
  locationId: string | null;
  connectorId: string | null;
}

export interface PublishContext {
  /** Tanggal hari ini di zona waktu venue, `YYYY-MM-DD`. */
  today: string;
  /** Denah aktif per lantai; tidak termasuk di snapshot. */
  floorPlans: readonly { floorId: string; georeferenced: boolean }[];
}

const SEVERITY_ORDER: Record<IssueSeverity, number> = { error: 0, warning: 1 };

function finding(
  code: PublishFindingCode,
  severity: IssueSeverity,
  message: string,
  scope: Partial<
    Pick<PublishFinding, 'floorId' | 'featureIds' | 'locationId' | 'connectorId'>
  > = {},
): PublishFinding {
  return {
    code,
    severity,
    message,
    floorId: scope.floorId ?? null,
    featureIds: scope.featureIds ?? [],
    locationId: scope.locationId ?? null,
    connectorId: scope.connectorId ?? null,
  };
}

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

type Labels = (floorId: string) => string;

function floorLabels(source: SnapshotSource): Labels {
  const buildings = new Map(source.buildings.map((b) => [b.id, b.name]));
  const names = new Map(
    source.floors.map((f) => [
      f.id,
      f.buildingId ? `${f.name} ${buildings.get(f.buildingId) ?? ''}`.trim() : f.name,
    ]),
  );
  return (floorId) => names.get(floorId) ?? 'lantai tidak dikenal';
}

function byFloor<T extends { floorId: string }>(items: readonly T[]): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const list = groups.get(item.floorId) ?? [];
    list.push(item);
    groups.set(item.floorId, list);
  }
  return groups;
}

function geometryFindings(source: SnapshotSource): PublishFinding[] {
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

const needsEntrance = (f: SourceFeature) => f.kind === 'unit' || f.kind === 'facility';

function entranceFindings(source: SnapshotSource, label: Labels): PublishFinding[] {
  const served = new Set(source.graph.nodes.flatMap((n) => (n.featureId ? [n.featureId] : [])));
  const missing = source.features.filter((f) => needsEntrance(f) && !served.has(f.id));
  return [...byFloor(missing)].map(([floorId, features]) =>
    finding(
      'missing_entrance',
      'error',
      `${features.length} unit/fasilitas di ${label(floorId)} belum punya titik masuk ke jalur.`,
      { floorId, featureIds: features.map((f) => f.id) },
    ),
  );
}

function locationFindings(source: SnapshotSource, context: PublishContext): PublishFinding[] {
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

interface Network {
  adjacency: Map<string, Set<string>>;
  /** Jumlah edge jalur (bukan konektor) per node. */
  degree: Map<string, number>;
  nodes: Map<string, SnapshotNavNode>;
}

function network(source: SnapshotSource): Network {
  const nodes = new Map(source.graph.nodes.map((n) => [n.id, n]));
  const adjacency = new Map<string, Set<string>>([...nodes.keys()].map((id) => [id, new Set()]));
  const degree = new Map<string, number>();
  const link = (a: string, b: string) => {
    adjacency.get(a)?.add(b);
    adjacency.get(b)?.add(a);
  };
  for (const e of source.graph.edges) {
    if (!nodes.has(e.from) || !nodes.has(e.to)) continue;
    link(e.from, e.to);
    degree.set(e.from, (degree.get(e.from) ?? 0) + 1);
    degree.set(e.to, (degree.get(e.to) ?? 0) + 1);
  }
  // Keterjangkauan tanpa memperhatikan arah eskalator: arah diperiksa routing, bukan validasi.
  for (const c of source.graph.connectors) {
    const stops = c.stops.filter((s) => nodes.has(s.nodeId));
    for (let i = 1; i < stops.length; i += 1) {
      link((stops[i - 1] as (typeof stops)[0]).nodeId, (stops[i] as (typeof stops)[0]).nodeId);
    }
  }
  return { adjacency, degree, nodes };
}

function reach(net: Network, seeds: Iterable<string>): Set<string> {
  const seen = new Set<string>();
  const queue = [...seeds].filter((id) => net.nodes.has(id));
  for (const id of queue) seen.add(id);
  while (queue.length) {
    const id = queue.pop() as string;
    for (const next of net.adjacency.get(id) ?? []) {
      if (seen.has(next)) continue;
      seen.add(next);
      queue.push(next);
    }
  }
  return seen;
}

/** Tanpa titik asal di graf, jaringan terbesar menjadi acuan (Visitor bisa memilih asal di peta). */
function reachableNodes(source: SnapshotSource, net: Network): Set<string> {
  const seeds = source.originPoints.flatMap((o) => (o.nodeId ? [o.nodeId] : []));
  if (seeds.some((id) => net.nodes.has(id))) return reach(net, seeds);
  let largest = new Set<string>();
  const visited = new Set<string>();
  for (const id of net.nodes.keys()) {
    if (visited.has(id)) continue;
    const component = reach(net, [id]);
    for (const n of component) visited.add(n);
    if (component.size > largest.size) largest = component;
  }
  return largest;
}

function graphFindings(source: SnapshotSource, label: Labels): PublishFinding[] {
  const net = network(source);
  const findings: PublishFinding[] = [];

  const reachable = reachableNodes(source, net);
  // Node konektor tanpa jalur dilaporkan aturan konektor, bukan di sini.
  const unreachable = source.graph.nodes.filter(
    (n) => !reachable.has(n.id) && n.role !== 'connector',
  );
  for (const [floorId, nodes] of byFloor(unreachable)) {
    const featureIds = [...new Set(nodes.flatMap((n) => (n.featureId ? [n.featureId] : [])))];
    findings.push(
      finding(
        'unreachable',
        'error',
        `${nodes.length} titik jalur di ${label(floorId)} tidak terjangkau dari titik asal mana pun.`,
        { floorId, featureIds },
      ),
    );
  }

  for (const origin of source.originPoints) {
    const connected =
      origin.nodeId !== null &&
      net.nodes.has(origin.nodeId) &&
      (net.adjacency.get(origin.nodeId)?.size ?? 0) > 0;
    if (!connected) {
      findings.push(
        finding(
          'origin_not_connected',
          'error',
          `Titik asal “${origin.name}” tidak menempel ke jalur; simpan ulang di menu Titik Asal.`,
          { floorId: origin.floorId },
        ),
      );
    }
  }

  for (const connector of source.graph.connectors) {
    if (connector.kind === 'escalator' && connector.stops.length !== 2) {
      findings.push(
        finding(
          'escalator_stops',
          'error',
          `Eskalator “${connector.name}” harus berhenti di tepat dua lantai.`,
          { floorId: connector.stops[0]?.floorId ?? null, connectorId: connector.id },
        ),
      );
    }
    const loose = connector.stops.filter((s) => (net.degree.get(s.nodeId) ?? 0) === 0);
    if (connector.stops.length >= 2 && loose.length > 0) {
      const floors = loose.map((s) => label(s.floorId)).join(', ');
      findings.push(
        finding(
          'connector_one_sided',
          'error',
          `“${connector.name}” belum tersambung ke jalur di ${floors}.`,
          { floorId: loose[0]?.floorId ?? null, connectorId: connector.id },
        ),
      );
    }
  }
  return findings;
}

/** Lantai dasar: level paling dekat ke 0, lantai di atas tanah didahulukan. */
function groundLevelFirst(a: { level: number }, b: { level: number }) {
  return Math.abs(a.level) - Math.abs(b.level) || b.level - a.level;
}

function liftFindings(source: SnapshotSource, label: Labels): PublishFinding[] {
  const findings: PublishFinding[] = [];
  const accessible = source.graph.connectors.filter((c) => c.accessible);
  for (const building of source.buildings) {
    const floors = source.floors.filter((f) => f.buildingId === building.id);
    const ground = [...floors].sort(groundLevelFirst)[0];
    if (!ground || floors.length < 2) continue;
    const reached = new Set([ground.id]);
    let grew = true;
    while (grew) {
      grew = false;
      for (const c of accessible) {
        const ids = c.stops.map((s) => s.floorId);
        if (!ids.some((id) => reached.has(id))) continue;
        for (const id of ids) {
          if (!reached.has(id)) {
            reached.add(id);
            grew = true;
          }
        }
      }
    }
    for (const floor of floors) {
      if (reached.has(floor.id)) continue;
      findings.push(
        finding(
          'floor_without_lift',
          'warning',
          `${label(floor.id)} tidak terhubung lift atau konektor aksesibel dari lantai dasar; rute kursi roda terputus.`,
          { floorId: floor.id },
        ),
      );
    }
  }
  return findings;
}

function instructionFindings(source: SnapshotSource): PublishFinding[] {
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

function planFindings(context: PublishContext, label: Labels): PublishFinding[] {
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

/**
 * Semua aturan validasi publish atas draft venue. Error memblokir publish, Peringatan tidak.
 * Kuota pemakaian dan status lisensi ditambahkan di R4 (T-404, T-406).
 */
export function validateVenue(source: SnapshotSource, context: PublishContext): PublishFinding[] {
  const label = floorLabels(source);
  return [
    ...geometryFindings(source),
    ...entranceFindings(source, label),
    ...locationFindings(source, context),
    ...graphFindings(source, label),
    ...liftFindings(source, label),
    ...instructionFindings(source),
    ...planFindings(context, label),
  ].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
