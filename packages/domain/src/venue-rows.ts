// Draft venue (`SnapshotSource`) menjadi baris tabel database, untuk menyalin venue: ruang kerja
// trial dari venue demo (T-614b). Dimuat Edge Function di Deno, jadi hanya impor `.ts`.
//
// Semua baris satu tabel memakai kunci yang sama (kolom kosong bernilai null): SQL menyisipkannya
// sekaligus lewat `jsonb_populate_recordset` dengan daftar kolom dari baris pertama.
// Area Luar tidak ikut: lantai itu dibuat trigger saat venue dibuat, dan id-nya diganti pemanggil.
import type { SnapshotSource, SourceLocation } from './snapshot-source.ts';

export type VenueRow = Record<string, unknown>;

/** Urutan sisip: induk sebelum anak. */
export const VENUE_ROW_TABLES = [
  'buildings',
  'floors',
  'facility_types',
  'features',
  'location_types',
  'field_definitions',
  'categories',
  'locations',
  'location_categories',
  'location_units',
  'opening_hours',
  'search_aliases',
  'nav_nodes',
  'nav_edges',
  'connectors',
  'connector_stops',
  'origin_points',
  'info_points',
] as const;
export type VenueRowTable = (typeof VENUE_ROW_TABLES)[number];

export interface VenueRows {
  tables: Record<VenueRowTable, VenueRow[]>;
  /** Diisi setelah lantai ada (rujukan melingkar gedung ↔ lantai). */
  buildingDefaults: { id: string; default_floor_id: string }[];
  defaultBuildingId: string | null;
  /** Pengaturan tampilan untuk baris `display_settings` yang dibuat trigger; null = bawaan. */
  display: VenueRow | null;
}

const point = (coordinates: readonly number[]) => ({ type: 'Point', coordinates });
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Salinan `value` dengan setiap UUID diganti id baru (UUID yang sama tetap menjadi id baru yang
 * sama, jadi rujukan antarbaris terjaga). `fixed`: id yang penggantinya sudah ditentukan, mis.
 * id venue baru dan Area Luar.
 */
export function withNewIds<T>(
  value: T,
  newId: () => string,
  fixed: ReadonlyMap<string, string> = new Map(),
): T {
  const map = new Map([...fixed].map(([from, to]) => [from.toLowerCase(), to]));
  const text = JSON.stringify(value).replace(UUID, (id) => {
    const key = id.toLowerCase();
    let next = map.get(key);
    if (!next) {
      next = newId();
      map.set(key, next);
    }
    return next;
  });
  return JSON.parse(text) as T;
}

function hoursRows(location: SourceLocation): VenueRow[] {
  const row = (fields: VenueRow) => ({
    location_id: location.id,
    weekday: null,
    special_date: null,
    opens_at: null,
    closes_at: null,
    is_closed: false,
    ...fields,
  });
  const rows: VenueRow[] = [];
  location.hours.weekly.forEach((spans, day) => {
    for (const s of spans)
      rows.push(row({ weekday: day + 1, opens_at: s.opens, closes_at: s.closes }));
  });
  for (const [date, spans] of Object.entries(location.hours.special)) {
    if (spans.length === 0) rows.push(row({ special_date: date, is_closed: true }));
    for (const s of spans) {
      rows.push(row({ special_date: date, opens_at: s.opens, closes_at: s.closes }));
    }
  }
  return rows;
}

/**
 * Baris semua tabel venue `venueId` dari `source`, yang id-nya sudah final. Lokasi nonaktif
 * permanen tidak didukung (trigger melepas unitnya saat status itu disimpan); `trialSample`
 * sudah membuangnya.
 */
