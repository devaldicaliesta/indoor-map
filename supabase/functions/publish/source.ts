// Membaca draft venue dan memetakannya ke masukan builder snapshot. Hanya kolom yang
// dibutuhkan yang diminta; builder tetap menyaring ulang field yang boleh terbit.
import { type OpeningHoursRow, openingHoursFromRows } from '../../../packages/domain/src/hours.ts';
import type {
  SnapshotGeometry,
  SnapshotLanguage,
  SnapshotPosition,
} from '../../../packages/domain/src/snapshot.ts';
import type {
  SnapshotSource,
  SourceAlias,
  SourceFeature,
  SourceLocation,
  SourceLocationType,
} from '../../../packages/domain/src/snapshot-source.ts';
import { serviceHeaders, url } from '../_shared/auth.ts';
import { type CallerRest, PublishError } from './rest.ts';

type Row = Record<string, unknown>;

const str = (value: unknown) => (typeof value === 'string' ? value : '');
const strOrNull = (value: unknown) => (typeof value === 'string' && value ? value : null);
const num = (value: unknown) => Number(value ?? 0);
const numOrNull = (value: unknown) =>
  value === null || value === undefined ? null : Number(value);
const rows = (value: unknown) => (Array.isArray(value) ? (value as Row[]) : []);
const point = (geom: unknown): SnapshotPosition => {
  const coordinates = (geom as { coordinates?: unknown } | null)?.coordinates;
  return Array.isArray(coordinates) ? [num(coordinates[0]), num(coordinates[1])] : [0, 0];
};

/** Bahasa default instalasi; tabelnya hanya bisa dibaca Super Admin, jadi dibaca server. */
async function defaultLanguage(): Promise<SnapshotLanguage> {
  const response = await fetch(`${url}/rest/v1/system_settings?select=default_language`, {
    headers: serviceHeaders,
  });
  const [row] = response.ok ? ((await response.json()) as Row[]) : [];
  return row?.default_language === 'en' ? 'en' : 'id';
}

function toFeature(r: Row): SourceFeature {
  const props = (r.props ?? {}) as Row;
  return {
    id: str(r.id),
    floorId: str(r.floor_id),
    kind: r.kind as SourceFeature['kind'],
    geometry: r.geom as SnapshotGeometry,
    name: strOrNull(r.name),
    unitCode: strOrNull(r.unit_code),
    unitStatus: (r.unit_status ?? null) as SourceFeature['unitStatus'],
    height: numOrNull(r.height_m),
    color: strOrNull(r.color),
    facilityTypeId: strOrNull(r.facility_type_id),
    subtype: (strOrNull(props.subtype) ?? null) as SourceFeature['subtype'],
  };
}

function toLocationType(r: Row): SourceLocationType {
  return {
    id: str(r.id),
    name: str(r.name),
    icon: strOrNull(r.icon),
    color: strOrNull(r.color),
    sortOrder: num(r.sort_order),
    fields: rows(r.field_definitions).map((f) => ({
      key: str(f.key),
      label: str(f.label),
      type: f.field_type as SourceLocationType['fields'][number]['type'],
      options: Array.isArray(f.options) ? f.options.filter((o) => typeof o === 'string') : [],
      isVisible: f.is_visible === true,
      isSearchable: f.is_searchable === true,
      isRequired: f.is_required === true,
      sortOrder: num(f.sort_order),
    })),
  };
}

function toLocation(r: Row): SourceLocation {
  const units = rows(r.location_units);
  return {
    id: str(r.id),
    code: strOrNull(r.code),
    name: str(r.name),
    description: strOrNull(r.description),
    locationTypeId: str(r.location_type_id),
    status: r.status as SourceLocation['status'],
    openingDate: strOrNull(r.opening_date),
    categoryIds: rows(r.location_categories).map((c) => str(c.category_id)),
    unitIds: units.map((u) => str(u.feature_id)),
    primaryUnitId: strOrNull(units.find((u) => u.is_primary === true)?.feature_id),
    logoPath: strOrNull(r.logo_path),
    photoPaths: Array.isArray(r.photo_paths) ? r.photo_paths.map(str) : [],
    customFields: (r.custom_fields ?? {}) as Record<string, unknown>,
    hours: openingHoursFromRows(rows(r.opening_hours) as unknown as OpeningHoursRow[]),
  };
}

