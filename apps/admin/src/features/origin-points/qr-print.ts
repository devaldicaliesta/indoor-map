import type { QrMatrix } from '@indoor/domain';

/** Isi kartu QR titik asal, sesuai wireframe "QR titik asal (cetak A6)" di 05-desain-ui.md. */
export interface QrCard {
  venueName: string;
  matrix: QrMatrix;
  /** Baris ajakan, misalnya "Pindai untuk petunjuk" dan "arah dari titik ini". */
  instructions: readonly string[];
  /** Nama titik dan lantai, misalnya "Lobi Utama · GF". */
  place: string;
}

const MM = 72 / 25.4;
/** A6 tegak dalam point PDF. */
export const A6_PT = { width: 105 * MM, height: 148 * MM };
const MARGIN = 10 * MM;
/** Sisi QR termasuk zona tenang; 70 mm cukup dipindai dari jarak lengan. */
const QR_SIDE = 70 * MM;
const QUIET = 4;
const MAX_LINE_CHARS = 34;

const fixed = (n: number) => n.toFixed(2).replace(/\.?0+$/, '');

/**
 * Teks sebagai string PDF WinAnsi: Latin-1 dipakai apa adanya (byte > 127 sebagai escape oktal agar
 * berkas tetap ASCII), karakter di luar itu menjadi "?". Font standar tidak bisa menulisnya, dan
 * menyematkan font hanya untuk kartu ini tidak sepadan.
 */
export function pdfString(text: string): string {
  let out = '(';
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 63;
    const byte =
      ch === '·' ? 0xb7 : code < 0x20 || code > 0xff || (code >= 0x7f && code < 0xa0) ? 63 : code;
    if (byte === 0x28 || byte === 0x29 || byte === 0x5c) out += `\\${String.fromCharCode(byte)}`;
    else if (byte > 0x7e) out += `\\${byte.toString(8).padStart(3, '0')}`;
    else out += String.fromCharCode(byte);
  }
  return `${out})`;
}

/** Potong teks menjadi baris ≤ `max` karakter di batas kata (kata yang terlalu panjang dipotong). */
export function wrapText(text: string, max = MAX_LINE_CHARS): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.trim().split(/\s+/)) {
    for (let rest = word; rest; rest = rest.slice(max)) {
      const part = rest.slice(0, max);
      if (!line) line = part;
      else if (line.length + 1 + part.length <= max) line += ` ${part}`;
      else {
        lines.push(line);
        line = part;
      }
    }
  }
  if (line) lines.push(line);
  return lines;
}

function contentStream(card: QrCard): string {
  const ops: string[] = [];
  const text = (font: 'F1' | 'F2', size: number, y: number, value: string) =>
    ops.push(`BT /${font} ${size} Tf ${fixed(MARGIN)} ${fixed(y)} Td ${pdfString(value)} Tj ET`);
  let y = A6_PT.height - MARGIN - 14;
  for (const line of wrapText(card.venueName).slice(0, 2)) {
    text('F2', 14, y, line);
    y -= 18;
  }
  const modules = card.matrix.length + 2 * QUIET;
  const unit = QR_SIDE / modules;
  const left = (A6_PT.width - QR_SIDE) / 2;
  const top = y - 6;
  ops.push('0 g');
  card.matrix.forEach((row, r) => {
    row.forEach((dark, c) => {
      if (!dark) return;
      const x = left + (c + QUIET) * unit;
      const yy = top - (r + QUIET + 1) * unit;
      // Sedikit melebar agar tidak ada garis putih tipis antar-modul di sebagian penampil.
      ops.push(`${fixed(x)} ${fixed(yy)} ${fixed(unit + 0.05)} ${fixed(unit + 0.05)} re`);
    });
  });
  ops.push('f');
  y = top - QR_SIDE - 16;
  for (const line of card.instructions) {
    text('F1', 12, y, line);
    y -= 16;
  }
  for (const line of wrapText(card.place).slice(0, 2)) {
    text('F2', 12, y - 4, line);
    y -= 16;
  }
  return ops.join('\n');
}

/** PDF satu halaman A6 berisi kartu QR, tanpa pustaka: objek, xref, dan trailer ditulis langsung. */
export function qrCardPdf(card: QrCard): string {
  const stream = contentStream(card);
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fixed(A6_PT.width)} ${fixed(A6_PT.height)}] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return pdf;
}
