import type { Position } from './geometry';

/** QR titik asal (tabel `origin_points`); halaman pengelolaannya dibuat di T-212. */
export interface OriginPoint {
  id: string;
  floorId: string;
  name: string;
  coordinates: Position;
  /** Arah hadap saat memindai, derajat dari utara searah jarum jam. */
  headingDeg: number;
  /** Node jalur tempat titik asal menempel; `null` bila belum menempel. */
  nodeId: string | null;
  /** Kode publik di URL QR (`public_code`). */
  code: string;
}
