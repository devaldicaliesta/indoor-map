import { describe, expect, it } from 'vitest';
import { DataError } from '../src/errors';
import { zeroRowsError } from '../src/mutations';
import { mapProfileRow, toProfileUpdate } from '../src/repositories/profiles';
import { mapSystemSettingsRow, toSystemSettingsUpdate } from '../src/repositories/system-settings';

const profileRow = {
  user_id: '00000000-0000-4000-8000-000000000001',
  full_name: 'Super Admin Lokal',
  email: 'admin@local.test',
  role: 'super_admin' as const,
  is_active: true,
  all_venues: true,
  locked_until: null,
  created_at: '2026-09-29T08:00:00+00:00',
  updated_at: '2026-09-29T08:00:00+00:00',
};

describe('profil', () => {
  it('baris profiles menjadi tipe domain', () => {
    expect(mapProfileRow(profileRow)).toEqual({
      userId: '00000000-0000-4000-8000-000000000001',
      fullName: 'Super Admin Lokal',
      email: 'admin@local.test',
      role: 'super_admin',
      isActive: true,
      allVenues: true,
      lockedUntil: null,
      createdAt: '2026-09-29T08:00:00+00:00',
      updatedAt: '2026-09-29T08:00:00+00:00',
    });
  });

  it('baris dengan ID rusak ditolak', () => {
    expect(() => mapProfileRow({ ...profileRow, user_id: 'bukan-uuid' })).toThrow();
  });

  it('patch hanya mengirim kolom yang diisi', () => {
    expect(toProfileUpdate({ role: 'editor' })).toEqual({ role: 'editor' });
    expect(toProfileUpdate({ fullName: 'Budi', isActive: false })).toEqual({
      full_name: 'Budi',
      is_active: false,
    });
  });
});

describe('pengaturan sistem', () => {
  const row = {
    public_visitor_url: 'https://peta.contoh.id',
    smtp_host: 'smtp.contoh.id',
    smtp_port: 587,
    smtp_username: 'noreply',
    smtp_from: 'Peta <noreply@contoh.id>',
    default_timezone: 'Asia/Jakarta',
    default_language: 'id' as const,
    basemap_tile_url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    basemap_attribution: '© OpenStreetMap contributors',
    audit_retention_days: 365,
    updated_at: '2026-09-29T08:00:00+00:00',
  };

  it('baris system_settings menjadi tipe domain', () => {
    expect(mapSystemSettingsRow(row)).toEqual({
      publicVisitorUrl: 'https://peta.contoh.id',
      smtpHost: 'smtp.contoh.id',
      smtpPort: 587,
      smtpUsername: 'noreply',
      smtpFrom: 'Peta <noreply@contoh.id>',
      defaultTimezone: 'Asia/Jakarta',
      defaultLanguage: 'id',
      basemapTileUrl: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      basemapAttribution: '© OpenStreetMap contributors',
      auditRetentionDays: 365,
      updatedAt: '2026-09-29T08:00:00+00:00',
    });
  });

  it('patch memakai nama kolom database dan boleh mengosongkan nilai', () => {
    expect(
      toSystemSettingsUpdate({
        publicVisitorUrl: null,
        defaultLanguage: 'en',
        auditRetentionDays: 90,
      }),
    ).toEqual({
      public_visitor_url: null,
      default_language: 'en',
      audit_retention_days: 90,
    });
  });
});

describe('zeroRowsError', () => {
  it('baris terlihat tetapi tidak berubah berarti forbidden', async () => {
    const error = await zeroRowsError(async () => true);
    expect(error).toBeInstanceOf(DataError);
    expect(error.kind).toBe('forbidden');
  });

  it('baris tidak terlihat berarti not_found', async () => {
    expect((await zeroRowsError(async () => false)).kind).toBe('not_found');
  });
});
