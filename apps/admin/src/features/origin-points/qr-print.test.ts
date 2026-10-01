import { encodeQr } from '@indoor/domain';
import { describe, expect, it } from 'vitest';
import { A6_PT, pdfString, qrCardPdf, wrapText } from './qr-print';

const card = {
  venueName: 'Gedung Contoh',
  matrix: encodeQr('https://peta.contoh.id/v/x?o=0123456789ab'),
  instructions: ['Pindai untuk petunjuk', 'arah dari titik ini'],
  place: 'Lobi Utama · GF',
};

describe('kartu QR A6', () => {
  it('string PDF: kurung dan garis miring di-escape, Latin-1 oktal, selain itu "?"', () => {
    expect(pdfString('a (b) \\ c')).toBe('(a \\(b\\) \\\\ c)');
    expect(pdfString('Lobi · Café')).toBe('(Lobi \\267 Caf\\351)');
    expect(pdfString('塔')).toBe('(?)');
  });

  it('teks dipotong di batas kata', () => {
    expect(wrapText('Ruang Tunggu Lantai Dua Sayap Timur Gedung Utama', 20)).toEqual([
      'Ruang Tunggu Lantai',
      'Dua Sayap Timur',
      'Gedung Utama',
    ]);
  });

  it('PDF satu halaman A6 dengan xref yang menunjuk tepat ke setiap objek', () => {
    const pdf = qrCardPdf(card);
    expect(pdf.startsWith('%PDF-1.4\n')).toBe(true);
    expect(pdf).toContain(`/MediaBox [0 0 ${A6_PT.width.toFixed(2)} ${A6_PT.height.toFixed(2)}]`);
    expect([...pdf].every((ch) => ch === '\n' || (ch >= ' ' && ch <= '~'))).toBe(true);
    const xref = Number(/startxref\n(\d+)/.exec(pdf)?.[1]);
    expect(pdf.slice(xref, xref + 4)).toBe('xref');
    const offsets = [...pdf.slice(xref).matchAll(/^(\d{10}) 00000 n $/gm)].map((m) => Number(m[1]));
    expect(offsets).toHaveLength(6);
    offsets.forEach((offset, i) => {
      expect(pdf.slice(offset).startsWith(`${i + 1} 0 obj`)).toBe(true);
    });
    const length = Number(/\/Length (\d+)/.exec(pdf)?.[1]);
    const start = pdf.indexOf('stream\n') + 'stream\n'.length;
    expect(pdf.slice(start + length, start + length + 10)).toBe('\nendstream');
    expect(pdf).toContain('(Lobi Utama \\267 GF) Tj');
  });
});

describe('nama berkas QR', () => {
  it('slug dari nama titik', async () => {
    const { qrFilename } = await import('./qr-download');
    expect(qrFilename('Lobi Utama · Café')).toBe('qr-lobi-utama-cafe');
    expect(qrFilename('··')).toBe('qr-titik-asal');
  });
});
