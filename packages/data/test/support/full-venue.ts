import { randomUUID } from 'node:crypto';
import type { SnapshotSource } from '@indoor/domain';
import { IDS, sampleSnapshotSource } from '@indoor/domain/fixtures/snapshot-source.ts';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../src/database.types';

/**
 * Venue uji lengkap untuk verifikasi E2E (`docs/16-test-case.md` bagian 2), dibangun dari
 * fixture domain `venue-sample.json` + `venue-graph.ts`: Gedung Utama (GF, L1, L2) dan Gedung
 * Timur (GF), unit dan fasilitas, lift GF–L1 saja, eskalator naik dan turun, tangga GF–L2,
 * jalur Area Luar landai (aksesibel) dan bertangga, lokasi berbagai status, alias, titik asal,
 * dan Info Point. Semua id diganti baru per pemanggilan agar test paralel tidak bentrok.
 */
export interface FullVenue {
  venueId: string;
  name: string;
  /** Id lama di fixture domain → id di database. */
  id: (fixtureId: string) => string;
  ids: { [K in keyof typeof IDS]: string };
  source: SnapshotSource;
}

type Db = SupabaseClient<Database>;
type Row = Record<string, unknown>;

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

async function insert(db: Db, table: keyof Database['public']['Tables'], rows: Row[]) {
  if (rows.length === 0) return;
  // biome-ignore lint/suspicious/noExplicitAny: baris disusun dinamis dari fixture; tipe dicek database.
  const { error } = await db.from(table).insert(rows as any);
  if (error) throw new Error(`Gagal mengisi ${table}: ${error.message}`);
}

const point = (coordinates: readonly number[]) => ({ type: 'Point', coordinates });

function hoursRows(location: SnapshotSource['locations'][number]): Row[] {
  const rows: Row[] = [];
  const base = { location_id: location.id, is_closed: false };
  location.hours.weekly.forEach((spans, day) => {
    for (const s of spans)
      rows.push({ ...base, weekday: day + 1, opens_at: s.opens, closes_at: s.closes });
  });
  for (const [date, spans] of Object.entries(location.hours.special)) {
    if (spans.length === 0) rows.push({ ...base, special_date: date, is_closed: true });
    for (const s of spans)
      rows.push({ ...base, special_date: date, opens_at: s.opens, closes_at: s.closes });
  }
  return rows;
}

/** Klien Supabase mentah untuk mengisi data uji, masuk sebagai Super Admin seed. */
export async function signedInDb(
  url: string,
  anonKey: string,
  credentials: { email: string; password: string },
): Promise<Db> {
  const db = createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await db.auth.signInWithPassword(credentials);
  if (error) throw new Error(`Login Super Admin gagal: ${error.message}`);
  return db;
}

