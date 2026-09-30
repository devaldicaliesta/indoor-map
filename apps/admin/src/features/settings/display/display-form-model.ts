import {
  COLOR_KINDS,
  type ColorKind,
  type DisplayMode,
  type DisplaySettings,
  type DisplaySettingsPatch,
  HEIGHT_KINDS,
  type HeightInputProblem,
  type HeightKind,
  HexColorSchema,
  parseHeightInput,
} from '@indoor/domain';

/** Isian formulir Pengaturan → Tampilan; tinggi berupa teks agar koma desimal diterima. */
export interface DisplayFormValues {
  defaultMode: DisplayMode;
  heights: Record<HeightKind, string>;
  /** Kosong = warna bawaan aplikasi. */
  colors: Record<ColorKind, string>;
}

export type DisplayFormErrors = Partial<Record<HeightKind | ColorKind, string>>;

const number = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2, useGrouping: false });

export function toFormValues(settings: DisplaySettings): DisplayFormValues {
  const heights = Object.fromEntries(
    HEIGHT_KINDS.map((kind) => {
      const value = settings.heights[kind];
      return [kind, value === undefined ? '' : number.format(value)];
    }),
  ) as Record<HeightKind, string>;
  const colors = Object.fromEntries(
    COLOR_KINDS.map((kind) => [kind, settings.colors[kind] ?? '']),
  ) as Record<ColorKind, string>;
  return { defaultMode: settings.defaultMode, heights, colors };
}

const HEIGHT_MESSAGES: Record<HeightInputProblem, string> = {
  not_number: 'Isi angka dalam meter, misalnya 4 atau 3,5.',
  negative: 'Tinggi tidak boleh negatif.',
  too_high: 'Tinggi maksimal 100 m.',
};

export function validate(values: DisplayFormValues): DisplayFormErrors {
  const errors: DisplayFormErrors = {};
  for (const kind of HEIGHT_KINDS) {
    const parsed = parseHeightInput(values.heights[kind]);
    if (!parsed.ok) errors[kind] = HEIGHT_MESSAGES[parsed.problem];
  }
  for (const kind of COLOR_KINDS) {
    const color = values.colors[kind].trim();
    if (color && !HexColorSchema.safeParse(color).success) {
      errors[kind] = 'Warna harus berformat #rrggbb, misalnya #ffe9a8.';
    }
  }
  return errors;
}

/** Tinggi/warna kosong tidak disimpan sehingga memakai bawaan aplikasi. Panggil setelah `validate`. */
export function toPatch(values: DisplayFormValues): Required<Omit<DisplaySettingsPatch, 'camera'>> {
  const heights: DisplaySettings['heights'] = {};
  for (const kind of HEIGHT_KINDS) {
    const parsed = parseHeightInput(values.heights[kind]);
    if (parsed.ok && parsed.value !== null) heights[kind] = parsed.value;
  }
  const colors: DisplaySettings['colors'] = {};
  for (const kind of COLOR_KINDS) {
    const color = values.colors[kind].trim().toLowerCase();
    if (HexColorSchema.safeParse(color).success) colors[kind] = color;
  }
  return { defaultMode: values.defaultMode, heights, colors };
}