export function venueRows(source: SnapshotSource, venueId: string): VenueRows {
  if (source.locations.some((l) => l.status === 'inactive_permanent')) {
    throw new Error('Lokasi nonaktif permanen tidak bisa disalin.');
  }
  const v = venueId;
  const tables: VenueRows['tables'] = {
    buildings: source.buildings.map((b) => ({
      id: b.id,
      venue_id: v,
      name: b.name,
      code: b.code,
      footprint: b.footprint,
      sort_order: b.sortOrder,
    })),
    floors: source.floors
      .filter((f) => !f.isOutdoor)
      .map((f) => ({
        id: f.id,
        venue_id: v,
        building_id: f.buildingId,
        name: f.name,
        level: f.level,
        height_m: f.heightM,
        sort_order: f.sortOrder,
      })),
    facility_types: source.facilityTypes.map((t) => ({
      id: t.id,
      venue_id: v,
      name: t.name,
      icon_path: t.icon,
      is_safety: t.isSafety,
      sort_order: t.sortOrder,
    })),
    features: source.features.map((f) => ({
      id: f.id,
      venue_id: v,
      floor_id: f.floorId,
      kind: f.kind,
      geom: f.geometry,
      name: f.name,
      unit_code: f.unitCode,
      unit_status: f.unitStatus,
      height_m: f.height,
      color: f.color,
      facility_type_id: f.facilityTypeId,
      props: f.subtype ? { subtype: f.subtype } : {},
    })),
    location_types: source.locationTypes.map((t) => ({
      id: t.id,
      venue_id: v,
      name: t.name,
      icon: t.icon,
      color: t.color,
      sort_order: t.sortOrder,
    })),
    field_definitions: source.locationTypes.flatMap((t) =>
      t.fields.map((f) => ({
        location_type_id: t.id,
        key: f.key,
        label: f.label,
        field_type: f.type,
        options: f.options,
        is_visible: f.isVisible,
        is_searchable: f.isSearchable,
        is_required: f.isRequired,
        sort_order: f.sortOrder,
      })),
    ),
    categories: source.categories.map((c) => ({
      id: c.id,
      location_type_id: c.locationTypeId,
      name: c.name,
      icon: c.icon,
      color: c.color ?? null,
      sort_order: c.sortOrder,
    })),
    locations: source.locations.map((l) => ({
      id: l.id,
      venue_id: v,
      location_type_id: l.locationTypeId,
      code: l.code,
      name: l.name,
      description: l.description,
      status: l.status,
      opening_date: l.openingDate,
      custom_fields: l.customFields,
    })),
    location_categories: source.locations.flatMap((l) =>
      l.categoryIds.map((categoryId) => ({ location_id: l.id, category_id: categoryId })),
    ),
    location_units: source.locations.flatMap((l) =>
      l.unitIds.map((featureId) => ({
        location_id: l.id,
        feature_id: featureId,
        is_primary: featureId === l.primaryUnitId,
      })),
    ),
    opening_hours: source.locations.flatMap(hoursRows),
    search_aliases: source.aliases.map((a) => ({
      venue_id: v,
      keyword: a.keyword,
      location_id: a.targetKind === 'location' ? a.targetId : null,
      category_id: a.targetKind === 'category' ? a.targetId : null,
      facility_type_id: a.targetKind === 'facility_type' ? a.targetId : null,
    })),
    nav_nodes: source.graph.nodes.map((n) => ({
      id: n.id,
      venue_id: v,
      floor_id: n.floorId,
      geom: point(n.coordinates),
      role: n.role,
      feature_id: n.featureId,
    })),
    nav_edges: source.graph.edges.map((e) => ({
      id: e.id,
      venue_id: v,
      floor_id: e.floorId,
      from_node_id: e.from,
      to_node_id: e.to,
      length_m: e.lengthM,
      is_accessible: e.accessible,
    })),
    connectors: source.graph.connectors.map((c) => ({
      id: c.id,
      venue_id: v,
      kind: c.kind,
      name: c.name,
      direction: c.direction,
      is_accessible: c.accessible,
    })),
    connector_stops: source.graph.connectors.flatMap((c) =>
      c.stops.map((s) => ({ connector_id: c.id, floor_id: s.floorId, node_id: s.nodeId })),
    ),
    origin_points: source.originPoints.map((o) => ({
      id: o.id,
      venue_id: v,
      floor_id: o.floorId,
      name: o.name,
      geom: point(o.coordinates),
      heading_deg: o.headingDeg,
      node_id: o.nodeId,
    })),
    info_points: source.infoPoints.map((i) => ({
      id: i.id,
      venue_id: v,
      code: i.code,
      name: i.name,
      floor_id: i.floorId,
      geom: point(i.coordinates),
      heading_deg: i.headingDeg,
      default_mode: i.defaultMode,
      force_2d: i.force2d,
      default_language: i.defaultLanguage,
      idle_seconds: i.idleSeconds,
      node_id: i.nodeId,
    })),
  };
  return {
    tables,
    buildingDefaults: source.buildings.flatMap((b) =>
      b.defaultFloorId ? [{ id: b.id, default_floor_id: b.defaultFloorId }] : [],
    ),
    defaultBuildingId: source.venue.defaultBuildingId,
    display: source.display
      ? {
          default_mode: source.display.defaultMode,
          heights: source.display.heights,
          colors: source.display.colors,
          camera: source.display.camera,
          branding: source.display.branding,
        }
      : null,
  };
}
