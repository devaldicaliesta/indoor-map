import { z } from 'zod';
import { GeometrySchema, PolygonSchema, PositionSchema } from './geometry';
import {
  INSTRUCTION_ACTIONS,
  SEARCH_TARGET_KINDS,
  SNAPSHOT_CONNECTOR_KINDS,
  SNAPSHOT_DISPLAY_MODES,
  SNAPSHOT_ESCALATOR_DIRECTIONS,
  SNAPSHOT_FEATURE_KINDS,
  SNAPSHOT_FIELD_TYPES,
  SNAPSHOT_LANGUAGES,
  SNAPSHOT_LOCATION_STATUSES,
  SNAPSHOT_NODE_ROLES,
  SNAPSHOT_OUTDOOR_SUBTYPES,
  SNAPSHOT_SCHEMA_VERSION,
  SNAPSHOT_UNIT_STATUSES,
  type Snapshot,
} from './snapshot';

const id = z.string().min(1);
const text = z.string();
const nullableText = z.string().nullable();
const byKind = <T extends z.ZodType>(value: T) =>
  z.partialRecord(z.enum(SNAPSHOT_FEATURE_KINDS), value);

const VenueSchema = z.object({
  id,
  name: text,
  timezone: text,
  defaultBuildingId: id.nullable(),
  defaultLanguage: z.enum(SNAPSHOT_LANGUAGES),
  logoPath: nullableText,
  camera: z
    .object({ center: PositionSchema, zoom: z.number(), pitch: z.number(), bearing: z.number() })
    .nullable(),
  display: z.object({
    defaultMode: z.enum(SNAPSHOT_DISPLAY_MODES),
    heights: byKind(z.number().min(0)),
    colors: byKind(text),
  }),
});

const BuildingSchema = z.object({
  id,
  name: text,
  code: text,
  footprint: PolygonSchema.nullable(),
  defaultFloorId: id.nullable(),
});

const FloorSchema = z.object({
  id,
  buildingId: id.nullable(),
  name: text,
  level: z.number().int(),
  heightM: z.number().positive(),
  isOutdoor: z.boolean(),
});

const FeatureSchema = z.object({
  type: z.literal('Feature'),
  id,
  geometry: GeometrySchema,
  properties: z.object({
    id,
    kind: z.enum(SNAPSHOT_FEATURE_KINDS),
    floorId: id,
    name: z.exactOptional(text),
    unitCode: z.exactOptional(text),
    unitStatus: z.exactOptional(z.enum(SNAPSHOT_UNIT_STATUSES)),
    height: z.exactOptional(z.number().min(0)),
    color: z.exactOptional(text),
    facilityTypeId: z.exactOptional(id),
    subtype: z.exactOptional(z.enum(SNAPSHOT_OUTDOOR_SUBTYPES)),
  }),
});

const LocationTypeSchema = z.object({
  id,
  name: text,
  icon: nullableText,
  color: nullableText,
  fields: z.array(
    z.object({
      key: text,
      label: text,
      type: z.enum(SNAPSHOT_FIELD_TYPES),
      options: z.array(text),
    }),
  ),
});

const LocationSchema = z.object({
  id,
  code: nullableText,
  name: text,
  description: nullableText,
  locationTypeId: id,
  status: z.enum(SNAPSHOT_LOCATION_STATUSES),
  openingDate: nullableText,
  categoryIds: z.array(id),
  unitIds: z.array(id),
  primaryUnitId: id.nullable(),
  logoPath: nullableText,
  photoPaths: z.array(text),
  fields: z.record(text, z.union([text, z.number(), z.boolean(), z.array(text)])),
});

const GraphSchema = z.object({
  nodes: z.array(
    z.object({
      id,
      floorId: id,
      coordinates: PositionSchema,
      role: z.enum(SNAPSHOT_NODE_ROLES),
      featureId: id.nullable(),
    }),
  ),
  edges: z.array(
    z.object({
      id,
      floorId: id,
      from: id,
      to: id,
      lengthM: z.number().min(0),
      accessible: z.boolean(),
    }),
  ),
  connectors: z.array(
    z.object({
      id,
      kind: z.enum(SNAPSHOT_CONNECTOR_KINDS),
      name: text,
      direction: z.enum(SNAPSHOT_ESCALATOR_DIRECTIONS).nullable(),
      accessible: z.boolean(),
      stops: z.array(z.object({ floorId: id, nodeId: id })),
    }),
  ),
});

const OriginPointSchema = z.object({
  id,
  floorId: id,
  name: text,
  coordinates: PositionSchema,
  headingDeg: z.number(),
  nodeId: id.nullable(),
  code: text,
});

const InfoPointSchema = z.object({
  id,
  code: text,
  name: text,
  floorId: id,
  coordinates: PositionSchema,
  headingDeg: z.number(),
  defaultMode: z.enum(SNAPSHOT_DISPLAY_MODES),
  force2d: z.boolean(),
  defaultLanguage: z.enum(SNAPSHOT_LANGUAGES),
  idleSeconds: z.number().int(),
  nodeId: id.nullable(),
});

/**
 * Skema snapshot untuk Visitor dan test. Anggota yang tidak dikenal dibuang, bukan ditolak,
 * agar Visitor lama yang masih di cache tetap bisa membaca snapshot yang menambah field baru.
 */
export const SnapshotSchema = z.object({
  schemaVersion: z.literal(SNAPSHOT_SCHEMA_VERSION),
  version: z.number().int().positive(),
  publishedAt: z.iso.datetime({ offset: true }),
  venue: VenueSchema,
  buildings: z.array(BuildingSchema),
  floors: z.array(FloorSchema),
  features: z.object({ type: z.literal('FeatureCollection'), features: z.array(FeatureSchema) }),
  facilityTypes: z.array(z.object({ id, name: text, icon: nullableText, isSafety: z.boolean() })),
  locations: z.array(LocationSchema),
  locationTypes: z.array(LocationTypeSchema),
  categories: z.array(z.object({ id, locationTypeId: id, name: text, icon: nullableText })),
  searchIndex: z.array(z.object({ kind: z.enum(SEARCH_TARGET_KINDS), id, text })),
  graph: GraphSchema,
  instructionTemplates: z.record(z.enum(INSTRUCTION_ACTIONS), z.object({ id: text, en: text })),
  originPoints: z.array(OriginPointSchema),
  infoPoints: z.array(InfoPointSchema),
  enabledFeatures: z.array(text),
}) satisfies z.ZodType<Snapshot>;

export function parseSnapshot(value: unknown): Snapshot {
  return SnapshotSchema.parse(value);
}
