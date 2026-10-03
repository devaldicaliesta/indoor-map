// Server vendor tiruan untuk uji lokal aktivasi online (T-402). Menerbitkan lisensi bertanda
// tangan kunci dev (`tools/license-cli/dev-keys/`) untuk kunci di `keys.json`. Satu kunci
// terikat ke instance pertama yang memakainya, seperti server vendor sungguhan.
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer, type IncomingMessage, type Server } from 'node:http';
import { fileURLToPath } from 'node:url';
import {
  type LicenseFile,
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

const here = (path: string) => fileURLToPath(new URL(path, import.meta.url));

async function body(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return null;
  }
}

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

  return createServer(async (request, response) => {
    const send = (status: number, value: unknown) => {
      response.writeHead(status, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(value));
    };
    if (request.method !== 'POST' || request.url !== '/v1/activate') {
      return send(404, { message: 'Tidak ditemukan.' });
    }
    const input = (await body(request)) as { licenseKey?: unknown; instanceId?: unknown } | null;
    const licenseKey = typeof input?.licenseKey === 'string' ? input.licenseKey : '';
    const instanceId = typeof input?.instanceId === 'string' ? input.instanceId : '';
    const template = keys[licenseKey];
    if (!template || !instanceId) return send(404, { message: 'Kunci lisensi tidak dikenal.' });
    const owner = bound.get(licenseKey);
    if (owner && owner !== instanceId) {
      return send(409, { message: 'Kunci lisensi sudah dipakai instalasi lain.' });
    }
    bound.set(licenseKey, instanceId);
    const issued = now();
    const payload = readLicensePayload({
      // Id dari hash kunci: kunci itu sendiri tidak pernah ikut tersimpan di instalasi.
      licenseId: licenseIdFor(licenseKey),
      client: template.client,
      plan: template.plan,
      validFrom: iso(issued),
      validUntil: iso(new Date(issued.getTime() + template.days * 86_400_000)),
      quota: template.quota,
      features: template.features,
      instanceId,
      issuedAt: iso(issued),
    });
    if (!payload) return send(500, { message: 'Template kunci tidak valid.' });
    const signature = await crypto.subtle.sign(
      { name: 'Ed25519' },
      privateKey,
      licenseSigningBytes(payload),
    );
    const file: LicenseFile = { ...payload, signature: toBase64(new Uint8Array(signature)) };
    send(200, file);
  });
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 8091);
  const server = await createVendorStub();
  server.listen(port, '0.0.0.0', () => process.stdout.write(`vendor-stub di port ${port}\n`));
}
