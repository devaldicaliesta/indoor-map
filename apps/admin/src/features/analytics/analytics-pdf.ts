import {
  ANALYTICS_KIND_LABELS,
  ANALYTICS_KINDS,
  type AnalyticsSection,
  type AnalyticsSummary,
} from '@indoor/domain';
import { pdfString } from '../origin-points/qr-print';

const MM = 72 / 25.4;
const A4 = { width: 210 * MM, height: 297 * MM };
const MARGIN = 18 * MM;
const LINE = 15;
const COUNT_X = A4.width - MARGIN - 60;
const MAX_LABEL = 70;

const fixed = (n: number) => n.toFixed(2).replace(/\.?0+$/, '');

type Line = { text: string; bold?: boolean; count?: number | string; gap?: number };

function lines(title: string, summary: AnalyticsSummary, sections: AnalyticsSection[]): Line[] {
  const out: Line[] = [
    { text: title, bold: true },
    { text: `Periode ${summary.from} s.d. ${summary.to}`, gap: 8 },
    { text: 'Ringkasan', bold: true },
    ...ANALYTICS_KINDS.map((kind) => ({
      text: ANALYTICS_KIND_LABELS[kind],
      count: summary.totals[kind],
    })),
  ];
  out.push({ text: '', gap: 0 }, { text: 'Tren harian', bold: true });
  out.push({
    text: `Tanggal: ${ANALYTICS_KINDS.map((k) => ANALYTICS_KIND_LABELS[k]).join(' / ')}`,
  });
  for (const day of summary.trend) {
    out.push({ text: day.day, count: ANALYTICS_KINDS.map((k) => day[k]).join(' / ') });
  }
  for (const section of sections) {
    out.push({ text: '', gap: 0 }, { text: section.title, bold: true });
    if (!section.rows.length) out.push({ text: 'Belum ada data' });
    for (const row of section.rows) {
      const label =
        row.label.length > MAX_LABEL ? `${row.label.slice(0, MAX_LABEL - 1)}…` : row.label;
      out.push({ text: label, count: row.count });
    }
  }
  return out;
}

function pages(all: Line[]): string[] {
  const streams: string[] = [];
  let ops: string[] = [];
  let y = A4.height - MARGIN;
  const flush = () => {
    streams.push(ops.join('\n'));
    ops = [];
    y = A4.height - MARGIN;
  };
  for (const line of all) {
    const height = LINE + (line.gap ?? 0);
    if (y - height < MARGIN) flush();
    y -= height;
    if (!line.text && line.count === undefined) continue;
    const font = line.bold ? 'F2' : 'F1';
    ops.push(`BT /${font} 10 Tf ${fixed(MARGIN)} ${fixed(y)} Td ${pdfString(line.text)} Tj ET`);
    if (line.count !== undefined) {
      ops.push(
        `BT /F1 10 Tf ${fixed(COUNT_X)} ${fixed(y)} Td ${pdfString(String(line.count))} Tj ET`,
      );
    }
  }
  if (ops.length) flush();
  return streams;
}

export function analyticsPdf(
  title: string,
  summary: AnalyticsSummary,
  sections: AnalyticsSection[],
): string {
  const streams = pages(lines(title, summary, sections));
  const first = 5;
  const kids = streams.map((_, i) => `${first + i * 2} 0 R`).join(' ');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${kids}] /Count ${streams.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    ...streams.flatMap((stream, i) => [
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fixed(A4.width)} ${fixed(A4.height)}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${first + i * 2 + 1} 0 R >>`,
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    ]),
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
