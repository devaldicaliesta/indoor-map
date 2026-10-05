import {
  EMPTY_OPENING_HOURS,
  type SnapshotConnector,
  type SnapshotNavEdge,
  type SnapshotNavNode,
  type SnapshotNodeRole,
  type SnapshotPolygon,
  type SnapshotPosition,
  type SnapshotSource,
  type SourceFeature,
  type SourceLocation,
} from '@indoor/domain';

/**
 * Venue besar untuk uji performa: 1 gedung, 10 lantai, 2.000 fitur (196 unit + 4 fasilitas per
 * lantai), 490 lokasi, dan graf tepat 20.000 edge (grid koridor 30 × 30 berjarak 5 m, pintu unit,
 * lift dan tangga melayani semua lantai, ditambah diagonal sampai 2.000 edge per lantai).
 * Id deterministik; `insertVenue` (packages/data) menggantinya dengan UUID baru saat disimpan.
 */
export interface VenueShape {
  floors: number;
  unitsPerSide: number;
  facilitiesPerFloor: number;
  gridSize: number;
  gridStepM: number;
  edgesPerFloor: number;
  unitsPerLocation: number;
}

export const LARGE: VenueShape = {
  floors: 10,
  unitsPerSide: 14,
  facilitiesPerFloor: 4,
  gridSize: 30,
  gridStepM: 5,
  edgesPerFloor: 2_000,
  unitsPerLocation: 4,
};

/** Satu lantai berisi 1.000 fitur (961 unit + 39 fasilitas) untuk uji kelancaran editor. */
export const DENSE_FLOOR: VenueShape = {
  ...LARGE,
  floors: 1,
  unitsPerSide: 31,
  facilitiesPerFloor: 39,
};

const ORIGIN: SnapshotPosition = [106.82, -6.18];
const M_PER_DEG_LAT = 110_574;
const M_PER_DEG_LNG = 111_320 * Math.cos((ORIGIN[1] * Math.PI) / 180);

/** Posisi `x` meter ke timur dan `y` meter ke selatan dari pojok barat laut gedung. */
const at = (x: number, y: number): SnapshotPosition => [
  ORIGIN[0] + x / M_PER_DEG_LNG,
  ORIGIN[1] - y / M_PER_DEG_LAT,
];

const rect = (x: number, y: number, w: number, h: number): SnapshotPolygon => ({
  type: 'Polygon',
  coordinates: [[at(x, y), at(x + w, y), at(x + w, y + h), at(x, y + h), at(x, y)]],
});

