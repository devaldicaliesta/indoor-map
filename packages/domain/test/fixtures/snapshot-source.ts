import type {
  SnapshotFeatureKind,
  SnapshotGeometry,
  SnapshotPolygon,
  SnapshotSource,
} from '../../src';
import { EMPTY_OPENING_HOURS } from '../../src';
import { GRAPH, sampleGraph } from './venue-graph';
import sample from './venue-sample.json';

// Id tetap agar test bisa menunjuk entitas tertentu.
export const IDS = {
  toiletType: '0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4a01',
  extinguisherType: '0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4a02',
  serviceType: '0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4a03',
  examCategory: '0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4a04',
  radiology: '0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4a05',
  lab: '0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4a06',
  closedPharmacy: '0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4a07',
  waitingRoom: '0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4a08',
  lobbyOrigin: '0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4a09',
  lobbyInfoPoint: '0a9b3f6e-1c2d-4e5f-8a9b-0c1d2e3f4a0a',
} as const;

const [mainBuilding, eastBuilding] = sample.buildings;
const features = sample.features.features;
const units = features.filter((f) => f.properties.kind === 'unit');
const groundFloor = sample.floors.find((f) => f.buildingId === mainBuilding?.id && f.level === 0);

export const RADIOLOGY_UNITS = units.slice(0, 2).map((u) => u.properties.id);

const FOOTPRINT: SnapshotPolygon = {
  type: 'Polygon',
  coordinates: [
    [
      [106.8267999, -6.1750999],
      [106.8276001, -6.1750999],
      [106.8276001, -6.1754701],
      [106.8267999, -6.1754701],
      [106.8267999, -6.1750999],
    ],
  ],
};

