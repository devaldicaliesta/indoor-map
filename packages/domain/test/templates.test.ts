import { describe, expect, it } from 'vitest';
import { checkCustomField, VENUE_TEMPLATES, VENUE_TYPES, VenueTemplateSchema } from '../src';

describe('template venue', () => {
  it('ada untuk setiap tipe venue dan lolos skemanya', () => {
    expect(Object.keys(VENUE_TEMPLATES).sort()).toEqual([...VENUE_TYPES].sort());
    for (const [type, template] of Object.entries(VENUE_TEMPLATES)) {
      expect(template.venueType).toBe(type);
      expect(VenueTemplateSchema.safeParse(template).success).toBe(true);
    }
  });

  it('nama unik, field sah, dan alias merujuk kategori atau fasilitas yang ada', () => {
    for (const template of Object.values(VENUE_TEMPLATES)) {
      const typeNames = template.locationTypes.map((t) => t.name);
      expect(new Set(typeNames).size).toBe(typeNames.length);
      for (const type of template.locationTypes) {
        type.fields.forEach((field, i) => {
          expect(checkCustomField(field, type.fields.slice(0, i))).toEqual([]);
          // Field tersembunyi tidak boleh dapat dicari (indeks pencarian publik).
          expect(field.isSearchable && !field.isVisible).toBe(false);
        });
        const categories = type.categories.map((c) => c.name);
        expect(new Set(categories).size).toBe(categories.length);
      }
      const facilities = template.facilityTypes.map((f) => f.name);
      expect(new Set(facilities).size).toBe(facilities.length);
      for (const alias of template.aliases) {
        if (alias.kind === 'facility_type') expect(facilities).toContain(alias.name);
        else {
          const type = template.locationTypes.find((t) => t.name === alias.locationType);
          expect(type?.categories.map((c) => c.name)).toContain(alias.name);
        }
      }
    }
  });

  it('rumah sakit berisi Poli, Lab, Apotek, IGD, dan Kamar Rawat beserta field dan kategori', () => {
    const types = VENUE_TEMPLATES.hospital.locationTypes;
    expect(types.map((t) => t.name)).toEqual(['Poli', 'Lab', 'Apotek', 'IGD', 'Kamar Rawat']);
    for (const type of types) {
      expect(type.fields.length).toBeGreaterThan(0);
      expect(type.categories.length).toBeGreaterThan(0);
    }
    expect(VENUE_TEMPLATES.hospital.facilityTypes.some((f) => f.isSafety)).toBe(true);
  });
});
