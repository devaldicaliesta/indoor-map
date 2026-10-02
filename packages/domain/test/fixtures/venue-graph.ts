/**
 * Graf jalur untuk `venue-sample.json`, dibangun dari geometrinya agar node selalu berada di
 * koridor dan pintu unit yang sama dengan peta. Id berurutan dan tetap (UUID) sehingga test bisa
 * menunjuk node tertentu lewat `GRAPH`.
 *
 * Gedung Utama (GF, L1, L2): garis tengah koridor dengan satu node per kolom unit, node masuk di
 * setiap pintu unit, fasilitas di koridor, dan zona timur berisi tangga (GF–L2), lift (GF–L1 saja),
 * eskalator naik dan turun (GF–L1), serta pintu gedung ke Area Luar. Area Luar: jalur landai
 * (aksesibel, memutar) dan jalan pintas bertangga (tidak aksesibel) ke Gedung Timur.
 */
import type {
  SnapshotConnector,
  SnapshotGraph,
  SnapshotNavEdge,
  SnapshotNavNode,
  SnapshotNodeRole,
  SnapshotPosition,
} from '../../src/snapshot';
import sample from './venue-sample.json' with { type: 'json' };

const EARTH_RADIUS_M = 6_371_008.8;
const RAD = Math.PI / 180;
function lengthM(a: SnapshotPosition, b: SnapshotPosition): number {
  const dLat = (b[1] - a[1]) * RAD;
  const dLng = (b[0] - a[0]) * RAD;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.sin(dLng / 2) ** 2;
  // Dua desimal seperti kolom `nav_edges.length_m`.
  return Math.round(2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h)) * 100) / 100;
}

const floorId = (buildingCode: string | null, name: string) => {
  const building = sample.buildings.find((b) => b.code === buildingCode);
  const floor = sample.floors.find(
    (f) => (building ? f.buildingId === building.id : f.isOutdoor) && f.name === name,
  );
  if (!floor) throw new Error(`Lantai ${buildingCode ?? 'Area Luar'} ${name} tidak ada`);
  return floor.id;
};

export const FLOORS = {
  outdoor: floorId(null, 'Area Luar'),
  guGf: floorId('GU', 'GF'),
  guL1: floorId('GU', 'L1'),
  guL2: floorId('GU', 'L2'),
  gtGf: floorId('GT', 'GF'),
} as const;

