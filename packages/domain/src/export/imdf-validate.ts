import { z } from 'zod';
import { LineStringSchema, MultiPolygonSchema, PointSchema, PolygonSchema } from '../geometry.ts';
import type { SnapshotPosition as Position } from '../snapshot.ts';
import { signedArea } from '../validation/planar.ts';
import {
  IMDF_ACCESS_CONTROL,
  IMDF_ACCESSIBILITY,
  IMDF_AMENITY_CATEGORIES,
  IMDF_BUILDING_CATEGORIES,
  IMDF_FOOTPRINT_CATEGORIES,
  IMDF_LEVEL_CATEGORIES,
  IMDF_OCCUPANT_CATEGORIES,
  IMDF_OPENING_CATEGORIES,
  IMDF_RESTRICTIONS,
  IMDF_UNIT_CATEGORIES,
  IMDF_VENUE_CATEGORIES,
} from './imdf-categories.ts';
import { containsPoint, type Polygonal } from './shapes.ts';
import { isUuid } from './uuid.ts';

/**
 * Validator paket IMDF 1.0.0 menurut skema yang dipublikasikan (OGC 20-094): bentuk setiap
 * fitur (properti wajib, tipe geometri, nilai kategori), lalu aturan lintas berkas (id unik,
 * rujukan ke fitur yang ada, titik tampilan di dalam geometrinya, arah cincin RFC 7946).
 */
export interface ImdfIssue {
  file: string;
  id: string | null;
  message: string;
}

const uuid = z.string().refine(isUuid, 'bukan UUID');
const nullable = <T extends z.ZodType>(schema: T) => schema.nullable();
const labels = z
  .record(z.string().regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/), z.string().min(1))
  .refine((value) => Object.keys(value).length > 0, 'label kosong');
const polygonal = z.discriminatedUnion('type', [PolygonSchema, MultiPolygonSchema]);
const restriction = nullable(z.enum(IMDF_RESTRICTIONS));
const accessibility = nullable(z.array(z.enum(IMDF_ACCESSIBILITY)));
const phone = nullable(z.string().regex(/^\+[1-9]\d{1,14}$/));
const website = nullable(z.url());
const hours = nullable(z.string().min(1));
// Kategori amenity boleh berupa subkategori bertitik (`restroom.male`, `checkin.selfservice`)
// dari kategori dasar yang terdaftar.
const amenityCategory = z
  .string()
  .refine(
    (value) => (IMDF_AMENITY_CATEGORIES as readonly string[]).includes(value.split('.')[0] ?? ''),
    'kategori amenity tidak dikenal',
  );

const feature = <G extends z.ZodType, P extends z.ZodRawShape>(
  type: string,
  geometry: G,
  props: P,
) =>
  z.strictObject({
    id: uuid,
    type: z.literal('Feature'),
    feature_type: z.literal(type),
    geometry,
    properties: z.strictObject(props),
  });

