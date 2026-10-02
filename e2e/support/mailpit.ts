import { expect } from '@playwright/test';
import { env } from '../env';

interface MailpitSummary {
  ID: string;
  Subject: string;
}

export interface Mail {
  /** ID Mailpit; tampilan web di `${env.mailpitUrl}/view/<id>`. */
  id: string;
  subject: string;
  text: string;
  /** Tautan `…/auth/v1/verify?…` di isi email; kosong untuk email tanpa tautan (pemberitahuan). */
  link: string;
}

async function search(to: string): Promise<MailpitSummary[]> {
  const url = `${env.mailpitUrl}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`;
  const response = await fetch(url);
  if (!response.ok)
    throw new Error(`Mailpit ${env.mailpitUrl} tidak menjawab (${response.status}).`);
  return ((await response.json()) as { messages: MailpitSummary[] }).messages;
}

/** Menunggu email ke-`count` (terbaru di depan) untuk alamat itu, lalu mengembalikan yang terbaru. */
export async function waitForMail(to: string, count = 1): Promise<Mail> {
  let messages: MailpitSummary[] = [];
  await expect
    .poll(
      async () => {
        messages = await search(to);
        return messages.length;
      },
      {
        message: `email ke ${to} di Mailpit (cek juga batas auth.rate_limit.email_sent)`,
        timeout: 15_000,
      },
    )
    .toBeGreaterThanOrEqual(count);
  const [latest] = messages;
  if (!latest) throw new Error(`Email ke ${to} tidak ada.`);
  const detail = (await (await fetch(`${env.mailpitUrl}/api/v1/message/${latest.ID}`)).json()) as {
    Text: string;
  };
  const link = /(http\S+\/auth\/v1\/verify\?\S+)/.exec(detail.Text)?.[1] ?? '';
  return { id: latest.ID, subject: latest.Subject, text: detail.Text, link };
}
