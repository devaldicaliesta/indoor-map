// Edge Function license-checkin: menanyakan keadaan lisensi terbaru ke server vendor.
// Dipanggil database (app.license_tick lewat pg_net, tanpa JWT) saat check-in jatuh tempo, atau
// oleh Super Admin kapan saja. Panggilan lain hanya menjalankan permintaan terjadwal yang
// sedang menunggu, sehingga tidak bisa membuat instalasi menghubungi vendor berulang-ulang.
// Berkas baru dari vendor diverifikasi seperti aktivasi (tanda tangan, instance, masa berlaku)
// sebelum dicatat; jawaban yang gagal atau tidak sah tidak pernah mematikan sistem.

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

type Outcome = 'renewed' | 'unchanged' | 'revoked' | 'failed';

interface Target {
  license_id: string;
  instance_id: string;
}

type VendorReply =
  | { status: 'active'; serverTime: string; license: unknown }
  | { status: 'revoked'; serverTime: string };

/** Berkas yang tidak sah membuat seluruh jawaban vendor tidak dipercaya. */
const UNTRUSTED: Partial<Record<LicenseRejection, string>> = {
  malformed: 'Jawaban vendor tidak berisi berkas lisensi yang valid.',
  bad_signature: 'Tanda tangan berkas dari vendor tidak cocok.',
  wrong_instance: 'Berkas dari vendor untuk instalasi lain.',
};

class CheckinFailure extends Error {}

async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: serviceHeaders,
    body: JSON.stringify(args),
  });
  if (!response.ok) throw new Error(`${name} gagal (${response.status}).`);
  return (await response.json()) as T;
}

async function askVendor(target: Target): Promise<VendorReply> {
  if (!vendorUrl) throw new CheckinFailure('Alamat server vendor belum diatur.');
  let response: Response;
  try {
    response = await fetch(`${vendorUrl.replace(/\/+$/, '')}/v1/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseId: target.license_id, instanceId: target.instance_id }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new CheckinFailure('Server vendor tidak bisa dihubungi.');
  }
  const body = (await response.json().catch(() => null)) as Record<string, unknown> | null;
  if (!response.ok) {
    const message = typeof body?.message === 'string' ? body.message : response.statusText;
    throw new CheckinFailure(`Vendor menolak check-in (${response.status}): ${message}`);
  }
  const serverTime = typeof body?.serverTime === 'string' ? body.serverTime : '';
  if (!body || Number.isNaN(Date.parse(serverTime))) {
    throw new CheckinFailure('Jawaban vendor tidak dikenali.');
  }
  if (body.status === 'revoked') return { status: 'revoked', serverTime };
  if (body.status === 'active') return { status: 'active', serverTime, license: body.license };
  throw new CheckinFailure('Jawaban vendor tidak dikenali.');
}

async function checkIn(target: Target): Promise<{ result: Outcome; message?: string }> {
  const failed = async (message: string) => {
    await rpc('license_checkin_failed', { p_error: message });
    return { result: 'failed' as const, message };
  };
  let answer: VendorReply;
  try {
    answer = await askVendor(target);
  } catch (error) {
    return failed(error instanceof CheckinFailure ? error.message : 'Check-in gagal.');
  }
  if (answer.status === 'revoked') {
    const result = await rpc<Outcome>('license_checkin_revoked', {
      p_license_id: target.license_id,
      p_server_time: answer.serverTime,
    });
    return { result };
  }
  const key = await importLicensePublicKey(LICENSE_PUBLIC_KEY);
  const verified = await verifyLicense(answer.license, key, target.instance_id, new Date());
  const untrusted = verified.valid ? undefined : UNTRUSTED[verified.reason];
  if (untrusted) return failed(untrusted);
  // Berkas yang belum berlaku atau sudah kedaluwarsa tetap jawaban sah: lisensi lokal dipakai.
  const result = await rpc<Outcome>('license_checkin_confirmed', {
    p_license_id: target.license_id,
    p_server_time: answer.serverTime,
    p_payload: verified.valid ? verified.license : null,
    p_signature: verified.valid ? (answer.license as { signature: string }).signature : null,
  });
  return { result };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return fail(405, 'invalid', 'Metode tidak didukung.');
  const manual = (await activeSuperAdmin(request)) !== null;
  try {
    const [target] = await rpc<Target[]>('license_checkin_claim', { p_manual: manual });
    // Pemanggil selain Super Admin selalu menerima balasan yang sama.
    if (!manual) {
      if (target) await checkIn(target);
      return reply(202, { result: 'accepted' });
    }
    if (!target) return fail(409, 'conflict', 'Belum ada lisensi untuk diperiksa.');
    return reply(200, await checkIn(target));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // biome-ignore lint/suspicious/noConsole: hasil check-in tidak tercatat di database; log Edge Runtime satu-satunya jejak untuk pemasang.
    console.error(`license-checkin: ${message}`);
    return manual
      ? fail(500, 'unknown', `Check-in gagal dicatat: ${message}`)
      : reply(202, { result: 'accepted' });
  }
});
