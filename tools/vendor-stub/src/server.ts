// Server vendor tiruan untuk uji lokal aktivasi online (T-402) dan check-in (T-403). Menerbitkan
// lisensi bertanda tangan kunci dev (`tools/license-cli/dev-keys/`) untuk kunci di `keys.json`.
// Satu kunci terikat ke instance pertama yang memakainya, seperti server vendor sungguhan.
// `/v1/vendor/*` meniru tindakan vendor di Vendor Portal (perpanjang, cabut) untuk uji check-in.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import {
  type LicenseFile,
  type LicensePayload,
  licenseSigningBytes,
  readLicensePayload,
  toBase64,
} from '../../../packages/domain/src/license.ts';

interface KeyTemplate {
  client: string;
  plan: string;
  days: number;
  quota: { venues: number; buildings: number; floors: number; infoPoints: number };
  features: string[];
}

/** Lisensi yang pernah diterbitkan stub ini; berkas terakhir dikirim saat check-in. */
interface Issued {
  instanceId: string;
  file: LicenseFile;
  revoked: boolean;
}

type Reply = [status: number, body: unknown];

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
  options: { keys?: Record<string, KeyTemplate>; privateKeyPath?: string; now?: () => Date } = {},
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
    entry.file = await sign({ ...payload, validUntil: iso(validUntil), issuedAt: iso(now()) });
    return [200, entry.file];
  }

  function revoke(input: Record<string, unknown>): Reply {
    const entry = issued.get(text(input.licenseId));
    if (!entry) return [404, { message: 'Lisensi tidak dikenal.' }];
    entry.revoked = true;
    return [200, { licenseId: entry.file.licenseId, revoked: true }];
  }

  const routes = new Map<string, (input: Record<string, unknown>) => Reply | Promise<Reply>>([
    ['/v1/activate', activate],
    ['/v1/checkin', checkin],
    ['/v1/vendor/renew', renew],
    ['/v1/vendor/revoke', revoke],
  ]);

  return createServer(async (request, response) => {
    const route = request.method === 'POST' ? routes.get(request.url ?? '') : undefined;
    const [status, value]: Reply = route
      ? await route(await body(request))
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