const SCHEMAS = {
  address: feature('address', z.null(), {
    address: z.string().min(1),
    unit: nullable(z.string()),
    locality: z.string().min(1),
    province: nullable(z.string().regex(/^[A-Z]{2}-[A-Z0-9]{1,3}$/)),
    country: z.string().regex(/^[A-Z]{2}$/),
    postal_code: nullable(z.string().min(1)),
    postal_code_ext: nullable(z.string().min(1)),
    postal_code_vanity: nullable(z.string().min(1)),
  }),
  venue: feature('venue', polygonal, {
    category: z.enum(IMDF_VENUE_CATEGORIES),
    restriction,
    name: labels,
    alt_name: nullable(labels),
    hours,
    phone,
    website,
    display_point: PointSchema,
    address_id: uuid,
  }),
  building: feature('building', z.null(), {
    category: z.enum(IMDF_BUILDING_CATEGORIES),
    restriction,
    name: nullable(labels),
    alt_name: nullable(labels),
    display_point: nullable(PointSchema),
    address_id: nullable(uuid),
  }),
  footprint: feature('footprint', polygonal, {
    category: z.enum(IMDF_FOOTPRINT_CATEGORIES),
    name: nullable(labels),
    building_ids: z.array(uuid).min(1),
  }),
  level: feature('level', polygonal, {
    category: z.enum(IMDF_LEVEL_CATEGORIES),
    restriction,
    outdoor: z.boolean(),
    ordinal: z.number().int(),
    name: labels,
    short_name: labels,
    display_point: nullable(PointSchema),
    address_id: nullable(uuid),
    building_ids: nullable(z.array(uuid).min(1)),
  }),
  unit: feature('unit', polygonal, {
    category: z.enum(IMDF_UNIT_CATEGORIES),
    restriction,
    accessibility,
    name: nullable(labels),
    alt_name: nullable(labels),
    display_point: nullable(PointSchema),
    level_id: uuid,
  }),
  opening: feature('opening', LineStringSchema, {
    category: z.enum(IMDF_OPENING_CATEGORIES),
    accessibility,
    access_control: nullable(z.array(z.enum(IMDF_ACCESS_CONTROL))),
    door: nullable(
      z.strictObject({
        type: nullable(z.string()),
        automatic: nullable(z.boolean()),
        material: nullable(z.string()),
      }),
    ),
    name: nullable(labels),
    alt_name: nullable(labels),
    display_point: nullable(PointSchema),
    level_id: uuid,
  }),
  amenity: feature('amenity', PointSchema, {
    category: amenityCategory,
    accessibility,
    name: nullable(labels),
    alt_name: nullable(labels),
    hours,
    phone,
    website,
    unit_ids: z.array(uuid).min(1),
    address_id: nullable(uuid),
    correlation_id: nullable(uuid),
  }),
  anchor: feature('anchor', PointSchema, { address_id: nullable(uuid), unit_id: uuid }),
  occupant: feature('occupant', z.null(), {
    name: labels,
    category: z.enum(IMDF_OCCUPANT_CATEGORIES),
    anchor_id: uuid,
    hours,
    phone,
    website,
    validity: nullable(
      z.strictObject({
        start: z.iso.datetime({ offset: true }).optional(),
        end: z.iso.datetime({ offset: true }).optional(),
        modified: z.iso.datetime({ offset: true }).optional(),
      }),
    ),
    correlation_id: nullable(uuid),
  }),
} as const;

type FeatureType = keyof typeof SCHEMAS;
const FEATURE_TYPES = Object.keys(SCHEMAS) as FeatureType[];
const REQUIRED: FeatureType[] = ['address', 'venue'];
/** Jenis fitur IMDF sah yang tidak dibuat export; berkasnya dibiarkan tanpa diperiksa. */
const UNCHECKED = ['detail', 'fixture', 'geofence', 'kiosk', 'relationship', 'section'];

const ManifestSchema = z.strictObject({
  version: z.literal('1.0.0'),
  created: z.iso.datetime({ offset: true }),
  generated_by: z.string().nullable().optional(),
  language: z.string().regex(/^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/),
  extensions: z.array(z.string()).nullable().optional(),
});

const CollectionSchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(z.unknown()),
});

/** Rujukan antar fitur: properti → jenis fitur yang dirujuk. */
const REFERENCES: Partial<Record<FeatureType, Record<string, FeatureType>>> = {
  venue: { address_id: 'address' },
  building: { address_id: 'address' },
  footprint: { building_ids: 'building' },
  level: { address_id: 'address', building_ids: 'building' },
  unit: { level_id: 'level' },
  opening: { level_id: 'level' },
  amenity: { unit_ids: 'unit', address_id: 'address' },
  anchor: { unit_id: 'unit', address_id: 'address' },
  occupant: { anchor_id: 'anchor' },
};

interface Parsed {
  id: string;
  feature_type: FeatureType;
  geometry: { type: string; coordinates: unknown } | null;
  properties: Record<string, unknown>;
}

const zodMessage = (error: z.ZodError) =>
  error.issues.map((i) => `${i.path.join('.') || '(fitur)'}: ${i.message}`).join('; ');

