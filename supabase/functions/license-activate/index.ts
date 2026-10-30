// Edge Function license-activate: memasang lisensi instalasi dan membuat Super Admin pertama.
//   { mode: "online", licenseKey }  → minta berkas ke server vendor untuk instance ini
//   { mode: "manual", license }     → berkas lisensi yang diunggah
//   { mode: "trial", name, institution, email } → trial otomatis dari server vendor (T-504)
//   { mode: "first_admin", fullName, email, password }
// Mode pemasangan lisensi membawa `eulaVersion` bila EULA versi berlaku belum pernah disetujui
// instalasi ini; tanpa itu aktivasi ditolak (T-602). Persetujuan dicatat bersama lisensinya.
// Berkas selalu diverifikasi di sini (tanda tangan vendor, instance, masa berlaku) sebelum
// disimpan; SQL lalu mempercayai baris `licenses`. Kunci lisensi hanya diteruskan ke vendor
// dan tidak pernah disimpan.

import { EULA_VERSION, needsEulaAcceptance } from '../../../packages/domain/src/eula.ts';
import { LICENSE_PUBLIC_KEY } from '../../../packages/domain/src/license.publicKey.ts';
import {
  importLicensePublicKey,
  type LicenseRejection,
  verifyLicense,
} from '../../../packages/domain/src/license.ts';
import {
  activeSuperAdmin,
  CORS_HEADERS,
  fail,
  reply,
  serviceHeaders,
  url,
} from '../_shared/auth.ts';

const vendorUrl = Deno.env.get('LICENSE_VENDOR_URL') ?? '';

const REJECTIONS: Record<LicenseRejection, string> = {
  malformed: 'Berkas lisensi tidak valid.',
  bad_signature: 'Tanda tangan lisensi tidak cocok. Berkas mungkin diubah atau bukan dari vendor.',
  wrong_instance: 'Lisensi ini untuk instalasi lain.',
  not_yet_valid: 'Lisensi belum berlaku.',
  expired: 'Lisensi sudah kedaluwarsa.',
};

interface Status {
  state: string;
  instance_id: string;
  needs_admin: boolean;
}

class ActivationError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function status(): Promise<Status> {
  const response = await fetch(`${url}/rest/v1/rpc/license_status`, {
    method: 'POST',
    headers: serviceHeaders,
    body: '{}',
  });
  const [row] = (await response.json().catch(() => [])) as Status[];
  if (!response.ok || !row)
    throw new ActivationError(502, 'unknown', 'Status lisensi tidak terbaca.');
  return row;
}

/**
 * Versi EULA yang disetujui bersama pemasangan ini: `null` bila versi berlaku sudah pernah
 * disetujui. Diperiksa sebelum menghubungi vendor agar trial tidak terpakai sia-sia.
 */
async function eulaToRecord(input: Record<string, unknown>): Promise<string | null> {
  const response = await fetch(`${url}/rest/v1/rpc/eula_status`, {
    method: 'POST',
    headers: serviceHeaders,
    body: '{}',
  });
  if (!response.ok) throw new ActivationError(502, 'unknown', 'Status EULA tidak terbaca.');
  const accepted = (await response.json()) as string | null;
  if (!needsEulaAcceptance(accepted)) return null;
  if (input.eulaVersion !== EULA_VERSION) {
    throw new ActivationError(
      422,
      'invalid',
      `Setujui Perjanjian Lisensi Pengguna Akhir (EULA) versi ${EULA_VERSION} sebelum mengaktifkan.`,
    );
  }
  return EULA_VERSION;
}

