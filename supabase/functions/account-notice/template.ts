// Isi email pemberitahuan akun dalam Bahasa Indonesia.
import { EMAIL_LOGO, emailHtml, emailText, escapeHtml, PRODUCT } from '../_shared/email-layout.ts';
import type { InlineImage } from '../_shared/smtp.ts';

export interface NoticeEmail {
  subject: string;
  text: string;
  html: string;
  inline: readonly InlineImage[];
}

export function renderAccountNotice(kind: string, fullName: string): NoticeEmail {
  if (kind !== 'account_locked') throw new Error(`Jenis pemberitahuan tidak dikenal: ${kind}`);
  const paragraphs = [
    `Halo ${fullName},`,
    `Akun Admin ${PRODUCT} Anda dikunci selama 15 menit karena 5 kali percobaan masuk dengan password yang salah.`,
    'Jika itu Anda, tunggu 15 menit lalu masuk lagi, atau pakai "Lupa password?" di halaman masuk.',
    'Jika bukan Anda, seseorang mungkin mencoba masuk ke akun Anda. Ganti password lewat "Lupa password?" setelah kunci berakhir dan beri tahu Super Admin.',
  ];
  return {
    subject: `Akun Admin ${PRODUCT} dikunci sementara`,
    text: emailText(paragraphs.join('\n\n')),
    html: emailHtml(paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')),
    inline: [EMAIL_LOGO],
  };
}
