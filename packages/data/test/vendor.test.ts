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

describe('kode TOTP untuk test', () => {
  it('cocok dengan vektor RFC 6238 (SHA-1)', () => {
    // Rahasia ASCII "12345678901234567890"; kode 8 digit 94287082 → 6 digit terakhir.
    expect(totpCode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 59_000)).toBe('287082');
    expect(totpCode('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', 1_111_111_109_000)).toBe('081804');
  });
});
