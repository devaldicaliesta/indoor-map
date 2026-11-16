import { VenueIdSchema } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { DataError } from '../src/errors';
import { createVendorRepository } from '../src/repositories/vendor';
import type { Db } from '../src/supabase';
import { totpCode } from './support/totp';

const VENUE = 'd3000000-0000-4000-8000-0000000000aa';

const requestRow = {
  id: 'e3000000-0000-4000-8000-0000000000aa',
  created_at: '2026-10-01T03:00:00+00:00',
  name: 'Rina',
  institution: 'RS Uji',
  title: 'Manajer',
  email: 'rina@rsuji.co.id',
  phone: '+62 812 0000 0000',
  building_type: 'hospital',
  building_size: 'lt5k',
  language: 'id',
  status: 'active',
  reject_reason: null,
  verified_at: '2026-10-01T03:05:00+00:00',
  queued_at: null,
  venue_id: VENUE,
  slug: 'rs-uji',
  started_at: '2026-10-01T03:05:00+00:00',
  ends_at: '2026-10-18T03:05:00+00:00',
  locked_at: null,
  extended_days: 0,
  published_versions: 2,
  last_published_at: '2026-10-03T03:00:00+00:00',
};

function repoWith(
  rpcResult: { data: unknown; error: unknown },
  invokeResult: { data: unknown; error: unknown } = { data: null, error: null },
) {
  const calls: { name: string; args: unknown }[] = [];
  const db = {
    rpc: async (name: string, args?: unknown) => {
      calls.push({ name, args });
      return rpcResult;
    },
    functions: { invoke: async () => invokeResult },
  } as unknown as Db;
  return { repo: createVendorRepository(db), calls };
}

describe('repository dasbor vendor', () => {
  it('baris vendor_requests menjadi lead dengan ruang kerja', async () => {
    const { repo } = repoWith({ data: [requestRow], error: null });
    const [lead] = await repo.leads();
    expect(lead).toMatchObject({
      institution: 'RS Uji',
      status: 'active',
      rejectReason: null,
      trial: { venueId: VENUE, slug: 'rs-uji', extendedDays: 0, publishedVersions: 2 },
    });
  });

  it('permintaan tanpa ruang kerja (antre, ditolak) tidak punya trial', async () => {
    const queued = {
      ...requestRow,
      status: 'rejected',
      reject_reason: 'duplicate',
      venue_id: null,
      slug: null,
      started_at: null,
      ends_at: null,
      extended_days: null,
      published_versions: null,
    };
    const { repo } = repoWith({ data: [queued], error: null });
    const [lead] = await repo.leads();
    expect(lead?.trial).toBeNull();
    expect(lead?.rejectReason).toBe('duplicate');
  });

  it('status yang tidak dikenal ditolak, bukan ditampilkan apa adanya', async () => {
    const { repo } = repoWith({ data: [{ ...requestRow, status: 'aneh' }], error: null });
    await expect(repo.leads()).rejects.toBeInstanceOf(DataError);
  });

  it('akses selain ok/mfa dianggap ditolak', async () => {
    await expect(repoWith({ data: 'mfa', error: null }).repo.access()).resolves.toBe('mfa');
    await expect(repoWith({ data: 'lain', error: null }).repo.access()).resolves.toBe('denied');
  });

  it('pesan aturan server (IMxxx) diteruskan ke vendor', async () => {
    const { repo, calls } = repoWith({
      data: null,
      error: { code: 'IM422', message: 'Perpanjangan total paling lama 17 hari; sisa 2 hari.' },
    });
    await expect(repo.extend(VenueIdSchema.parse(VENUE), 5)).rejects.toThrow('sisa 2 hari');
    expect(calls).toEqual([
      { name: 'vendor_trial_extend', args: { p_venue_id: VENUE, p_days: 5 } },
    ]);
  });

  it('siklus hidup yang sebagian gagal (HTTP 500) tetap mengembalikan hitungannya', async () => {
    const counts = { reminded: 0, locked: 1, deleted: 0, activated: 0, failed: 1 };
    const { repo } = repoWith(
      { data: null, error: null },
      { data: null, error: { context: new Response(JSON.stringify(counts), { status: 500 }) } },
    );
    await expect(repo.runLifecycle()).resolves.toEqual(counts);
  });
});

