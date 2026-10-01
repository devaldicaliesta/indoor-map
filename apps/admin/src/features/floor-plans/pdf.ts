import { pdfRenderScale } from '@indoor/domain';

export interface PdfDocument {
  pageCount: number;
  /** Render satu halaman (mulai dari 1) menjadi PNG untuk ditampilkan di peta. */
  renderPage(page: number): Promise<Blob>;
  destroy(): Promise<void>;
}

/**
 * pdf.js hanya dimuat saat pengguna memilih PDF. Build legacy dipakai karena build utama
 * v6 memakai API JS yang belum ada di Chrome/Edge kantor yang belum diperbarui.
 */
async function loadPdfJs() {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist/legacy/build/pdf.mjs'),
    import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  return pdfjs;
}

export async function openPdf(file: File): Promise<PdfDocument> {
  const pdfjs = await loadPdfJs();
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  return {
    pageCount: doc.numPages,
    async renderPage(pageNumber) {
      const page = await doc.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: pdfRenderScale(base.width, base.height) });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      // Latar putih: denah PDF umumnya tanpa latar, dan PNG transparan tak terbaca di peta gelap.
      await page.render({ canvas, viewport, background: '#ffffff' }).promise;
      page.cleanup();
      return new Promise((resolve, reject) =>
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Halaman PDF gagal dirender.'))),
          'image/png',
        ),
      );
    },
    destroy: () => task.destroy(),
  };
}
