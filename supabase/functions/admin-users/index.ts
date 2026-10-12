// Edge Function admin-users: Super Admin atau Admin venue (trial) mengundang pengguna baru.
// Membuat akun Auth butuh service role, jadi tidak bisa dilakukan dari klien.
// Memakai REST API Auth/PostgREST langsung, tanpa impor dari internet: fungsi tetap
// bisa dimuat di server on-premise yang aksesnya ke registry dibatasi.
import {
  CORS_HEADERS,
  callerHeaders,
  fail,
  reply,
  requireCaller,
  serviceHeaders,
  url,
} from '../_shared/auth.ts';

const ROLES = ['super_admin', 'admin', 'editor', 'operator', 'viewer'] as const;
type Role = (typeof ROLES)[number];

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

/**
 * Siapa boleh mengundang, ke venue mana, dan dalam batas berapa diputuskan SQL
 * (`user_invite_check`, migrasi 0046) atas nama pemanggil — sebelum email undangan dikirim.
 * `venueId` null = undangan tingkat instalasi (Super Admin).
 */
async function inviteScope(
  authorization: string,
  role: Role,
): Promise<{ venueId: string | null } | Response> {
  const response = await fetch(`${url}/rest/v1/rpc/user_invite_check`, {
    method: 'POST',
    headers: callerHeaders(authorization),
    body: JSON.stringify({ p_role: role }),
  });
  if (response.ok) return { venueId: (await response.json()) as string | null };
  const { code, message } = (await response.json().catch(() => ({}))) as {
    code?: string;
    message?: string;
  };
  if (code === '42501') {
    return fail(403, 'forbidden', message ?? 'Anda tidak bisa menambah pengguna.');
  }
  if (code === 'IM422') return fail(409, 'conflict', message ?? 'Batas pengguna tercapai.');
  return fail(500, 'unknown', 'Pemeriksaan hak menambah pengguna gagal. Coba lagi.');
}

async function profileEmailExists(email: string): Promise<boolean> {
  const response = await fetch(
    `${url}/rest/v1/profiles?select=user_id&email=ilike.${encodeURIComponent(email)}`,
    { headers: serviceHeaders },
  );
  return response.ok && ((await response.json()) as unknown[]).length > 0;
}

/** Akun baru dihapus bila langkah sesudah undangan gagal; profilnya ikut terhapus (cascade). */
async function removeInvited(userId: string): Promise<void> {
  await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    method: 'DELETE',
    headers: serviceHeaders,
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return fail(405, 'invalid', 'Metode tidak didukung.');

  const caller = await requireCaller(request);
  if (caller instanceof Response) return caller;

  const input = parseInput(await request.json().catch(() => null));
  if (!input) return fail(400, 'invalid', 'Nama, email, dan role wajib diisi dengan benar.');

  const scope = await inviteScope(request.headers.get('Authorization') ?? '', input.role);
  if (scope instanceof Response) return scope;

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
      // Anggota venue hanya melihat venue itu (T-611a); undangan Super Admin tetap akses-semua.
      all_venues: scope.venueId === null,
    }),
  });
  if (!profile.ok) {
    const { code } = (await profile.json().catch(() => ({}))) as { code?: string };
    if (code === '23505') return fail(409, 'conflict', `Email ${input.email} sudah terdaftar.`);
    // Akun baru tanpa profil dihapus; akun lama (konflik) tidak pernah disentuh.
    await removeInvited(invited.id);
    return fail(500, 'unknown', 'Profil pengguna gagal dibuat. Coba lagi.');
  }

  if (scope.venueId !== null) {
    const member = await fetch(`${url}/rest/v1/venue_members`, {
      method: 'POST',
      headers: serviceHeaders,
      body: JSON.stringify({ venue_id: scope.venueId, user_id: invited.id }),
    });
    if (!member.ok) {
      // Batas pengguna ditegakkan ulang trigger (0044) bila dua undangan berbarengan.
      const { code, message } = (await member.json().catch(() => ({}))) as {
        code?: string;
        message?: string;
      };
      await removeInvited(invited.id);
      return code === 'IM422'
        ? fail(409, 'conflict', message ?? 'Batas pengguna tercapai.')
        : fail(500, 'unknown', 'Pengguna gagal ditambahkan ke venue. Coba lagi.');
    }
  }

  return reply(201, { userId: invited.id });
});
