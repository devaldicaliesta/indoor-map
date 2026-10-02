import { DataError } from '../errors';

export interface CadLayer {
  name: string;
  /** Jumlah entitas di model space; layer kosong tidak berguna untuk denah. */
  entities: number;
}

export interface CadInspection {
  layers: CadLayer[];
  /** `null` bila berkas tidak mencatat satuan. */
  unit: string | null;
  metersPerUnit: number | null;
  /** `[minX, minY, maxX, maxY]` dalam satuan berkas. */
  extents: number[] | null;
}

export interface CadRender {
  svg: string;
  widthPx: number;
  heightPx: number;
  extents: number[];
}

/** Layanan `services/cad-converter`; berkas dikirim apa adanya dan tidak disimpan di sana. */
export interface CadConverterRepository {
  /** `false` bila alamat layanan belum diatur di instalasi ini. */
  readonly available: boolean;
  inspect(file: Blob): Promise<CadInspection>;
  /** SVG layer terpilih, sisi terpanjang `maxPx` piksel. */
  render(file: Blob, layers: string[], maxPx?: number): Promise<CadRender>;
}

const STATUS_KINDS: Record<number, 'invalid' | 'forbidden'> = {
  400: 'invalid',
  401: 'forbidden',
  413: 'invalid',
  415: 'invalid',
  422: 'invalid',
};

export function createCadConverterRepository(
  accessToken: () => Promise<string | null>,
  baseUrl: string | undefined,
  fetcher: typeof fetch = (...args) => fetch(...args),
): CadConverterRepository {
  const base = baseUrl?.replace(/\/+$/, '');

  async function post<T>(path: string, file: Blob): Promise<T> {
    if (!base) {
      throw new DataError('invalid', {
        message: 'Konversi DXF belum dipasang di server ini. Unggah denah sebagai PDF atau PNG.',
      });
    }
    const token = await accessToken();
    let response: Response;
    try {
      response = await fetcher(`${base}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token ?? ''}`, 'Content-Type': 'application/dxf' },
        body: file,
      });
    } catch (cause) {
      throw new DataError('network', {
        message:
          'Layanan konversi DXF tidak bisa dihubungi. Coba lagi atau hubungi pengelola server.',
        cause,
      });
    }
    const body = (await response.json().catch(() => null)) as
      | (T & { code?: string; message?: string })
      | null;
    if (!response.ok) {
      throw new DataError(STATUS_KINDS[response.status] ?? 'unknown', {
        message: body?.message ?? 'Konversi DXF gagal.',
        code: body?.code ?? null,
      });
    }
    return body as T;
  }

  return {
    available: Boolean(base),
    inspect: (file) => post<CadInspection>('/inspect', file),
    render(file, layers, maxPx = 4000) {
      const query = new URLSearchParams(layers.map((layer) => ['layer', layer]));
      query.set('maxPx', String(maxPx));
      return post<CadRender>(`/render?${query}`, file);
    },
  };
}
