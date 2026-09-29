import type { AppRole } from './profile';

/**
 * Matriks akses per role (FR-AUTH-04, docs/spec/05-user-flow.md "Struktur menu Admin").
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
  // Editor hanya menjalankan validasi; tombol Publish/Rollback diatur per aksi (T-009).
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
