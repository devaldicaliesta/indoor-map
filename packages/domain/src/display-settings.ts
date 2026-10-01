import { z } from 'zod';
import type { FeatureKind } from './feature';
import type { VenueId } from './ids';

/** Mode awal peta venue. Sama dengan enum `display_mode` di migrasi 0001. */
export const DISPLAY_MODES = ['2d', '3d'] as const;
export type DisplayMode = (typeof DISPLAY_MODES)[number];

/** Jenis fitur yang punya tinggi 3D: semua poligon dan dinding. */
export const HEIGHT_KINDS = [
  'unit',
  'corridor',
  'wall',
  'elevator',
  'escalator',
  'stairs',
  'non_walkable',
  'outdoor_area',
] as const satisfies readonly FeatureKind[];
export type HeightKind = (typeof HEIGHT_KINDS)[number];

/** Jenis fitur yang warnanya bisa diatur per venue. */
export const COLOR_KINDS = [
  'unit',
  'corridor',
  'wall',
  'elevator',
  'escalator',
  'stairs',
  'non_walkable',
  'outdoor_area',
  'door',
  'exit',
  'facility',
] as const satisfies readonly FeatureKind[];
export type ColorKind = (typeof COLOR_KINDS)[number];

/** Batas tinggi dalam meter; kolom `features.height_m numeric(6, 2)`. */
export const MAX_HEIGHT_M = 100;

export const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
export const HeightSchema = z.number().min(0).max(MAX_HEIGHT_M);

/** Kamera awal Visitor: pusat WGS84, zoom, kemiringan, dan rotasi. */
export const CameraViewSchema = z.object({
  center: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
  zoom: z.number().min(0).max(24),
  pitch: z.number().min(0).max(60),
  bearing: z.number().min(-180).max(180),
});
export type CameraView = z.infer<typeof CameraViewSchema>;

export interface DisplaySettings {
  venueId: VenueId;
  defaultMode: DisplayMode;
  /** Tinggi default per jenis (m); jenis yang tidak disebut memakai default aplikasi. */
  heights: Partial<Record<HeightKind, number>>;
  /** Warna per jenis `#rrggbb`; jenis yang tidak disebut memakai warna default. */
  colors: Partial<Record<ColorKind, string>>;
  camera: CameraView | null;
}

export type DisplaySettingsPatch = Partial<Omit<DisplaySettings, 'venueId'>>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Membaca kolom jsonb `display_settings.heights` dengan aman: entri yang bukan jenis
 * bertinggi atau bukan angka 0–100 dibuang, bukan membuat seluruh pengaturan gagal.
 */
export function parseHeights(value: unknown): DisplaySettings['heights'] {
  if (!isRecord(value)) return {};
  const heights: DisplaySettings['heights'] = {};
  for (const kind of HEIGHT_KINDS) {
    const parsed = HeightSchema.safeParse(value[kind]);
    if (parsed.success) heights[kind] = parsed.data;
  }
  return heights;
}

export function parseColors(value: unknown): DisplaySettings['colors'] {
  if (!isRecord(value)) return {};
  const colors: DisplaySettings['colors'] = {};
  for (const kind of COLOR_KINDS) {
    const parsed = HexColorSchema.safeParse(value[kind]);
    if (parsed.success) colors[kind] = parsed.data.toLowerCase();
  }
  return colors;
}

export function parseCamera(value: unknown): CameraView | null {
  const parsed = CameraViewSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export type HeightInputProblem = 'not_number' | 'negative' | 'too_high';

/**
 * Isian tinggi dari formulir (koma desimal diterima). String kosong = pakai default
 * (`null`); selain itu angka dibulatkan 2 desimal sesuai kolom database.
 */
export function parseHeightInput(
  input: string,
): { ok: true; value: number | null } | { ok: false; problem: HeightInputProblem } {
  const text = input.trim().replace(',', '.');
  if (!text) return { ok: true, value: null };
  const value = Number(text);
  if (!Number.isFinite(value)) return { ok: false, problem: 'not_number' };
  if (value < 0) return { ok: false, problem: 'negative' };
  if (value > MAX_HEIGHT_M) return { ok: false, problem: 'too_high' };
  return { ok: true, value: Math.round(value * 100) / 100 };
}

/** Kamera dari peta dibulatkan agar tersimpan rapi dan lolos batas skema. */
export function toCameraView(camera: {
  center: readonly [number, number];
  zoom: number;
  pitch: number;
  bearing: number;
}): CameraView {
  const round = (value: number, digits: number) => Number(value.toFixed(digits));
  return CameraViewSchema.parse({
    center: [round(camera.center[0], 7), round(camera.center[1], 7)],
    zoom: round(Math.min(24, Math.max(0, camera.zoom)), 2),
    pitch: round(Math.min(60, Math.max(0, camera.pitch)), 1),
    bearing: round(((((camera.bearing + 180) % 360) + 360) % 360) - 180, 1),
  });
}