function parseFiles(files: Record<string, unknown>, issues: ImdfIssue[]): Parsed[] {
  const features: Parsed[] = [];
  const manifest = ManifestSchema.safeParse(files['manifest.json']);
  if (!manifest.success) {
    issues.push({ file: 'manifest.json', id: null, message: zodMessage(manifest.error) });
  }
  for (const name of Object.keys(files)) {
    const type = name.replace(/\.geojson$/, '');
    if (name !== 'manifest.json' && !(type in SCHEMAS) && !UNCHECKED.includes(type)) {
      issues.push({ file: name, id: null, message: 'berkas tidak dikenal di paket IMDF' });
    }
  }
  for (const type of FEATURE_TYPES) {
    const file = `${type}.geojson`;
    if (!(file in files)) {
      if (REQUIRED.includes(type))
        issues.push({ file, id: null, message: 'berkas wajib tidak ada' });
      continue;
    }
    const collection = CollectionSchema.safeParse(files[file]);
    if (!collection.success) {
      issues.push({ file, id: null, message: zodMessage(collection.error) });
      continue;
    }
    for (const raw of collection.data.features) {
      const result = SCHEMAS[type].safeParse(raw);
      const id = (raw as { id?: unknown })?.id;
      if (!result.success) {
        issues.push({
          file,
          id: typeof id === 'string' ? id : null,
          message: zodMessage(result.error),
        });
      } else features.push(result.data as Parsed);
    }
  }
  if (features.filter((f) => f.feature_type === 'venue').length !== 1) {
    issues.push({ file: 'venue.geojson', id: null, message: 'harus berisi tepat satu venue' });
  }
  return features;
}

const ringsOf = (g: Polygonal) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);

function checkGeometry(f: Parsed, issue: (message: string) => void) {
  const { geometry } = f;
  if (geometry?.type !== 'Polygon' && geometry?.type !== 'MultiPolygon') return;
  const shape = geometry as Polygonal;
  for (const rings of ringsOf(shape)) {
    rings.forEach((ring, i) => {
      if (signedArea(ring as Position[]) > 0 !== (i === 0)) {
        issue(
          i === 0 ? 'cincin luar harus berlawanan arah jarum jam' : 'lubang harus searah jarum jam',
        );
      }
    });
  }
  const display = f.properties.display_point as { coordinates: Position } | null | undefined;
  if (display && !containsPoint(shape, display.coordinates)) {
    issue('display_point berada di luar geometri');
  }
}

/** Temuan validasi paket IMDF; kosong berarti lolos. */
export function validateImdf(files: Record<string, unknown>): ImdfIssue[] {
  const issues: ImdfIssue[] = [];
  const features = parseFiles(files, issues);
  const byId = new Map<string, Parsed>();
  for (const f of features) {
    const issue = (message: string) =>
      issues.push({ file: `${f.feature_type}.geojson`, id: f.id, message });
    if (byId.has(f.id)) issue('id dipakai lebih dari satu fitur');
    byId.set(f.id, f);
  }
  for (const f of features) {
    const issue = (message: string) =>
      issues.push({ file: `${f.feature_type}.geojson`, id: f.id, message });
    for (const [key, target] of Object.entries(REFERENCES[f.feature_type] ?? {})) {
      const value = f.properties[key];
      const refs = Array.isArray(value) ? value : value == null ? [] : [value];
      for (const ref of refs) {
        if (byId.get(ref as string)?.feature_type !== target) {
          issue(`${key} merujuk ${target} yang tidak ada (${String(ref)})`);
        }
      }
    }
    checkGeometry(f, issue);
    // Amenity dan anchor harus berada di dalam unit yang dirujuknya.
    const point = f.geometry?.type === 'Point' ? (f.geometry.coordinates as Position) : null;
    const unitRefs = f.feature_type === 'amenity' ? f.properties.unit_ids : [f.properties.unit_id];
    if (point && (f.feature_type === 'amenity' || f.feature_type === 'anchor')) {
      const inside = (unitRefs as string[]).some((id) => {
        const unit = byId.get(id);
        return unit?.geometry && containsPoint(unit.geometry as Polygonal, point);
      });
      if (!inside) issue('titik berada di luar unit yang dirujuk');
    }
  }
  return issues;
}
