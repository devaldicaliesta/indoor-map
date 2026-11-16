import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { expect, test } from '../../../fixtures';
import { AdminShell } from '../../../pages/admin-shell';
import { EditorPage } from '../../../pages/editor-page';

const evidence = (name: string) => `evidence/T-544/${name}`;

async function exportAs(
  page: Page,
  options: { format: 'PDF' | 'SVG'; paper: 'A3' | 'A4'; orientation: 'Lanskap' | 'Potret' },
  file: string,
) {
  await page.getByRole('button', { name: 'Export peta' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('radio', { name: options.format, exact: true }).check();
  await dialog.getByRole('radio', { name: options.paper, exact: true }).check();
  await dialog.getByRole('radio', { name: options.orientation, exact: true }).check();
  const downloading = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Ekspor' }).click();
  const download = await downloading;
  await download.saveAs(evidence(file));
  await expect(page.getByText('Peta diekspor').last()).toBeVisible();
  return { name: download.suggestedFilename(), path: evidence(file) };
}

async function pdfText(path: string) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const document = await pdfjs.getDocument({
    data: new Uint8Array(readFileSync(path)),
    disableFontFace: true,
  }).promise;
  const page = await document.getPage(1);
  const [, , width, height] = page.view;
  const content = await page.getTextContent();
  const strings = content.items.flatMap((item) => ('str' in item ? [item.str] : []));
  return { pages: document.numPages, width, height, strings };
}

test.describe('T-544 Export peta cetak', () => {
  test('lantai diekspor ke PDF A3 dan SVG dengan judul, legenda, arah utara, dan skala', async ({
    page,
    browser,
    loginAs,
    fullVenue,
  }) => {
    test.setTimeout(120_000);
    await loginAs('admin');
    await new AdminShell(page).selectVenue(fullVenue.name);
    const editor = new EditorPage(page);
    await editor.goto();
    await page.getByRole('button', { name: 'Export peta' }).click();
    const dialog = page.getByRole('dialog');
    const title = dialog.getByLabel('Judul');
    await expect(title).toHaveValue(`${fullVenue.name} — Gedung Utama GF`);
    await page.screenshot({ path: evidence('01-dialog-export.png') });
    await dialog.getByRole('button', { name: 'Batal' }).click();

    const pdf = await exportAs(
      page,
      { format: 'PDF', paper: 'A3', orientation: 'Lanskap' },
      '02-denah-a3-lanskap.pdf',
    );
    expect(pdf.name).toMatch(/-a3\.pdf$/);
    expect(readFileSync(pdf.path).subarray(0, 8).toString('latin1')).toBe('%PDF-1.4');
    const parsed = await pdfText(pdf.path);
    expect(parsed.pages).toBe(1);
    expect([Math.round(parsed.width ?? 0), Math.round(parsed.height ?? 0)]).toEqual([1191, 842]);
    expect(parsed.strings).toEqual(
      expect.arrayContaining([
        `${fullVenue.name} — Gedung Utama GF`,
        'Denah lantai GF',
        'Legenda',
        'Unit',
        'Dinding',
        'Pintu',
        'U',
      ]),
    );
    expect(parsed.strings.some((text) => /^\d+ m$/.test(text))).toBe(true);
    expect(parsed.strings.some((text) => /^GF-/.test(text))).toBe(true);

    const svg = await exportAs(
      page,
      { format: 'SVG', paper: 'A3', orientation: 'Lanskap' },
      '03-denah-a3-lanskap.svg',
    );
    const svgText = readFileSync(svg.path, 'utf8');
    expect(svgText).toContain('width="420mm" height="297mm"');
    expect(svgText).toContain('>Legenda</text>');

    const portrait = await exportAs(
      page,
      { format: 'SVG', paper: 'A4', orientation: 'Potret' },
      '05-denah-a4-potret.svg',
    );
    expect(readFileSync(portrait.path, 'utf8')).toContain('width="210mm" height="297mm"');

    const viewer = await browser.newPage({ viewport: { width: 1588, height: 1123 } });
    await viewer.setContent(
      `<body style="margin:0;background:#fff">${svgText.replace(/^<\?xml[^>]*>/, '')}</body>`,
    );
    await viewer.locator('svg').evaluate((element) => {
      element.setAttribute('width', '1588');
      element.setAttribute('height', '1123');
    });
    await viewer.screenshot({ path: evidence('04-pratinjau-a3.png') });
    await viewer.close();
  });
});
