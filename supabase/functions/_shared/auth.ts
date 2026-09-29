// Pemeriksaan pemanggil untuk Edge Function khusus Super Admin, lewat REST tanpa dependensi.

export const url = Deno.env.get('SUPABASE_URL') ?? '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

export const serviceHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
};

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

export function fail(status: number, code: string, message: string): Response {
  return reply(status, { code, message });
}

export interface Caller {
  id: string;
  email: string;
}

async function callerFromToken(authorization: string): Promise<Caller | null> {
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: authorization },
  });
  if (!response.ok) return null;
  const user = (await response.json()) as { id?: string; email?: string };
  return user.id && user.email ? { id: user.id, email: user.email } : null;
}

async function isActiveSuperAdmin(userId: string): Promise<boolean> {
  const response = await fetch(
    `${url}/rest/v1/profiles?select=role,is_active&user_id=eq.${encodeURIComponent(userId)}`,
    { headers: serviceHeaders },
  );
  if (!response.ok) return false;
  const [profile] = (await response.json()) as { role: string; is_active: boolean }[];
  return profile?.role === 'super_admin' && profile.is_active;
}

/** Mengembalikan pemanggil jika Super Admin aktif, atau Response 401/403 yang siap dikirim. */
export async function requireSuperAdmin(
  request: Request,
  action: string,
): Promise<Caller | Response> {
  const caller = await callerFromToken(request.headers.get('Authorization') ?? '');
  if (!caller) return fail(401, 'forbidden', 'Sesi tidak berlaku. Silakan masuk lagi.');
  if (!(await isActiveSuperAdmin(caller.id))) {
    return fail(403, 'forbidden', `Hanya Super Admin yang bisa ${action}.`);
  }
  return caller;
}
