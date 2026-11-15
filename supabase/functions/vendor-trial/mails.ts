import type { LicenseFile } from '../../../packages/domain/src/license.ts';
import { licenseFileName } from '../../../packages/domain/src/license-issue.ts';
import { EMAIL_LOGO, emailHtml, emailText, VENDOR_EMAIL } from '../_shared/email-layout.ts';
import { type SmtpMessage, sendMail } from '../_shared/smtp.ts';
import {
  detailsTable,
  paragraph,
  trialSmtpConfig,
  trialVendorEmail,
} from '../_shared/trial-mail.ts';
import { logError } from '../trial-verify/activate.ts';

export interface TrialApplicant {
  name: string;
  institution: string;
  email: string;
}

const dateOf = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  });

function mail(to: string, subject: string, lines: readonly string[]): SmtpMessage {
  return {
    to,
    subject,
    text: emailText(lines.join('\n\n')),
    html: emailHtml(lines.map(paragraph).join('')),
    inline: [EMAIL_LOGO],
  };
}

export function licenseMail(applicant: TrialApplicant, license: LicenseFile): SmtpMessage {
  const fileName = licenseFileName(license);
  return {
    ...mail(applicant.email, `Lisensi trial PanduArah untuk ${applicant.institution}`, [
      `Halo ${applicant.name},`,
      `Permintaan trial PanduArah untuk ${applicant.institution} disetujui. Berkas lisensi trial terlampir (${fileName}), berlaku sampai ${dateOf(license.validUntil)}.`,
      'Cara memasang: buka Admin PanduArah di server Anda, halaman Aktivasi, tab "Unggah berkas", pilih berkas terlampir, lalu klik "Pasang lisensi". Lisensi hanya berlaku di instalasi yang mengajukan permintaan ini.',
      `Ada pertanyaan? Hubungi ${VENDOR_EMAIL}.`,
    ]),
    attachments: [
      {
        filename: fileName,
        contentType: 'application/json',
        content: `${JSON.stringify(license, null, 2)}\n`,
      },
    ],
  };
}

export function rejectionMail(applicant: TrialApplicant, reason: string): SmtpMessage {
  return mail(applicant.email, `Permintaan trial PanduArah untuk ${applicant.institution}`, [
    `Halo ${applicant.name},`,
    `Mohon maaf, permintaan trial PanduArah untuk ${applicant.institution} belum bisa kami setujui.`,
    `Alasan: ${reason}`,
    `Bila ada pertanyaan atau ingin mengajukan ulang, hubungi ${VENDOR_EMAIL}.`,
  ]);
}

export function vendorQueuedMail(applicant: TrialApplicant, instanceId: string): SmtpMessage {
  const title = 'Permintaan trial on-premise baru';
  const rows: [string, string][] = [
    ['Nama', applicant.name],
    ['Instansi', applicant.institution],
    ['Email', applicant.email],
    ['ID instalasi', instanceId],
  ];
  return {
    to: trialVendorEmail,
    subject: `${title}: ${applicant.institution}`,
    text: emailText(
      `${title}. Setujui atau tolak di dasbor vendor, tab Klien & Instalasi.\n\n${rows
        .map(([label, value]) => `${label}: ${value}`)
        .join('\n')}`,
    ),
    html: emailHtml(
      `${paragraph(`${title}. Setujui atau tolak di dasbor vendor, tab Klien & Instalasi.`)}${detailsTable(rows)}`,
    ),
    inline: [EMAIL_LOGO],
  };
}

export async function deliver(message: SmtpMessage): Promise<boolean> {
  const config = trialSmtpConfig();
  if (!config) {
    logError('vendor-trial', 'TRIAL_SMTP_HOST/TRIAL_SMTP_FROM belum diatur');
    return false;
  }
  try {
    await sendMail(config, message);
    return true;
  } catch (error) {
    logError(
      'vendor-trial',
      `email ke ${message.to}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return false;
  }
}
