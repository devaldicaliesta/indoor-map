import type { AppRole } from '@indoor/domain';
import { DataError, type DataErrorKind, toDataError } from '../errors';
import type { Db } from '../supabase';

export interface InviteUserInput {
  email: string;
  fullName: string;
  role: AppRole;
  /** Halaman tempat pengguna membuat password dari tautan undangan. */
  redirectTo: string;
}

export interface UsersRepository {
  /** Mengundang pengguna lewat Edge Function `admin-users` (hanya Super Admin). */
  invite(input: InviteUserInput): Promise<void>;
}

const FUNCTION_KINDS: Record<string, DataErrorKind> = {
  forbidden: 'forbidden',
  conflict: 'conflict',
  invalid: 'invalid',
};

/** Edge Function membalas `{ code, message }`; pesan Bahasa Indonesia ditampilkan apa adanya. */
async function fromFunctionError(error: unknown): Promise<DataError> {
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

export function createUsersRepository(db: Db): UsersRepository {
  return {
    async invite(input) {
      const { error } = await db.functions.invoke('admin-users', { body: input });
      if (error) throw await fromFunctionError(error);
    },
  };
}
