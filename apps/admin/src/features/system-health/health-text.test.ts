import { describe, expect, it } from 'vitest';
import { alertText, serviceStateText } from './health-text';

describe('alertText', () => {
  it('backup gagal: satu titik walau pesan sudah diakhiri titik', () => {
    expect(
      alertText({ kind: 'backup_failed', details: { message: 'Berhenti saat backup database.' } }),
    ).toBe('Backup gagal 2 kali berturut-turut. Pesan terakhir: Berhenti saat backup database.');
    expect(alertText({ kind: 'backup_failed', details: {} })).toBe(
      'Backup gagal 2 kali berturut-turut. Pesan terakhir: tanpa keterangan.',
    );
  });

  it('disk dan sertifikat menyebut angka dari server', () => {
    expect(alertText({ kind: 'disk_high', details: { path: '/data', percent: 91 } })).toBe(
      'Disk /data terpakai 91% (batas 85%).',
    );
    expect(
      alertText({ kind: 'cert_expiring', details: { domain: 'admin.rs.id', days_left: 9 } }),
    ).toBe('Sertifikat HTTPS admin.rs.id berakhir dalam 9 hari.');
    expect(alertText({ kind: 'cert_expiring', details: { days_left: 0 } })).toBe(
      'Sertifikat HTTPS server sudah atau hampir berakhir.',
    );
  });
});

describe('serviceStateText', () => {
  it('membedakan berjalan, tidak sehat, dan berhenti', () => {
    expect(serviceStateText('running', 'healthy')).toBe('berjalan');
    expect(serviceStateText('running', 'unhealthy')).toBe('berjalan, tidak sehat');
    expect(serviceStateText('exited', '')).toBe('berhenti');
  });
});
