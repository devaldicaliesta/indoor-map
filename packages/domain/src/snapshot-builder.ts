import { hasOpeningHours, type OpeningHours } from './hours';
/**
 * Builder snapshot dari data draft venue. Dijalankan Edge Function `publish` di Deno, jadi
 * hanya mengimpor modul tanpa dependensi dengan ekstensi `.ts` (lihat `snapshot.ts`).
 */
import { sortByOrder } from './names.ts';
import {
  INSTRUCTION_ACTIONS,
  type InstructionAction,
  type InstructionText,
  SNAPSHOT_COORDINATE_DECIMALS,
  SNAPSHOT_FEATURE_KINDS,
  SNAPSHOT_SCHEMA_VERSION,
  type Snapshot,
  type SnapshotBuilding,
  type SnapshotCamera,
  type SnapshotFeature,
  type SnapshotFeatureKind,
  type SnapshotFeatureProperties,
  type SnapshotFieldValue,
  type SnapshotFloor,
  type SnapshotGeometry,
  type SnapshotGraph,
  type SnapshotInfoPoint,
  type SnapshotLocation,
  type SnapshotLocationStatus,
  type SnapshotLocationType,
  type SnapshotOriginPoint,
  type SnapshotPolygon,
  type SnapshotPosition,
  type SnapshotVenue,
} from './snapshot.ts';
import { buildSearchIndex } from './snapshot-search-index.ts';
import type {
  SnapshotSource,
  SourceFeature,
  SourceLocation,
  SourceLocationType,
} from './snapshot-source.ts';

const SCALE = 10 ** SNAPSHOT_COORDINATE_DECIMALS;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const MAX_HEIGHT_M = 100;

const round = (value: number) => Math.round(value * SCALE) / SCALE;
/** Posisi dengan presisi snapshot (7 desimal). */
export const snapshotPosition = (p: readonly number[]): SnapshotPosition => [
  round(p[0] ?? 0),
  round(p[1] ?? 0),
];
const roundRing = (ring: readonly (readonly number[])[]) => ring.map(snapshotPosition);
const byId = (a: { id: string }, b: { id: string }) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Hanya `type` dan `coordinates` yang dibawa; anggota lain seperti `crs` dari PostGIS dibuang. */
export function snapshotGeometry(geometry: SnapshotGeometry): SnapshotGeometry {
  switch (geometry.type) {
    case 'Point':
      return { type: 'Point', coordinates: snapshotPosition(geometry.coordinates) };
    case 'LineString':
      return { type: 'LineString', coordinates: roundRing(geometry.coordinates) };
    case 'Polygon':
      return { type: 'Polygon', coordinates: geometry.coordinates.map(roundRing) };
    case 'MultiPolygon':
      return {
        type: 'MultiPolygon',
        coordinates: geometry.coordinates.map((polygon) => polygon.map(roundRing)),
      };
  }
}

function pickKinds<T>(value: unknown, keep: (v: unknown) => v is T) {
  const picked: Partial<Record<SnapshotFeatureKind, T>> = {};
  if (!isRecord(value)) return picked;
  for (const kind of SNAPSHOT_FEATURE_KINDS) {
    const entry = value[kind];
    if (keep(entry)) picked[kind] = entry;
  }
  return picked;
}

const isHeight = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= MAX_HEIGHT_M;
const isColor = (v: unknown): v is string => typeof v === 'string' && HEX_COLOR.test(v);

function toCamera(value: unknown): SnapshotCamera | null {
  if (!isRecord(value) || !Array.isArray(value.center)) return null;
  const [lng, lat] = value.center as unknown[];
  const numbers = [lng, lat, value.zoom, value.pitch, value.bearing];
  if (!numbers.every((n) => typeof n === 'number' && Number.isFinite(n))) return null;
  const [cLng, cLat, zoom, pitch, bearing] = numbers as number[];
  return {
    center: snapshotPosition([cLng ?? 0, cLat ?? 0]),
    zoom: zoom ?? 0,
    pitch: pitch ?? 0,
    bearing: bearing ?? 0,
  };
}

function toVenue(source: SnapshotSource): SnapshotVenue {
  const { venue, display } = source;
  return {
    id: venue.id,
    name: venue.name,
    timezone: venue.timezone,
    defaultBuildingId: venue.defaultBuildingId,
    defaultLanguage: source.defaultLanguage,
    logoPath: venue.logoPath,
    camera: toCamera(display?.camera),
    display: {
      defaultMode: display?.defaultMode === '3d' ? '3d' : '2d',
      heights: pickKinds(display?.heights, isHeight),
      colors: pickKinds(display?.colors, isColor),
    },
  };
}

