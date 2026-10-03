import { buildSnapshot, type VenueId } from '@indoor/domain';
import { sampleSnapshotSource } from '@indoor/domain/fixtures/snapshot-source.ts';
import { createClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Database } from '../src/database.types';
import { DataError } from '../src/errors';
import { createSnapshotsRepository } from '../src/repositories/snapshots';

const VENUE = '10000000-0000-4000-8000-000000000001' as VenueId;
const repo = createSnapshotsRepository(
  createClient<Database>('https://peta.test', 'anon-key', { auth: { persistSession: false } }),
);

function respondWith(response: Response | Error) {
  const fetchMock = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

async function latestError(): Promise<DataError> {
  const error = await repo.latest(VENUE).catch((e: unknown) => e);
  expect(error).toBeInstanceOf(DataError);
  return error as DataError;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('snapshot Visitor', () => {
  it('membaca latest.json publik venue dan memeriksanya terhadap skema', async () => {
    const snapshot = buildSnapshot(sampleSnapshotSource());
    const fetchMock = respondWith(Response.json(snapshot));

    await expect(repo.latest(VENUE)).resolves.toEqual(snapshot);
    expect(fetchMock).toHaveBeenCalledWith(
      `https://peta.test/storage/v1/object/public/snapshots/${VENUE}/latest.json`,
      // Selalu divalidasi ulang ke server agar versi baru terpakai setelah publish.
      { cache: 'no-cache' },
    );
  });

  it('venue yang belum menerbitkan peta menjadi not_found', async () => {
    respondWith(new Response('{"error":"not_found"}', { status: 400 }));
    expect((await latestError()).kind).toBe('not_found');
    respondWith(new Response('', { status: 404 }));
    expect((await latestError()).kind).toBe('not_found');
  });

  it('isi yang tidak sesuai skema ditolak sebagai invalid', async () => {
    respondWith(Response.json({ schemaVersion: 2 }));
    expect((await latestError()).kind).toBe('invalid');
  });

  it('server tidak terjangkau menjadi network', async () => {
    respondWith(new TypeError('Failed to fetch'));
    expect((await latestError()).kind).toBe('network');
  });

  it('path aset menjadi URL publik bucket public-assets', () => {
    expect(repo.assetUrl('venues/a/logo.png')).toBe(
      'https://peta.test/storage/v1/object/public/public-assets/venues/a/logo.png',
    );
  });
});
