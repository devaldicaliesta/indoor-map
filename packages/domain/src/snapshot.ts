import type { OpeningHours } from './hours';
/**
 * Format snapshot publish yang dibaca Visitor dan Info Point (03-arsitektur.md "Format
 * snapshot"). Builder-nya di `snapshot-builder.ts`, skema zod-nya di `snapshot-schema.ts`.
 *
 * Modul ini dimuat juga oleh Edge Function `publish` di Deno, yang membaca seluruh graf impor
 * (termasuk impor tipe) tanpa bundler, jadi tidak boleh mengimpor apa pun. Tipe yang berdiri
 * sendiri juga membuat perubahan enum internal tidak diam-diam mengubah format publik; test
 * menjaga keduanya tetap sama.
 */

export const SNAPSHOT_SCHEMA_VERSION = 1;

/** 7 desimal ≈ 1 cm: cukup untuk denah dan memperkecil ukuran snapshot. */
export const SNAPSHOT_COORDINATE_DECIMALS = 7;

export const SNAPSHOT_FEATURE_KINDS = [
  'unit',
  'corridor',
  'wall',
  'door',
  'elevator',
  'escalator',
  'stairs',
  'exit',
  'non_walkable',
  'outdoor_area',
  'facility',
  'landmark',
] as const;
export type SnapshotFeatureKind = (typeof SNAPSHOT_FEATURE_KINDS)[number];

export const INSTRUCTION_ACTIONS = [
  'start',
  'straight',
  'turn_left',
  'turn_right',
  'slight_left',
  'slight_right',
  'elevator_up',
  'elevator_down',
  'escalator_up',
  'escalator_down',
  'stairs_up',
  'stairs_down',
  'exit_building',
  'enter_building',
  'arrive',
] as const;
export type InstructionAction = (typeof INSTRUCTION_ACTIONS)[number];

export const SNAPSHOT_UNIT_STATUSES = ['occupied', 'vacant', 'renovation'] as const;
export type SnapshotUnitStatus = (typeof SNAPSHOT_UNIT_STATUSES)[number];

export const SNAPSHOT_OUTDOOR_SUBTYPES = ['road', 'garden', 'parking'] as const;
export type SnapshotOutdoorSubtype = (typeof SNAPSHOT_OUTDOOR_SUBTYPES)[number];

export const SNAPSHOT_LANGUAGES = ['id', 'en'] as const;
export type SnapshotLanguage = (typeof SNAPSHOT_LANGUAGES)[number];

export const SNAPSHOT_DISPLAY_MODES = ['2d', '3d'] as const;
export type SnapshotDisplayMode = (typeof SNAPSHOT_DISPLAY_MODES)[number];

/** Lokasi nonaktif permanen tidak pernah masuk snapshot. */
export const SNAPSHOT_LOCATION_STATUSES = ['active', 'coming_soon', 'inactive_temporary'] as const;
export type SnapshotLocationStatus = (typeof SNAPSHOT_LOCATION_STATUSES)[number];

export const SNAPSHOT_FIELD_TYPES = [
  'text',
  'number',
  'select',
  'opening_hours',
  'image',
  'link',
] as const;
export type SnapshotFieldType = (typeof SNAPSHOT_FIELD_TYPES)[number];

export const SNAPSHOT_NODE_ROLES = [
  'path',
  'entrance',
  'origin',
  'info_point',
  'connector',
] as const;
export type SnapshotNodeRole = (typeof SNAPSHOT_NODE_ROLES)[number];

export const SNAPSHOT_CONNECTOR_KINDS = [
  'elevator',
  'escalator',
  'stairs',
  'building_door',
] as const;
export type SnapshotConnectorKind = (typeof SNAPSHOT_CONNECTOR_KINDS)[number];

export const SNAPSHOT_ESCALATOR_DIRECTIONS = ['up', 'down', 'both'] as const;
export type SnapshotEscalatorDirection = (typeof SNAPSHOT_ESCALATOR_DIRECTIONS)[number];

export type SnapshotPosition = [number, number];

export type SnapshotGeometry =
  | { type: 'Point'; coordinates: SnapshotPosition }
  | { type: 'LineString'; coordinates: SnapshotPosition[] }
  | { type: 'Polygon'; coordinates: SnapshotPosition[][] }
  | { type: 'MultiPolygon'; coordinates: SnapshotPosition[][][] };

export type SnapshotPolygon = Extract<SnapshotGeometry, { type: 'Polygon' }>;

export interface SnapshotCamera {
  center: SnapshotPosition;
  zoom: number;
  pitch: number;
  bearing: number;
}

export interface SnapshotDisplay {
  defaultMode: SnapshotDisplayMode;
  /** Tinggi 3D default per jenis (m); jenis yang tidak disebut memakai default aplikasi. */
  heights: Partial<Record<SnapshotFeatureKind, number>>;
  /** Warna `#rrggbb` per jenis; jenis yang tidak disebut memakai warna default. */
  colors: Partial<Record<SnapshotFeatureKind, string>>;
}

export interface SnapshotVenue {
  id: string;
  name: string;
  timezone: string;
  defaultBuildingId: string | null;
  defaultLanguage: SnapshotLanguage;
  /** Path di bucket `public-assets`; URL-nya dibentuk `@indoor/data`. */
  logoPath: string | null;
  /** Kamera awal; `null` berarti Visitor membingkai lantai default. */
  camera: SnapshotCamera | null;
  display: SnapshotDisplay;
}

