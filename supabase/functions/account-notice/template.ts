// Isi email pemberitahuan akun dan peringatan kesehatan sistem dalam Bahasa Indonesia.
import { EMAIL_LOGO, emailHtml, emailText, escapeHtml, PRODUCT } from '../_shared/email-layout.ts';
import type { InlineImage } from '../_shared/smtp.ts';

export interface NoticeEmail {
  subject: string;
  text: string;
  html: string;
  inline: readonly InlineImage[];
}

/** Rincian dari `account_notices.details` (peringatan kesehatan, migrasi 0061). */
export type NoticeDetails = Record<string, unknown>;

const HEALTH_PAGE = 'Buka Admin → Kesehatan sistem untuk melihat keadaan server saat ini.';

const str = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback;

/** Satu titik di akhir kalimat, walau pesan dari server sudah diakhiri tanda baca. */
const sentence = (value: string) => (/[.!?]$/.test(value) ? value : `${value}.`);

function dateText(value: unknown): string | null {
  const time = typeof value === 'string' ? Date.parse(value) : Number.NaN;
  if (Number.isNaN(time)) return null;
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone: 'Asia/Jakarta' }).format(
    time,
  );
}

function content(kind: string, fullName: string, details: NoticeDetails) {
  const greeting = `Halo ${fullName},`;
  switch (kind) {
    case 'account_locked':
      return {
        subject: `Akun Admin ${PRODUCT} dikunci sementara`,
        paragraphs: [
          greeting,
          `Akun Admin ${PRODUCT} Anda dikunci selama 15 menit karena 5 kali percobaan masuk dengan password yang salah.`,
          'Jika itu Anda, tunggu 15 menit lalu masuk lagi, atau pakai "Lupa password?" di halaman masuk.',
          'Jika bukan Anda, seseorang mungkin mencoba masuk ke akun Anda. Ganti password lewat "Lupa password?" setelah kunci berakhir dan beri tahu Super Admin.',
        ],
      };
    case 'backup_failed': {
      const lastSuccess = dateText(details.last_success_at);
      return {
        subject: `Peringatan ${PRODUCT}: backup gagal 2 kali berturut-turut`,
        paragraphs: [
          greeting,
          `Backup harian server ${PRODUCT} gagal 2 kali berturut-turut. Pesan terakhir: ${sentence(str(details.message, 'tidak ada keterangan'))}`,
          lastSuccess
            ? `Backup terakhir yang berhasil: ${lastSuccess}.`
            : 'Belum ada backup yang berhasil tercatat.',
          'Periksa log backup di server (backups/backup.log) dan ruang disk, lalu jalankan backup.sh secara manual sampai berhasil.',
          HEALTH_PAGE,
        ],
      };
    }
    case 'disk_high':
      return {
        subject: `Peringatan ${PRODUCT}: disk server hampir penuh`,
        paragraphs: [
          greeting,
          `Disk ${str(details.path, 'server')} sudah terpakai ${Number(details.percent) || 0}%. Di atas 85%, backup dan unggahan bisa gagal.`,
          'Kosongkan ruang (misalnya pindahkan backup lama ke NAS) atau tambah kapasitas disk.',
          HEALTH_PAGE,
        ],
      };
    case 'cert_expiring': {
      const expires = dateText(details.expires_at);
      const days = Number(details.days_left);
      return {
        subject: `Peringatan ${PRODUCT}: sertifikat HTTPS segera berakhir`,
        paragraphs: [
          greeting,
          `Sertifikat HTTPS ${str(details.domain, 'server')} ${days > 0 ? `berakhir dalam ${days} hari` : 'sudah atau hampir berakhir'}${expires ? ` (${expires})` : ''}. Setelah berakhir, Admin dan Visitor tidak bisa dibuka dengan aman.`,
          "Sertifikat Let's Encrypt diperbarui otomatis: pastikan server bisa dijangkau dari internet di port 80/443. Sertifikat dari instansi: ganti berkas di folder certs lalu jalankan ulang layanan web.",
          HEALTH_PAGE,
        ],
      };
    }
    default:
      throw new Error(`Jenis pemberitahuan tidak dikenal: ${kind}`);
  }
}

export function renderAccountNotice(
  kind: string,
  fullName: string,
  details: NoticeDetails = {},
): NoticeEmail {
  const { subject, paragraphs } = content(kind, fullName, details);
  return {
    subject,
    text: emailText(paragraphs.join('\n\n')),
    html: emailHtml(paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join('')),
    inline: [EMAIL_LOGO],
  };
}
