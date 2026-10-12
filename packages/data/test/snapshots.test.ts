import { buildSnapshot, type VenueId, type VenueSlug } from '@indoor/domain';
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

describe('alamat slug Visitor', () => {
  const SLUG = 'demo' as VenueSlug;

  it('penunjuk slug publik dibaca ulang ke server dan menghasilkan id venue', async () => {
    const fetchMock = respondWith(Response.json({ venueId: VENUE }));
    await expect(repo.venueIdForSlug(SLUG)).resolves.toBe(VENUE);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://peta.test/storage/v1/object/public/snapshots/slugs/demo.json',
      { cache: 'no-cache' },
    );
  });

  it('respons dari HTML dipakai alih-alih permintaan baru', async () => {
    const fetchMock = respondWith(new TypeError('tidak boleh dipanggil'));
    await expect(
      repo.venueIdForSlug(SLUG, Promise.resolve(Response.json({ venueId: VENUE }))),
    ).resolves.toBe(VENUE);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('slug yang belum pernah diterbitkan menjadi not_found', async () => {
    respondWith(new Response('', { status: 400 }));
    const error = await repo.venueIdForSlug(SLUG).catch((e: unknown) => e);
    expect((error as DataError).kind).toBe('not_found');
  });

  it('penunjuk rusak ditolak sebagai invalid', async () => {
    respondWith(Response.json({ venueId: 'bukan-uuid' }));
    const error = await repo.venueIdForSlug(SLUG).catch((e: unknown) => e);
    expect((error as DataError).kind).toBe('invalid');
  });
});

describe('penanda latest.json', () => {
  it('trial ter-hosting berakhir: forbidden dengan kode trial_ended', async () => {
    respondWith(Response.json({ trialEnded: true }));
    const error = await latestError();
    expect(error.kind).toBe('forbidden');
    expect(error.code).toBe('trial_ended');
  });
});
