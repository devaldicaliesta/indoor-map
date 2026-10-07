import type {
  OpeningHours,
  SnapshotConnector,
  SnapshotConnectorKind,
  SnapshotGeometry,
  SnapshotNavEdge,
  SnapshotNavNode,
  SnapshotPolygon,
  SnapshotPosition,
  SnapshotSource,
  SourceFeature,
  SourceLocation,
} from '../../../src';
import {
  DEFAULT_INSTRUCTION_TEMPLATES,
  EMPTY_OPENING_HOURS,
  INSTRUCTION_ACTIONS,
} from '../../../src';

/**
 * Penyusun venue uji besar yang lolos validasi publish: gedung persegi panjang dengan koridor
 * memanjang di tengah, deretan unit di kedua sisi (masing-masing bertitik masuk ke koridor),
 * konektor di ujung koridor, fasilitas di area ujung, dan Area Luar untuk venue multi-gedung.
 * Semua id UUID deterministik dari kunci teks, sehingga `insertVenue` bisa memetakan ulang.
 */

/** UUID v4-berbentuk yang stabil untuk satu kunci (FNV-1a 32-bit empat kali dengan garam). */
export function stableUuid(key: string): string {
  const part = (salt: number) => {
    let h = 0x811c9dc5 ^ salt;
    for (let i = 0; i < key.length; i += 1) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
  };
  const hex = `${part(1)}${part(2)}${part(3)}${part(4)}`;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export interface FloorSpec {
  name: string;
  level: number;
}

/** Titik dalam meter timur/utara dari pusat venue. */
export type Pt = readonly [number, number];

export interface FreeFloor {
  id: string;
  name: string;
  level: number;
}

export interface BuildingSpec {
  key: string;
  name: string;
  code: string;
  /** Sudut barat daya gedung, meter dari pusat venue. */
  x: number;
  y: number;
  width: number;
  depth: number;
  floors: FloorSpec[];
  unitWidth: number;
  unitDepth: number;
}

export interface FloorUnit {
  id: string;
  code: string;
  floorId: string;
  buildingId: string;
}

export interface BuiltFloor {
  id: string;
  name: string;
  level: number;
  /** Node jalur ujung barat dan timur koridor. */
  west: string;
  east: string;
  units: FloorUnit[];
}

export interface BuiltBuilding {
  id: string;
  spec: BuildingSpec;
  floors: BuiltFloor[];
}

const CORRIDOR = 4;
const END_ZONE = 8;

export class VenueBuilder {
  readonly source: SnapshotSource;
  private readonly lat: number;

  constructor(
    private readonly seed: string,
    name: string,
    readonly center: SnapshotPosition,
  ) {
    this.lat = center[1];
    this.source = {
      version: 1,
      publishedAt: '2026-10-03T00:00:00.000Z',
      defaultLanguage: 'id',
      enabledFeatures: ['3d', 'info_point'],
      venue: {
        id: this.id('venue'),
        name,
        timezone: 'Asia/Jakarta',
        defaultBuildingId: null,
        logoPath: null,
      },
      display: null,
      buildings: [],
      floors: [
        {
          id: this.id('outdoor'),
          buildingId: null,
          name: 'Area Luar',
          level: 0,
          heightM: 1,
          isOutdoor: true,
          sortOrder: 0,
        },
      ],
      features: [],
      facilityTypes: [],
      locationTypes: [],
      categories: [],
      locations: [],
      aliases: [],
      graph: { nodes: [], edges: [], connectors: [] },
      instructionTemplates: INSTRUCTION_ACTIONS.map((action) => ({
        action,
        ...DEFAULT_INSTRUCTION_TEMPLATES[action],
      })),
      originPoints: [],
      infoPoints: [],
    };
  }

  id(key: string): string {
    return stableUuid(`${this.seed}:${key}`);
  }

  get outdoorFloorId(): string {
    return this.id('outdoor');
  }

  /** Posisi dari meter timur/utara terhadap pusat venue. */
  pos(east: number, north: number): SnapshotPosition {
    const mPerDegLat = 111_320;
    const mPerDegLng = 111_320 * Math.cos((this.lat * Math.PI) / 180);
    return [
      Number((this.center[0] + east / mPerDegLng).toFixed(7)),
      Number((this.center[1] + north / mPerDegLat).toFixed(7)),
    ];
  }

  rect(x: number, y: number, w: number, h: number): SnapshotPolygon {
    return {
      type: 'Polygon',
      coordinates: [
        [
          this.pos(x, y),
          this.pos(x + w, y),
          this.pos(x + w, y + h),
          this.pos(x, y + h),
          this.pos(x, y),
        ],
      ],
    };
  }

  // --- Taksonomi ---------------------------------------------------------------------------

  locationType(key: string, name: string, color: string): string {
    const id = this.id(`type:${key}`);
    this.source.locationTypes = [
      ...this.source.locationTypes,
      {
        id,
        name,
        icon: null,
        color,
        sortOrder: this.source.locationTypes.length,
        fields: [
          {
            key: 'telepon',
            label: 'Telepon',
            type: 'text',
            options: [],
            isVisible: true,
            isSearchable: false,
            isRequired: false,
            sortOrder: 0,
          },
        ],
      },
    ];
    return id;
  }

  category(typeId: string, key: string, name: string, color: string | null = null): string {
    const id = this.id(`category:${key}`);
    this.source.categories = [
      ...this.source.categories,
      {
        id,
        locationTypeId: typeId,
        name,
        icon: null,
        color,
        sortOrder: this.source.categories.length,
      },
    ];
    return id;
  }

  facilityType(key: string, name: string, icon: string, isSafety = false): string {
    const id = this.id(`facility-type:${key}`);
    this.source.facilityTypes = [
      ...this.source.facilityTypes,
      { id, name, icon: `builtin:${icon}`, isSafety, sortOrder: this.source.facilityTypes.length },
    ];
    return id;
  }

  alias(targetKind: 'location' | 'category' | 'facility_type', targetId: string, keyword: string) {
    this.source.aliases = [...this.source.aliases, { targetKind, targetId, keyword }];
  }

  // --- Graf --------------------------------------------------------------------------------

  node(
    key: string,
    floorId: string,
    position: SnapshotPosition,
    role: SnapshotNavNode['role'] = 'path',
    featureId: string | null = null,
  ): string {
    const id = this.id(`node:${key}`);
    this.source.graph.nodes = [
      ...this.source.graph.nodes,
      { id, floorId, coordinates: position, role, featureId },
    ];
    return id;
  }

  edge(from: string, to: string, floorId: string, lengthM: number, accessible = true) {
    const e: SnapshotNavEdge = {
      id: this.id(`edge:${from}:${to}`),
      floorId,
      from,
      to,
      lengthM: Math.max(0.5, Number(lengthM.toFixed(2))),
      accessible,
    };
    this.source.graph.edges = [...this.source.graph.edges, e];
  }

  feature(
    key: string,
    floorId: string,
    kind: SourceFeature['kind'],
    geometry: SnapshotGeometry,
    extra: Partial<SourceFeature> = {},
  ): string {
    const id = this.id(`feature:${key}`);
    this.source.features = [
      ...this.source.features,
      {
        id,
        floorId,
        kind,
        geometry,
        name: null,
        unitCode: null,
        unitStatus: null,
        height: null,
        color: null,
        facilityTypeId: null,
        subtype: null,
        ...extra,
      },
    ];
    return id;
  }

  // --- Gedung ------------------------------------------------------------------------------

  building(spec: BuildingSpec): BuiltBuilding {
    const id = this.id(`building:${spec.key}`);
    const floors = spec.floors.map((f) => this.layoutFloor(spec, id, f));
    const ground = [...floors].sort(
      (a, b) => Math.abs(a.level) - Math.abs(b.level) || b.level - a.level,
    )[0];
    this.source.buildings = [
      ...this.source.buildings,
      {
        id,
        name: spec.name,
        code: spec.code,
        footprint: this.rect(spec.x, spec.y, spec.width, spec.depth),
        defaultFloorId: ground?.id ?? null,
        sortOrder: this.source.buildings.length,
      },
    ];
    this.source.venue = {
      ...this.source.venue,
      defaultBuildingId: this.source.venue.defaultBuildingId ?? id,
    };
    return { id, spec, floors };
  }

  private layoutFloor(spec: BuildingSpec, buildingId: string, floor: FloorSpec): BuiltFloor {
    const floorId = this.id(`floor:${spec.key}:${floor.name}`);
    this.source.floors = [
      ...this.source.floors,
      {
        id: floorId,
        buildingId,
        name: floor.name,
        level: floor.level,
        heightM: 4.5,
        isOutdoor: false,
        sortOrder: floor.level,
      },
    ];
    const key = `${spec.key}:${floor.name}`;
    const yc = spec.y + spec.depth / 2;
    const x0 = spec.x + END_ZONE;
    const columns = Math.floor((spec.width - 2 * END_ZONE) / spec.unitWidth);
    this.feature(
      `${key}:corridor`,
      floorId,
      'corridor',
      this.rect(spec.x + 1, yc - CORRIDOR / 2, spec.width - 2, CORRIDOR),
    );

    const west = this.node(`${key}:west`, floorId, this.pos(spec.x + 3, yc));
    let previous = west;
    let previousX = spec.x + 3;
    const units: FloorUnit[] = [];
    for (let i = 0; i < columns; i += 1) {
      const x = x0 + i * spec.unitWidth;
      const cx = x + spec.unitWidth / 2;
      const path = this.node(`${key}:path:${i}`, floorId, this.pos(cx, yc));
      this.edge(previous, path, floorId, cx - previousX);
      previous = path;
      previousX = cx;
      for (const [side, y0, doorY] of [
        ['A', yc + CORRIDOR / 2, yc + CORRIDOR / 2],
        ['B', yc - CORRIDOR / 2 - spec.unitDepth, yc - CORRIDOR / 2],
      ] as const) {
        const code = `${spec.code}-${floor.name}-${side}${String(i + 1).padStart(2, '0')}`;
        const unitId = this.feature(
          `${key}:unit:${side}${i}`,
          floorId,
          'unit',
          this.rect(x, y0, spec.unitWidth, spec.unitDepth),
          {
            unitCode: code,
            unitStatus: 'occupied',
          },
        );
        const entrance = this.node(
          `${key}:entrance:${side}${i}`,
          floorId,
          this.pos(cx, doorY),
          'entrance',
          unitId,
        );
        this.edge(path, entrance, floorId, CORRIDOR / 2);
        units.push({ id: unitId, code, floorId, buildingId });
      }
    }
    const eastX = spec.x + spec.width - 3;
    const east = this.node(`${key}:east`, floorId, this.pos(eastX, yc));
    this.edge(previous, east, floorId, eastX - previousX);
    return { id: floorId, name: floor.name, level: floor.level, west, east, units };
  }

  /** Fasilitas titik di area ujung barat/timur koridor, tersambung ke node ujung itu. */
  facility(
    building: BuiltBuilding,
    floor: BuiltFloor,
    typeId: string,
    end: 'west' | 'east',
    slot: number,
    name: string | null = null,
  ) {
    const { spec } = building;
    const yc = spec.y + spec.depth / 2;
    const x =
      end === 'west' ? spec.x + 2 + (slot % 2) * 3 : spec.x + spec.width - 2 - (slot % 2) * 3;
    const y = yc + (slot < 2 ? 1 : -1) * (CORRIDOR / 2 + 2 + Math.floor(slot / 4) * 2);
    const key = `${spec.key}:${floor.name}:facility:${end}:${slot}`;
    const id = this.feature(
      key,
      floor.id,
      'facility',
      { type: 'Point', coordinates: this.pos(x, y) },
      { facilityTypeId: typeId, name },
    );
    const entrance = this.node(`${key}:entrance`, floor.id, this.pos(x, y), 'entrance', id);
    this.edge(end === 'west' ? floor.west : floor.east, entrance, floor.id, 4);
  }

  /** Konektor di ujung koridor, satu node per lantai yang dilayani. */
  connector(
    building: BuiltBuilding,
    kind: Exclude<SnapshotConnectorKind, 'building_door'>,
    name: string,
    end: 'west' | 'east',
    floors: readonly BuiltFloor[],
    options: { direction?: 'up' | 'down'; offset?: number } = {},
  ) {
    const { spec } = building;
    const yc = spec.y + spec.depth / 2;
    const offset = options.offset ?? 0;
    const x = end === 'west' ? spec.x + 1.5 : spec.x + spec.width - 1.5;
    const area = kind === 'elevator' ? 'elevator' : kind === 'escalator' ? 'escalator' : 'stairs';
    const stops = floors.map((floor) => {
      const key = `${spec.key}:${floor.name}:${name}`;
      this.feature(`${key}:area`, floor.id, area, this.rect(x - 1, yc + offset - 1, 2, 2));
      const nodeId = this.node(`${key}:stop`, floor.id, this.pos(x, yc + offset), 'connector');
      this.edge(
        end === 'west' ? floor.west : floor.east,
        nodeId,
        floor.id,
        2 + Math.abs(offset),
        kind === 'elevator',
      );
      return { floorId: floor.id, nodeId };
    });
    const connector: SnapshotConnector = {
      id: this.id(`connector:${spec.key}:${name}`),
      kind,
      name,
      direction: kind === 'escalator' ? (options.direction ?? 'up') : null,
      accessible: kind === 'elevator',
      stops,
    };
    this.source.graph.connectors = [...this.source.graph.connectors, connector];
  }

  /** Pintu gedung di ujung barat lantai dasar ke jalur Area Luar; mengembalikan node luar. */
  door(building: BuiltBuilding, ground: BuiltFloor): string {
    const { spec } = building;
    const yc = spec.y + spec.depth / 2;
    const inside = this.node(
      `${spec.key}:door:in`,
      ground.id,
      this.pos(spec.x + 0.5, yc),
      'connector',
    );
    this.edge(ground.west, inside, ground.id, 2.5);
    const outside = this.node(
      `${spec.key}:door:out`,
      this.outdoorFloorId,
      this.pos(spec.x - 2, yc),
      'connector',
    );
    const walk = this.node(`${spec.key}:door:walk`, this.outdoorFloorId, this.pos(spec.x - 6, yc));
    this.edge(outside, walk, this.outdoorFloorId, 4);
    this.source.graph.connectors = [
      ...this.source.graph.connectors,
      {
        id: this.id(`connector:${spec.key}:door`),
        kind: 'building_door',
        name: `Pintu ${spec.name}`,
        direction: null,
        accessible: true,
        stops: [
          { floorId: ground.id, nodeId: inside },
          { floorId: this.outdoorFloorId, nodeId: outside },
        ],
      },
    ];
    return walk;
  }

  /** Jalur Area Luar lurus antar dua node, dengan titik tengah. */
  outdoorPath(key: string, from: string, to: string, via: SnapshotPosition, lengthM: number) {
    const mid = this.node(`outdoor:${key}`, this.outdoorFloorId, via);
    this.edge(from, mid, this.outdoorFloorId, lengthM / 2);
    this.edge(mid, to, this.outdoorFloorId, lengthM / 2);
  }

  outdoorArea(
    key: string,
    subtype: 'road' | 'garden' | 'parking',
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    this.feature(
      `outdoor-area:${key}`,
      this.outdoorFloorId,
      'outdoor_area',
      this.rect(x, y, w, h),
      { subtype },
    );
  }

  // --- Tata letak bebas (koordinat meter timur/utara) -----------------------------------------

  /** Posisi meter setiap node tata letak bebas, untuk menghitung panjang edge. */
  private readonly meters = new Map<string, Pt>();

  poly(ring: readonly Pt[]): SnapshotPolygon {
    const first = ring[0];
    if (!first) throw new Error('poligon kosong');
    return { type: 'Polygon', coordinates: [[...ring, first].map(([x, y]) => this.pos(x, y))] };
  }

  /** Node di posisi meter. */
  at(
    key: string,
    floorId: string,
    p: Pt,
    role: SnapshotNavNode['role'] = 'path',
    featureId: string | null = null,
  ): string {
    const id = this.node(key, floorId, this.pos(p[0], p[1]), role, featureId);
    this.meters.set(id, p);
    return id;
  }

  meterOf(nodeId: string): Pt {
    const p = this.meters.get(nodeId);
    if (!p) throw new Error('node tanpa posisi meter');
    return p;
  }

  /** Edge lurus antara dua node tata letak bebas. */
  link(a: string, b: string, floorId: string, accessible = true) {
    const [ax, ay] = this.meterOf(a);
    const [bx, by] = this.meterOf(b);
    this.edge(a, b, floorId, Math.hypot(bx - ax, by - ay), accessible);
  }

  area(
    key: string,
    floorId: string,
    kind: 'corridor' | 'non_walkable' | 'elevator' | 'escalator' | 'stairs',
    ring: readonly Pt[],
    extra: Partial<SourceFeature> = {},
  ): string {
    return this.feature(key, floorId, kind, this.poly(ring), extra);
  }

  /** Unit poligon bebas dengan titik masuk di `door`, tersambung ke node jalur `path`. */
  unit(
    key: string,
    floorId: string,
    buildingId: string,
    code: string,
    ring: readonly Pt[],
    door: Pt,
    path: string,
    extra: Partial<SourceFeature> = {},
  ): FloorUnit {
    const id = this.feature(key, floorId, 'unit', this.poly(ring), {
      unitCode: code,
      unitStatus: 'occupied',
      ...extra,
    });
    const entrance = this.at(`${key}:entrance`, floorId, door, 'entrance', id);
    this.link(path, entrance, floorId);
    return { id, code, floorId, buildingId };
  }

  facilityAt(
    key: string,
    floorId: string,
    typeId: string,
    p: Pt,
    path: string,
    name: string | null = null,
  ) {
    const id = this.feature(
      key,
      floorId,
      'facility',
      { type: 'Point', coordinates: this.pos(p[0], p[1]) },
      { facilityTypeId: typeId, name },
    );
    const entrance = this.at(`${key}:entrance`, floorId, p, 'entrance', id);
    this.link(path, entrance, floorId);
  }

  landmarkAt(key: string, floorId: string, p: Pt, name: string) {
    this.feature(
      key,
      floorId,
      'landmark',
      { type: 'Point', coordinates: this.pos(p[0], p[1]) },
      {
        name,
      },
    );
  }

  /** Konektor bebas: area 2,5 × 2,5 m dan satu node per lantai, tersambung ke node jalur. */
  connectorAt(
    key: string,
    kind: Exclude<SnapshotConnectorKind, 'building_door'>,
    name: string,
    stops: readonly { floorId: string; at: Pt; path: string }[],
    direction: 'up' | 'down' = 'up',
  ) {
    const area = kind === 'elevator' ? 'elevator' : kind === 'escalator' ? 'escalator' : 'stairs';
    const built = stops.map((stop, i) => {
      const [x, y] = stop.at;
      this.area(`${key}:${i}:area`, stop.floorId, area, [
        [x - 1.25, y - 1.25],
        [x + 1.25, y - 1.25],
        [x + 1.25, y + 1.25],
        [x - 1.25, y + 1.25],
      ]);
      const nodeId = this.at(`${key}:${i}:stop`, stop.floorId, stop.at, 'connector');
      this.link(stop.path, nodeId, stop.floorId, kind === 'elevator');
      return { floorId: stop.floorId, nodeId };
    });
    this.source.graph.connectors = [
      ...this.source.graph.connectors,
      {
        id: this.id(`connector:${key}`),
        kind,
        name,
        direction: kind === 'escalator' ? direction : null,
        accessible: kind === 'elevator',
        stops: built,
      },
    ];
  }

  /** Gedung berfootprint poligon bebas; isi lantainya disusun pemanggil. */
  freeBuilding(spec: {
    key: string;
    name: string;
    code: string;
    footprint: readonly Pt[];
    floors: FloorSpec[];
  }): { id: string; floors: FreeFloor[] } {
    const id = this.id(`building:${spec.key}`);
    const floors = spec.floors.map((floor) => {
      const floorId = this.id(`floor:${spec.key}:${floor.name}`);
      this.source.floors = [
        ...this.source.floors,
        {
          id: floorId,
          buildingId: id,
          name: floor.name,
          level: floor.level,
          heightM: 4.5,
          isOutdoor: false,
          sortOrder: floor.level,
        },
      ];
      return { id: floorId, name: floor.name, level: floor.level };
    });
    const ground = [...floors].sort(
      (a, b) => Math.abs(a.level) - Math.abs(b.level) || b.level - a.level,
    )[0];
    this.source.buildings = [
      ...this.source.buildings,
      {
        id,
        name: spec.name,
        code: spec.code,
        footprint: this.poly(spec.footprint),
        defaultFloorId: ground?.id ?? null,
        sortOrder: this.source.buildings.length,
      },
    ];
    this.source.venue = {
      ...this.source.venue,
      defaultBuildingId: this.source.venue.defaultBuildingId ?? id,
    };
    return { id, floors };
  }

  /** Pintu gedung bebas; mengembalikan node di sisi Area Luar. */
  doorAt(key: string, name: string, groundFloorId: string, inside: Pt, path: string, outside: Pt) {
    const inNode = this.at(`door:${key}:in`, groundFloorId, inside, 'connector');
    this.link(path, inNode, groundFloorId);
    const outNode = this.at(`door:${key}:out`, this.outdoorFloorId, outside, 'connector');
    this.source.graph.connectors = [
      ...this.source.graph.connectors,
      {
        id: this.id(`connector:door:${key}`),
        kind: 'building_door',
        name,
        direction: null,
        accessible: true,
        stops: [
          { floorId: groundFloorId, nodeId: inNode },
          { floorId: this.outdoorFloorId, nodeId: outNode },
        ],
      },
    ];
    return outNode;
  }

  outdoorPoly(key: string, subtype: 'road' | 'garden' | 'parking', ring: readonly Pt[]) {
    this.feature(`outdoor-area:${key}`, this.outdoorFloorId, 'outdoor_area', this.poly(ring), {
      subtype,
    });
  }

  originAt(key: string, floorId: string, nodeId: string, name: string, code: string, heading = 0) {
    const node = this.source.graph.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error('node titik asal tidak ada');
    this.source.originPoints = [
      ...this.source.originPoints,
      {
        id: this.id(`origin:${key}`),
        floorId,
        name,
        coordinates: node.coordinates,
        headingDeg: heading,
        nodeId,
        code,
      },
    ];
  }

  infoAt(floorId: string, nodeId: string, name: string, code: string, heading = 0) {
    const node = this.source.graph.nodes.find((n) => n.id === nodeId);
    if (!node) throw new Error('node Info Point tidak ada');
    this.source.infoPoints = [
      ...this.source.infoPoints,
      {
        id: this.id(`info:${code}`),
        code,
        name,
        floorId,
        coordinates: node.coordinates,
        headingDeg: heading,
        defaultMode: '3d',
        force2d: false,
        defaultLanguage: 'id',
        idleSeconds: 90,
        nodeId,
      },
    ];
  }

  // --- Lokasi dan titik asal -----------------------------------------------------------------

  location(
    unit: FloorUnit,
    typeId: string,
    categoryId: string,
    name: string,
    extra: Partial<SourceLocation> = {},
  ) {
    const location: SourceLocation = {
      id: this.id(`location:${unit.code}`),
      code: unit.code,
      name,
      description: null,
      locationTypeId: typeId,
      status: 'active',
      openingDate: null,
      categoryIds: [categoryId],
      unitIds: [unit.id],
      primaryUnitId: unit.id,
      logoPath: null,
      photoPaths: [],
      hours: EMPTY_OPENING_HOURS,
      customFields: {},
      ...extra,
    };
    this.source.locations = [...this.source.locations, location];
    return location.id;
  }

  vacant(unit: FloorUnit) {
    this.source.features = this.source.features.map((f) =>
      f.id === unit.id ? { ...f, unitStatus: 'vacant' } : f,
    );
  }

  originPoint(building: BuiltBuilding, floor: BuiltFloor, name: string, code: string) {
    const node = this.source.graph.nodes.find((n) => n.id === floor.west);
    if (!node) throw new Error('node barat tidak ada');
    this.source.originPoints = [
      ...this.source.originPoints,
      {
        id: this.id(`origin:${building.spec.key}:${floor.name}`),
        floorId: floor.id,
        name,
        coordinates: node.coordinates,
        headingDeg: 90,
        nodeId: node.id,
        code,
      },
    ];
  }

  infoPoint(floor: BuiltFloor, name: string, code: string) {
    const node = this.source.graph.nodes.find((n) => n.id === floor.west);
    if (!node) throw new Error('node barat tidak ada');
    this.source.infoPoints = [
      ...this.source.infoPoints,
      {
        id: this.id(`info:${code}`),
        code,
        name,
        floorId: floor.id,
        coordinates: node.coordinates,
        headingDeg: 90,
        defaultMode: '3d',
        force2d: false,
        defaultLanguage: 'id',
        idleSeconds: 90,
        nodeId: node.id,
      },
    ];
  }
}

/** Jam buka setiap hari dengan rentang yang sama; `days` = indeks Senin..Minggu yang buka. */
export function dailyHours(
  opens: string,
  closes: string,
  days: readonly number[] = [0, 1, 2, 3, 4, 5, 6],
): OpeningHours {
  return {
    weekly: Array.from({ length: 7 }, (_, i) => (days.includes(i) ? [{ opens, closes }] : [])),
    special: {},
  };
}
