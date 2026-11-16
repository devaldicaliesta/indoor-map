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

  it('lisensi tanpa cad_import: 403 dari layanan menjadi galat izin dengan pesan layanan', async () => {
    const { fetcher } = stub(403, {
      code: 'feature_locked',
      message: 'Impor denah CAD (DXF) tidak termasuk paket lisensi ini.',
    });
    const cad = createCadConverterRepository(session, 'http://cad.local', fetcher);
    await expect(cad.render(dxf, ['DINDING'])).rejects.toMatchObject({
      kind: 'forbidden',
      code: 'feature_locked',
      message: 'Impor denah CAD (DXF) tidak termasuk paket lisensi ini.',
    });
  });
});

describe('scan denah', () => {
  const png = new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' });
  const result = {
    widthPx: 100,
    heightPx: 80,
    rooms: [
      {
        points: [
          [0, 0],
          [50, 0],
          [50, 40],
        ],
        confidence: 0.9,
      },
    ],
    walls: [],
  };

  it('mengirim gambar dengan kepekaan dan membaca hasilnya', async () => {
    const { calls, fetcher } = stub(200, result);
    const cad = createCadConverterRepository(session, 'http://cad.local', fetcher);
    await expect(cad.scan(png, 'high')).resolves.toEqual(result);
    expect(calls[0]?.url).toBe('http://cad.local/scan?sensitivity=high');
    expect(new Headers(calls[0]?.init.headers).get('Content-Type')).toBe('image/png');
  });

  it('gambar di luar batas ditolak dengan pesan layanan', async () => {
    const { fetcher } = stub(413, {
      code: 'too_large_px',
      message: 'Gambar 9000×10 piksel melebihi batas.',
    });
    const cad = createCadConverterRepository(session, 'http://cad.local', fetcher);
    await expect(cad.scan(png, 'medium')).rejects.toMatchObject({
      kind: 'invalid',
      code: 'too_large_px',
      message: expect.stringContaining('melebihi batas'),
    });
  });

  it('balasan rusak dan layanan belum dipasang', async () => {
    const { fetcher } = stub(200, { widthPx: 0 });
    await expect(
      createCadConverterRepository(session, 'http://cad.local', fetcher).scan(png, 'low'),
    ).rejects.toThrow('tidak terbaca');
    await expect(createCadConverterRepository(session, undefined).scan(png, 'low')).rejects.toThrow(
      'Scan denah butuh',
    );
  });
});
