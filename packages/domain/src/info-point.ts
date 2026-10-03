import type { DisplayMode } from './display-settings';
import type { Position } from './geometry';
import type { VenueId } from './ids';
import type { LanguageCode } from './language';

/** Info Point (tabel `info_points`): posisi layar sentuh dan pengaturan perangkatnya. */
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
  defaultMode: DisplayMode;
  /** Paksa 2D untuk perangkat lemah, walau paket membuka 3D. */
  force2d: boolean;
  defaultLanguage: LanguageCode;
  /** Detik tanpa sentuhan sebelum layar kembali ke tampilan awal. */
  idleSeconds: number;
}

export type InfoPointInput = Omit<InfoPoint, 'id'>;

/** Bagian Info Point yang dipakai rute dan pilihan tempat (tanpa pengaturan perangkat). */
export type InfoPointPlace = Pick<
  InfoPoint,
  'id' | 'code' | 'name' | 'floorId' | 'coordinates' | 'headingDeg' | 'nodeId'
>;

export const INFO_POINT_IDLE_RANGE = { min: 15, max: 600 } as const;
const CODE = /^[A-Za-z0-9][A-Za-z0-9-]{0,31}$/;

export type InfoPointProblem = 'code' | 'name' | 'idle';

/** Masalah isian Info Point; kosong bila boleh disimpan. Posisi diperiksa saat menempel ke jalur. */
export function checkInfoPointInput(
  input: Pick<InfoPointInput, 'code' | 'name' | 'idleSeconds'>,
): InfoPointProblem[] {
  const problems: InfoPointProblem[] = [];
  if (!CODE.test(input.code.trim())) problems.push('code');
  if (!input.name.trim()) problems.push('name');
  const { min, max } = INFO_POINT_IDLE_RANGE;
  if (!Number.isInteger(input.idleSeconds) || input.idleSeconds < min || input.idleSeconds > max) {
    problems.push('idle');
  }
  return problems;
}

/**
 * URL layar Info Point. Kode unik per venue, jadi venue ikut di URL agar Visitor (mode Info
 * Point, T-408) memuat snapshot yang benar.
 */
export function infoPointUrl(publicUrl: string, venueId: VenueId, code: string): string {
  const base = publicUrl.replace(/\/+$/, '');
  return `${base}/ip/${encodeURIComponent(code)}?venue=${encodeURIComponent(venueId)}`;
}
