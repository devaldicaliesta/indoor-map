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

function dateText(value: unknown, timeZone = 'Asia/Jakarta'): string | null {
  const time = typeof value === 'string' ? Date.parse(value) : Number.NaN;
  if (Number.isNaN(time)) return null;
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeZone }).format(time);
}

/** Tanggal dan jam dalam zona waktu venue beserta singkatannya, mis. "9 Nov 2026, 14.30 WITA". */
function dateTimeText(value: unknown, timeZone: unknown): string | null {
  const time = typeof value === 'string' ? Date.parse(value) : Number.NaN;
  if (Number.isNaN(time)) return null;
  const zone = typeof timeZone === 'string' && timeZone ? timeZone : 'Asia/Jakarta';
  try {
    // dateStyle/timeStyle tidak boleh digabung dengan timeZoneName (RangeError).
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: zone,
      timeZoneName: 'short',
    }).format(time);
  } catch {
    return dateText(value);
  }
}

const OPERATIONAL_FOOTER = 'Atur email yang Anda terima di Admin: menu akun → Notifikasi email.';

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
    case 'license_reminder': {
      const days = Number(details.days_left) || 0;
      const until = dateText(details.valid_until);
      return {
        subject: `Lisensi ${PRODUCT} berakhir dalam ${days} hari`,
        paragraphs: [
          greeting,
          `Lisensi ${PRODUCT}${typeof details.licensee === 'string' ? ` untuk ${details.licensee}` : ''} berakhir dalam ${days} hari${until ? `, pada ${until}` : ''}.`,
          'Setelah berakhir ada masa tenggang 14 hari: Admin hanya bisa dibaca, Visitor tetap berjalan. Sesudahnya peta untuk pengunjung berhenti tampil.',
          `Hubungi vendor untuk perpanjangan, lalu pasang lisensi baru di Admin → Lisensi.`,
        ],
      };
    }
    case 'publish': {
      const venue = str(details.venue, 'venue');
      const actor = str(details.actor, 'pengguna lain');
      const at = dateTimeText(details.at, details.timezone);
      const action =
        details.origin === 'rollback'
          ? `dikembalikan ke isi versi ${Number(details.source_version) || '?'} (sebagai versi ${Number(details.version) || '?'})`
          : `diterbitkan sebagai versi ${Number(details.version) || '?'}`;
      return {
        subject: `Peta ${venue} ${details.origin === 'rollback' ? 'dikembalikan' : 'diterbitkan'}`,
        paragraphs: [
          greeting,
          `Peta ${venue} ${action} oleh ${actor}${at ? ` pada ${at}` : ''}. Pengunjung melihat versi ini saat membuka peta berikutnya.`,
        ],
      };
    }
    case 'closure_created': {
      const venue = str(details.venue, 'venue');
      const starts = dateTimeText(details.starts_at, details.timezone);
      const ends = dateTimeText(details.ends_at, details.timezone);
      return {
        subject: `Penutupan baru di ${venue}`,
        paragraphs: [
          greeting,
          `${str(details.actor, 'Pengguna lain')} menambahkan penutupan sementara di ${venue}: ${sentence(str(details.reason, 'tanpa alasan'))}`,
          `Berlaku ${starts ? `mulai ${starts}` : 'sekarang'}${ends ? ` sampai ${ends}` : ' sampai diakhiri'}. Rute di Visitor menghindarinya selama berlaku.`,
        ],
      };
    }
    default:
      throw new Error(`Jenis pemberitahuan tidak dikenal: ${kind}`);
  }
}

/** Tautan berhenti berlangganan yang dibuat database; hanya http(s). */
function unsubscribeUrl(details: NoticeDetails): string | null {
  const url = details.unsubscribe_url;
  return typeof url === 'string' && /^https?:\/\/\S+$/.test(url) ? url : null;
}

export function renderAccountNotice(
  kind: string,
  fullName: string,
  details: NoticeDetails = {},
): NoticeEmail {
  const { subject, paragraphs } = content(kind, fullName, details);
  const unsubscribe = unsubscribeUrl(details);
  const html = paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`);
  const text = [...paragraphs];
  if (unsubscribe) {
    text.push(`${OPERATIONAL_FOOTER}\nBerhenti menerima email jenis ini: ${unsubscribe}`);
    html.push(
      `<p style="color:#545b64;font-size:13px">${escapeHtml(OPERATIONAL_FOOTER)} <a href="${escapeHtml(unsubscribe)}" style="color:#545b64">Berhenti menerima email jenis ini</a>.</p>`,
    );
  }
  return {
    subject,
    text: emailText(text.join('\n\n')),
    html: emailHtml(html.join('')),
    inline: [EMAIL_LOGO],
  };
}
