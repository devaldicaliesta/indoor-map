import { describe, expect, it } from 'vitest';
import { DataError } from '../src/errors';
import { createCadConverterRepository } from '../src/repositories/cad-converter';

const session = async () => 'token-sesi';
const dxf = new Blob(['0\nSECTION\n'], { type: 'image/vnd.dxf' });

function stub(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetcher = async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    return new Response(JSON.stringify(body), { status });
  };
  return { calls, fetcher: fetcher as typeof fetch };
}

describe('klien konversi CAD', () => {
  it('tanpa alamat layanan: tidak tersedia dan menolak dengan pesan jelas', async () => {
    const cad = createCadConverterRepository(session, undefined);
    expect(cad.available).toBe(false);
    await expect(cad.inspect(dxf)).rejects.toMatchObject({
      kind: 'invalid',
      message: expect.stringContaining('belum dipasang'),
    });
  });

  it('inspect dan render mengirim berkas dengan token sesi', async () => {
    const inspected = {
      layers: [{ name: 'DINDING', entities: 2 }],
      unit: 'mm',
      metersPerUnit: 0.001,
      extents: [0, 0, 1, 1],
    };
    const { calls, fetcher } = stub(200, inspected);
    const cad = createCadConverterRepository(session, 'http://cad.local/', fetcher);
    expect(await cad.inspect(dxf)).toEqual(inspected);
    await cad.render(dxf, ['DINDING', 'PINTU & JENDELA'], 3000);
    expect(calls.map((c) => c.url)).toEqual([
      'http://cad.local/inspect',
      'http://cad.local/render?layer=DINDING&layer=PINTU+%26+JENDELA&maxPx=3000',
    ]);
    expect(new Headers(calls[0]?.init.headers).get('Authorization')).toBe('Bearer token-sesi');
    expect(calls[0]?.init.body).toBe(dxf);
  });

  it('pesan layanan diteruskan; layanan mati menjadi galat jaringan', async () => {
    const { fetcher } = stub(415, {
      code: 'invalid_dxf',
      message: 'Berkas bukan DXF yang bisa dibaca.',
    });
    const cad = createCadConverterRepository(session, 'http://cad.local', fetcher);
    const error = await cad.inspect(dxf).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(DataError);
    expect(error).toMatchObject({
      kind: 'invalid',
      code: 'invalid_dxf',
      message: 'Berkas bukan DXF yang bisa dibaca.',
    });

    const down = createCadConverterRepository(session, 'http://cad.local', (async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch);
    await expect(down.inspect(dxf)).rejects.toMatchObject({ kind: 'network' });
  });
});
