import { COMMON_FACILITY_TYPES, category, templateField, type VenueTemplate } from './template';

export const office: VenueTemplate = {
  venueType: 'office',
  label: 'Perkantoran',
  description: 'Ruang rapat, kantor divisi, resepsionis, dan pantry.',
  locationTypes: [
    {
      name: 'Ruang Rapat',
      icon: 'meeting-room',
      color: '#3d5a80',
      fields: [
        templateField('Kapasitas', 'number', { isRequired: true }),
        templateField('Konferensi video', 'select', { options: ['Ada', 'Tidak ada'] }),
      ],
      categories: [category('Ruang Rapat Kecil'), category('Ruang Rapat Besar')],
    },
    {
      name: 'Kantor Divisi',
      icon: 'office',
      color: '#2f6f4f',
      fields: [
        templateField('Ekstensi telepon', 'text', { isSearchable: true }),
        templateField('Penanggung jawab', 'text', { isVisible: false }),
      ],
      categories: [
        category('Keuangan', 'finance'),
        category('SDM', 'human-resources'),
        category('TI', 'server-room'),
        category('Operasional'),
      ],
    },
    {
      name: 'Layanan',
      icon: 'information',
      color: '#6a4c93',
      fields: [templateField('Jam layanan', 'opening_hours')],
      categories: [
        category('Resepsionis', 'reception'),
        category('Pantry', 'pantry'),
        category('Ruang Laktasi', 'nursing-room'),
      ],
    },
  ],
  facilityTypes: [...COMMON_FACILITY_TYPES, { name: 'Parkir', icon: 'parking', isSafety: false }],
  aliases: [
    {
      keyword: 'meeting',
      kind: 'category',
      locationType: 'Ruang Rapat',
      name: 'Ruang Rapat Kecil',
    },
    { keyword: 'lobi', kind: 'category', locationType: 'Layanan', name: 'Resepsionis' },
  ],
};
