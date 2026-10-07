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
  html: string;
  /** Pengirim di header From. */
  fromName: string;
  fromAddress: string;
  /** Gambar inline (multipart/related) beserta Content-ID yang dirujuk HTML lewat `cid:`. */
  inline: { fileName: string; contentType: string; contentId: string; size: number }[];
}

interface MailpitDetail {
  Text: string;
  HTML: string;
  From: { Name: string; Address: string };
  Inline: { FileName: string; ContentType: string; ContentID: string; Size: number }[] | null;
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
  const detail = (await (
    await fetch(`${env.mailpitUrl}/api/v1/message/${latest.ID}`)
  ).json()) as MailpitDetail;
  const link = /(http\S+\/auth\/v1\/verify\?\S+)/.exec(detail.Text)?.[1] ?? '';
  return {
    id: latest.ID,
    subject: latest.Subject,
    text: detail.Text,
    link,
    html: detail.HTML,
    fromName: detail.From.Name,
    fromAddress: detail.From.Address,
    inline: (detail.Inline ?? []).map((part) => ({
      fileName: part.FileName,
      contentType: part.ContentType,
      contentId: part.ContentID,
      size: part.Size,
    })),
  };
}
