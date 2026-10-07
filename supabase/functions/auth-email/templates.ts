// Isi email Auth (reset password, undangan, konfirmasi) dalam Bahasa Indonesia.
// Sebelumnya ada di supabase/templates/*.html milik GoTrue; kini satu sumber di sini.
import { EMAIL_LOGO, emailHtml, emailText, escapeHtml, PRODUCT } from '../_shared/email-layout.ts';
import type { InlineImage } from '../_shared/smtp.ts';

export interface AuthEmail {
  subject: string;
  text: string;
  html: string;
  inline: readonly InlineImage[];
}

interface Params {
  email: string;
  /** Tautan sekali pakai; kosong untuk jenis yang hanya memakai kode. */
  link: string;
  code: string;
}

const ADMIN = `Admin ${PRODUCT}`;

function compose(
  subject: string,
  heading: string,
  intro: string,
  action: string | null,
  params: Params,
  note: string,
): AuthEmail {
  const actionText = action ? `${action}:\n${params.link}` : `Kode: ${params.code}`;
  const actionHtml = action
    ? `<p><a href="${escapeHtml(params.link)}">${escapeHtml(action)}</a></p>`
    : `<p style="font-size:24px;font-weight:700;letter-spacing:4px">${escapeHtml(params.code)}</p>`;
  return {
    subject,
    text: emailText(`${heading}\n\n${intro}\n\n${actionText}\n\n${note}`),
    html: emailHtml(
      `<h2>${escapeHtml(heading)}</h2><p>${escapeHtml(intro)}</p>${actionHtml}<p>${escapeHtml(note)}</p>`,
    ),
    inline: [EMAIL_LOGO],
  };
}

/** Jenis email dari GoTrue (`email_action_type`); jenis tak dikenal memakai isi konfirmasi umum. */
export function renderAuthEmail(type: string, params: Params): AuthEmail {
  switch (type) {
    case 'recovery':
      return compose(
        `Atur ulang password ${ADMIN}`,
        'Atur ulang password',
        `Ada permintaan untuk mengatur ulang password akun ${ADMIN} dengan email ${params.email}.`,
        'Atur password baru',
        params,
        'Tautan ini hanya bisa dipakai sekali dan berlaku selama 1 jam. Jika Anda tidak meminta pengaturan ulang, abaikan email ini; password Anda tidak berubah.',
      );
    case 'invite':
      return compose(
        `Undangan ${ADMIN}`,
        `Undangan ${ADMIN}`,
        `Anda diundang menjadi pengguna ${ADMIN} dengan email ${params.email}.`,
        'Buat password dan masuk',
        params,
        'Tautan ini hanya bisa dipakai sekali. Jika Anda tidak mengenal undangan ini, abaikan email ini.',
      );
    case 'reauthentication':
      return compose(
        `Kode verifikasi ${ADMIN}`,
        'Kode verifikasi',
        `Masukkan kode berikut untuk melanjutkan tindakan di ${ADMIN}.`,
        null,
        params,
        'Kode berlaku selama 1 jam. Jika Anda tidak sedang melakukan tindakan ini, abaikan email ini.',
      );
    case 'email_change':
      return compose(
        `Konfirmasi perubahan email ${ADMIN}`,
        'Konfirmasi perubahan email',
        `Ada permintaan mengubah email akun ${ADMIN} menjadi atau dari ${params.email}.`,
        'Konfirmasi perubahan',
        params,
        'Jika Anda tidak meminta perubahan ini, abaikan email ini dan hubungi Super Admin.',
      );
    default:
      return compose(
        `Konfirmasi ${ADMIN}`,
        'Konfirmasi email',
        `Konfirmasi email ${params.email} untuk ${ADMIN}.`,
        'Konfirmasi',
        params,
        'Tautan ini hanya bisa dipakai sekali. Jika Anda tidak merasa meminta email ini, abaikan saja.',
      );
  }
}
