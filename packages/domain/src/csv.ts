/**
 * CSV RFC 4180 yang cukup untuk berkas dari Excel/LibreOffice/Google Sheets: tanda kutip ganda,
 * pemisah dan baris baru di dalam sel berkutip, BOM, CRLF. Pemisah `,` atau `;` (Excel berbahasa
 * Indonesia memakai `;`) ditebak dari baris pertama.
 */
export function parseCsv(text: string): string[][] {
  const source = text.replace(/^﻿/, '');
  const delimiter = guessDelimiter(source);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
      continue;
    }
    if (ch === '"' && cell === '') quoted = true;
    else if (ch === delimiter) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && source[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  // Baris yang seluruh selnya kosong (sering ada di akhir berkas Excel) dibuang.
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

function guessDelimiter(text: string): ',' | ';' {
  let commas = 0;
  let semicolons = 0;
  let quoted = false;
  for (const ch of text) {
    if (ch === '"') quoted = !quoted;
    else if (!quoted && (ch === '\n' || ch === '\r')) break;
    else if (!quoted && ch === ',') commas++;
    else if (!quoted && ch === ';') semicolons++;
  }
  return semicolons > commas ? ';' : ',';
}

/** Tabel menjadi CSV berpemisah koma; sel dengan koma, kutip, atau baris baru dikutip. */
export function toCsv(rows: readonly (readonly string[])[]): string {
  const cell = (value: string) =>
    /[",\n\r;]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  return `${rows.map((r) => r.map(cell).join(',')).join('\r\n')}\r\n`;
}
