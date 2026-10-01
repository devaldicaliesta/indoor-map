import type { AppRole } from './profile';

/**
 * Matriks akses per role (docs/spec/05-user-flow.md "Struktur menu Admin").
 * Satu sumber untuk UI; server menegakkan aturan yang sama lewat RLS dan fungsi `app.*`.
 */
export const ADMIN_MODULES = [
  'venues',
  'map_editor',
  'locations',
  'closures',
  'origin_points',
  'publish',
  'settings',
  'users',
  'license',
] as const;
export type AdminModule = (typeof ADMIN_MODULES)[number];

/** `edit`: boleh mengubah; `read`: hanya melihat. Role tanpa entri tidak melihat modulnya. */
export type ModuleAccess = 'edit' | 'read';

const MODULE_ACCESS: Record<AdminModule, Partial<Record<AppRole, ModuleAccess>>> = {
  venues: { super_admin: 'edit', admin: 'edit', editor: 'read', viewer: 'read' },
  map_editor: {
    super_admin: 'edit',
    admin: 'edit',
    editor: 'edit',
    operator: 'read',
    viewer: 'read',
  },
  locations: { super_admin: 'edit', admin: 'edit', editor: 'edit', viewer: 'read' },
  closures: {
    super_admin: 'edit',
    admin: 'edit',
    operator: 'edit',
    editor: 'read',
    viewer: 'read',
  },
  origin_points: { super_admin: 'edit', admin: 'edit', editor: 'edit', viewer: 'read' },
  // Editor hanya menjalankan validasi; tombol Publish/Rollback diatur per aksi.
  publish: { super_admin: 'edit', admin: 'edit', editor: 'edit', viewer: 'read' },
  settings: { super_admin: 'edit', admin: 'edit', editor: 'read', viewer: 'read' },
  users: { super_admin: 'edit' },
  license: { super_admin: 'edit' },
};

export function moduleAccess(role: AppRole, module: AdminModule): ModuleAccess | null {
  return MODULE_ACCESS[module][role] ?? null;
}

export function visibleModules(role: AppRole): { module: AdminModule; access: ModuleAccess }[] {
  return ADMIN_MODULES.flatMap((module) => {
    const access = moduleAccess(role, module);
    return access ? [{ module, access }] : [];
  });
}

/** Aksi yang tombolnya disembunyikan per role; server tetap menegakkan lewat RLS/`app.*`. */
export const ADMIN_ACTIONS = [
  'venue.edit',
  'map.edit',
  'location.edit',
  'closure.manage',
  'origin_point.edit',
  'publish.validate',
  'publish.publish',
  'publish.rollback',
  'settings.edit',
  'settings.system',
  'user.manage',
  'license.manage',
] as const;
export type AdminAction = (typeof ADMIN_ACTIONS)[number];

const ACTION_ROLES: Record<AdminAction, readonly AppRole[]> = {
  'venue.edit': ['super_admin', 'admin'],
  'map.edit': ['super_admin', 'admin', 'editor'],
  'location.edit': ['super_admin', 'admin', 'editor'],
  'closure.manage': ['super_admin', 'admin', 'operator'],
  'origin_point.edit': ['super_admin', 'admin', 'editor'],
  'publish.validate': ['super_admin', 'admin', 'editor'],
  'publish.publish': ['super_admin', 'admin'],
  'publish.rollback': ['super_admin', 'admin'],
  'settings.edit': ['super_admin', 'admin'],
  'settings.system': ['super_admin'],
  'user.manage': ['super_admin'],
  'license.manage': ['super_admin'],
};

export function can(role: AppRole, action: AdminAction): boolean {
  return ACTION_ROLES[action].includes(role);
}
