import { describe, expect, it } from 'vitest';
import { isNotificationKind, notificationKindsFor, withDefaultPreferences } from '../src';

describe('notificationKindsFor', () => {
  it('sama dengan penerima di database per role', () => {
    expect(notificationKindsFor('super_admin')).toEqual([
      'license_reminder',
      'publish',
      'closure_created',
    ]);
    expect(notificationKindsFor('admin')).toEqual(['publish', 'closure_created']);
    expect(notificationKindsFor('editor')).toEqual(['publish']);
    expect(notificationKindsFor('operator')).toEqual(['closure_created']);
    expect(notificationKindsFor('viewer')).toEqual([]);
  });
});

describe('withDefaultPreferences', () => {
  it('jenis tanpa baris tersimpan dianggap aktif', () => {
    expect(withDefaultPreferences({ publish: false })).toEqual({
      license_reminder: true,
      publish: false,
      closure_created: true,
    });
  });
});

describe('isNotificationKind', () => {
  it('hanya jenis yang bisa dimatikan', () => {
    expect(isNotificationKind('publish')).toBe(true);
    expect(isNotificationKind('backup_failed')).toBe(false);
  });
});
