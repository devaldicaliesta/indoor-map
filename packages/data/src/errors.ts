export type DataErrorKind =
  | 'conflict'
  | 'invalid'
  | 'forbidden'
  | 'not_found'
  | 'network'
  | 'unknown';

const DEFAULT_MESSAGES: Record<DataErrorKind, string> = {
  conflict: 'Data bentrok dengan data yang sudah ada.',
  invalid: 'Data tidak valid.',
  forbidden: 'Anda tidak memiliki izin untuk tindakan ini.',
  not_found: 'Data tidak ditemukan.',
  network: 'Tidak dapat terhubung ke server. Periksa koneksi, lalu coba lagi.',
  unknown: 'Terjadi kesalahan yang tidak terduga. Coba lagi.',
};

/** Satu-satunya jenis error yang keluar dari `@indoor/data`. */
export class DataError extends Error {
  override readonly name = 'DataError';
  readonly kind: DataErrorKind;
  /** Kode asli dari Postgres/PostgREST, jika ada. */
  readonly code: string | null;

  constructor(
    kind: DataErrorKind,
    options: { message?: string | undefined; code?: string | null; cause?: unknown } = {},
  ) {
    super(options.message ?? DEFAULT_MESSAGES[kind], { cause: options.cause });
    this.kind = kind;
    this.code = options.code ?? null;
  }
}

interface CodeRule {
  kind: DataErrorKind;
  message?: string;
}

// Kode SQLSTATE Postgres dan kode PostgREST (PGRSTxxx).
const CODE_RULES: Record<string, CodeRule> = {
  '23505': { kind: 'conflict', message: 'Data dengan nilai yang sama sudah ada.' },
  '23503': { kind: 'conflict', message: 'Data masih dipakai atau merujuk data yang tidak ada.' },
  '23514': { kind: 'invalid', message: 'Data melanggar aturan validasi.' },
  '23502': { kind: 'invalid', message: 'Ada isian wajib yang kosong.' },
  '22P02': { kind: 'invalid', message: 'Format data tidak valid.' },
  '22001': { kind: 'invalid', message: 'Teks terlalu panjang.' },
  '42501': { kind: 'forbidden' },
  PGRST116: { kind: 'not_found' },
  PGRST301: { kind: 'forbidden', message: 'Sesi Anda berakhir. Silakan masuk lagi.' },
  PGRST303: { kind: 'forbidden', message: 'Sesi Anda berakhir. Silakan masuk lagi.' },
};

function readString(value: unknown, key: string): string | null {
  if (typeof value !== 'object' || value === null || !(key in value)) {
    return null;
  }
  const field = (value as Record<string, unknown>)[key];
  return typeof field === 'string' ? field : null;
}

function isNetworkFailure(error: unknown): boolean {
  if (error instanceof TypeError) {
    return true;
  }
  const message = readString(error, 'message') ?? '';
  return /failed to fetch|fetch failed|network ?error|load failed/i.test(message);
}

/** Mengubah error apa pun dari Supabase menjadi `DataError`. */
export function toDataError(error: unknown): DataError {
  if (error instanceof DataError) {
    return error;
  }
  const code = readString(error, 'code');
  const rule = code ? CODE_RULES[code] : undefined;
  if (code && rule) {
    return new DataError(rule.kind, { message: rule.message, code, cause: error });
  }
  if (isNetworkFailure(error)) {
    return new DataError('network', { code, cause: error });
  }
  return new DataError('unknown', { code, cause: error });
}