const uuid = (kind: number, n: number) =>
  `${kind.toString(16).padStart(8, '0')}-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;

const ID = { building: 1, floor: 2, feature: 3, node: 4, edge: 5, connector: 6, location: 7 };
const VENUE_ID = uuid(0, 1);
const TYPE_ID = uuid(8, 1);
const CATEGORY_ID = uuid(8, 2);
const FACILITY_TYPE_ID = uuid(8, 3);
const ORIGIN_ID = uuid(8, 4);

function lengthM(a: SnapshotPosition, b: SnapshotPosition): number {
  const dx = (b[0] - a[0]) * M_PER_DEG_LNG;
  const dy = (b[1] - a[1]) * M_PER_DEG_LAT;
  return Math.round(Math.hypot(dx, dy) * 100) / 100;
}

const floorName = (index: number) => (index === 0 ? 'GF' : `L${index}`);

class GraphBuilder {
  readonly nodes: SnapshotNavNode[] = [];
  readonly edges: SnapshotNavEdge[] = [];
  private readonly byId = new Map<string, SnapshotNavNode>();

  node(
    floorId: string,
    coordinates: SnapshotPosition,
    role: SnapshotNodeRole = 'path',
    featureId: string | null = null,
  ) {
    const node = {
      id: uuid(ID.node, this.nodes.length + 1),
      floorId,
      coordinates,
      role,
      featureId,
    };
    this.nodes.push(node);
    this.byId.set(node.id, node);
    return node.id;
  }

  edge(from: string, to: string, accessible = true) {
    const a = this.byId.get(from);
    const b = this.byId.get(to);
    if (!a || !b) throw new Error('Node edge tidak ada');
    this.edges.push({
      id: uuid(ID.edge, this.edges.length + 1),
      floorId: a.floorId,
      from,
      to,
      lengthM: lengthM(a.coordinates, b.coordinates),
      accessible,
    });
  }
}

interface FloorGraph {
  grid: string[][];
  lift: string;
  stairs: string;
}

function floorFeatures(
  shape: VenueShape,
  floorId: string,
  floorIndex: number,
  graph: GraphBuilder,
  grid: string[][],
) {
  const features: SourceFeature[] = [];
  const span = (shape.gridSize - 1) * shape.gridStepM;
  const cell = span / shape.unitsPerSide;
  const base = floorIndex * (shape.unitsPerSide ** 2 + shape.facilitiesPerFloor);
  for (let row = 0; row < shape.unitsPerSide; row++) {
    for (let col = 0; col < shape.unitsPerSide; col++) {
      const n = row * shape.unitsPerSide + col;
      const id = uuid(ID.feature, base + n + 1);
      const x = col * cell + 1;
      const y = row * cell + 1;
      features.push({
        id,
        floorId,
        kind: 'unit',
        geometry: rect(x, y, cell - 2, cell - 3),
        name: null,
        unitCode: `${floorName(floorIndex)}-${String(n + 1).padStart(3, '0')}`,
        unitStatus: 'occupied',
        height: null,
        color: null,
        facilityTypeId: null,
        subtype: null,
      });
      // Pintu di sisi selatan unit, tersambung ke node koridor terdekat.
      const door = at(x + (cell - 2) / 2, y + cell - 2);
      const entrance = graph.node(floorId, door, 'entrance', id);
      const gx = Math.round((x + (cell - 2) / 2) / shape.gridStepM);
      const gy = Math.round((y + cell - 2) / shape.gridStepM);
      graph.edge(entrance, grid[gy]?.[gx] ?? '');
    }
  }
  for (let i = 0; i < shape.facilitiesPerFloor; i++) {
    const id = uuid(ID.feature, base + shape.unitsPerSide ** 2 + i + 1);
    const gx = Math.round(((i + 1) * (shape.gridSize - 1)) / (shape.facilitiesPerFloor + 1));
    const position = at(gx * shape.gridStepM, 0);
    features.push({
      id,
      floorId,
      kind: 'facility',
      geometry: { type: 'Point', coordinates: position },
      name: null,
      unitCode: null,
      unitStatus: null,
      height: null,
      color: null,
      facilityTypeId: FACILITY_TYPE_ID,
      subtype: null,
    });
    graph.edge(graph.node(floorId, position, 'entrance', id), grid[0]?.[gx] ?? '');
  }
  return features;
}

function floorGraph(shape: VenueShape, floorId: string, graph: GraphBuilder): FloorGraph {
  const size = shape.gridSize;
  const step = shape.gridStepM;
  const grid = Array.from({ length: size }, (_, y) =>
    Array.from({ length: size }, (_, x) => graph.node(floorId, at(x * step, y * step))),
  );
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (x + 1 < size) graph.edge(grid[y]?.[x] ?? '', grid[y]?.[x + 1] ?? '');
      if (y + 1 < size) graph.edge(grid[y]?.[x] ?? '', grid[y + 1]?.[x] ?? '');
    }
  }
  const lift = graph.node(floorId, at(-step, 0), 'connector');
  graph.edge(lift, grid[0]?.[0] ?? '');
  const stairs = graph.node(floorId, at(size * step, (size - 1) * step), 'connector');
  graph.edge(stairs, grid[size - 1]?.[size - 1] ?? '', false);
  return { grid, lift, stairs };
}

/** Diagonal deterministik sampai lantai ini memiliki `edgesPerFloor` edge. */
function padDiagonals(shape: VenueShape, graph: GraphBuilder, grid: string[][], target: number) {
  const cells = (shape.gridSize - 1) ** 2;
  // 37 koprima dengan 29² sehingga setiap sel dipakai paling banyak sekali (tanpa edge ganda).
  for (let k = 0; graph.edges.length < target; k++) {
    const cell = (k * 37) % cells;
    const x = cell % (shape.gridSize - 1);
    const y = Math.floor(cell / (shape.gridSize - 1));
    graph.edge(grid[y]?.[x] ?? '', grid[y + 1]?.[x + 1] ?? '');
  }
}

function locations(shape: VenueShape, units: SourceFeature[]): SourceLocation[] {
  const result: SourceLocation[] = [];
  for (let i = 0; i < units.length; i += shape.unitsPerLocation) {
    const n = result.length + 1;
    const unit = units[i];
    if (!unit) break;
    result.push({
      id: uuid(ID.location, n),
      code: `LOK-${String(n).padStart(4, '0')}`,
      name: `Lokasi ${String(n).padStart(4, '0')}`,
      description: null,
      locationTypeId: TYPE_ID,
      status: 'active',
      openingDate: null,
      categoryIds: [CATEGORY_ID],
      unitIds: [unit.id],
      primaryUnitId: unit.id,
      logoPath: null,
      photoPaths: [],
      customFields: {},
      hours: EMPTY_OPENING_HOURS,
    });
  }
  return result;
}

export function largeVenueSource(shape: VenueShape = LARGE): SnapshotSource {
  const graph = new GraphBuilder();
  const buildingId = uuid(ID.building, 1);
  const floors = Array.from({ length: shape.floors }, (_, i) => ({
    id: uuid(ID.floor, i + 1),
    buildingId,
    name: floorName(i),
    level: i,
    heightM: 4,
    isOutdoor: false,
    sortOrder: i,
  }));
  const features: SourceFeature[] = [];
  const perFloor: FloorGraph[] = [];
  floors.forEach((floor, i) => {
    const g = floorGraph(shape, floor.id, graph);
    features.push(...floorFeatures(shape, floor.id, i, graph, g.grid));
    padDiagonals(shape, graph, g.grid, (i + 1) * shape.edgesPerFloor);
    perFloor.push(g);
  });
  const ground = perFloor[0];
  const originNode = graph.node(floors[0]?.id ?? '', at(-2 * shape.gridStepM, 0), 'origin');
  // Edge titik asal menggantikan satu diagonal agar total tetap 20.000.
  graph.edges.pop();
  graph.edge(originNode, ground?.lift ?? '');

  const connector = (
    n: number,
    kind: SnapshotConnector['kind'],
    name: string,
    key: 'lift' | 'stairs',
    accessible: boolean,
  ): SnapshotConnector => ({
    id: uuid(ID.connector, n),
    kind,
    name,
    direction: null,
    accessible,
    stops: perFloor.map((g, i) => ({ floorId: floors[i]?.id ?? '', nodeId: g[key] })),
  });

  const span = (shape.gridSize + 1) * shape.gridStepM;
  return {
    version: 1,
    publishedAt: '2026-10-05T00:00:00.000Z',
    defaultLanguage: 'id',
    enabledFeatures: ['3d', 'info_point'],
    venue: {
      id: VENUE_ID,
      name: 'Venue Besar',
      timezone: 'Asia/Jakarta',
      defaultBuildingId: buildingId,
      logoPath: null,
    },
    display: null,
    buildings: [
      {
        id: buildingId,
        name: 'Gedung Besar',
        code: 'GB',
        footprint: rect(-2 * shape.gridStepM, -shape.gridStepM, span + shape.gridStepM, span),
        defaultFloorId: floors[0]?.id ?? null,
        sortOrder: 0,
      },
    ],
    floors,
    features,
    facilityTypes: [
      {
        id: FACILITY_TYPE_ID,
        name: 'Toilet',
        icon: 'builtin:toilet',
        isSafety: false,
        sortOrder: 0,
      },
    ],
    locationTypes: [
      { id: TYPE_ID, name: 'Layanan', icon: null, color: '#2f6f4f', sortOrder: 0, fields: [] },
    ],
    categories: [
      { id: CATEGORY_ID, locationTypeId: TYPE_ID, name: 'Umum', icon: null, sortOrder: 0 },
    ],
    locations: locations(
      shape,
      features.filter((f) => f.kind === 'unit'),
    ),
    aliases: [],
    graph: {
      nodes: graph.nodes,
      edges: graph.edges,
      connectors: [
        connector(1, 'elevator', 'Lift Utama', 'lift', true),
        connector(2, 'stairs', 'Tangga Darurat', 'stairs', false),
      ],
    },
    instructionTemplates: [],
    originPoints: [
      {
        id: ORIGIN_ID,
        floorId: floors[0]?.id ?? '',
        name: 'Lobi',
        coordinates: at(-2 * shape.gridStepM, 0),
        headingDeg: 90,
        nodeId: originNode,
        code: 'a0b1c2d3e4f5',
      },
    ],
    infoPoints: [],
  };
}
