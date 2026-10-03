import { type AdminAction, can } from './permissions';
import { APP_ROLES, type AppRole } from './profile';

/**
 * Siapa boleh membaca dan mengubah setiap tabel lewat API (RLS), diturunkan dari matriks aksi
 * di `permissions.ts`. Dipakai untuk membangkitkan test pgTAP `permissions_matrix.test.sql`
 * sehingga UI dan server tidak bisa berbeda diam-diam.
 */
export type AccessSubject = AppRole | 'anon';
export const ACCESS_SUBJECTS: readonly AccessSubject[] = [...APP_ROLES, 'anon'];

export const TABLE_OPERATIONS = ['select', 'insert', 'update', 'delete'] as const;
export type TableOperation = (typeof TABLE_OPERATIONS)[number];

type Subjects = readonly AccessSubject[];

const STAFF: Subjects = APP_ROLES;
const NOBODY: Subjects = [];
const by = (action: AdminAction): Subjects => APP_ROLES.filter((role) => can(role, action));

/** Staf membaca; yang mengubah ditentukan satu aksi Admin. */
const staffTable = (action: AdminAction): Record<TableOperation, Subjects> => ({
  select: STAFF,
  insert: by(action),
  update: by(action),
  delete: by(action),
});

export const TABLE_ACCESS = {
  venues: staffTable('venue.edit'),
  buildings: staffTable('venue.edit'),
  floors: staffTable('venue.edit'),
  floor_plans: staffTable('venue.edit'),
  display_settings: staffTable('settings.edit'),
  facility_types: staffTable('settings.edit'),
  instruction_templates: staffTable('settings.edit'),
  features: staffTable('map.edit'),
  nav_nodes: staffTable('map.edit'),
  nav_edges: staffTable('map.edit'),
  connectors: staffTable('map.edit'),
  connector_stops: staffTable('map.edit'),
  info_points: staffTable('map.edit'),
  location_types: staffTable('location.edit'),
  field_definitions: staffTable('location.edit'),
  categories: staffTable('location.edit'),
  locations: staffTable('location.edit'),
  location_units: staffTable('location.edit'),
  location_categories: staffTable('location.edit'),
  opening_hours: staffTable('location.edit'),
  search_aliases: staffTable('location.edit'),
  origin_points: staffTable('origin_point.edit'),
  // Pengunjung (anon) hanya membaca penutupan yang sedang berlaku.
  closures: { ...staffTable('closure.manage'), select: [...STAFF, 'anon'] },
  // Kunci lantai: diambil pengedit untuk dirinya sendiri; kunci orang lain hanya bisa
  // dilepas Super Admin dan tidak bisa diubah siapa pun.
  edit_locks: { select: STAFF, insert: by('map.edit'), update: NOBODY, delete: by('user.manage') },
  // Hanya Edge Function `publish` yang menulis; anon membaca versi aktif.
  publications: { select: [...STAFF, 'anon'], insert: NOBODY, update: NOBODY, delete: NOBODY },
  profiles: staffTable('user.manage'),
  audit_events: { select: by('user.manage'), insert: NOBODY, update: NOBODY, delete: NOBODY },
  system_settings: {
    select: by('settings.system'),
    insert: NOBODY,
    update: by('settings.system'),
    delete: NOBODY,
  },
  installation: { select: by('license.manage'), insert: NOBODY, update: NOBODY, delete: NOBODY },
  licenses: { select: by('license.manage'), insert: NOBODY, update: NOBODY, delete: NOBODY },
} as const satisfies Record<string, Record<TableOperation, Subjects>>;

export type AccessTable = keyof typeof TABLE_ACCESS;

export function tableAllows(
  subject: AccessSubject,
  table: AccessTable,
  operation: TableOperation,
): boolean {
  const allowed: Subjects = TABLE_ACCESS[table][operation];
  return allowed.includes(subject);
}