function toBuilding(b: SnapshotBuilding): SnapshotBuilding {
  return {
    id: b.id,
    name: b.name,
    code: b.code,
    footprint: b.footprint ? (snapshotGeometry(b.footprint) as SnapshotPolygon) : null,
    defaultFloorId: b.defaultFloorId,
  };
}

function sortFloors(floors: SnapshotSource['floors'], buildingIds: readonly string[]) {
  const rank = (f: SnapshotFloor) => (f.buildingId ? buildingIds.indexOf(f.buildingId) + 1 : 0);
  return [...floors].sort(
    (a, b) => rank(a) - rank(b) || a.level - b.level || a.sortOrder - b.sortOrder || byId(a, b),
  );
}

function toFloor(f: SnapshotFloor): SnapshotFloor {
  return {
    id: f.id,
    buildingId: f.buildingId,
    name: f.name,
    level: f.level,
    heightM: f.heightM,
    isOutdoor: f.isOutdoor,
  };
}

/** Properti opsional hanya ditulis bila ada nilainya agar snapshot tetap kecil. */
function toFeature(f: SourceFeature): SnapshotFeature {
  const properties: SnapshotFeatureProperties = { id: f.id, kind: f.kind, floorId: f.floorId };
  if (f.name) properties.name = f.name;
  if (f.kind === 'unit' && f.unitCode) properties.unitCode = f.unitCode;
  if (f.kind === 'unit' && f.unitStatus) properties.unitStatus = f.unitStatus;
  if (isHeight(f.height)) properties.height = f.height;
  if (isColor(f.color)) properties.color = f.color;
  if (f.kind === 'facility' && f.facilityTypeId) properties.facilityTypeId = f.facilityTypeId;
  if (f.kind === 'outdoor_area' && f.subtype) properties.subtype = f.subtype;
  return { type: 'Feature', id: f.id, geometry: snapshotGeometry(f.geometry), properties };
}

function isFieldValue(value: unknown): value is SnapshotFieldValue {
  if (typeof value === 'string') return value.trim().length > 0;
  if (typeof value === 'number') return Number.isFinite(value);
  if (typeof value === 'boolean') return true;
  return Array.isArray(value) && value.every((v) => typeof v === 'string');
}

function toLocation(l: SourceLocation, visibleKeys: ReadonlySet<string>): SnapshotLocation {
  const fields: Record<string, SnapshotFieldValue> = {};
  for (const [key, value] of Object.entries(l.customFields)) {
    if (visibleKeys.has(key) && isFieldValue(value)) fields[key] = value;
  }
  return {
    id: l.id,
    code: l.code,
    name: l.name,
    description: l.description,
    locationTypeId: l.locationTypeId,
    status: l.status as SnapshotLocationStatus,
    openingDate: l.openingDate,
    categoryIds: [...l.categoryIds].sort(),
    unitIds: [...l.unitIds].sort(),
    primaryUnitId: l.primaryUnitId,
    logoPath: l.logoPath,
    photoPaths: [...l.photoPaths],
    fields,
    hours: hasOpeningHours(l.hours) ? sortedHours(l.hours) : null,
  };
}

/** Tanggal khusus berurutan agar snapshot yang sama menghasilkan berkas yang sama. */
function sortedHours(hours: OpeningHours): OpeningHours {
  return {
    weekly: hours.weekly.map((spans) => [...spans]),
    special: Object.fromEntries(
      Object.keys(hours.special)
        .sort()
        .map((date) => [date, [...(hours.special[date] ?? [])]]),
    ),
  };
}

function toLocationType(t: SourceLocationType): SnapshotLocationType {
  return {
    id: t.id,
    name: t.name,
    icon: t.icon,
    color: isColor(t.color) ? t.color : null,
    fields: [...t.fields]
      .filter((f) => f.isVisible)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.key.localeCompare(b.key))
      .map((f) => ({ key: f.key, label: f.label, type: f.type, options: [...f.options] })),
  };
}

/** Template per aksi untuk ke-15 aksi; aksi tanpa baris berisi teks kosong. */
export function snapshotInstructionTemplates(
  rows: SnapshotSource['instructionTemplates'],
): Record<InstructionAction, InstructionText> {
  const byAction = new Map(rows.map((r) => [r.action, r]));
  const templates = {} as Record<InstructionAction, InstructionText>;
  for (const action of INSTRUCTION_ACTIONS) {
    const row = byAction.get(action);
    templates[action] = { id: row?.id ?? '', en: row?.en ?? '' };
  }
  return templates;
}

/**
 * Graf snapshot: urut id dan koordinat node 7 desimal. Uji rute Admin memakai fungsi yang sama
 * untuk graf draft agar hasilnya sama dengan rute pengunjung setelah publish.
 */