const nodes: SnapshotNavNode[] = [];
const edges: SnapshotNavEdge[] = [];
const connectors: SnapshotConnector[] = [];
const uuid = (prefix: string, n: number) =>
  `${prefix}-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;

function node(
  floor: string,
  coordinates: SnapshotPosition,
  role: SnapshotNodeRole = 'path',
  featureId: string | null = null,
): string {
  const id = uuid('9e000000', nodes.length + 1);
  nodes.push({ id, floorId: floor, coordinates, role, featureId });
  return id;
}

function edge(from: string, to: string, accessible = true): string {
  const a = nodes.find((n) => n.id === from);
  const b = nodes.find((n) => n.id === to);
  if (!a || !b) throw new Error('Node edge tidak ada');
  const id = uuid('9e100000', edges.length + 1);
  edges.push({
    id,
    floorId: a.floorId,
    from,
    to,
    lengthM: lengthM(a.coordinates, b.coordinates),
    accessible,
  });
  return id;
}

function connector(
  kind: SnapshotConnector['kind'],
  name: string,
  stops: [string, string][],
  options: { accessible: boolean; direction?: SnapshotConnector['direction'] },
): string {
  const id = uuid('9e200000', connectors.length + 1);
  connectors.push({
    id,
    kind,
    name,
    direction: options.direction ?? null,
    accessible: options.accessible,
    stops: stops.map(([floor, nodeId]) => ({ floorId: floor, nodeId })),
  });
  return id;
}

const features = sample.features.features;
const pointOf = (f: (typeof features)[number]) => f.geometry.coordinates as unknown as number[];
const unitAt = (floor: string, x: number, y: number) =>
  features.find((f) => {
    if (f.properties.kind !== 'unit' || f.properties.floorId !== floor) return false;
    const ring = (f.geometry.coordinates as unknown as number[][][])[0] ?? [];
    const xs = ring.map((p) => p[0] ?? 0);
    const ys = ring.map((p) => p[1] ?? 0);
    return (
      x > Math.min(...xs) &&
      x < Math.max(...xs) &&
      y >= Math.min(...ys) - 1e-7 &&
      y <= Math.max(...ys) + 1e-7
    );
  });

// Gedung Utama: koridor y -6.1752447 … -6.175317, kolom unit 0,0000903° (≈ 10 m).
const GU_Y = -6.17528085;
const GU_COLUMNS = Array.from({ length: 8 }, (_, i) => 106.8268452 + i * 0.0000903);
const EAST_X = 106.827559;

interface MainFloor {
  hub: string;
  stairs: string;
  lift?: string;
  escalatorUp?: string;
  escalatorDown?: string;
  facility: string;
  columns: string[];
}

const main: Record<'guGf' | 'guL1' | 'guL2', MainFloor> = {} as Record<
  'guGf' | 'guL1' | 'guL2',
  MainFloor
>;
let lobby = '';
let infoPoint = '';
const entrances = new Map<string, string>();

for (const key of ['guGf', 'guL1', 'guL2'] as const) {
  const floor = FLOORS[key];
  const columns = GU_COLUMNS.map((x) => node(floor, [x, GU_Y]));
  const facilityFeature = features.find(
    (f) => f.properties.kind === 'facility' && f.properties.floorId === floor,
  );
  const facilityPoint = facilityFeature ? pointOf(facilityFeature) : [106.8271614, GU_Y];
  const facility = node(
    floor,
    [facilityPoint[0] ?? 0, facilityPoint[1] ?? 0],
    'entrance',
    facilityFeature?.properties.id ?? null,
  );
  if (facilityFeature) entrances.set(facilityFeature.properties.id, facility);
  const hub = node(floor, [EAST_X, GU_Y]);

  // Lobi (titik asal QR) dan Info Point di ujung barat koridor GF.
  const west: string[] = [];
  if (key === 'guGf') {
    lobby = node(floor, [106.8268, GU_Y], 'origin');
    infoPoint = node(floor, [106.82689, GU_Y], 'info_point');
    west.push(lobby, columns[0] ?? '', infoPoint);
  } else {
    west.push(columns[0] ?? '');
  }
  const line = [...west, ...columns.slice(1, 4), facility, ...columns.slice(4), hub];
  for (let i = 0; i + 1 < line.length; i++) edge(line[i] ?? '', line[i + 1] ?? '');

  // Pintu unit: node masuk di pintu, terhubung ke kolom koridor di depannya.
  for (const door of features.filter(
    (f) => f.properties.kind === 'door' && f.properties.floorId === floor,
  )) {
    const [x = 0, y = 0] = pointOf(door);
    const unit = unitAt(floor, x, y);
    if (!unit) continue;
    const entrance = node(floor, [x, y], 'entrance', unit.properties.id);
    entrances.set(unit.properties.id, entrance);
    const column = GU_COLUMNS.findIndex((c) => Math.abs(c - x) < 1e-6);
    edge(entrance, columns[column] ?? '');
  }

  const stairs = node(floor, [EAST_X, -6.17513615]);
  edge(stairs, hub, false);
  const hasKind = (kind: string, name?: string) =>
    features.some(
      (f) =>
        f.properties.floorId === floor &&
        f.properties.kind === kind &&
        (!name || f.properties.name === name),
    );
  const entry: MainFloor = { hub, stairs, facility, columns };
  if (hasKind('elevator')) {
    entry.lift = node(floor, [EAST_X, -6.1752085]);
    edge(entry.lift, hub);
  }
  if (hasKind('escalator', 'Eskalator naik')) {
    entry.escalatorUp = node(floor, [106.8275409, -6.175317]);
    edge(entry.escalatorUp, hub, false);
  }
  if (hasKind('escalator', 'Eskalator turun')) {
    entry.escalatorDown = node(floor, [106.827577, -6.175317]);
    edge(entry.escalatorDown, hub, false);
  }
  main[key] = entry;
}

// Pintu Gedung Utama di ujung timur koridor GF, lalu Area Luar.
const guDoorIn = node(FLOORS.guGf, [106.8275951, GU_Y]);
edge(main.guGf.hub, guDoorIn);
const guDoorOut = node(FLOORS.outdoor, [106.8276, GU_Y]);
const outdoorWest = node(FLOORS.outdoor, [106.8276, -6.1754]);
const outdoorEast = node(FLOORS.outdoor, [106.82795, -6.1754]);
const gtDoorOut = node(FLOORS.outdoor, [106.82799, -6.1753085]);
edge(guDoorOut, outdoorWest);
edge(outdoorWest, outdoorEast);
edge(outdoorEast, gtDoorOut);
const outdoorShortcut = edge(guDoorOut, gtDoorOut, false);

// Gedung Timur: koridor y -6.1752904 … -6.1753266, empat kolom unit, pintu barat.
const GT_Y = -6.1753085;
const gtDoorIn = node(FLOORS.gtGf, [106.828, GT_Y]);
const gtColumns = Array.from({ length: 4 }, (_, j) =>
  node(FLOORS.gtGf, [106.8280452 + j * 0.0000904, GT_Y]),
);
[gtDoorIn, ...gtColumns].forEach((id, i, all) => {
  if (i > 0) edge(all[i - 1] ?? '', id);
});
gtColumns.forEach((column, j) => {
  const x = 106.8280452 + j * 0.0000904;
  for (const y of [-6.1752904, -6.1753266]) {
    const unit = unitAt(FLOORS.gtGf, x, y);
    if (!unit) continue;
    const entrance = node(FLOORS.gtGf, [x, y], 'entrance', unit.properties.id);
    entrances.set(unit.properties.id, entrance);
    edge(entrance, column);
  }
});

const stopsOf = (key: keyof MainFloor) =>
  (['guGf', 'guL1', 'guL2'] as const).flatMap((floor): [string, string][] => {
    const id = main[floor][key];
    return typeof id === 'string' ? [[FLOORS[floor], id]] : [];
  });

const lift = connector('elevator', 'Lift 1', stopsOf('lift'), { accessible: true });
const stairs = connector('stairs', 'Tangga Barat', stopsOf('stairs'), { accessible: false });
const escalatorUp = connector('escalator', 'Eskalator naik', stopsOf('escalatorUp'), {
  accessible: false,
  direction: 'up',
});
const escalatorDown = connector('escalator', 'Eskalator turun', stopsOf('escalatorDown'), {
  accessible: false,
  direction: 'down',
});
const guDoor = connector(
  'building_door',
  'Pintu Gedung Utama',
  [
    [FLOORS.guGf, guDoorIn],
    [FLOORS.outdoor, guDoorOut],
  ],
  { accessible: true },
);
const gtDoor = connector(
  'building_door',
  'Pintu Barat Gedung Timur',
  [
    [FLOORS.gtGf, gtDoorIn],
    [FLOORS.outdoor, gtDoorOut],
  ],
  { accessible: true },
);

/** Node, edge, dan konektor yang dirujuk test. */
export const GRAPH = {
  lobby,
  infoPoint,
  main,
  guDoorIn,
  guDoorOut,
  outdoorWest,
  outdoorEast,
  gtDoorOut,
  gtDoorIn,
  gtColumns,
  outdoorShortcut,
  connectors: { lift, stairs, escalatorUp, escalatorDown, guDoor, gtDoor },
} as const;

/** Node masuk unit atau fasilitas (id fitur → id node). */
export const ENTRANCES: ReadonlyMap<string, string> = entrances;

/** Id unit dari kode unitnya. */
export function unitIdOf(code: string): string {
  const unit = features.find((f) => f.properties.unitCode === code);
  if (!unit) throw new Error(`Unit ${code} tidak ada`);
  return unit.properties.id;
}

/** Salinan graf agar test yang mengubahnya tidak memengaruhi test lain. */
export function sampleGraph(): SnapshotGraph {
  return JSON.parse(JSON.stringify({ nodes, edges, connectors })) as SnapshotGraph;
}