/** `venue-sample.json` dilengkapi lokasi, kategori, alias, titik asal, dan pengaturan tampilan. */
export function sampleSnapshotSource(): SnapshotSource {
  return {
    version: 3,
    publishedAt: '2026-09-30T06:00:00.000Z',
    defaultLanguage: 'id',
    enabledFeatures: ['info_point', '3d'],
    venue: {
      id: sample.venue.id,
      name: sample.venue.name,
      timezone: 'Asia/Jakarta',
      defaultBuildingId: mainBuilding?.id ?? null,
      logoPath: `venues/${sample.venue.id}/logo.png`,
    },
    display: {
      defaultMode: '3d',
      heights: { unit: 4, wall: 5 },
      colors: { unit: '#d9dcd4' },
      camera: { center: [106.8272, -6.1753], zoom: 18.5, pitch: 40, bearing: -12 },
      branding: { displayName: 'RS Kenari', primaryColor: '#0b1f4d', routeColor: '#e4002b' },
    },
    // Urutan database sengaja terbalik agar pengurutan builder teruji.
    buildings: [
      {
        ...(eastBuilding ?? { id: '', name: '', code: '' }),
        footprint: null,
        defaultFloorId: null,
        sortOrder: 1,
      },
      {
        ...(mainBuilding ?? { id: '', name: '', code: '' }),
        footprint: FOOTPRINT,
        defaultFloorId: groundFloor?.id ?? null,
        sortOrder: 0,
      },
    ],
    floors: [...sample.floors].reverse().map((f) => ({ ...f, heightM: 4, sortOrder: 0 })),
    features: features.map((f) => ({
      id: f.properties.id,
      floorId: f.properties.floorId,
      kind: f.properties.kind as SnapshotFeatureKind,
      geometry: f.geometry as SnapshotGeometry,
      name: 'name' in f.properties ? (f.properties.name ?? null) : null,
      unitCode: 'unitCode' in f.properties ? (f.properties.unitCode ?? null) : null,
      unitStatus: f.properties.kind === 'unit' ? 'occupied' : null,
      height: null,
      color: null,
      facilityTypeId: f.properties.kind === 'facility' ? IDS.toiletType : null,
      subtype: f.properties.kind === 'outdoor_area' ? 'road' : null,
    })),
    facilityTypes: [
      { id: IDS.toiletType, name: 'Toilet', icon: 'builtin:toilet', isSafety: false, sortOrder: 1 },
      {
        id: IDS.extinguisherType,
        name: 'APAR',
        icon: 'builtin:fire-extinguisher',
        isSafety: true,
        sortOrder: 0,
      },
    ],
    locationTypes: [
      {
        id: IDS.serviceType,
        name: 'Layanan',
        icon: null,
        color: '#2f6f4f',
        sortOrder: 0,
        fields: [
          {
            key: 'extension',
            label: 'Ekstensi telepon',
            type: 'text',
            options: [],
            isVisible: true,
            isSearchable: true,
            sortOrder: 0,
          },
          {
            key: 'staff_phone',
            label: 'HP penanggung jawab',
            type: 'text',
            options: [],
            isVisible: false,
            isSearchable: false,
            sortOrder: 1,
          },
        ],
      },
    ],
    categories: [
      {
        id: IDS.examCategory,
        locationTypeId: IDS.serviceType,
        name: 'Pemeriksaan',
        icon: null,
        sortOrder: 0,
      },
    ],
    locations: [
      {
        id: IDS.radiology,
        code: 'RAD-01',
        name: 'Radiologi',
        description: 'Rontgen dan CT scan.',
        locationTypeId: IDS.serviceType,
        status: 'active',
        openingDate: null,
        categoryIds: [IDS.examCategory],
        unitIds: [...RADIOLOGY_UNITS],
        primaryUnitId: RADIOLOGY_UNITS[0] ?? null,
        logoPath: null,
        photoPaths: [`locations/${sample.venue.id}/${IDS.radiology}/1.jpg`],
        customFields: { extension: '1203', staff_phone: '0812-0000-1111' },
        hours: {
          weekly: [
            ...Array.from({ length: 5 }, () => [{ opens: '08:00', closes: '16:00' }]),
            [],
            [],
          ],
          special: { '2026-08-17': [] },
        },
      },
      {
        id: IDS.lab,
        code: null,
        name: 'Laboratorium',
        description: null,
        locationTypeId: IDS.serviceType,
        status: 'coming_soon',
        openingDate: '2026-11-01',
        categoryIds: [IDS.examCategory],
        unitIds: [],
        primaryUnitId: null,
        logoPath: null,
        photoPaths: [],
        customFields: {},
        hours: EMPTY_OPENING_HOURS,
      },
      {
        id: IDS.waitingRoom,
        code: null,
        name: 'Ruang Tunggu Ümum',
        description: null,
        locationTypeId: IDS.serviceType,
        status: 'inactive_temporary',
        openingDate: null,
        categoryIds: [],
        unitIds: [],
        primaryUnitId: null,
        logoPath: null,
        photoPaths: [],
        customFields: {},
        hours: EMPTY_OPENING_HOURS,
      },
      {
        id: IDS.closedPharmacy,
        code: 'APT-OLD',
        name: 'Apotek Lama',
        description: null,
        locationTypeId: IDS.serviceType,
        status: 'inactive_permanent',
        openingDate: null,
        categoryIds: [],
        unitIds: [],
        primaryUnitId: null,
        logoPath: null,
        photoPaths: [],
        customFields: {},
        hours: EMPTY_OPENING_HOURS,
      },
    ],
    aliases: [
      { targetKind: 'location', targetId: IDS.radiology, keyword: 'Rontgen' },
      { targetKind: 'category', targetId: IDS.examCategory, keyword: 'Periksa' },
      { targetKind: 'facility_type', targetId: IDS.toiletType, keyword: 'WC' },
      { targetKind: 'location', targetId: IDS.closedPharmacy, keyword: 'Obat lama' },
    ],
    graph: sampleGraph(),
    instructionTemplates: [
      { action: 'start', id: 'Mulai dari {origin}', en: 'Start at {origin}' },
      { action: 'arrive', id: 'Tiba di {destination}', en: 'Arrive at {destination}' },
    ],
    originPoints: [
      {
        id: IDS.lobbyOrigin,
        floorId: groundFloor?.id ?? '',
        name: 'Lobi Utama',
        coordinates: [106.826800012345, -6.175280854321],
        headingDeg: 90,
        nodeId: GRAPH.lobby,
        code: '3fa9c1d2e4b5',
      },
    ],
    infoPoints: [
      {
        id: IDS.lobbyInfoPoint,
        code: 'IP-LOBI',
        name: 'Info Point Lobi',
        floorId: groundFloor?.id ?? '',
        coordinates: [106.82689, -6.17528085],
        headingDeg: 180,
        defaultMode: '2d',
        force2d: false,
        defaultLanguage: 'id',
        idleSeconds: 60,
        nodeId: GRAPH.infoPoint,
      },
    ],
  };
}
