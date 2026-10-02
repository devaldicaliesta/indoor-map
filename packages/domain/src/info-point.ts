import type { Position } from './geometry';

/** Info Point (tabel `info_points`): posisi layar sentuh; pengaturan perangkatnya di T-407. */
export interface InfoPoint {
  id: string;
  code: string;
  name: string;
  floorId: string;
  coordinates: Position;
  /** Arah hadap layar, derajat dari utara searah jarum jam. */
  headingDeg: number;
  /** Node jalur tempat Info Point menempel; `null` bila belum menempel. */
  nodeId: string | null;
}