export async function createFullVenue(db: Db, name: string): Promise<FullVenue> {
  const sample = sampleSnapshotSource();
  const { data: venue, error } = await db
    .from('venues')
    .insert({
      name,
      timezone: 'Asia/Jakarta',
      center: point([106.8272, -6.1753]) as unknown as string,
    })
    .select('id')
    .single();
  if (error) throw new Error(`Gagal membuat venue: ${error.message}`);
  const outdoor = await db
    .from('floors')
    .select('id')
    .eq('venue_id', venue.id)
    .eq('is_outdoor', true)
    .single();
  if (outdoor.error) throw new Error(outdoor.error.message);

  // Semua UUID fixture dipetakan ke id baru; lapisan Area Luar ke lapisan buatan trigger.
  const map = new Map<string, string>([[sample.venue.id, venue.id]]);
  const fixtureOutdoor = sample.floors.find((f) => f.isOutdoor);
  if (fixtureOutdoor) map.set(fixtureOutdoor.id, outdoor.data.id);
  const remap = (id: string) => {
    let next = map.get(id);
    if (!next) {
      next = randomUUID();
      map.set(id, next);
    }
    return next;
  };
  const source = JSON.parse(
    JSON.stringify(sample).replace(UUID, (id) => remap(id.toLowerCase())),
  ) as SnapshotSource;
  const v = venue.id;

  await insert(
    db,
    'buildings',
    source.buildings.map((b) => ({
      id: b.id,
      venue_id: v,
      name: b.name,
      code: b.code,
      footprint: b.footprint,
      sort_order: b.sortOrder,
    })),
  );
  await insert(
    db,
    'floors',
    source.floors
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
  );
  await insert(
    db,
    'facility_types',
    source.facilityTypes.map((t) => ({
      id: t.id,
      venue_id: v,
      name: t.name,
      icon_path: t.icon,
      is_safety: t.isSafety,
      sort_order: t.sortOrder,
    })),
  );
  await insert(
    db,
    'features',
    source.features.map((f) => ({
      id: f.id,
      venue_id: v,
      floor_id: f.floorId,
      kind: f.kind,
      geom: f.geometry,
      name: f.name,
      unit_code: f.unitCode,
      unit_status: f.unitStatus,
      facility_type_id: f.facilityTypeId,
      props: f.subtype ? { subtype: f.subtype } : {},
    })),
  );
  await insert(
    db,
    'location_types',
    source.locationTypes.map((t) => ({
      id: t.id,
      venue_id: v,
      name: t.name,
      icon: t.icon,
      color: t.color,
      sort_order: t.sortOrder,
    })),
  );
  await insert(
    db,
    'field_definitions',
    source.locationTypes.flatMap((t) =>
      t.fields.map((f) => ({
        location_type_id: t.id,
        key: f.key,
        label: f.label,
        field_type: f.type,
        options: f.options,
        is_visible: f.isVisible,
        is_searchable: f.isSearchable,
        sort_order: f.sortOrder,
      })),
    ),
  );
  await insert(
    db,
    'categories',
    source.categories.map((c) => ({
      id: c.id,
      location_type_id: c.locationTypeId,
      name: c.name,
      icon: c.icon,
      sort_order: c.sortOrder,
    })),
  );
  await insert(
    db,
    'locations',
    source.locations.map((l) => ({
      id: l.id,
      venue_id: v,
      location_type_id: l.locationTypeId,
      code: l.code,
      name: l.name,
      description: l.description,
      // Nonaktif permanen disimpan terakhir: trigger mengosongkan unitnya.
      status: l.status === 'inactive_permanent' ? 'active' : l.status,
      opening_date: l.openingDate,
      custom_fields: l.customFields,
    })),
  );
  await insert(
    db,
    'location_categories',
    source.locations.flatMap((l) =>
      l.categoryIds.map((categoryId) => ({ location_id: l.id, category_id: categoryId })),
    ),
  );
  await insert(
    db,
    'location_units',
    source.locations.flatMap((l) =>
      l.unitIds.map((featureId) => ({
        location_id: l.id,
        feature_id: featureId,
        is_primary: featureId === l.primaryUnitId,
      })),
    ),
  );
  await insert(db, 'opening_hours', source.locations.flatMap(hoursRows));
  for (const l of source.locations.filter((x) => x.status === 'inactive_permanent')) {
    const { error: e } = await db
      .from('locations')
      .update({ status: 'inactive_permanent' })
      .eq('id', l.id);
    if (e) throw new Error(e.message);
  }
  await insert(
    db,
    'search_aliases',
    source.aliases.map((a) => ({
      venue_id: v,
      keyword: a.keyword,
      location_id: a.targetKind === 'location' ? a.targetId : null,
      category_id: a.targetKind === 'category' ? a.targetId : null,
      facility_type_id: a.targetKind === 'facility_type' ? a.targetId : null,
    })),
  );
  await insert(
    db,
    'nav_nodes',
    source.graph.nodes.map((n) => ({
      id: n.id,
      venue_id: v,
      floor_id: n.floorId,
      geom: point(n.coordinates),
      role: n.role,
      feature_id: n.featureId,
    })),
  );
  await insert(
    db,
    'nav_edges',
    source.graph.edges.map((e) => ({
      id: e.id,
      venue_id: v,
      floor_id: e.floorId,
      from_node_id: e.from,
      to_node_id: e.to,
      length_m: e.lengthM,
      is_accessible: e.accessible,
    })),
  );
  await insert(
    db,
    'connectors',
    source.graph.connectors.map((c) => ({
      id: c.id,
      venue_id: v,
      kind: c.kind,
      name: c.name,
      direction: c.direction,
      is_accessible: c.accessible,
    })),
  );
  await insert(
    db,
    'connector_stops',
    source.graph.connectors.flatMap((c) =>
      c.stops.map((s) => ({ connector_id: c.id, floor_id: s.floorId, node_id: s.nodeId })),
    ),
  );
  await insert(
    db,
    'origin_points',
    source.originPoints.map((o) => ({
      id: o.id,
      venue_id: v,
      floor_id: o.floorId,
      name: o.name,
      geom: point(o.coordinates),
      heading_deg: o.headingDeg,
      node_id: o.nodeId,
    })),
  );
  await insert(
    db,
    'info_points',
    source.infoPoints.map((i) => ({
      id: i.id,
      venue_id: v,
      code: `${i.code}-${v.slice(0, 8)}`,
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
  );

  const ids = Object.fromEntries(
    Object.entries(IDS).map(([key, id]) => [key, remap(id)]),
  ) as FullVenue['ids'];
  return { venueId: v, name, id: remap, ids, source };
}
