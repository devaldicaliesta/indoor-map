import { describe, expect, it } from 'vitest';
import {
  ADMIN_ACTIONS,
  ADMIN_MODULES,
  APP_ROLES,
  can,
  canInviteUsers,
  invitableRoles,
  moduleAccess,
  moduleAccessFor,
  visibleModules,
  visibleModulesFor,
} from '../src';

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

describe('can', () => {
  it('Editor tidak bisa publish, rollback, kelola pengguna, atau lisensi (FR-AUTH-04)', () => {
    for (const action of [
      'publish.publish',
      'publish.rollback',
      'user.manage',
      'license.manage',
    ] as const) {
      expect(can('editor', action)).toBe(false);
    }
    expect(can('editor', 'publish.validate')).toBe(true);
  });

  it('Operator hanya mengelola penutupan', () => {
    expect(ADMIN_ACTIONS.filter((action) => can('operator', action))).toEqual(['closure.manage']);
  });

  it('Viewer tidak punya aksi ubah apa pun', () => {
    expect(ADMIN_ACTIONS.filter((action) => can('viewer', action))).toEqual([]);
  });

  it('Super Admin boleh semua aksi', () => {
    expect(ADMIN_ACTIONS.every((action) => can('super_admin', action))).toBe(true);
  });

  it('aksi ubah konsisten dengan akses modul', () => {
    for (const role of APP_ROLES) {
      expect(can(role, 'venue.edit')).toBe(moduleAccess(role, 'venues') === 'edit');
      expect(can(role, 'closure.manage')).toBe(moduleAccess(role, 'closures') === 'edit');
    }
  });
});

describe('akses per venue (trial ter-hosting)', () => {
  const venueAdmin = { role: 'admin', allVenues: false } as const;

  it('Admin venue melihat Pengguna dalam mode baca dan bisa mengundang', () => {
    expect(moduleAccessFor(venueAdmin, 'users')).toBe('read');
    expect(canInviteUsers(venueAdmin)).toBe(true);
  });

  it('Admin venue tetap tidak melihat Lisensi', () => {
    expect(moduleAccessFor(venueAdmin, 'license')).toBeNull();
    expect(visibleModulesFor(venueAdmin).map(({ module }) => module)).not.toContain('license');
  });

  it('Admin venue tidak bisa memberi role Super Admin', () => {
    expect(invitableRoles(venueAdmin)).not.toContain('super_admin');
    expect(invitableRoles({ role: 'super_admin', allVenues: true })).toEqual(APP_ROLES);
  });

  it('pengguna akses-semua (on-premise) tidak berubah dari aturan per role', () => {
    for (const role of APP_ROLES) {
      const subject = { role, allVenues: true };
      expect(visibleModulesFor(subject)).toEqual(visibleModules(role));
      expect(canInviteUsers(subject)).toBe(can(role, 'user.manage'));
    }
  });

  it('peran lain dengan satu venue tidak mendapat modul Pengguna', () => {
    for (const role of ['editor', 'operator', 'viewer'] as const) {
      expect(moduleAccessFor({ role, allVenues: false }, 'users')).toBeNull();
      expect(canInviteUsers({ role, allVenues: false })).toBe(false);
    }
  });
});
