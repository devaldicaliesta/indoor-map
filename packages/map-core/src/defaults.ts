import type { FeatureKind } from '@indoor/domain';

/**
 * Warna dan tinggi default peta (05-desain-ui.md "Warna peta"); dapat ditimpa per venue
 * lewat display_settings (FR-VIS-01, FR-VIS-03). Nilai hex di sini adalah data style
 * MapLibre, bukan warna komponen UI.
 */
export const MAP_BACKGROUND = '#f2f3ef';

export const DEFAULT_FILL: Partial<Record<FeatureKind, string>> = {
  unit: '#ffffff',
  corridor: '#eceeea',
  non_walkable: '#daddd7',
  outdoor_area: '#e6e3da',
  elevator: '#e3e7ee',
  escalator: '#e3e7ee',
  stairs: '#e3e7ee',
};

export const DEFAULT_OUTLINE: Partial<Record<FeatureKind, string>> = {
  unit: '#bfc5cc',
  elevator: '#8a929b',
  escalator: '#8a929b',
  stairs: '#8a929b',
  wall: '#8a929b',
};

export const VACANT_UNIT = { fill: '#f7f7f4', outline: '#d5d9de' } as const;
export const POINT_COLOR = '#545b64';

/** Tinggi 3D default dalam meter; jenis yang tidak disebut datar (0). */
export const DEFAULT_HEIGHTS: Partial<Record<FeatureKind, number>> = {
  unit: 4,
  wall: 5,
  elevator: 4,
  escalator: 4,
  stairs: 4,
};

/** Pitch kamera 3D (05-desain-ui.md: miring ±50°). */
export const PITCH_3D = 50;

/** Warna alat sunting di peta: token --signal (sorotan) dan --ink (garis). */
export const EDIT_COLORS = { signal: '#ffc20e', ink: '#111418', paper: '#ffffff' } as const;
