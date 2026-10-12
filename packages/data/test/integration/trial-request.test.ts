import { createHash, randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { sql } from './psql';

const url = process.env.SUPABASE_API_URL ?? '';
const mailpit = process.env.SUPABASE_MAILPIT_URL ?? '';

interface MailpitMessage {
  ID: string;
  Subject: string;
  To: { Address: string }[];
}

async function search(query: string): Promise<MailpitMessage[]> {
  const response = await fetch(`${mailpit}/api/v1/search?query=${encodeURIComponent(query)}`);
  return ((await response.json()) as { messages: MailpitMessage[] }).messages;
}

async function waitForMail(
  query: string,
): Promise<{ message: MailpitMessage; html: string; text: string }> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const [first] = await search(query);
    if (first) {
      const detail = (await (await fetch(`${mailpit}/api/v1/message/${first.ID}`)).json()) as {
        HTML: string;
        Text: string;
      };
      return { message: first, html: detail.HTML, text: detail.Text };
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Email "${query}" tidak sampai di Mailpit.`);
}

const send = (body: Record<string, unknown>) =>
  fetch(`${url}/functions/v1/trial-request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'http://localhost:5175' },
    body: JSON.stringify(body),
  });

// Fungsi vendor `trial-request` dengan SMTP lokal ke Mailpit (supabase/config.toml). Sejak trial
// ter-hosting (T-614) permintaan disimpan dan pemohon menerima tautan verifikasi; tidak ada lagi
// email rincian ke vendor per permintaan (leads ada di `hosting.trial_requests`).
// Satu berkas berurutan: batas laju 5 kiriman per menit per alamat ikut terpakai oleh test lain.
describe.runIf(url && mailpit)('form trial landing page', () => {
  const suffix = randomUUID().slice(0, 8);
  const form = (overrides: Record<string, unknown> = {}) => ({
    name: 'Rina Wijaya',
    institution: `Mal Contoh ${suffix}`,
    title: 'Manajer Operasional',
    email: `rina-${suffix}@malcontoh.co.id`,
    phone: '+62 812-3456-7890',
    buildingType: 'mall',
    buildingSize: '20k-50k',
    durationDays: 21,
    installId: '',
    consent: true,
    language: 'id',
    website: '',
    ...overrides,
  });

  it('kiriman sah: permintaan tersimpan dan pemohon menerima tautan verifikasi (TC-HT-01)', async () => {
    const response = await send(form({ name: '<b>Rina</b> Wijaya' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    const mail = await waitForMail(`to:"rina-${suffix}@malcontoh.co.id"`);
    expect(mail.message.Subject).toBe('Konfirmasi trial PanduArah Anda');
    // Lama trial tetap 17 hari walau form lama mengirim 21.
    expect(mail.text).toContain(`trial PanduArah 17 hari untuk Mal Contoh ${suffix}`);
    // HTML dari isian tampil sebagai teks (TC-LND-05).
    expect(mail.html).toContain('&lt;b&gt;Rina&lt;/b&gt; Wijaya');
    expect(mail.html).not.toContain('<b>Rina</b>');
    const token = /trial\/verifikasi\?token=([A-Za-z0-9_-]+)/.exec(mail.text)?.[1] ?? '';
    expect(token).toHaveLength(43);
    // Yang tersimpan hanya hash token (§3.7), berstatus belum diverifikasi, berlaku 24 jam.
    const row =
      sql(`select status || '|' || (token_hash = '${createHash('sha256').update(token).digest('hex')}')
      || '|' || (token_expires_at between now() + interval '23 hours' and now() + interval '25 hours')
      from hosting.trial_requests where email = 'rina-${suffix}@malcontoh.co.id'`);
    expect(row).toBe('unverified|true|true');
    expect(sql(`select count(*) from hosting.trial_requests where token_hash = '${token}'`)).toBe(
      '0',
    );
  });

  it('honeypot terisi dan isian tidak sah ditolak tanpa email (TC-LND-03/04/05)', async () => {
    const bot = await send(
      form({ website: 'http://spam.example', email: `bot-${suffix}@spam.id` }),
    );
    expect(bot.status).toBe(400);
    const invalid = await send(form({ email: 'bukan-email', durationDays: 31, consent: false }));
    expect(invalid.status).toBe(422);
    // Lama trial tidak lagi dipilih pemohon: nilai lama diabaikan, bukan ditolak.
    expect((await invalid.json()).problems).toEqual({ email: 'invalid', consent: 'required' });
    const injected = await send(
      form({ institution: `Mal ${suffix}\r\nBcc: korban-${suffix}@contoh.id` }),
    );
    expect(injected.status).toBe(422);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    expect(await search(`to:"bot-${suffix}@spam.id"`)).toHaveLength(0);
    expect(await search(`korban-${suffix}`)).toHaveLength(0);
  });

  it('lebih dari 5 kiriman per menit dari satu alamat ditolak 429 (TC-LND-04)', async () => {
    // Dua kiriman sebelumnya di berkas ini + empat di test kedua sudah memakai jatah menit ini.
    const statuses: number[] = [];
    for (let i = 0; i < 3; i++) {
      statuses.push((await send(form({ email: `laju-${i}-${suffix}@malcontoh.co.id` }))).status);
    }
    expect(statuses.at(-1)).toBe(429);
    expect(await search(`to:"laju-2-${suffix}@malcontoh.co.id"`)).toHaveLength(0);
  });
});
