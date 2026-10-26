/** Canvas minimal yang dibutuhkan pemeriksaan; test memberi canvas palsu. */
export type WebGLProbeCanvas = Pick<HTMLCanvasElement, 'getContext'>;

/**
 * MapLibre 6 hanya memakai WebGL2: tanpa konteks itu peta melempar galat saat dibuat. PC Info
 * Point dengan GPU lama atau browser yang mematikan WebGL masuk ke sini.
 */
export function detectWebGL(createCanvas: () => WebGLProbeCanvas): boolean {
  try {
    const gl = createCanvas().getContext('webgl2');
    if (!gl) return false;
    // Konteks uji dilepas segera: browser membatasi jumlah konteks WebGL yang hidup.
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

let supported: boolean | undefined;

/** Hasil `detectWebGL` untuk browser ini, diperiksa sekali per halaman. */
export function supportsWebGL(): boolean {
  supported ??= detectWebGL(() => document.createElement('canvas'));
  return supported;
}
