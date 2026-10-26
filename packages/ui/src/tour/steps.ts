// Langkah tur halaman tanpa ketergantungan DOM atau driver.js, agar bisa diuji dan didaftarkan
// tanpa memuat pustaka tur.

export type TourSide = 'top' | 'right' | 'bottom' | 'left';

export interface TourStep<A extends string = string> {
  /** Nilai `data-tour` elemen sasaran; tanpa ini langkah tampil di tengah layar. */
  target?: string;
  title: string;
  description: string;
  /**
   * Aksi yang harus dimiliki pengguna agar langkah ini tampil, misalnya tombol tulis yang tidak
   * dimiliki Viewer. Tur bukan otorisasi: server tetap menegakkan aksi itu.
   */
  requires?: A;
  side?: TourSide;
  /** Dijalankan sebelum langkah tampil, misalnya membuka bottom sheet ke tinggi yang sesuai. */
  before?: () => void | Promise<void>;
}

export interface TourDefinition<A extends string = string> {
  /** Nama tur, unik per halaman, misalnya `locations`. */
  id: string;
  /** Naikkan bila isi tur berubah besar agar tur tampil lagi untuk yang sudah melihatnya. */
  version: number;
  steps: readonly TourStep<A>[];
}

/** Kunci status "sudah dilihat", misalnya `locations@1`. */
export function tourKey(tour: Pick<TourDefinition, 'id' | 'version'>): string {
  return `${tour.id}@${tour.version}`;
}

export function tourSelector(target: string): string {
  return `[data-tour="${target}"]`;
}

/**
 * Langkah yang benar-benar ditampilkan: langkah untuk aksi yang tidak dimiliki pengguna dan
 * langkah yang elemennya tidak ada di layar (misalnya tabel kosong) dibuang, agar tur tidak
 * menunjuk tombol yang tidak boleh dipakai atau macet di elemen yang hilang.
 */
export function resolveTourSteps<A extends string>(
  steps: readonly TourStep<A>[],
  { can, isPresent }: { can: (action: A) => boolean; isPresent: (target: string) => boolean },
): TourStep<A>[] {
  return steps.filter(
    (step) =>
      (step.requires === undefined || can(step.requires)) &&
      (step.target === undefined || isPresent(step.target)),
  );
}