function toAlias(r: Row): SourceAlias {
  if (r.location_id)
    return { targetKind: 'location', targetId: str(r.location_id), keyword: str(r.keyword) };
  if (r.category_id)
    return { targetKind: 'category', targetId: str(r.category_id), keyword: str(r.keyword) };
  return {
    targetKind: 'facility_type',
    targetId: str(r.facility_type_id),
    keyword: str(r.keyword),
  };
}

export async function readSource(
  rest: CallerRest,
  venueId: string,
  meta: { version: number; publishedAt: string; enabledFeatures: readonly string[] },
): Promise<SnapshotSource> {
  const byVenue = `venue_id=eq.${venueId}`;
  const [
    venues,
    display,
    language,
    buildings,
    floors,
    features,
    facilityTypes,
    locationTypes,
    locations,
    aliases,
    nodes,
    edges,
    connectors,
    templates,
    originPoints,
    infoPoints,
  ] = await Promise.all([
    rest.select<Row>(
      'venues',
      `select=id,name,timezone,default_building_id,logo_path&id=eq.${venueId}&order=id`,
    ),
    rest.select<Row>(
      'display_settings',
      `select=default_mode,heights,colors,camera,branding&${byVenue}&order=venue_id`,
    ),
    defaultLanguage(),
    rest.select<Row>(
      'buildings',
      `select=id,name,code,footprint,default_floor_id,sort_order&${byVenue}&order=id`,
    ),
    rest.select<Row>(
      'floors',
      `select=id,building_id,name,level,height_m,is_outdoor,sort_order&${byVenue}&order=id`,
    ),
    rest.select<Row>(
      'features',
      `select=id,floor_id,kind,geom,name,height_m,color,unit_code,unit_status,facility_type_id,props&${byVenue}&order=id`,
    ),
    rest.select<Row>(
      'facility_types',
      `select=id,name,icon_path,is_safety,sort_order&${byVenue}&order=id`,
    ),
    rest.select<Row>(
      'location_types',
      `select=id,name,icon,color,sort_order,field_definitions(key,label,field_type,options,is_visible,is_searchable,is_required,sort_order)&${byVenue}&order=id`,
    ),
    rest.select<Row>(
      'locations',
      `select=id,code,name,description,location_type_id,status,opening_date,logo_path,photo_paths,custom_fields,location_categories(category_id),location_units(feature_id,is_primary),opening_hours(weekday,special_date,opens_at,closes_at,is_closed)&${byVenue}&status=neq.inactive_permanent&order=id`,
    ),
    rest.select<Row>(
      'search_aliases',
      `select=location_id,category_id,facility_type_id,keyword&${byVenue}&order=id`,
    ),
    rest.select<Row>('nav_nodes', `select=id,floor_id,geom,role,feature_id&${byVenue}&order=id`),
    rest.select<Row>(
      'nav_edges',
      `select=id,floor_id,from_node_id,to_node_id,length_m,is_accessible&${byVenue}&order=id`,
    ),
    rest.select<Row>(
      'connectors',
      `select=id,kind,name,direction,is_accessible,connector_stops(floor_id,node_id)&${byVenue}&order=id`,
    ),
    rest.select<Row>(
      'instruction_templates',
      `select=action,text_id,text_en&${byVenue}&order=action`,
    ),
    rest.select<Row>(
      'origin_points',
      `select=id,floor_id,name,geom,heading_deg,node_id,public_code&${byVenue}&order=id`,
    ),
    rest.select<Row>(
      'info_points',
      `select=id,code,name,floor_id,geom,heading_deg,default_mode,force_2d,default_language,idle_seconds,node_id&${byVenue}&order=id`,
    ),
  ]);

  const venue = venues[0];
  if (!venue) throw new PublishError(404, 'not_found', 'Venue tidak ditemukan.');
  const typeIds = locationTypes.map((t) => str(t.id));
  const categories = typeIds.length
    ? await rest.select<Row>(
        'categories',
        `select=id,location_type_id,name,icon,color,sort_order&location_type_id=in.(${typeIds.join(',')})&order=id`,
      )
    : [];
  const settings = display[0];

  return {
    version: meta.version,
    publishedAt: meta.publishedAt,
    defaultLanguage: language,
    enabledFeatures: meta.enabledFeatures,
    venue: {
      id: str(venue.id),
      name: str(venue.name),
      timezone: str(venue.timezone),
      defaultBuildingId: strOrNull(venue.default_building_id),
      logoPath: strOrNull(venue.logo_path),
    },
    display: settings
      ? {
          defaultMode: str(settings.default_mode),
          heights: settings.heights,
          colors: settings.colors,
          camera: settings.camera,
          branding: settings.branding,
        }
      : null,
    buildings: buildings.map((b) => ({
      id: str(b.id),
      name: str(b.name),
      code: str(b.code),
      footprint: (b.footprint ?? null) as SnapshotSource['buildings'][number]['footprint'],
      defaultFloorId: strOrNull(b.default_floor_id),
      sortOrder: num(b.sort_order),
    })),
    floors: floors.map((f) => ({
      id: str(f.id),
      buildingId: strOrNull(f.building_id),
      name: str(f.name),
      level: num(f.level),
      heightM: num(f.height_m),
      isOutdoor: f.is_outdoor === true,
      sortOrder: num(f.sort_order),
    })),
    features: features.map(toFeature),
    facilityTypes: facilityTypes.map((t) => ({
      id: str(t.id),
      name: str(t.name),
      icon: strOrNull(t.icon_path),
      isSafety: t.is_safety === true,
      sortOrder: num(t.sort_order),
    })),
    locationTypes: locationTypes.map(toLocationType),
    categories: categories.map((c) => ({
      id: str(c.id),
      locationTypeId: str(c.location_type_id),
      name: str(c.name),
      icon: strOrNull(c.icon),
      color: strOrNull(c.color),
      sortOrder: num(c.sort_order),
    })),
    locations: locations.map(toLocation),
    aliases: aliases.map(toAlias),
    graph: {
      nodes: nodes.map((n) => ({
        id: str(n.id),
        floorId: str(n.floor_id),
        coordinates: point(n.geom),
        role: n.role as SnapshotSource['graph']['nodes'][number]['role'],
        featureId: strOrNull(n.feature_id),
      })),
      edges: edges.map((e) => ({
        id: str(e.id),
        floorId: str(e.floor_id),
        from: str(e.from_node_id),
        to: str(e.to_node_id),
        lengthM: num(e.length_m),
        accessible: e.is_accessible === true,
      })),
      connectors: connectors.map((c) => ({
        id: str(c.id),
        kind: c.kind as SnapshotSource['graph']['connectors'][number]['kind'],
        name: str(c.name),
        direction: (c.direction ??
          null) as SnapshotSource['graph']['connectors'][number]['direction'],
        accessible: c.is_accessible === true,
        stops: rows(c.connector_stops).map((s) => ({
          floorId: str(s.floor_id),
          nodeId: str(s.node_id),
        })),
      })),
    },
    instructionTemplates: templates.map((t) => ({
      action: str(t.action),
      id: str(t.text_id),
      en: str(t.text_en),
    })),
    originPoints: originPoints.map((o) => ({
      id: str(o.id),
      floorId: str(o.floor_id),
      name: str(o.name),
      coordinates: point(o.geom),
      headingDeg: num(o.heading_deg),
      nodeId: strOrNull(o.node_id),
      code: str(o.public_code),
    })),
    infoPoints: infoPoints.map((p) => ({
      id: str(p.id),
      code: str(p.code),
      name: str(p.name),
      floorId: str(p.floor_id),
      coordinates: point(p.geom),
      headingDeg: num(p.heading_deg),
      defaultMode: p.default_mode === '3d' ? '3d' : '2d',
      force2d: p.force_2d === true,
      defaultLanguage: p.default_language === 'en' ? 'en' : 'id',
      idleSeconds: num(p.idle_seconds),
      nodeId: strOrNull(p.node_id),
    })),
  };
}

/** Denah aktif per lantai: tergeoreferensi bila sudah punya empat sudut. */
export async function readFloorPlans(
  rest: CallerRest,
  floorIds: readonly string[],
): Promise<{ floorId: string; georeferenced: boolean }[]> {
  if (floorIds.length === 0) return [];
  const plans = await rest.select<Row>(
    'floor_plans',
    `select=floor_id,corners&is_active=eq.true&floor_id=in.(${floorIds.join(',')})&order=floor_id`,
  );
  return plans.map((p) => ({
    floorId: str(p.floor_id),
    georeferenced: Array.isArray(p.corners) && p.corners.length === 4,
  }));
}
