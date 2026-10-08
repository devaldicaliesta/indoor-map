import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';

const url = process.env.SUPABASE_API_URL ?? '';
const mailpit = process.env.SUPABASE_MAILPIT_URL ?? '';
const VENDOR = 'panduarahid@gmail.com';

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

// Fungsi vendor `trial-request` (T-505) dengan SMTP lokal ke Mailpit (supabase/config.toml).
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

  it('kiriman sah: email rincian ke vendor dan konfirmasi ke pemohon (TC-LND-02)', async () => {
    const response = await send(form({ name: '<b>Rina</b> Wijaya' }));
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    const vendor = await waitForMail(`to:"${VENDOR}" subject:"Mal Contoh ${suffix}"`);
    expect(vendor.message.Subject).toBe(`Permintaan trial: Mal Contoh ${suffix} (21 hari)`);
    expect(vendor.text).toContain('Jabatan: Manajer Operasional');
    expect(vendor.text).toContain('Luas: 20.000–50.000 m²');
    // HTML dari isian tampil sebagai teks (TC-LND-05).
    expect(vendor.html).toContain('&lt;b&gt;Rina&lt;/b&gt; Wijaya');
    expect(vendor.html).not.toContain('<b>Rina</b>');
    const applicant = await waitForMail(`to:"rina-${suffix}@malcontoh.co.id"`);
    expect(applicant.message.Subject).toBe('Permintaan trial PanduArah diterima');
    expect(applicant.text).toContain('Permintaan trial 21 hari');
  });

  it('honeypot terisi dan isian tidak sah ditolak tanpa email (TC-LND-03/04/05)', async () => {
    const bot = await send(
      form({ website: 'http://spam.example', email: `bot-${suffix}@spam.id` }),
    );
    expect(bot.status).toBe(400);
    const invalid = await send(form({ email: 'bukan-email', durationDays: 31, consent: false }));
    expect(invalid.status).toBe(422);
    expect(await invalid.json()).toMatchObject({
      problems: { email: 'invalid', durationDays: 'out_of_range', consent: 'required' },
    });
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
