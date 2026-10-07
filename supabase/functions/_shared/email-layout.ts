// Kerangka email sistem: logo PanduArah di kepala email, dikirim sebagai gambar inline (`cid:`)
// sehingga tampil tanpa mengunduh dari server luar, dan kontak vendor di kaki email.
import { BRAND_LOGO } from './brand-logo.ts';
import type { InlineImage } from './smtp.ts';

export const PRODUCT = 'PanduArah';
/** Email vendor untuk kontak, dukungan, dan lisensi (keputusan pemilik 2026-10-05). */
export const VENDOR_EMAIL = 'panduarahid@gmail.com';

export const EMAIL_LOGO: InlineImage = BRAND_LOGO;

const FOOTER = `${PRODUCT} — Indoor Navigation · Dukungan: ${VENDOR_EMAIL}`;

export function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c,
  );
}

/** Isi HTML (sudah di-escape) di antara logo dan kaki email, lebar baca nyaman di klien email. */
export function emailHtml(body: string): string {
  const logo = `<img src="cid:${BRAND_LOGO.cid}" width="${BRAND_LOGO.width}" height="${BRAND_LOGO.height}" alt="${PRODUCT}" style="display:block;border:0">`;
  const footer = `<p style="margin:32px 0 0;padding-top:12px;border-top:1px solid #d5d9de;color:#545b64;font-size:12px">${PRODUCT} — Indoor Navigation · Dukungan: <a href="mailto:${VENDOR_EMAIL}" style="color:#545b64">${VENDOR_EMAIL}</a></p>`;
  return `<div style="max-width:560px;font-family:Arial,Helvetica,sans-serif;line-height:1.5"><p style="margin:0 0 24px">${logo}</p>${body}${footer}</div>`;
}

/** Versi teks biasa dengan kaki email yang sama. */
export function emailText(body: string): string {
  return `${body.trimEnd()}\n\n--\n${FOOTER}\n`;
}
