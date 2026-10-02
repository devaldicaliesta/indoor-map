import {
  type Branding,
  type BrandingInput,
  type BrandingProblem,
  brandDisplayName,
  checkBranding,
  MAX_DISPLAY_NAME_LENGTH,
  parseBranding,
} from '@indoor/domain';
import { primaryTextCheck, routeLineCheck } from '@indoor/ui';

/** Isian formulir Pengaturan → Branding; kosong = bawaan (nama venue, warna aplikasi). */
export type BrandingFormValues = BrandingInput;
export type BrandingFormErrors = Partial<Record<keyof BrandingFormValues, string>>;

const MESSAGES: Record<keyof Branding, Record<BrandingProblem, string>> = {
  displayName: {
    too_long: `Nama tampilan maksimal ${MAX_DISPLAY_NAME_LENGTH} karakter.`,
    invalid_color: '',
  },
  primaryColor: {
    too_long: '',
    invalid_color: 'Warna harus berformat #rrggbb, misalnya #0b1f4d.',
  },
  routeColor: {
    too_long: '',
    invalid_color: 'Warna harus berformat #rrggbb, misalnya #0b1f4d.',
  },
};

export function toBrandingFormValues(branding: Branding): BrandingFormValues {
  return {
    displayName: branding.displayName ?? '',
    primaryColor: branding.primaryColor ?? '',
    routeColor: branding.routeColor ?? '',
  };
}

export function validateBranding(
  values: BrandingFormValues,
): { ok: true; branding: Branding } | { ok: false; errors: BrandingFormErrors } {
  const checked = checkBranding(values);
  if (checked.ok) return { ok: true, branding: checked.value };
  const errors: BrandingFormErrors = {};
  for (const [key, problem] of Object.entries(checked.problems) as [
    keyof Branding,
    BrandingProblem,
  ][]) {
    errors[key] = MESSAGES[key][problem];
  }
  return { ok: false, errors };
}

/** Pratinjau langsung: isian yang belum sah diabaikan sampai benar. */
export function livePreview(
  values: BrandingFormValues,
  venueName: string,
): { name: string } & Pick<Branding, 'primaryColor' | 'routeColor'> {
  const branding = parseBranding(values);
  return {
    name: brandDisplayName(venueName, branding),
    primaryColor: branding.primaryColor,
    routeColor: branding.routeColor,
  };
}

export interface ColorNote {
  tone: 'ok' | 'warn';
  text: string;
}

const ratio = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Keterangan kontras di bawah isian warna; `null` bila warna bawaan dipakai. */
export function colorNotes(colors: Pick<Branding, 'primaryColor' | 'routeColor'>): {
  primary: ColorNote | null;
  route: ColorNote | null;
} {
  let primary: ColorNote | null = null;
  if (colors.primaryColor) {
    const check = primaryTextCheck(colors.primaryColor);
    const text = check.text === 'ink' ? 'warna gelap' : 'putih';
    primary = check.passes
      ? {
          tone: 'ok',
          text: `Teks di atas warna utama memakai ${text} (kontras ${ratio.format(check.ratio)}:1).`,
        }
      : {
          tone: 'warn',
          text: `Tidak ada warna teks yang cukup kontras di atas warna ini; dipakai ${text} (kontras ${ratio.format(check.ratio)}:1, minimal 4,5:1). Pilih warna yang lebih terang atau lebih gelap.`,
        };
  }
  let route: ColorNote | null = null;
  if (colors.routeColor) {
    const check = routeLineCheck(colors.routeColor);
    if (!check.passes) {
      route = {
        tone: 'warn',
        text: `Garis rute sulit terlihat di atas latar peta (kontras ${ratio.format(check.ratio)}:1, disarankan minimal 3:1).`,
      };
    }
  }
  return { primary, route };
}
