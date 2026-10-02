import { COMMON_FACILITY_TYPES, type VenueTemplate } from './template';

export const custom: VenueTemplate = {
  venueType: 'custom',
  label: 'Lainnya',
  description: 'Satu tipe lokasi umum dan fasilitas dasar; atur sendiri tipe dan field-nya.',
  locationTypes: [{ name: 'Lokasi', icon: null, color: null, fields: [], categories: [] }],
  facilityTypes: COMMON_FACILITY_TYPES,
  aliases: [],
};
