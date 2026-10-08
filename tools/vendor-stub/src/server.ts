// Server vendor tiruan untuk uji lokal aktivasi online (T-402) dan check-in (T-403). Menerbitkan
// lisensi bertanda tangan kunci dev (`tools/license-cli/dev-keys/`) untuk kunci di `keys.json`.
// Satu kunci terikat ke instance pertama yang memakainya, seperti server vendor sungguhan.
// `/v1/vendor/*` meniru tindakan vendor di Vendor Portal (perpanjang, cabut) untuk uji check-in.
// `/v1/trial` menerbitkan trial otomatis (T-504): sekali per instalasi, email, dan domain email
// kantor, dengan batas laju per alamat IP.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import {
  type LicenseFile,
  type LicensePayload,
  type LicenseQuota,
  licenseSigningBytes,
  readLicensePayload,
  TRIAL_FEATURES,
  TRIAL_MIN_DAYS,
  TRIAL_PLAN,
  TRIAL_QUOTA,
  toBase64,
} from '../../../packages/domain/src/license.ts';

interface KeyTemplate {
  client: string;
  plan: string;
  days: number;
  quota: LicenseQuota;
  features: string[];
}

/** Batas laju permintaan trial per alamat IP. */
export interface TrialRateLimit {
  max: number;
  windowMs: number;
}

/**
 * Domain email umum: banyak calon klien berbeda memakainya, jadi trial dibatasi per alamat email
 * saja, bukan per domain.
 */
const PUBLIC_MAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.id',
  'ymail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'icloud.com',
  'proton.me',
]);

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lisensi yang pernah diterbitkan stub ini; berkas terakhir dikirim saat check-in. */
interface Issued {
  instanceId: string;
  file: LicenseFile;
  revoked: boolean;
}

type Reply = [status: number, body: unknown];
type Route = (input: Record<string, unknown>, ip: string) => Reply | Promise<Reply>;

const DAY_MS = 86_400_000;
const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

