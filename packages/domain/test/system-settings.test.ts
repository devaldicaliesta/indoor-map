import { describe, expect, it } from 'vitest';
import {
  AUDIT_RETENTION_DAYS,
  checkBasemapTileUrl,
  checkPublicVisitorUrl,
  escapeAttribution,
  isValidAuditRetentionDays,
  isValidPort,
  isValidTimezone,
} from '../src';

describe('checkPublicVisitorUrl', () => {
  it('menerima https tanpa garis miring akhir, termasuk dengan path', () => {
    expect(checkPublicVisitorUrl('https://peta.rs-harapan.id')).toBeNull();
    expect(checkPublicVisitorUrl('https://rs-harapan.id/peta')).toBeNull();
  });

  it('menolak http kecuali localhost', () => {
    expect(checkPublicVisitorUrl('http://peta.rs-harapan.id')).toBe('not_https');
    expect(checkPublicVisitorUrl('http://localhost:5174')).toBeNull();
    expect(checkPublicVisitorUrl('http://127.0.0.1:5174')).toBeNull();
  });

  it('menolak garis miring di akhir', () => {
    expect(checkPublicVisitorUrl('https://peta.rs-harapan.id/')).toBe('trailing_slash');
  });

  it('menolak query atau hash, dan teks yang bukan URL', () => {
    expect(checkPublicVisitorUrl('https://peta.id?x=1')).toBe('has_query');
    expect(checkPublicVisitorUrl('peta.rs-harapan.id')).toBe('invalid');
    expect(checkPublicVisitorUrl('ftp://peta.id')).toBe('invalid');
  });
});

describe('isValidPort dan isValidTimezone', () => {
  it('port 1–65535', () => {
    expect(isValidPort(587)).toBe(true);
    expect(isValidPort(0)).toBe(false);
    expect(isValidPort(70000)).toBe(false);
    expect(isValidPort(25.5)).toBe(false);
  });

  it('zona waktu IANA', () => {
    expect(isValidTimezone('Asia/Makassar')).toBe(true);
    expect(isValidTimezone('WITA')).toBe(false);
  });
});

describe('URL tile peta dasar', () => {
  it('menerima URL XYZ https dengan {z}, {x}, {y}', () => {
    expect(checkBasemapTileUrl('https://tile.openstreetmap.org/{z}/{x}/{y}.png')).toBeNull();
    expect(checkBasemapTileUrl('http://localhost:8080/tiles/{z}/{x}/{y}.png')).toBeNull();
  });

  it('menolak URL rusak, http di luar localhost, dan tanpa placeholder', () => {
    expect(checkBasemapTileUrl('bukan url')).toBe('invalid');
    expect(checkBasemapTileUrl('http://tile.contoh.id/{z}/{x}/{y}.png')).toBe('not_https');
    expect(checkBasemapTileUrl('https://tile.contoh.id/{z}/{x}.png')).toBe('missing_placeholders');
  });
});

describe('atribusi peta dasar', () => {
  it('karakter HTML di-escape', () => {
    expect(escapeAttribution('© OpenStreetMap contributors')).toBe('© OpenStreetMap contributors');
    expect(escapeAttribution('<img src=x onerror=alert(1)>')).toBe(
      '&#60;img src=x onerror=alert(1)&#62;',
    );
  });
});

describe('isValidAuditRetentionDays', () => {
  it('bilangan bulat 30–3650 hari, bawaan satu tahun', () => {
    expect(AUDIT_RETENTION_DAYS.default).toBe(365);
    expect(isValidAuditRetentionDays(30)).toBe(true);
    expect(isValidAuditRetentionDays(3650)).toBe(true);
    expect(isValidAuditRetentionDays(29)).toBe(false);
    expect(isValidAuditRetentionDays(3651)).toBe(false);
    expect(isValidAuditRetentionDays(90.5)).toBe(false);
    expect(isValidAuditRetentionDays(Number.NaN)).toBe(false);
  });
});
