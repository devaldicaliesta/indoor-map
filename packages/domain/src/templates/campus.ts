import { COMMON_FACILITY_TYPES, category, templateField, type VenueTemplate } from './template';

export const campus: VenueTemplate = {
  venueType: 'campus',
  label: 'Kampus',
  description: 'Ruang kuliah, laboratorium, kantor fakultas, perpustakaan, dan kantin.',
  locationTypes: [
    {
      name: 'Ruang Kuliah',
      icon: null,
      color: '#3d5a80',
      fields: [
        templateField('Kapasitas', 'number'),
        templateField('Proyektor', 'select', { options: ['Ada', 'Tidak ada'] }),
      ],
      categories: [category('Ruang Kelas'), category('Auditorium')],
    },
    {
      name: 'Laboratorium',
      icon: null,
      color: '#2f6f4f',
      fields: [
        templateField('Kepala laboratorium', 'text', { isSearchable: true }),
        templateField('Jam buka', 'opening_hours'),
      ],
      categories: [category('Lab Komputer'), category('Lab Sains'), category('Studio')],
    },
    {
      name: 'Kantor',
      icon: 'information',
      color: '#6a4c93',
      fields: [
        templateField('Jam layanan', 'opening_hours'),
        templateField('Telepon', 'link'),
        templateField('Situs web', 'link'),
      ],
      categories: [
        category('Rektorat'),
        category('Fakultas'),
        category('Program Studi'),
        category('Layanan Mahasiswa'),
      ],
    },
    {
      name: 'Perpustakaan',
      icon: null,
      color: '#7a5c3d',
      fields: [templateField('Jam buka', 'opening_hours')],
      categories: [category('Perpustakaan Pusat'), category('Ruang Baca')],
    },
    {
      name: 'Kantin',
      icon: null,
      color: '#b26a00',
      fields: [templateField('Jam buka', 'opening_hours')],
      categories: [category('Kantin')],
    },
  ],
  facilityTypes: [
    ...COMMON_FACILITY_TYPES,
    { name: 'ATM', icon: 'atm', isSafety: false },
    { name: 'Parkir', icon: 'parking', isSafety: false },
  ],
  aliases: [
    {
      keyword: 'perpus',
      kind: 'category',
      locationType: 'Perpustakaan',
      name: 'Perpustakaan Pusat',
    },
    { keyword: 'makan', kind: 'category', locationType: 'Kantin', name: 'Kantin' },
    { keyword: 'BAAK', kind: 'category', locationType: 'Kantor', name: 'Layanan Mahasiswa' },
  ],
};
