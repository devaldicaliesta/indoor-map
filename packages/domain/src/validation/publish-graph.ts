// Dipakai juga Edge Function `publish` (Deno): hanya impor berekstensi `.ts` tanpa zod.
import type { SnapshotNavNode } from '../snapshot.ts';
import type { SnapshotSource, SourceFeature } from '../snapshot-source.ts';
import { byFloor, finding, type Labels, type PublishFinding } from './publish-finding.ts';

const needsEntrance = (f: SourceFeature) => f.kind === 'unit' || f.kind === 'facility';

export function entranceFindings(source: SnapshotSource, label: Labels): PublishFinding[] {
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

/**
 * Acuan: titik asal QR dan Info Point yang menempel ke graf. Tanpa keduanya, jaringan terbesar
 * menjadi acuan (Visitor bisa memilih asal di peta).
 */
function reachableNodes(source: SnapshotSource, net: Network): Set<string> {
  const seeds = [...source.originPoints, ...source.infoPoints].flatMap((o) =>
    o.nodeId ? [o.nodeId] : [],
  );
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

export function graphFindings(source: SnapshotSource, label: Labels): PublishFinding[] {
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
    if (connector.kind !== 'escalator' && connector.stops.length < 2) {
      findings.push(
        finding(
          'connector_stops',
          'error',
          `“${connector.name}” harus berhenti di minimal dua lantai.`,
          { floorId: connector.stops[0]?.floorId ?? null, connectorId: connector.id },
        ),
      );
    }
    const missing = connector.stops.filter((s) => !net.nodes.has(s.nodeId));
    const loose = connector.stops.filter(
      (s) => net.nodes.has(s.nodeId) && (net.degree.get(s.nodeId) ?? 0) === 0,
    );
    if (connector.stops.length >= 2 && (missing.length > 0 || loose.length > 0)) {
      const floors = (list: typeof loose) => list.map((s) => label(s.floorId)).join(', ');
      const parts = [
        ...(missing.length ? [`titik pemberhentiannya hilang di ${floors(missing)}`] : []),
        ...(loose.length ? [`belum tersambung ke jalur di ${floors(loose)}`] : []),
      ];
      findings.push(
        finding('connector_one_sided', 'error', `“${connector.name}”: ${parts.join('; ')}.`, {
          floorId: (missing[0] ?? loose[0])?.floorId ?? null,
          connectorId: connector.id,
        }),
      );
    }
  }
  return findings;
}

/** Lantai dasar: level paling dekat ke 0, lantai di atas tanah didahulukan. */
function groundLevelFirst(a: { level: number }, b: { level: number }) {
  return Math.abs(a.level) - Math.abs(b.level) || b.level - a.level;
}

export function liftFindings(source: SnapshotSource, label: Labels): PublishFinding[] {
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