export interface SnapshotBuilding {
  id: string;
  name: string;
  code: string;
  footprint: SnapshotPolygon | null;
  defaultFloorId: string | null;
}

export interface SnapshotFloor {
  id: string;
  /** `null` untuk lapisan Area Luar. */
  buildingId: string | null;
  name: string;
  level: number;
  heightM: number;
  isOutdoor: boolean;
}

export interface SnapshotFeatureProperties {
  id: string;
  kind: SnapshotFeatureKind;
  floorId: string;
  name?: string;
  unitCode?: string;
  unitStatus?: SnapshotUnitStatus;
  height?: number;
  color?: string;
  facilityTypeId?: string;
  subtype?: SnapshotOutdoorSubtype;
}

export interface SnapshotFeature {
  type: 'Feature';
  id: string;
  geometry: SnapshotGeometry;
  properties: SnapshotFeatureProperties;
}

export interface SnapshotFeatureCollection {
  type: 'FeatureCollection';
  features: SnapshotFeature[];
}

export interface SnapshotFacilityType {
  id: string;
  name: string;
  /** `builtin:<kunci>` atau path PNG di `public-assets`. */
  icon: string | null;
  isSafety: boolean;
}

export interface SnapshotField {
  key: string;
  label: string;
  type: SnapshotFieldType;
  options: string[];
}

export interface SnapshotLocationType {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  /** Hanya field yang ditandai tampil. */
  fields: SnapshotField[];
}

export interface SnapshotCategory {
  id: string;
  locationTypeId: string;
  name: string;
  icon: string | null;
}

export type SnapshotFieldValue = string | number | boolean | string[];

export interface SnapshotLocation {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  locationTypeId: string;
  status: SnapshotLocationStatus;
  /** Tanggal `YYYY-MM-DD` untuk status segera buka. */
  openingDate: string | null;
  categoryIds: string[];
  /** Id fitur unit yang ditempati. */
  unitIds: string[];
  primaryUnitId: string | null;
  logoPath: string | null;
  photoPaths: string[];
  /** Isi field kustom yang ditandai tampil, per `key`. */
  fields: Record<string, SnapshotFieldValue>;
  /** Jam operasional dalam zona waktu venue; `null` bila tidak dijadwalkan. */
  hours: OpeningHours | null;
}

export const SEARCH_TARGET_KINDS = ['location', 'category', 'facility_type', 'unit'] as const;
export type SearchTargetKind = (typeof SEARCH_TARGET_KINDS)[number];

export interface SearchEntry {
  kind: SearchTargetKind;
  id: string;
  /** Teks gabungan hasil `normalizeSearchText`: huruf kecil, tanpa diakritik. */
  text: string;
}

export interface SnapshotNavNode {
  id: string;
  floorId: string;
  coordinates: SnapshotPosition;
  role: SnapshotNodeRole;
  featureId: string | null;
}

export interface SnapshotNavEdge {
  id: string;
  floorId: string;
  from: string;
  to: string;
  lengthM: number;
  accessible: boolean;
}

export interface SnapshotConnectorStop {
  floorId: string;
  nodeId: string;
}

export interface SnapshotConnector {
  id: string;
  kind: SnapshotConnectorKind;
  name: string;
  direction: SnapshotEscalatorDirection | null;
  accessible: boolean;
  stops: SnapshotConnectorStop[];
}

export interface SnapshotGraph {
  nodes: SnapshotNavNode[];
  edges: SnapshotNavEdge[];
  connectors: SnapshotConnector[];
}

export interface SnapshotOriginPoint {
  id: string;
  floorId: string;
  name: string;
  coordinates: SnapshotPosition;
  headingDeg: number;
  nodeId: string | null;
  /** Kode publik yang dicetak di QR titik asal. */
  code: string;
}

export interface SnapshotInfoPoint {
  id: string;
  code: string;
  name: string;
  floorId: string;
  coordinates: SnapshotPosition;
  headingDeg: number;
  defaultMode: SnapshotDisplayMode;
  force2d: boolean;
  defaultLanguage: SnapshotLanguage;
  idleSeconds: number;
  nodeId: string | null;
}

export interface InstructionText {
  id: string;
  en: string;
}

export interface Snapshot {
  schemaVersion: typeof SNAPSHOT_SCHEMA_VERSION;
  version: number;
  publishedAt: string;
  venue: SnapshotVenue;
  buildings: SnapshotBuilding[];
  /** Area Luar lebih dulu, lalu per gedung dari lantai terendah. */
  floors: SnapshotFloor[];
  features: SnapshotFeatureCollection;
  facilityTypes: SnapshotFacilityType[];
  locations: SnapshotLocation[];
  locationTypes: SnapshotLocationType[];
  categories: SnapshotCategory[];
  searchIndex: SearchEntry[];
  graph: SnapshotGraph;
  instructionTemplates: Record<InstructionAction, InstructionText>;
  originPoints: SnapshotOriginPoint[];
  infoPoints: SnapshotInfoPoint[];
  /** Fitur lisensi yang aktif, misalnya `3d` dan `info_point`. */
  enabledFeatures: string[];
}