describe('antrean trial on-premise', () => {
  const trialRow = {
    id: 'e3000000-0000-4000-8000-0000000000bb',
    name: 'Sari',
    institution: 'Kampus Uji',
    email: 'sari@kampus.ac.id',
    instance_id: 'c3000000-0000-4000-8000-0000000000cc',
    status: 'rejected',
    reject_reason: 'Data belum lengkap',
    created_at: '2026-11-15T01:00:00+00:00',
    decided_at: '2026-11-15T02:00:00+00:00',
    decided_by_email: 'staf@vendor.id',
    license_id: null,
  };
  const license = {
    licenseId: 'LIC-ABCDEF12',
    client: 'Kampus Uji',
    plan: 'trial',
    validFrom: '2026-11-15T00:00:00Z',
    validUntil: '2026-11-29T00:00:00Z',
    quota: { venues: 1, buildings: 2, floors: 6, infoPoints: 2 },
    features: ['3d'],
    instanceId: trialRow.instance_id,
    issuedAt: '2026-11-15T02:00:00Z',
    signature: 'c2lnbmF0dXJl',
  };

  function invoking(result: { data: unknown; error: unknown }) {
    const calls: { name: string; body: unknown }[] = [];
    const db = {
      rpc: async () => ({ data: [trialRow], error: null }),
      functions: {
        invoke: async (name: string, options: { body: unknown }) => {
          calls.push({ name, body: options.body });
          return result;
        },
      },
    } as unknown as Db;
    return { repo: createVendorRepository(db), calls };
  }

  it('baris antrean menjadi permintaan dengan keputusan dan alasannya', async () => {
    const [request] = await invoking({ data: null, error: null }).repo.trialRequests();
    expect(request).toEqual({
      id: trialRow.id,
      name: 'Sari',
      institution: 'Kampus Uji',
      email: 'sari@kampus.ac.id',
      instanceId: trialRow.instance_id,
      status: 'rejected',
      rejectReason: 'Data belum lengkap',
      createdAt: trialRow.created_at,
      decidedAt: trialRow.decided_at,
      decidedByEmail: 'staf@vendor.id',
      licenseId: null,
    });
  });

  it('persetujuan memanggil vendor-trial dan mengembalikan berkas lisensi', async () => {
    const { repo, calls } = invoking({ data: { license, emailed: true }, error: null });
    await expect(repo.approveTrial(trialRow.id, 20)).resolves.toEqual({ license, emailed: true });
    expect(calls).toEqual([
      { name: 'vendor-trial', body: { requestId: trialRow.id, decision: 'approve', days: 20 } },
    ]);
  });

  it('balasan persetujuan tanpa lisensi yang terbaca ditolak', async () => {
    const { repo } = invoking({
      data: { license: { licenseId: 'x' }, emailed: true },
      error: null,
    });
    await expect(repo.approveTrial(trialRow.id, 14)).rejects.toThrow('Balasan lisensi');
  });

  it('pesan penolakan dari fungsi diteruskan dan email gagal tetap dilaporkan', async () => {
    const conflict = new Response(JSON.stringify({ message: 'Permintaan sudah diputuskan.' }), {
      status: 409,
    });
    await expect(
      invoking({ data: null, error: { context: conflict } }).repo.rejectTrial(trialRow.id, 'x'),
    ).rejects.toThrow('Permintaan sudah diputuskan.');
    const { repo, calls } = invoking({ data: { emailed: false }, error: null });
    await expect(repo.rejectTrial(trialRow.id, 'Data belum lengkap')).resolves.toEqual({
      emailed: false,
    });
    expect(calls[0]?.body).toEqual({
      requestId: trialRow.id,
      decision: 'reject',
      reason: 'Data belum lengkap',
    });
  });
});

