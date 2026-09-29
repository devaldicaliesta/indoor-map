import { describe, expect, it } from 'vitest';
import { ADMIN_MODULES, APP_ROLES, moduleAccess, visibleModules } from '../src';

const menuOf = (role: (typeof APP_ROLES)[number]) =>
  visibleModules(role)
    .map(({ module, access }) => `${module}:${access}`)
    .join(',');

describe('visibleModules', () => {
  it('Super Admin melihat dan mengubah semua modul', () => {
    expect(visibleModules('super_admin')).toEqual(
      ADMIN_MODULES.map((module) => ({ module, access: 'edit' })),
    );
  });

  it('Pengguna dan Lisensi hanya untuk Super Admin', () => {
    for (const role of APP_ROLES.filter((r) => r !== 'super_admin')) {
      expect(moduleAccess(role, 'users')).toBeNull();
      expect(moduleAccess(role, 'license')).toBeNull();
    }
  });

  it('Operator hanya Penutupan (ubah) dan peta (baca)', () => {
    expect(visibleModules('operator')).toEqual([
      { module: 'map_editor', access: 'read' },
      { module: 'closures', access: 'edit' },
    ]);
  });

  it('Viewer membuka semua kecuali Pengguna dan Lisensi, tanpa hak ubah', () => {
    const modules = visibleModules('viewer');
    expect(modules.map((m) => m.module)).toEqual(
      ADMIN_MODULES.filter((m) => m !== 'users' && m !== 'license'),
    );
    expect(modules.every((m) => m.access === 'read')).toBe(true);
  });

  it('Editor tidak mengubah venue dan pengaturan', () => {
    expect(moduleAccess('editor', 'venues')).toBe('read');
    expect(moduleAccess('editor', 'settings')).toBe('read');
    expect(moduleAccess('editor', 'map_editor')).toBe('edit');
  });

  it('menu berbeda untuk kelima role', () => {
    expect(new Set(APP_ROLES.map(menuOf)).size).toBe(5);
  });
});
