// Email hasil verifikasi trial (T-614b): ke pemohon dalam bahasanya, ke vendor dalam Indonesia.
import { HOSTED_TRIAL_DAYS } from '../../../packages/domain/src/trial-request.ts';
import { EMAIL_LOGO, emailHtml, emailText, VENDOR_EMAIL } from '../_shared/email-layout.ts';
import { button, detailsTable, paragraph, trialVendorEmail } from '../_shared/trial-mail.ts';
import type { TrialRequest, Workspace } from './provision.ts';

function mail(to: string, subject: string, lines: readonly string[], action?: [string, string]) {
  const [label, href] = action ?? [];
  const html = lines.map(paragraph);
  if (label && href) html.splice(2, 0, button(label, href));
  const text =
    label && href ? [...lines.slice(0, 2), `${label}: ${href}`, ...lines.slice(2)] : lines;
  return {
    to,
    subject,
    text: emailText(text.join('\n\n')),
    html: emailHtml(html.join('')),
    inline: [EMAIL_LOGO],
  };
}

const dateOf = (iso: string, en: boolean) =>
  new Date(iso).toLocaleDateString(en ? 'en-GB' : 'id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });

/** "Trial aktif": tautan membuat password, Admin, Visitor, tanggal berakhir, panduan singkat. */
export function activeMail(
  request: TrialRequest,
  workspace: Workspace,
  links: { password: string; admin: string; visitor: string },
) {
  const en = request.language === 'en';
  const until = dateOf(workspace.endsAt, en);
  const lines = en
    ? [
        `Hello ${request.name},`,
        `Your PanduArah trial workspace for ${request.institution} is ready, with sample data for your building type. First, create your password:`,
        `Admin (draw the map, manage locations, publish): ${links.admin} — sign in with ${request.email}.`,
        `Visitor (what your visitors see, also from a phone or QR): ${links.visitor}`,
        `Your trial runs for ${HOSTED_TRIAL_DAYS} days, until ${until}. Quick start: open Map Editor, replace the sample with your own building, then Publish.`,
        `The password link is valid for a limited time; use "Forgot password" on the sign-in page if it expires. Questions? Reply to ${VENDOR_EMAIL}.`,
      ]
    : [
        `Halo ${request.name},`,
        `Ruang kerja trial PanduArah untuk ${request.institution} sudah siap, berisi data contoh sesuai jenis gedung Anda. Pertama, buat password Anda:`,
        `Admin (gambar peta, kelola lokasi, publish): ${links.admin} — masuk dengan ${request.email}.`,
        `Visitor (tampilan untuk pengunjung, juga dari HP atau QR): ${links.visitor}`,
        `Trial berlaku ${HOSTED_TRIAL_DAYS} hari, sampai ${until}. Mulai cepat: buka Editor Peta, ganti data contoh dengan gedung Anda, lalu Publish.`,
        `Tautan password berlaku terbatas; bila kedaluwarsa, pakai "Lupa password" di halaman masuk. Ada pertanyaan? Hubungi ${VENDOR_EMAIL}.`,
      ];
  return mail(
    request.email,
    en ? 'Your PanduArah trial is ready' : 'Trial PanduArah Anda siap',
    lines,
    [en ? 'Create password' : 'Buat password', links.password],
  );
}

/** Kapasitas penuh: pemohon menunggu giliran (siklus hidup memprosesnya, T-615). */
export function queuedMail(request: TrialRequest) {
  const en = request.language === 'en';
  const lines = en
    ? [
        `Hello ${request.name},`,
        `Thank you for confirming. All trial workspaces are currently in use, so your request for ${request.institution} is in the queue.`,
        'We will email you as soon as your workspace is ready — no need to apply again.',
        `Questions? Reply to ${VENDOR_EMAIL}.`,
      ]
    : [
        `Halo ${request.name},`,
        `Terima kasih sudah mengonfirmasi. Semua ruang kerja trial sedang terpakai, jadi permintaan untuk ${request.institution} masuk antrean.`,
        'Kami kirim email begitu ruang kerja Anda siap — tidak perlu mengajukan lagi.',
        `Ada pertanyaan? Hubungi ${VENDOR_EMAIL}.`,
      ];
  return mail(
    request.email,
    en ? 'Your PanduArah trial is in the queue' : 'Permintaan trial PanduArah Anda dalam antrean',
    lines,
  );
}

/** Hari ke-14: trial berakhir 3 hari lagi (FR-HT-08). */
export function reminderMail(request: TrialRequest, endsAt: string, admin: string) {
  const en = request.language === 'en';
  const until = dateOf(endsAt, en);
  const lines = en
    ? [
        `Hello ${request.name},`,
        `Your PanduArah trial for ${request.institution} ends on ${until}. After that, Admin and Visitor are locked, and the workspace is deleted 7 days later.`,
        `Want to keep using PanduArah? Reply to ${VENDOR_EMAIL} and we will help you continue with your own installation.`,
        `Admin: ${admin}`,
      ]
    : [
        `Halo ${request.name},`,
        `Trial PanduArah untuk ${request.institution} berakhir pada ${until}. Setelah itu Admin dan Visitor terkunci, dan ruang kerja dihapus 7 hari kemudian.`,
        `Ingin terus memakai PanduArah? Balas ke ${VENDOR_EMAIL}, kami bantu melanjutkan dengan instalasi Anda sendiri.`,
        `Admin: ${admin}`,
      ];
  return mail(
    request.email,
    en ? `Your PanduArah trial ends on ${until}` : `Trial PanduArah Anda berakhir ${until}`,
    lines,
  );
}

/** Hari ke-17: trial berakhir dan terkunci (FR-HT-09); dihapus `deleteAt` (FR-HT-10). */
export function endedMail(request: TrialRequest, deleteAt: string) {
  const en = request.language === 'en';
  const removal = dateOf(deleteAt, en);
  const lines = en
    ? [
        `Hello ${request.name},`,
        `Your PanduArah trial for ${request.institution} has ended. Admin and Visitor are now locked.`,
        `The workspace, its files, and your trial account will be deleted on ${removal}.`,
        `Thank you for trying PanduArah. To continue, reply to ${VENDOR_EMAIL}.`,
      ]
    : [
        `Halo ${request.name},`,
        `Trial PanduArah untuk ${request.institution} sudah berakhir. Admin dan Visitor kini terkunci.`,
        `Ruang kerja, berkasnya, dan akun trial Anda akan dihapus pada ${removal}.`,
        `Terima kasih sudah mencoba PanduArah. Untuk melanjutkan, balas ke ${VENDOR_EMAIL}.`,
      ];
  return mail(
    request.email,
    en ? 'Your PanduArah trial has ended' : 'Trial PanduArah Anda sudah berakhir',
    lines,
  );
}

/** Pemberitahuan vendor: trial aktif, antre, gagal dibuat, atau berakhir (leads). */
export function vendorMail(
  event: 'active' | 'queued' | 'failed' | 'ended',
  request: TrialRequest,
  detail: string,
) {
  const title = {
    active: 'Trial aktif',
    queued: 'Trial antre',
    failed: 'Provisioning gagal',
    // Saat terbaik menindaklanjuti calon klien.
    ended: 'Trial berakhir',
  }[event];
  const rows: [string, string][] = [
    ['Nama', request.name],
    ['Instansi', request.institution],
    ['Jabatan', request.title],
    ['Email', request.email],
    ['Telepon', request.phone],
    ['Jenis gedung', request.building_type],
    ['Luas', request.building_size],
    ['Bahasa', request.language === 'en' ? 'English' : 'Indonesia'],
    ['Keterangan', detail],
  ];
  return {
    to: trialVendorEmail,
    subject: `${title}: ${request.institution}`,
    text: emailText(`${title}.\n\n${rows.map(([l, v]) => `${l}: ${v}`).join('\n')}`),
    html: emailHtml(`${paragraph(`${title}.`)}${detailsTable(rows)}`),
    inline: [EMAIL_LOGO],
  };
}
