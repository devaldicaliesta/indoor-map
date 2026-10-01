import { encodeQr, type QrMatrix } from '@indoor/domain';
import { type QrCard, qrCardPdf } from './qr-print';

const INSTRUCTIONS = ['Pindai untuk petunjuk', 'arah dari titik ini'];

export function qrCard(venueName: string, url: string, place: string): QrCard {
  return { venueName, matrix: encodeQr(url), instructions: INSTRUCTIONS, place };
}

function save(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/** Nama berkas aman dari nama titik, misalnya "qr-lobi-utama". */
export function qrFilename(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `qr-${slug || 'titik-asal'}`;
}

export function downloadPdf(card: QrCard, name: string) {
  const pdf = qrCardPdf(card);
  const bytes = Uint8Array.from(pdf, (ch) => ch.charCodeAt(0));
  save(new Blob([bytes], { type: 'application/pdf' }), `${qrFilename(name)}.pdf`);
}

/** PNG QR saja (tanpa teks) untuk ditempel di desain lain; 10 px per modul. */
export function downloadPng(matrix: QrMatrix, name: string) {
  const quiet = 4;
  const scale = 10;
  const side = (matrix.length + quiet * 2) * scale;
  const canvas = document.createElement('canvas');
  canvas.width = side;
  canvas.height = side;
  const context = canvas.getContext('2d');
  if (!context) return;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, side, side);
  context.fillStyle = '#000000';
  matrix.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) context.fillRect((x + quiet) * scale, (y + quiet) * scale, scale, scale);
    });
  });
  canvas.toBlob((blob) => (blob ? save(blob, `${qrFilename(name)}.png`) : null), 'image/png');
}
