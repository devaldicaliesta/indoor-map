import { describe, expect, it } from 'vitest';
import { DataError } from '../src/errors';
import { createTrialRepository } from '../src/repositories/trial';
import type { Db } from '../src/supabase';

const VENUE = '1d000000-0000-4000-8000-000000000001';

const repoReturning = (result: { data: unknown; error: unknown }) => {
  const calls: string[] = [];
  const db = {
    rpc: async (name: string) => {
      calls.push(name);
      return result;
    },
  } as unknown as Db;
  return { repo: createTrialRepository(db), calls };
};

describe('status trial ter-hosting', () => {
  it('baris trial_status menjadi status domain', async () => {
    const { repo, calls } = repoReturning({
      data: [{ venue_id: VENUE, ends_at: '2026-10-29T03:00:00+00:00', locked: false }],
      error: null,
    });
    await expect(repo.status()).resolves.toEqual({
      venueId: VENUE,
      endsAt: '2026-10-29T03:00:00+00:00',
      locked: false,
    });
    expect(calls).toEqual(['trial_status']);
  });

  it('bukan pengguna trial (on-premise, staf vendor): null', async () => {
    const { repo } = repoReturning({ data: [], error: null });
    await expect(repo.status()).resolves.toBeNull();
  });

  it('galat server menjadi DataError', async () => {
    const { repo } = repoReturning({ data: null, error: { code: '42501', message: 'ditolak' } });
    await expect(repo.status()).rejects.toBeInstanceOf(DataError);
  });
});
