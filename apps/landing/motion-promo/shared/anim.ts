// Fungsi waktu dan easing; semua animasi menghitung keadaan dari waktu saja (deterministik),
// sehingga frame mana pun bisa digambar langsung tanpa memutar dari awal.

export const clamp = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** Progres 0..1 dari `start` sampai `end`. */
export const span = (t: number, start: number, end: number) =>
  end <= start ? (t >= end ? 1 : 0) : clamp((t - start) / (end - start));

export const easeInOut = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2;
};
export const easeOut = (t: number) => 1 - (1 - clamp(t)) ** 3;
export const easeIn = (t: number) => clamp(t) ** 3;
/** Lewat sedikit lalu kembali: untuk elemen yang "muncul" di ketukan. */
export const backOut = (t: number) => {
  const x = clamp(t);
  const c = 1.9;
  return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2;
};

/** Masuk di `start` (lama `inDur`) dan keluar di `end` (lama `outDur`); 0..1. */
export function window01(t: number, start: number, end: number, inDur = 0.3, outDur = 0.3) {
  return easeOut(span(t, start, start + inDur)) * (1 - easeIn(span(t, end - outDur, end)));
}

/** Denyut 0..1 yang naik tajam di setiap ketukan lalu meluruh. */
export function beatPulse(t: number, beat: number) {
  const phase = (((t % beat) + beat) % beat) / beat;
  return (1 - phase) ** 3;
}

/** Bilangan acak semu yang tetap untuk satu kunci (posisi, warna, jitter). */
export function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}
