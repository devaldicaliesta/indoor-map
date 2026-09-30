import { DataError, type DataErrorKind, toDataError } from './errors';

const FUNCTION_KINDS: Record<string, DataErrorKind> = {
  forbidden: 'forbidden',
  conflict: 'conflict',
  invalid: 'invalid',
  not_found: 'not_found',
};

/**
 * Edge Function proyek membalas `{ code, message }` dengan pesan Bahasa Indonesia yang
 * siap ditampilkan. Kode `smtp_*` dan lainnya yang tidak dikenal menjadi `unknown`.
 */
export async function fromFunctionError(error: unknown): Promise<DataError> {
  const context = (error as { context?: unknown }).context;
  if (context instanceof Response) {
    const body = (await context.json().catch(() => null)) as {
      code?: string;
      message?: string;
    } | null;
    if (body?.message) {
      return new DataError(FUNCTION_KINDS[body.code ?? ''] ?? 'unknown', {
        message: body.message,
        code: body.code ?? null,
        cause: error,
      });
    }
  }
  return toDataError(error);
}
