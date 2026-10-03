import type {
  SnapshotConnector,
  SnapshotGeometry,
  SnapshotNavEdge,
  SnapshotNavNode,
  SnapshotPolygon,
  SnapshotPosition,
  SnapshotSource,
  SourceFeature,
} from '../../../src';
import { EMPTY_OPENING_HOURS, INSTRUCTION_ACTIONS } from '../../../src';

/** Venue kecil yang lolos semua aturan publish: dua lantai, lift, titik asal, satu lokasi. */
export const ID = {
  building: 'b-utama',
  gf: 'f-gf',
  l1: 'f-l1',
  u1: 'u-gf-1',
  u2: 'u-gf-2',
  u3: 'u-l1-1',
  toilet: 'fac-toilet',
  lift: 'conn-lift',
  origin: 'origin-lobi',
  location: 'loc-1',
  type: 'type-1',
} as const;

const ORIGIN: SnapshotPosition = [106.8, -6.2];
const DEG_PER_M_LAT = 1 / 111_320;
const DEG_PER_M_LNG = 1 / (111_320 * Math.cos((6.2 * Math.PI) / 180));

/** Koordinat dari meter timur/utara terhadap titik asal fixture. */
export const at = (east: number, north: number): SnapshotPosition => [
  ORIGIN[0] + east * DEG_PER_M_LNG,
  ORIGIN[1] + north * DEG_PER_M_LAT,
];

export function rect(x: number, y: number, w: number, h: number): SnapshotPolygon {
  return {
    type: 'Polygon',
    coordinates: [[at(x, y), at(x + w, y), at(x + w, y + h), at(x, y + h), at(x, y)]],
  };
}

function feature(
  id: string,
  floorId: string,
  geometry: SnapshotGeometry,
  extra: Partial<SourceFeature> = {},
): SourceFeature {
  return {
    id,
    floorId,
    kind: 'unit',
    geometry,
    name: null,
    unitCode: null,
    unitStatus: 'occupied',
    height: null,
    color: null,
    facilityTypeId: null,
    subtype: null,
    ...extra,
  };
}

const node = (
  id: string,
  floorId: string,
  position: SnapshotPosition,
  role: SnapshotNavNode['role'] = 'path',
  featureId: string | null = null,
): SnapshotNavNode => ({
  id,
  floorId,
  coordinates: position,
  role,
  featureId,
});

const edge = (from: string, to: string, floorId: string): SnapshotNavEdge => ({
  id: `${from}-${to}`,
  floorId,
  from,
  to,
  lengthM: 5,
  accessible: true,
});

export function validSource(): SnapshotSource {
  const lift: SnapshotConnector = {
    id: ID.lift,
    kind: 'elevator',
    name: 'Lift 1',
    direction: null,
    accessible: true,
    stops: [
      { floorId: ID.gf, nodeId: 'c-gf' },
      { floorId: ID.l1, nodeId: 'c-l1' },
    ],
  };
  return {
    version: 1,
    publishedAt: '2026-10-03T00:00:00.000Z',
    defaultLanguage: 'id',
    enabledFeatures: [],
    venue: {
      id: 'v-1',
      name: 'Venue Uji',
      timezone: 'Asia/Jakarta',
      defaultBuildingId: ID.building,
      logoPath: null,
    },
    display: null,
    buildings: [
      {
        id: ID.building,
        name: 'Gedung Utama',
        code: 'GU',
        footprint: rect(-5, -20, 50, 40),
        defaultFloorId: ID.gf,
        sortOrder: 0,
      },
    ],
    floors: [
      {
        id: ID.gf,
        buildingId: ID.building,
        name: 'GF',
        level: 0,
        heightM: 4,
        isOutdoor: false,
        sortOrder: 0,
      },
      {
        id: ID.l1,
        buildingId: ID.building,
        name: 'L1',
        level: 1,
        heightM: 4,
        isOutdoor: false,
        sortOrder: 1,
      },
    ],
    features: [
      feature(ID.u1, ID.gf, rect(0, 0, 10, 10), { unitCode: 'GF-01' }),
      feature(ID.u2, ID.gf, rect(20, 0, 10, 10), { unitCode: 'GF-02' }),
      feature(
        ID.toilet,
        ID.gf,
        { type: 'Point', coordinates: at(15, -8) },
        { kind: 'facility', unitStatus: null },
      ),
      feature(ID.u3, ID.l1, rect(0, 0, 10, 10), { unitCode: 'L1-01' }),
    ],
    facilityTypes: [],
    locationTypes: [
      {
        id: ID.type,
        name: 'Layanan',
        icon: null,
        color: null,
        sortOrder: 0,
        fields: [
          {
            key: 'telepon',
            label: 'Telepon',
            type: 'text',
            options: [],
            isVisible: true,
            isSearchable: false,
            isRequired: true,
            sortOrder: 0,
          },
        ],
      },
    ],
    categories: [],
    locations: [
      {
        id: ID.location,
        code: 'L-01',
        name: 'Klinik',
        description: null,
        locationTypeId: ID.type,
        status: 'active',
        openingDate: null,
        categoryIds: [],
        unitIds: [ID.u1],
        primaryUnitId: ID.u1,
        hours: EMPTY_OPENING_HOURS,
        logoPath: null,
        photoPaths: [],
        customFields: { telepon: '021 555' },
      },
    ],
    aliases: [],
    graph: {
      nodes: [
        node('p1', ID.gf, at(0, -5)),
        node('p2', ID.gf, at(30, -5)),
        node('e1', ID.gf, at(5, 0), 'entrance', ID.u1),
        node('e2', ID.gf, at(25, 0), 'entrance', ID.u2),
        node('e-toilet', ID.gf, at(15, -8), 'entrance', ID.toilet),
        node('c-gf', ID.gf, at(35, -5), 'connector'),
        node('c-l1', ID.l1, at(35, -5), 'connector'),
        node('p3', ID.l1, at(5, -5)),
        node('e3', ID.l1, at(5, 0), 'entrance', ID.u3),
      ],
      edges: [
        edge('p1', 'p2', ID.gf),
        edge('p1', 'e1', ID.gf),
        edge('p2', 'e2', ID.gf),
        edge('p1', 'e-toilet', ID.gf),
        edge('p2', 'c-gf', ID.gf),
        edge('c-l1', 'p3', ID.l1),
        edge('p3', 'e3', ID.l1),
      ],
      connectors: [lift],
    },
    instructionTemplates: INSTRUCTION_ACTIONS.map((action) => ({
      action,
      id: `teks ${action}`,
      en: `text ${action}`,
    })),
    originPoints: [
      {
        id: ID.origin,
        floorId: ID.gf,
        name: 'Lobi',
        coordinates: at(0, -5),
        headingDeg: 0,
        nodeId: 'p1',
        code: 'abcdefabcdef',
      },
    ],
    infoPoints: [],
  };
}
