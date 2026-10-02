import { z } from 'zod';
import { type CustomField, FIELD_TYPES, type FieldType, fieldKeyFromLabel } from '../custom-fields';
import { PICTOGRAM_KEYS, type PictogramKey } from '../facility';
import { VENUE_TYPES, type VenueType } from '../venue';

/**
 * Template isi awal venue per jenis industri. Template hanya ada di kode: venue mendapat
 * salinannya saat dibuat (`apply_template`), sehingga perubahan di venue tidak memengaruhi
 * template atau venue lain.
 */
export interface TemplateCategory {
  name: string;
  icon: PictogramKey | null;
}

export interface TemplateLocationType {
  name: string;
  icon: PictogramKey | null;
  color: string | null;
  fields: CustomField[];
  categories: TemplateCategory[];
}

export interface TemplateFacilityType {
  name: string;
  icon: PictogramKey | null;
  isSafety: boolean;
}

/** Kata pencarian awal yang mengarah ke kategori (tipe + nama) atau jenis fasilitas. */
export type TemplateAlias =
  | { keyword: string; kind: 'category'; locationType: string; name: string }
  | { keyword: string; kind: 'facility_type'; name: string };

export interface VenueTemplate {
  venueType: VenueType;
  label: string;
  description: string;
  locationTypes: TemplateLocationType[];
  facilityTypes: TemplateFacilityType[];
  aliases: TemplateAlias[];
}

/** Field template; kunci dari label dengan aturan yang sama dengan field buatan Admin. */
export function templateField(
  label: string,
  type: FieldType,
  options: Partial<Omit<CustomField, 'key' | 'label' | 'type'>> = {},
): CustomField {
  return {
    key: fieldKeyFromLabel(label, []),
    label,
    type,
    options: options.options ?? [],
    isRequired: options.isRequired ?? false,
    isVisible: options.isVisible ?? true,
    isSearchable: options.isSearchable ?? false,
  };
}

export const category = (name: string, icon: PictogramKey | null = null): TemplateCategory => ({
  name,
  icon,
});

/** Fasilitas umum hampir semua gedung, termasuk fasilitas keselamatan. */
export const COMMON_FACILITY_TYPES: TemplateFacilityType[] = [
  { name: 'Toilet Pria', icon: 'toilet-male', isSafety: false },
  { name: 'Toilet Wanita', icon: 'toilet-female', isSafety: false },
  { name: 'Toilet Difabel', icon: 'toilet-accessible', isSafety: false },
  { name: 'Musala', icon: 'prayer-room', isSafety: false },
  { name: 'Informasi', icon: 'information', isSafety: false },
  { name: 'P3K', icon: 'first-aid', isSafety: false },
  { name: 'APAR', icon: 'fire-extinguisher', isSafety: true },
  { name: 'Titik Kumpul', icon: 'assembly-point', isSafety: true },
  { name: 'Pintu Darurat', icon: 'emergency-exit', isSafety: true },
];

const pictogram = z.enum(PICTOGRAM_KEYS).nullable();
const color = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/)
  .nullable();
const name = z.string().trim().min(1).max(60);

/** Skema isi template; dipakai test dan sebelum template dikirim ke `apply_template`. */
export const VenueTemplateSchema = z.object({
  venueType: z.enum(VENUE_TYPES),
  label: name,
  description: z.string().min(1),
  locationTypes: z
    .array(
      z.object({
        name,
        icon: pictogram,
        color,
        fields: z.array(
          z.object({
            key: z.string().regex(/^[a-z][a-z0-9_]*$/),
            label: name,
            type: z.enum(FIELD_TYPES),
            options: z.array(z.string().min(1)),
            isRequired: z.boolean(),
            isVisible: z.boolean(),
            isSearchable: z.boolean(),
          }),
        ),
        categories: z.array(z.object({ name, icon: pictogram })),
      }),
    )
    .min(1),
  facilityTypes: z.array(z.object({ name, icon: pictogram, isSafety: z.boolean() })),
  aliases: z.array(
    z.discriminatedUnion('kind', [
      z.object({ keyword: name, kind: z.literal('category'), locationType: name, name }),
      z.object({ keyword: name, kind: z.literal('facility_type'), name }),
    ]),
  ),
});

/** Ringkasan isi untuk pratinjau di wizard. */
export function templateSummary(template: VenueTemplate) {
  return {
    locationTypes: template.locationTypes.map((t) => ({
      name: t.name,
      fields: t.fields.map((f) => f.label),
      categories: t.categories.map((c) => c.name),
    })),
    facilityTypes: template.facilityTypes.map((f) => f.name),
    aliases: template.aliases.length,
  };
}