describe('check-in dan rilis', () => {
  it('baris check-in dan rilis dipetakan; versi atau IP kosong menjadi null', async () => {
    const checkins = repoWith({
      data: [{ created_at: '2026-11-15T01:00:00+00:00', version: null, ip_address: null }],
      error: null,
    });
    await expect(checkins.repo.checkins('i-1')).resolves.toEqual([
      { at: '2026-11-15T01:00:00+00:00', version: null, ip: null },
    ]);
    expect(checkins.calls).toEqual([
      { name: 'vendor_checkins', args: { p_installation_id: 'i-1' } },
    ]);

    const releases = repoWith({
      data: [
        {
          id: 'r-1',
          version: '1.2.0',
          released_on: '2026-11-15',
          notes: '',
          download_url: 'https://unduh.vendor.id/a.tar.gz',
          sha256: 'ab'.repeat(32),
          created_by_email: null,
          created_at: '2026-11-15T01:00:00+00:00',
        },
      ],
      error: null,
    });
    await expect(releases.repo.releases()).resolves.toEqual([
      {
        id: 'r-1',
        version: '1.2.0',
        releasedOn: '2026-11-15',
        notes: '',
        downloadUrl: 'https://unduh.vendor.id/a.tar.gz',
        sha256: 'ab'.repeat(32),
        createdByEmail: null,
        createdAt: '2026-11-15T01:00:00+00:00',
      },
    ]);
  });

  it('rilis ganda ditolak dengan pesan server', async () => {
    const { repo, calls } = repoWith({
      data: null,
      error: { code: 'IM409', message: 'Rilis versi 1.2.0 sudah ada.' },
    });
    await expect(
      repo.addRelease({
        version: '1.2.0',
        releasedOn: '2026-11-15',
        notes: '',
        downloadUrl: 'https://unduh.vendor.id/a.tar.gz',
        sha256: 'ab'.repeat(32),
      }),
    ).rejects.toThrow('sudah ada');
    expect(calls[0]?.name).toBe('vendor_release_add');
  });
});

describe('kunci lisensi', () => {
  const keyRow = {
    id: 'k-1',
    key_hint: 'YZ012',
    status: 'activated',
    plan: 'Profesional',
    duration_days: 365,
    quota: { venues: 1, buildings: 1, floors: 10, infoPoints: 0 },
    features: ['3d'],
    instance_id: 'c6800000-0000-4000-8000-000000000001',
    installation_name: 'Instalasi c6800000',
    license_id: 'LIC-AB12CD34',
    created_at: '2026-11-15T01:00:00+00:00',
    created_by_email: null,
    activated_at: '2026-11-15T02:00:00+00:00',
    revoked_at: null,
  };

  it('baris kunci dipetakan', async () => {
    const { repo, calls } = repoWith({ data: [keyRow], error: null });
    await expect(repo.licenseKeys('c-1')).resolves.toEqual([
      {
        id: 'k-1',
        hint: 'YZ012',
        status: 'activated',
        plan: 'Profesional',
        durationDays: 365,
        quota: { venues: 1, buildings: 1, floors: 10, infoPoints: 0 },
        features: ['3d'],
        instanceId: 'c6800000-0000-4000-8000-000000000001',
        installationName: 'Instalasi c6800000',
        licenseId: 'LIC-AB12CD34',
        createdAt: '2026-11-15T01:00:00+00:00',
        createdByEmail: null,
        activatedAt: '2026-11-15T02:00:00+00:00',
        revokedAt: null,
      },
    ]);
    expect(calls).toEqual([{ name: 'vendor_license_keys', args: { p_client_id: 'c-1' } }]);
  });

  it('status tak dikenal ditolak', async () => {
    const { repo } = repoWith({ data: [{ ...keyRow, status: 'hilang' }], error: null });
    await expect(repo.licenseKeys('c-1')).rejects.toThrow('tidak terbaca');
  });

  it('membuat kunci mengirim templat dan mengembalikan kunci', async () => {
    const { repo, calls } = repoWith({ data: 'ABCDE-FGHJK-MNPQR-STVWX-YZ012', error: null });
    await expect(
      repo.createLicenseKey({
        clientId: 'c-1',
        plan: 'Profesional',
        durationDays: 365,
        quota: { venues: 1, buildings: 1, floors: 10, infoPoints: 0 },
        features: [],
      }),
    ).resolves.toBe('ABCDE-FGHJK-MNPQR-STVWX-YZ012');
    expect(calls[0]).toEqual({
      name: 'vendor_license_key_create',
      args: {
        p_client_id: 'c-1',
        p_plan: 'Profesional',
        p_duration_days: 365,
        p_quota: { venues: 1, buildings: 1, floors: 10, infoPoints: 0 },
        p_features: [],
      },
    });
  });
});

describe('kode TOTP untuk test', () => {
  it('cocok dengan vektor RFC 6238 (SHA-1)', () => {
    // Rahasia ASCII "12345678901234567890"; kode 8 digit 94287082 → 6 digit terakhir.
    expect(totpCode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59_000)).toBe('287082');
    expect(totpCode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 1_111_111_109_000)).toBe('081804');
  });
});
