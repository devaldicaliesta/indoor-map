import { strFromU8, strToU8, unzipSync, zipSync } from 'fflate';

/*
 * XLSX minimal untuk template dan berkas import: satu lembar, semua nilai sebagai teks. Ditulis
 * sendiri di atas fflate (zip) karena hanya tabel teks yang dibutuhkan; pustaka spreadsheet
 * lengkap jauh lebih besar.
 */

const escapeXml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Karakter kontrol selain tab dan baris baru tidak sah di XML, jadi dibuang. */
const xmlSafe = (text: string) =>
  [...text]
    .filter((ch) => ch.charCodeAt(0) >= 32 || ch === '\t' || ch === '\n' || ch === '\r')
    .join('');

const unescapeXml = (text: string) =>
  text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) => String.fromCodePoint(Number.parseInt(n, 16)))
    .replace(/&amp;/g, '&');

/** Huruf kolom (A, B, …, AA) dari indeks mulai 0, dan sebaliknya. */
export function columnName(index: number): string {
  let name = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  }
  return name;
}

function columnIndex(name: string): number {
  return [...name].reduce((sum, ch) => sum * 26 + ch.charCodeAt(0) - 64, 0) - 1;
}

const XML = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';

/** Tabel teks menjadi berkas XLSX satu lembar (sel teks sebaris, baris pertama judul kolom). */
export function writeXlsx(rows: readonly (readonly string[])[], sheetName = 'Data'): Uint8Array {
  const sheetRows = rows
    .map((row, r) => {
      const cells = row
        .map((value, c) =>
          value === ''
            ? ''
            : `<c r="${columnName(c)}${r + 1}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(xmlSafe(value))}</t></is></c>`,
        )
        .join('');
      return `<row r="${r + 1}">${cells}</row>`;
    })
    .join('');
  const files = {
    '[Content_Types].xml': `${XML}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    '_rels/.rels': `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `${XML}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(xmlSafe(sheetName))}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `${XML}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    'xl/styles.xml': `${XML}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    'xl/worksheets/sheet1.xml': `${XML}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`,
  };
  return zipSync(
    Object.fromEntries(Object.entries(files).map(([path, text]) => [path, strToU8(text)])),
  );
}

/** Teks semua `<t>` di dalam potongan XML (teks kaya Excel dipecah ke beberapa `<t>`). */
const texts = (xml: string) =>
  [...xml.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map((m) => unescapeXml(m[1] ?? '')).join('');

/** Path lembar pertama menurut workbook dan relasinya; cadangannya sheet1.xml. */
function firstSheetPath(files: Record<string, Uint8Array>): string {
  const workbook = files['xl/workbook.xml'];
  const rels = files['xl/_rels/workbook.xml.rels'];
  if (workbook && rels) {
    const id = /<sheet\b[^>]*\br:id="([^"]+)"/.exec(strFromU8(workbook))?.[1];
    const target = id
      ? (new RegExp(`<Relationship\\b[^>]*Id="${id}"[^>]*Target="([^"]+)"`).exec(
          strFromU8(rels),
        )?.[1] ??
        new RegExp(`<Relationship\\b[^>]*Target="([^"]+)"[^>]*Id="${id}"`).exec(
          strFromU8(rels),
        )?.[1])
      : undefined;
    if (target) return target.startsWith('/') ? target.slice(1) : `xl/${target}`;
  }
  return 'xl/worksheets/sheet1.xml';
}

/**
 * Lembar pertama berkas XLSX sebagai tabel teks. Angka (termasuk tanggal, yang di Excel berupa
 * nomor seri) dikembalikan apa adanya sebagai teks; baris kosong di sela diisi sel kosong.
 */
export function readXlsx(bytes: Uint8Array): string[][] {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    throw new Error('Berkas bukan XLSX yang sah.');
  }
  const sheet = files[firstSheetPath(files)];
  if (!sheet) throw new Error('Lembar pertama tidak ditemukan di berkas XLSX.');
  const shared = files['xl/sharedStrings.xml']
    ? [...strFromU8(files['xl/sharedStrings.xml']).matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
        texts(m[1] ?? ''),
      )
    : [];
  const rows: string[][] = [];
  for (const rowMatch of strFromU8(sheet).matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
    const rowNumber = Number(/\br="(\d+)"/.exec(rowMatch[1] ?? '')?.[1] ?? rows.length + 1);
    const row: string[] = [];
    for (const cell of (rowMatch[2] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = cell[1] ?? '';
      const body = cell[2] ?? '';
      const ref = /\br="([A-Z]+)\d+"/.exec(attrs)?.[1];
      const type = /\bt="([^"]+)"/.exec(attrs)?.[1];
      const raw = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1];
      let value = '';
      if (type === 's') value = shared[Number(raw)] ?? '';
      else if (type === 'inlineStr') value = texts(body);
      else if (type === 'b') value = raw === '1' ? 'TRUE' : 'FALSE';
      else value = raw === undefined ? '' : unescapeXml(raw);
      row[ref ? columnIndex(ref) : row.length] = value;
    }
    rows[rowNumber - 1] = Array.from(row, (v) => v ?? '');
  }
  return Array.from(rows, (r) => r ?? []).filter((r) => r.some((c) => c.trim() !== ''));
}
