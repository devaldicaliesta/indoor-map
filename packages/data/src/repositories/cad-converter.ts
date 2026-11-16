import {
  readScanResult,
  type ScanResult,
  type ScanSensitivity,
  trimTrailingSlashes,
} from '@indoor/domain';
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
  scan(image: Blob, sensitivity: ScanSensitivity): Promise<ScanResult>;
}

interface Messages {
  missing: string;
  network: string;
  failed: string;
}

const DXF: Messages = {
  missing: 'Konversi DXF belum dipasang di server ini. Unggah denah sebagai PDF atau PNG.',
  network: 'Layanan konversi DXF tidak bisa dihubungi. Coba lagi atau hubungi pengelola server.',
  failed: 'Konversi DXF gagal.',
};

const SCAN: Messages = {
  missing: 'Scan denah butuh layanan cad-converter yang belum dipasang di server ini.',
  network: 'Layanan scan denah tidak bisa dihubungi. Coba lagi atau hubungi pengelola server.',
  failed: 'Scan denah gagal.',
};

const STATUS_KINDS: Record<number, 'invalid' | 'forbidden'> = {
  400: 'invalid',
  401: 'forbidden',
  // Lisensi instalasi tanpa fitur `cad_import`: layanan menolak walau UI terlewati.
  403: 'forbidden',
  413: 'invalid',
  415: 'invalid',
  422: 'invalid',
};

export function createCadConverterRepository(
  accessToken: () => Promise<string | null>,
  baseUrl: string | undefined,
  fetcher: typeof fetch = (...args) => fetch(...args),
): CadConverterRepository {
  const base = baseUrl === undefined ? undefined : trimTrailingSlashes(baseUrl);

  async function post<T>(
    path: string,
    file: Blob,
    messages: Messages = DXF,
    contentType = 'application/dxf',
  ): Promise<T> {
    if (!base) throw new DataError('invalid', { message: messages.missing });
    const token = await accessToken();
    let response: Response;
    try {
      response = await fetcher(`${base}${path}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token ?? ''}`, 'Content-Type': contentType },
        body: file,
      });
    } catch (cause) {
      throw new DataError('network', { message: messages.network, cause });
    }
    const body = (await response.json().catch(() => null)) as
      | (T & { code?: string; message?: string })
      | null;
    if (!response.ok) {
      throw new DataError(STATUS_KINDS[response.status] ?? 'unknown', {
        message: body?.message ?? messages.failed,
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
    async scan(image, sensitivity) {
      const body = await post<unknown>(
        `/scan?sensitivity=${sensitivity}`,
        image,
        SCAN,
        image.type || 'image/png',
      );
      const result = readScanResult(body);
      if (!result) throw new DataError('unknown', { message: 'Balasan scan denah tidak terbaca.' });
      return result;
    },
  };
}