async function body(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  try {
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

const text = (value: unknown) => (typeof value === 'string' ? value : '');

export const licenseIdFor = (licenseKey: string) =>
  `LIC-${createHash('sha256').update(licenseKey).digest('hex').slice(0, 10).toUpperCase()}`;

const iso = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, 'Z');

export async function createVendorStub(
  options: {
    keys?: Record<string, KeyTemplate>;
    privateKeyPath?: string;
    now?: () => Date;
    trialDays?: number;
    trialRateLimit?: TrialRateLimit;
  } = {},
): Promise<Server> {
  const keys: Record<string, KeyTemplate> =
    options.keys ?? JSON.parse(readFileSync(here('../keys.json'), 'utf8'));
  const privateKeyText = readFileSync(
    options.privateKeyPath ?? here('../../license-cli/dev-keys/license-private.pkcs8.b64'),
    'utf8',
  ).trim();
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    Buffer.from(privateKeyText, 'base64'),
    { name: 'Ed25519' },
    false,
    ['sign'],
  );
  const now = options.now ?? (() => new Date());
  const bound = new Map<string, string>();
  const issued = new Map<string, Issued>();
  const trialInstances = new Set<string>();
  const trialEmails = new Set<string>();
  const trialDomains = new Set<string>();
  const trialRequests = new Map<string, number[]>();
  const rateLimit = options.trialRateLimit ?? { max: 10, windowMs: 60 * 60_000 };

  async function sign(payload: LicensePayload): Promise<LicenseFile> {
    const signature = await crypto.subtle.sign(
      { name: 'Ed25519' },
      privateKey,
      licenseSigningBytes(payload),
    );
    return { ...payload, signature: toBase64(new Uint8Array(signature)) };
  }

  async function activate(input: Record<string, unknown>): Promise<Reply> {
    const licenseKey = text(input.licenseKey);
    const instanceId = text(input.instanceId);
    const template = keys[licenseKey];
    if (!template || !instanceId) return [404, { message: 'Kunci lisensi tidak dikenal.' }];
    const owner = bound.get(licenseKey);
    if (owner && owner !== instanceId) {
      return [409, { message: 'Kunci lisensi sudah dipakai instalasi lain.' }];
    }
    bound.set(licenseKey, instanceId);
    // Id dari hash kunci: kunci itu sendiri tidak pernah ikut tersimpan di instalasi.
    const licenseId = licenseIdFor(licenseKey);
    const existing = issued.get(licenseId);
    if (existing) return [200, existing.file];
    const at = now();
    const payload = readLicensePayload({
      licenseId,
      client: template.client,
      plan: template.plan,
      validFrom: iso(at),
      validUntil: iso(new Date(at.getTime() + template.days * DAY_MS)),
      quota: template.quota,
      features: template.features,
      instanceId,
      issuedAt: iso(at),
    });
    if (!payload) return [500, { message: 'Template kunci tidak valid.' }];
    const file = await sign(payload);
    issued.set(licenseId, { instanceId, file, revoked: false });
    return [200, file];
  }

  /**
   * Trial otomatis dari tombol "Mulai trial" di `/aktivasi`: menolak instalasi, email, atau domain
   * kantor yang pernah mendapat trial, dan permintaan beruntun dari satu alamat IP.
   */
  async function trial(input: Record<string, unknown>, ip: string): Promise<Reply> {
    const at = now();
    const recent = (trialRequests.get(ip) ?? []).filter(
      (t) => at.getTime() - t < rateLimit.windowMs,
    );
    if (recent.length >= rateLimit.max) {
      return [
        429,
        { message: 'Terlalu banyak permintaan trial dari alamat ini. Coba lagi nanti.' },
      ];
    }
    trialRequests.set(ip, [...recent, at.getTime()]);
    const instanceId = text(input.instanceId).trim();
    const name = text(input.name).trim();
    const institution = text(input.institution).trim();
    const email = text(input.email).trim().toLowerCase();
    if (!instanceId || !name || !institution || name.length > 200 || institution.length > 200) {
      return [400, { message: 'Nama, instansi, dan ID instalasi wajib diisi.' }];
    }
    if (!EMAIL.test(email) || email.length > 200) {
      return [400, { message: 'Alamat email tidak valid.' }];
    }
    const domain = email.split('@')[1] ?? '';
    if (trialInstances.has(instanceId)) {
      return [409, { message: 'Instalasi ini sudah pernah mendapat trial.' }];
    }
    if (trialEmails.has(email)) {
      return [409, { message: 'Email ini sudah pernah dipakai untuk trial.' }];
    }
    if (!PUBLIC_MAIL_DOMAINS.has(domain) && trialDomains.has(domain)) {
      return [409, { message: `Domain ${domain} sudah pernah mendapat trial. Hubungi vendor.` }];
    }
    const days = options.trialDays ?? TRIAL_MIN_DAYS;
    const payload = readLicensePayload({
      licenseId: `TRIAL-${createHash('sha256').update(instanceId).digest('hex').slice(0, 10).toUpperCase()}`,
      client: institution,
      plan: TRIAL_PLAN,
      validFrom: iso(at),
      validUntil: iso(new Date(at.getTime() + days * DAY_MS)),
      quota: TRIAL_QUOTA,
      features: TRIAL_FEATURES,
      instanceId,
      issuedAt: iso(at),
    });
    if (!payload) return [500, { message: 'Lisensi trial tidak valid.' }];
    const file = await sign(payload);
    trialInstances.add(instanceId);
    trialEmails.add(email);
    trialDomains.add(domain);
    issued.set(payload.licenseId, { instanceId, file, revoked: false });
    return [200, file];
  }

  /** Status terbaru lisensi beserta waktu server vendor (untuk proteksi jam di instalasi). */
  function checkin(input: Record<string, unknown>): Reply {
    const entry = issued.get(text(input.licenseId));
    if (!entry) return [404, { message: 'Lisensi tidak dikenal.' }];
    if (entry.instanceId !== text(input.instanceId)) {
      return [409, { message: 'Lisensi ini untuk instalasi lain.' }];
    }
    const serverTime = iso(now());
    if (entry.revoked) return [200, { status: 'revoked', serverTime }];
    return [200, { status: 'active', serverTime, license: entry.file }];
  }

  /** Perpanjangan: masa berlaku diperpanjang dari tanggal berakhir lama, berkas diterbitkan ulang. */
  async function renew(input: Record<string, unknown>): Promise<Reply> {
    const entry = issued.get(text(input.licenseId));
    const days = typeof input.days === 'number' && input.days > 0 ? input.days : 365;
    if (!entry) return [404, { message: 'Lisensi tidak dikenal.' }];
    const { signature: _old, ...payload } = entry.file;
    const validUntil = new Date(Date.parse(payload.validUntil) + days * DAY_MS);
    // Tanggal terbit berpresisi detik; berkas baru selalu terbit setelah berkas sebelumnya.
    const issuedAt = new Date(Math.max(now().getTime(), Date.parse(payload.issuedAt) + 1000));
    entry.file = await sign({ ...payload, validUntil: iso(validUntil), issuedAt: iso(issuedAt) });
    return [200, entry.file];
  }

  function revoke(input: Record<string, unknown>): Reply {
    const entry = issued.get(text(input.licenseId));
    if (!entry) return [404, { message: 'Lisensi tidak dikenal.' }];
    entry.revoked = true;
    return [200, { licenseId: entry.file.licenseId, revoked: true }];
  }

  const routes = new Map<string, Route>([
    ['/v1/activate', activate],
    ['/v1/trial', trial],
    ['/v1/checkin', checkin],
    ['/v1/vendor/renew', renew],
    ['/v1/vendor/revoke', revoke],
  ]);

  return createServer(async (request, response) => {
    const route = request.method === 'POST' ? routes.get(request.url ?? '') : undefined;
    const ip = request.socket.remoteAddress ?? 'unknown';
    const [status, value]: Reply = route
      ? await route(await body(request), ip)
      : [404, { message: 'Tidak ditemukan.' }];
    response.writeHead(status, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(value));
  });
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 8091);
  const server = await createVendorStub();
  server.listen(port, '0.0.0.0', () => process.stdout.write(`vendor-stub di port ${port}\n`));
}
