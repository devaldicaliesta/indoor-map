import type { Page } from '@playwright/test';

/** Denah gambar sederhana (ruang dan koridor) yang digambar di browser; PNG atau JPG. */
export async function drawPlan(page: Page, type: 'image/png' | 'image/jpeg', label: string) {
  const base64 = await page.evaluate(
    ([mime, text]) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas 2d tidak tersedia');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1200, 600);
      ctx.strokeStyle = '#1b1f24';
      ctx.lineWidth = 6;
      ctx.strokeRect(20, 20, 1160, 560);
      ctx.lineWidth = 3;
      for (let x = 160; x < 1180; x += 140) {
        ctx.beginPath();
        ctx.moveTo(x, 20);
        ctx.lineTo(x, 240);
        ctx.moveTo(x, 360);
        ctx.lineTo(x, 580);
        ctx.stroke();
      }
      ctx.strokeRect(20, 240, 1160, 120);
      ctx.fillStyle = '#1b1f24';
      ctx.font = 'bold 40px sans-serif';
      ctx.fillText(text, 40, 320);
      return canvas.toDataURL(mime, 0.9).split(',')[1] ?? '';
    },
    [type, label] as const,
  );
  return Buffer.from(base64, 'base64');
}

/** PDF minimal beberapa halaman (teks per halaman), ditulis langsung dengan tabel xref yang benar. */
export function multiPagePdf(pages: string[]): Buffer {
  const objects: string[] = [];
  const kids = pages.map((_, i) => `${4 + i * 2} 0 R`).join(' ');
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push(`<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  pages.forEach((text, i) => {
    const content = `BT /F1 36 Tf 60 500 Td (${text}) Tj ET 40 40 760 520 re S`;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 3 0 R >> >> /Contents ${5 + i * 2} 0 R >>`,
    );
    objects.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
  });
  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((object, i) => {
    offsets.push(body.length);
    body += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) body += `${String(offset).padStart(10, '0')} 00000 n \n`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(body, 'latin1');
}
