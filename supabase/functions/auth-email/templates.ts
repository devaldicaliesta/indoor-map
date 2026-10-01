// Isi email Auth (reset password, undangan, konfirmasi) dalam Bahasa Indonesia.
// Sebelumnya ada di supabase/templates/*.html milik GoTrue; kini satu sumber di sini.

export interface AuthEmail {
  subject: string;
  text: string;
  html: string;
}

interface Params {
  email: string;
  /** Tautan sekali pakai; kosong untuk jenis yang hanya memakai kode. */
  link: string;
  code: string;
}

const PRODUCT = 'Admin Indoor Map';

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}

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
    text: `${heading}\n\n${intro}\n\n${actionText}\n\n${note}\n`,
    html: `<h2>${escapeHtml(heading)}</h2><p>${escapeHtml(intro)}</p>${actionHtml}<p>${escapeHtml(note)}</p>`,
  };
}

/** Jenis email dari GoTrue (`email_action_type`); jenis tak dikenal memakai isi konfirmasi umum. */
export function renderAuthEmail(type: string, params: Params): AuthEmail {
  switch (type) {
    case 'recovery':
      return compose(
        `Atur ulang password ${PRODUCT}`,
        'Atur ulang password',
        `Ada permintaan untuk mengatur ulang password akun ${PRODUCT} dengan email ${params.email}.`,
        'Atur password baru',
        params,
        'Tautan ini hanya bisa dipakai sekali dan berlaku selama 1 jam. Jika Anda tidak meminta pengaturan ulang, abaikan email ini; password Anda tidak berubah.',
      );
    case 'invite':
      return compose(
        `Undangan ${PRODUCT}`,
        `Undangan ${PRODUCT}`,
        `Anda diundang menjadi pengguna ${PRODUCT} dengan email ${params.email}.`,
        'Buat password dan masuk',
        params,
        'Tautan ini hanya bisa dipakai sekali. Jika Anda tidak mengenal undangan ini, abaikan email ini.',
      );
    case 'reauthentication':
      return compose(
        `Kode verifikasi ${PRODUCT}`,
        'Kode verifikasi',
        `Masukkan kode berikut untuk melanjutkan tindakan di ${PRODUCT}.`,
        null,
        params,
        'Kode berlaku selama 1 jam. Jika Anda tidak sedang melakukan tindakan ini, abaikan email ini.',
      );
    case 'email_change':
      return compose(
        `Konfirmasi perubahan email ${PRODUCT}`,
        'Konfirmasi perubahan email',
        `Ada permintaan mengubah email akun ${PRODUCT} menjadi atau dari ${params.email}.`,
        'Konfirmasi perubahan',
        params,
        'Jika Anda tidak meminta perubahan ini, abaikan email ini dan hubungi Super Admin.',
      );
    default:
      return compose(
        `Konfirmasi ${PRODUCT}`,
        'Konfirmasi email',
        `Konfirmasi email ${params.email} untuk ${PRODUCT}.`,
        'Konfirmasi',
        params,
        'Tautan ini hanya bisa dipakai sekali. Jika Anda tidak merasa meminta email ini, abaikan saja.',
      );
  }
}
