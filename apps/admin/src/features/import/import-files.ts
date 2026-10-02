import { importHeader, type LocationType, parseCsv, toCsv } from '@indoor/domain';

/** Unduh berkas buatan browser (template), tanpa melewati server. */
function save(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

const slug = (name: string) =>
  name
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'lokasi';

export function downloadCsvTemplate(type: LocationType) {
  // BOM agar Excel membaca UTF-8 dengan benar.
  save(
    new Blob([`﻿${toCsv([importHeader(type)])}`], { type: 'text/csv;charset=utf-8' }),
    `template-${slug(type.name)}.csv`,
  );
}

export async function downloadXlsxTemplate(type: LocationType) {
  const { writeXlsx } = await import('./xlsx');
  const bytes = writeXlsx([importHeader(type)], type.name.slice(0, 31));
  save(
    new Blob([new Uint8Array(bytes)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `template-${slug(type.name)}.xlsx`,
  );
}

/** Berkas pilihan pengguna diparse di browser; tidak pernah diunggah ke server. */
export async function readTable(file: File): Promise<string[][]> {
  if (/\.xlsx$/i.test(file.name)) {
    const { readXlsx } = await import('./xlsx');
    return readXlsx(new Uint8Array(await file.arrayBuffer()));
  }
  if (/\.(csv|txt)$/i.test(file.name)) return parseCsv(await file.text());
  throw new Error('Pilih berkas .csv atau .xlsx.');
}
