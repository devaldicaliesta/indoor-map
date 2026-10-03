// Akses PostgREST dengan JWT pemanggil, sehingga RLS dan pemeriksaan izin di fungsi SQL
// berlaku seperti saat Admin membuka datanya sendiri. Tanpa supabase-js (lihat admin-users).
import { url } from '../_shared/auth.ts';

const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

// Sama dengan `max_rows` PostgREST di supabase/config.toml.
const PAGE_SIZE = 1000;

/** Error yang langsung menjadi balasan `{ code, message }` Edge Function. */
export class PublishError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

interface PostgrestError {
  code?: string;
  message?: string;
}

async function toPublishError(response: Response): Promise<PublishError> {
  const body = (await response.json().catch(() => ({}))) as PostgrestError;
  const message = body.message ?? response.statusText;
  if (response.status === 401) {
    return new PublishError(401, 'forbidden', 'Sesi tidak berlaku. Silakan masuk lagi.');
  }
  switch (body.code) {
    case '42501':
      return new PublishError(403, 'forbidden', message);
    case '22023':
      return new PublishError(400, 'invalid', message);
    case 'P0002':
      return new PublishError(404, 'not_found', message);
    case 'IM409':
      return new PublishError(409, 'conflict', message);
    default:
      return new PublishError(502, 'unknown', `Data draft tidak bisa dibaca: ${message}`);
  }
}

export interface CallerRest {
  /** Semua baris hasil query, dibaca per halaman. `query` harus memuat `order` agar stabil. */
  select<T>(table: string, query: string): Promise<T[]>;
  rpc<T>(fn: string, args: Record<string, unknown>): Promise<T>;
}

export function callerRest(authorization: string): CallerRest {
  const headers = {
    apikey: anonKey,
    Authorization: authorization,
    'Content-Type': 'application/json',
  };
  return {
    async select<T>(table: string, query: string) {
      const rows: T[] = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        const response = await fetch(`${url}/rest/v1/${table}?${query}`, {
          headers: { ...headers, 'Range-Unit': 'items', Range: `${from}-${from + PAGE_SIZE - 1}` },
        });
        if (!response.ok) throw await toPublishError(response);
        const page = (await response.json()) as T[];
        rows.push(...page);
        if (page.length < PAGE_SIZE) return rows;
      }
    },
    async rpc<T>(fn: string, args: Record<string, unknown>) {
      const response = await fetch(`${url}/rest/v1/rpc/${fn}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(args),
      });
      if (!response.ok) throw await toPublishError(response);
      return (await response.json().catch(() => null)) as T;
    },
  };
}
