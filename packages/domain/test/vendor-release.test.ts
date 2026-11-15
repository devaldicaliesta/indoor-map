import { describe, expect, it } from 'vitest';
import {
  checkCheckinRequest,
  checkNewRelease,
  installationReleaseState,
  readSha256,
  type VendorRelease,
} from '../src/vendor-release';

const INSTANCE = '7F3A9C10-0000-4000-8000-000000000001';
const SHA = 'ab'.repeat(32);

describe('checkCheckinRequest', () => {
  it('merapikan isian sah dan membawa versi', () => {
    expect(
      checkCheckinRequest({ licenseId: ' LIC-1 ', instanceId: INSTANCE, version: ' 1.2.0 ' }),
    ).toEqual({
      ok: true,
      request: { licenseId: 'LIC-1', instanceId: INSTANCE.toLowerCase(), version: '1.2.0' },
    });
  });

  it('versi kosong atau tidak sah menjadi null, bukan penolakan (klien lama)', () => {
    const base = { licenseId: 'LIC-1', instanceId: INSTANCE };
    expect(checkCheckinRequest(base)).toMatchObject({ ok: true, request: { version: null } });
    expect(checkCheckinRequest({ ...base, version: 'v 1; drop' })).toMatchObject({
      ok: true,
      request: { version: null },
    });
  });

  it('ID lisensi dan ID instalasi wajib sah', () => {
    expect(checkCheckinRequest({ instanceId: INSTANCE })).toEqual({
      ok: false,
      message: 'ID lisensi wajib diisi.',
    });
    expect(checkCheckinRequest({ licenseId: 'LIC-1', instanceId: 'x' })).toEqual({
      ok: false,
      message: 'ID instalasi tidak valid.',
    });
    expect(checkCheckinRequest(null)).toMatchObject({ ok: false });
  });
});

describe('checkNewRelease', () => {
  const input = {
    version: ' 1.2.0 ',
    releasedOn: '2026-11-15',
    notes: ' Perbaikan ',
    downloadUrl: ' https://unduh.vendor.id/panduarah-1.2.0.tar.gz ',
    sha256: `${SHA.toUpperCase()}  panduarah-1.2.0.tar.gz\n`,
  };

  it('menerima isi berkas .sha256 apa adanya dan merapikan isian', () => {
    expect(checkNewRelease(input, '2026-11-15')).toEqual({
      ok: true,
      release: {
        version: '1.2.0',
        releasedOn: '2026-11-15',
        notes: 'Perbaikan',
        downloadUrl: 'https://unduh.vendor.id/panduarah-1.2.0.tar.gz',
        sha256: SHA,
      },
    });
    expect(readSha256(`${SHA} *arsip.tar.gz`)).toBe(SHA);
  });

  it.each([
    [{ version: '1.2 beta' }, 'Versi hanya'],
    [{ releasedOn: '2026-11-16' }, 'masa depan'],
    [{ downloadUrl: 'http://unduh.vendor.id/a.tar.gz' }, 'https://'],
    [{ sha256: 'abc' }, 'SHA-256'],
    [{ notes: 'x'.repeat(2001) }, 'Catatan'],
  ])('menolak %o', (change, message) => {
    const check = checkNewRelease({ ...input, ...change }, '2026-11-15');
    expect(check.ok).toBe(false);
    expect(check.ok ? '' : check.message).toContain(message);
  });
});

describe('installationReleaseState', () => {
  const release = (version: string): VendorRelease => ({
    id: version,
    version,
    releasedOn: '2026-11-15',
    notes: '',
    downloadUrl: 'https://unduh.vendor.id/a',
    sha256: SHA,
    createdByEmail: null,
    createdAt: '2026-11-15T00:00:00Z',
  });

  it('membandingkan dengan rilis terbaru (urutan pertama)', () => {
    const releases = [release('1.2.0'), release('1.1.0')];
    expect(installationReleaseState('1.2.0', releases)).toEqual({ kind: 'latest' });
    expect(installationReleaseState('1.1.0', releases)).toEqual({
      kind: 'outdated',
      latest: '1.2.0',
    });
    expect(installationReleaseState(null, releases)).toEqual({ kind: 'unknown' });
    expect(installationReleaseState('1.1.0', [])).toEqual({ kind: 'unknown' });
  });
});