export function snapshotGraph(graph: SnapshotSource['graph']): SnapshotGraph {
  return {
    nodes: [...graph.nodes].sort(byId).map((n) => ({
      id: n.id,
      floorId: n.floorId,
      coordinates: snapshotPosition(n.coordinates),
      role: n.role,
      featureId: n.featureId,
    })),
    edges: [...graph.edges].sort(byId).map((e) => ({
      id: e.id,
      floorId: e.floorId,
      from: e.from,
      to: e.to,
      lengthM: e.lengthM,
      accessible: e.accessible,
    })),
    connectors: [...graph.connectors].sort(byId).map((c) => ({
      id: c.id,
      kind: c.kind,
      name: c.name,
      direction: c.direction,
      accessible: c.accessible,
      stops: c.stops.map((s) => ({ floorId: s.floorId, nodeId: s.nodeId })),
    })),
  };
}

export function snapshotOriginPoint(o: SnapshotOriginPoint): SnapshotOriginPoint {
  return {
    id: o.id,
    floorId: o.floorId,
    name: o.name,
    coordinates: snapshotPosition(o.coordinates),
    headingDeg: o.headingDeg,
    nodeId: o.nodeId,
    code: o.code,
  };
}

function toInfoPoint(p: SnapshotInfoPoint): SnapshotInfoPoint {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    floorId: p.floorId,
    coordinates: snapshotPosition(p.coordinates),
    headingDeg: p.headingDeg,
    defaultMode: p.defaultMode,
    force2d: p.force2d,
    defaultLanguage: p.defaultLanguage,
    idleSeconds: p.idleSeconds,
    nodeId: p.nodeId,
  };
}

/**
 * Snapshot dari data draft. Setiap bagian disalin per field yang diizinkan, jadi kolom lain
 * di sumber (pembuat, email, pengaturan server, heartbeat perangkat) tidak pernah ikut.
 * Lokasi nonaktif permanen dan field kustom yang tidak ditandai tampil dibuang; koordinat
 * dibulatkan 7 desimal; urutan stabil agar dua publish dari draft yang sama identik.
 */
export function buildSnapshot(source: SnapshotSource): Snapshot {
  const buildings = sortByOrder(source.buildings);
  const features = [...source.features]
    .sort((a, b) => (a.floorId < b.floorId ? -1 : a.floorId > b.floorId ? 1 : byId(a, b)))
    .map(toFeature);
  const locationTypes = sortByOrder(source.locationTypes);
  const visibleKeys = new Map(
    locationTypes.map((t) => [
      t.id,
      new Set(t.fields.filter((f) => f.isVisible).map((f) => f.key)),
    ]),
  );
  const searchableKeys = new Map(
    locationTypes.map((t) => [
      t.id,
      // Field tersembunyi tidak masuk indeks pencarian publik walau ditandai dapat dicari.
      new Set(t.fields.filter((f) => f.isSearchable && f.isVisible).map((f) => f.key)),
    ]),
  );
  const locations = source.locations
    .filter((l) => l.status !== 'inactive_permanent')
    .sort((a, b) => a.name.localeCompare(b.name, 'id') || byId(a, b));
  const typeOrder = locationTypes.map((t) => t.id);
  const categories = [...source.categories]
    .sort(
      (a, b) =>
        typeOrder.indexOf(a.locationTypeId) - typeOrder.indexOf(b.locationTypeId) ||
        a.sortOrder - b.sortOrder ||
        a.name.localeCompare(b.name, 'id'),
    )
    .map((c) => ({ id: c.id, locationTypeId: c.locationTypeId, name: c.name, icon: c.icon }));
  const facilityTypes = sortByOrder(source.facilityTypes).map((t) => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
    isSafety: t.isSafety,
  }));

  return {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    version: source.version,
    publishedAt: source.publishedAt,
    venue: toVenue(source),
    buildings: buildings.map(toBuilding),
    floors: sortFloors(
      source.floors,
      buildings.map((b) => b.id),
    ).map(toFloor),
    features: { type: 'FeatureCollection', features },
    facilityTypes,
    locations: locations.map((l) => toLocation(l, visibleKeys.get(l.locationTypeId) ?? new Set())),
    locationTypes: locationTypes.map(toLocationType),
    categories,
    searchIndex: buildSearchIndex({
      locations,
      categories,
      facilityTypes,
      units: features.filter((f) => f.properties.unitCode),
      aliases: source.aliases,
      searchableKeys,
    }),
    graph: snapshotGraph(source.graph),
    instructionTemplates: snapshotInstructionTemplates(source.instructionTemplates),
    originPoints: [...source.originPoints].sort(byId).map(snapshotOriginPoint),
    infoPoints: [...source.infoPoints].sort(byId).map(toInfoPoint),
    enabledFeatures: [...new Set(source.enabledFeatures)].sort(),
  };
}
