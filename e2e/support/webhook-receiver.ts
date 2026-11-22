import { createHmac } from 'node:crypto';
import { createServer, type IncomingHttpHeaders } from 'node:http';

export interface ReceivedWebhook {
  headers: IncomingHttpHeaders;
  body: string;
}

/**
 * Penerima webhook uji di host. Edge runtime berjalan di kontainer, jadi alamat yang
 * didaftarkan memakai `host.docker.internal` (ubah lewat WEBHOOK_TEST_HOST bila perlu).
 * `replies` adalah status balasan berurutan; setelah habis selalu 200.
 */
export async function startWebhookReceiver(port: number, replies: number[] = []) {
  const received: ReceivedWebhook[] = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      received.push({ headers: req.headers, body });
      res.statusCode = replies.shift() ?? 200;
      res.end(res.statusCode === 200 ? 'ok' : 'gangguan');
    });
  });
  await new Promise<void>((resolve) => server.listen(port, '0.0.0.0', resolve));
  return {
    url: `http://${process.env.WEBHOOK_TEST_HOST ?? 'host.docker.internal'}:${port}/hook`,
    received,
    replies,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

/** Standard Webhooks: penerima menghitung ulang HMAC dengan rahasia webhook. */
export function signatureValid(secret: string, { headers, body }: ReceivedWebhook) {
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const mac = createHmac('sha256', key)
    .update(`${headers['webhook-id']}.${headers['webhook-timestamp']}.${body}`)
    .digest('base64');
  return headers['webhook-signature'] === `v1,${mac}`;
}