/** Berkas dari server vendor; kunci lisensi tidak disimpan di instalasi. */
async function fromVendor(path: string, payload: Record<string, unknown>): Promise<unknown> {
  if (!vendorUrl) throw new ActivationError(503, 'unknown', 'Alamat server vendor belum diatur.');
  let response: Response;
  try {
    response = await fetch(`${vendorUrl.replace(/\/+$/, '')}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new ActivationError(
      502,
      'network',
      'Server vendor tidak bisa dihubungi. Coba lagi atau unggah berkas lisensi.',
    );
  }
  const body = (await response.json().catch(() => null)) as { message?: unknown } | null;
  if (!response.ok) {
    const message = typeof body?.message === 'string' ? body.message : response.statusText;
    // 429: vendor membatasi laju permintaan trial per alamat IP.
    const status = response.status === 404 || response.status === 429 ? response.status : 422;
    throw new ActivationError(status, 'invalid', `Vendor: ${message}`);
  }
  return body;
}

/** Isian "Mulai trial": nama, instansi, dan email pemohon (hanya diteruskan ke vendor). */
function trialRequest(input: Record<string, unknown>) {
  const field = (key: string) => {
    const value = input[key];
    return typeof value === 'string' ? value.trim() : '';
  };
  const name = field('name');
  const institution = field('institution');
  const email = field('email').toLowerCase();
  if (!name || !institution || name.length > 200 || institution.length > 200) {
    throw new ActivationError(400, 'invalid', 'Nama dan instansi wajib diisi.');
  }
  if (!EMAIL.test(email) || email.length > 200) {
    throw new ActivationError(400, 'invalid', 'Alamat email tidak valid.');
  }
  return { name, institution, email };
}

/**
 * `actorId`: Super Admin yang memasang, untuk log audit; kosong pada instalasi baru.
 * `eulaVersion`: versi EULA yang disetujui bersama pemasangan ini, bila ada.
 */
async function install(
  file: unknown,
  source: 'online' | 'manual',
  instanceId: string,
  actorId: string | null,
  eulaVersion: string | null,
) {
  const key = await importLicensePublicKey(LICENSE_PUBLIC_KEY);
  const result = await verifyLicense(file, key, instanceId, new Date());
  if (!result.valid) throw new ActivationError(422, 'invalid', REJECTIONS[result.reason]);
  const response = await fetch(`${url}/rest/v1/rpc/license_install`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify({
      p_license_id: result.license.licenseId,
      p_payload: result.license,
      p_signature: (file as { signature: string }).signature,
      p_source: source,
      p_actor_id: actorId,
      p_eula_version: eulaVersion,
    }),
  });
  if (!response.ok) {
    // Aturan proyek (mis. lisensi yang sudah dicabut vendor) membawa pesan untuk pengguna.
    const body = (await response.json().catch(() => null)) as {
      code?: unknown;
      message?: unknown;
    } | null;
    if (
      typeof body?.code === 'string' &&
      body.code.startsWith('IM') &&
      typeof body.message === 'string'
    ) {
      throw new ActivationError(409, 'conflict', body.message);
    }
    throw new ActivationError(500, 'unknown', 'Lisensi lolos verifikasi tetapi gagal disimpan.');
  }
  return result.license;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function createFirstAdmin(input: Record<string, unknown>) {
  const fullName = typeof input.fullName === 'string' ? input.fullName.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';
  if (!fullName || !EMAIL.test(email) || password.length < 8) {
    throw new ActivationError(
      400,
      'invalid',
      'Nama, email, dan password (minimal 8 karakter) wajib diisi.',
    );
  }
  const created = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    }),
  });
  const user = (await created.json().catch(() => ({}))) as { id?: string; msg?: string };
  if (!created.ok || !user.id) {
    throw new ActivationError(
      422,
      'invalid',
      `Akun gagal dibuat: ${user.msg ?? created.statusText}`,
    );
  }
  const profile = await fetch(`${url}/rest/v1/profiles`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify({ user_id: user.id, full_name: fullName, email, role: 'super_admin' }),
  });
  if (!profile.ok) {
    await fetch(`${url}/auth/v1/admin/users/${user.id}`, {
      method: 'DELETE',
      headers: serviceHeaders,
    });
    throw new ActivationError(500, 'unknown', 'Profil Super Admin gagal dibuat. Coba lagi.');
  }
}

async function handle(request: Request, input: Record<string, unknown>) {
  const current = await status();
  const actor = await activeSuperAdmin(request);
  // Instalasi baru (belum ada Super Admin) boleh diaktifkan tanpa login; setelah itu hanya
  // Super Admin yang boleh memasang lisensi baru.
  if (!current.needs_admin && !actor) {
    throw new ActivationError(403, 'forbidden', 'Hanya Super Admin yang bisa memasang lisensi.');
  }

  if (input.mode === 'first_admin') {
    if (current.state !== 'active') {
      throw new ActivationError(409, 'conflict', 'Aktifkan lisensi sebelum membuat Super Admin.');
    }
    if (!current.needs_admin) {
      throw new ActivationError(409, 'conflict', 'Super Admin sudah ada. Silakan masuk.');
    }
    await createFirstAdmin(input);
    return { created: true };
  }
  const actorId = actor?.id ?? null;
  if (input.mode === 'online') {
    const key = typeof input.licenseKey === 'string' ? input.licenseKey.trim() : '';
    if (!key || key.length > 200)
      throw new ActivationError(400, 'invalid', 'Kunci lisensi wajib diisi.');
    const eula = await eulaToRecord(input);
    const file = await fromVendor('/v1/activate', {
      licenseKey: key,
      instanceId: current.instance_id,
    });
    return { license: await install(file, 'online', current.instance_id, actorId, eula) };
  }
  if (input.mode === 'trial') {
    const request = trialRequest(input);
    const eula = await eulaToRecord(input);
    const file = await fromVendor('/v1/trial', { ...request, instanceId: current.instance_id });
    return { license: await install(file, 'online', current.instance_id, actorId, eula) };
  }
  if (input.mode === 'manual') {
    const eula = await eulaToRecord(input);
    return {
      license: await install(input.license, 'manual', current.instance_id, actorId, eula),
    };
  }
  throw new ActivationError(400, 'invalid', 'Mode aktivasi tidak dikenal.');
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return fail(405, 'invalid', 'Metode tidak didukung.');
  const input = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!input || typeof input !== 'object') return fail(400, 'invalid', 'Permintaan tidak valid.');
  try {
    return reply(200, await handle(request, input));
  } catch (error) {
    if (error instanceof ActivationError) return fail(error.status, error.code, error.message);
    const message = error instanceof Error ? error.message : String(error);
    return fail(500, 'unknown', `Aktivasi gagal: ${message}`);
  }
});
