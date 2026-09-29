// Edge Function admin-users (T-009): Super Admin mengundang pengguna baru.
// Membuat akun Auth butuh service role, jadi tidak bisa dilakukan dari klien.
// Memakai REST API Auth/PostgREST langsung, tanpa impor dari internet: fungsi tetap
// bisa dimuat di server on-premise yang aksesnya ke registry dibatasi.
const ROLES = ['super_admin', 'admin', 'editor', 'operator', 'viewer'] as const;
type Role = (typeof ROLES)[number];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function reply(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function fail(status: number, code: string, message: string): Response {
  return reply(status, { code, message });
}

interface InviteInput {
  email: string;
  fullName: string;
  role: Role;
  redirectTo: string;
}

function parseInput(body: unknown): InviteInput | null {
  if (typeof body !== 'object' || body === null) return null;
  const { email, fullName, role, redirectTo } = body as Record<string, unknown>;
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+$/.test(email.trim())) return null;
  if (typeof fullName !== 'string' || fullName.trim().length === 0) return null;
  if (typeof role !== 'string' || !ROLES.includes(role as Role)) return null;
  if (typeof redirectTo !== 'string') return null;
  return {
    email: email.trim().toLowerCase(),
    fullName: fullName.trim(),
    role: role as Role,
    redirectTo,
  };
}

const url = Deno.env.get('SUPABASE_URL') ?? '';
const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const serviceHeaders = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  'Content-Type': 'application/json',
};

async function callerUserId(authorization: string): Promise<string | null> {
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: authorization },
  });
  if (!response.ok) return null;
  const user = (await response.json()) as { id?: string };
  return user.id ?? null;
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

async function profileEmailExists(email: string): Promise<boolean> {
  const response = await fetch(
    `${url}/rest/v1/profiles?select=user_id&email=ilike.${encodeURIComponent(email)}`,
    { headers: serviceHeaders },
  );
  return response.ok && ((await response.json()) as unknown[]).length > 0;
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return fail(405, 'invalid', 'Metode tidak didukung.');

  const callerId = await callerUserId(request.headers.get('Authorization') ?? '');
  if (!callerId) return fail(401, 'forbidden', 'Sesi tidak berlaku. Silakan masuk lagi.');
  if (!(await isActiveSuperAdmin(callerId))) {
    return fail(403, 'forbidden', 'Hanya Super Admin yang bisa menambah pengguna.');
  }

  const input = parseInput(await request.json().catch(() => null));
  if (!input) return fail(400, 'invalid', 'Nama, email, dan role wajib diisi dengan benar.');

  if (await profileEmailExists(input.email)) {
    return fail(409, 'conflict', `Email ${input.email} sudah terdaftar.`);
  }

  const invite = await fetch(
    `${url}/auth/v1/invite?redirect_to=${encodeURIComponent(input.redirectTo)}`,
    {
      method: 'POST',
      headers: serviceHeaders,
      body: JSON.stringify({ email: input.email, data: { full_name: input.fullName } }),
    },
  );
  const invited = (await invite.json().catch(() => ({}))) as {
    id?: string;
    error_code?: string;
    msg?: string;
  };
  if (!invite.ok || !invited.id) {
    return invited.error_code === 'email_exists'
      ? fail(409, 'conflict', `Email ${input.email} sudah terdaftar.`)
      : fail(502, 'unknown', `Undangan gagal dikirim: ${invited.msg ?? invite.statusText}`);
  }

  const profile = await fetch(`${url}/rest/v1/profiles`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify({
      user_id: invited.id,
      full_name: input.fullName,
      email: input.email,
      role: input.role,
    }),
  });
  if (!profile.ok) {
    const { code } = (await profile.json().catch(() => ({}))) as { code?: string };
    if (code === '23505') return fail(409, 'conflict', `Email ${input.email} sudah terdaftar.`);
    // Akun baru tanpa profil dihapus; akun lama (konflik) tidak pernah disentuh.
    await fetch(`${url}/auth/v1/admin/users/${invited.id}`, {
      method: 'DELETE',
      headers: serviceHeaders,
    });
    return fail(500, 'unknown', 'Profil pengguna gagal dibuat. Coba lagi.');
  }

  return reply(201, { userId: invited.id });
});
