import { describe, expect, it } from 'vitest';
import { licenseFileName, vendorLicenseStatus } from '../src/license-issue';

const NOW = new Date('2026-11-15T00:00:00Z');

describe('vendorLicenseStatus', () => {
  it('lisensi aktif yang sudah lewat masa berlakunya tampil berakhir', () => {
    expect(vendorLicenseStatus('active', '2026-11-15T00:00:00Z', NOW)).toBe('expired');
    expect(vendorLicenseStatus('active', '2026-11-16T00:00:00Z', NOW)).toBe('active');
  });

  it('status tersimpan lain diteruskan, status tak dikenal ditolak', () => {
    expect(vendorLicenseStatus('revoked', '2020-01-01T00:00:00Z', NOW)).toBe('revoked');
    expect(vendorLicenseStatus('superseded', '2030-01-01T00:00:00Z', NOW)).toBe('superseded');
    expect(vendorLicenseStatus('expired', '2030-01-01T00:00:00Z', NOW)).toBeNull();
  });
});

describe('licenseFileName', () => {
  it('memakai ID lisensi', () => {
    expect(licenseFileName({ licenseId: 'LIC-AB12CD34' })).toBe('lisensi-LIC-AB12CD34.json');
  });
});
