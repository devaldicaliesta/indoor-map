/** Sisi PNG ikon yang disimpan; cukup untuk lingkaran 28 px pada layar 2× dan pratinjau. */
export const ICON_RASTER_PX = 128;

/**
 * SVG dan PNG unggahan disimpan sebagai PNG persegi. Menggambar lewat <img> membuat skrip
 * dan rujukan luar di dalam SVG tidak pernah dijalankan, dan metadata berkas asli terbuang.
 */
export async function rasterizeIcon(file: File): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode().catch(() => {
      throw new Error('Berkas ikon tidak dapat dibaca. Pastikan SVG atau PNG-nya utuh.');
    });
    const canvas = document.createElement('canvas');
    canvas.width = ICON_RASTER_PX;
    canvas.height = ICON_RASTER_PX;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Browser tidak mendukung pengolahan gambar.');
    // SVG tanpa ukuran bawaan dianggap persegi.
    const width = image.naturalWidth || ICON_RASTER_PX;
    const height = image.naturalHeight || ICON_RASTER_PX;
    const scale = ICON_RASTER_PX / Math.max(width, height);
    const w = width * scale;
    const h = height * scale;
    ctx.drawImage(image, (ICON_RASTER_PX - w) / 2, (ICON_RASTER_PX - h) / 2, w, h);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Ikon gagal dikonversi ke PNG.'))),
        'image/png',
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
