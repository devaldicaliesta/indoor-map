import { COMMON_FACILITY_TYPES, category, templateField, type VenueTemplate } from './template';

const hours = templateField('Jam layanan', 'opening_hours');

export const hospital: VenueTemplate = {
  venueType: 'hospital',
  label: 'Rumah sakit',
  description: 'Poli, laboratorium, apotek, IGD, dan kamar rawat inap.',
  locationTypes: [
    {
      name: 'Poli',
      icon: 'first-aid',
      color: '#2f6f4f',
      fields: [
        templateField('Jadwal praktik', 'opening_hours', { isRequired: true }),
        templateField('Dokter', 'text', { isSearchable: true }),
        templateField('Ekstensi telepon', 'text'),
        templateField('Layanan', 'select', { options: ['Umum', 'BPJS', 'Asuransi'] }),
      ],
      categories: [
        category('Poli Umum'),
        category('Poli Anak'),
        category('Poli Gigi'),
        category('Poli Mata'),
        category('Poli Penyakit Dalam'),
        category('Poli Kandungan'),
      ],
    },
    {
      name: 'Lab',
      icon: null,
      color: '#3d5a80',
      fields: [hours, templateField('Perlu janji', 'select', { options: ['Ya', 'Tidak'] })],
      categories: [category('Laboratorium Klinik'), category('Radiologi')],
    },
    {
      name: 'Apotek',
      icon: null,
      color: '#6a4c93',
      fields: [hours],
      categories: [category('Apotek Rawat Jalan'), category('Apotek Rawat Inap')],
    },
    {
      name: 'IGD',
      icon: 'first-aid',
      color: '#c8321e',
      fields: [
        templateField('Telepon darurat', 'link'),
        templateField('Buka 24 jam', 'select', { options: ['Ya', 'Tidak'] }),
      ],
      categories: [category('IGD Umum'), category('IGD Anak')],
    },
    {
      name: 'Kamar Rawat',
      icon: null,
      color: '#7a5c3d',
      fields: [
        templateField('Kelas', 'select', { options: ['VIP', 'Kelas 1', 'Kelas 2', 'Kelas 3'] }),
        templateField('Jumlah tempat tidur', 'number', { isVisible: false }),
        templateField('Jam besuk', 'opening_hours'),
      ],
      categories: [category('Rawat Inap Umum'), category('ICU'), category('Perinatologi')],
    },
  ],
  facilityTypes: [
    ...COMMON_FACILITY_TYPES,
    { name: 'ATM', icon: 'atm', isSafety: false },
    { name: 'Parkir', icon: 'parking', isSafety: false },
  ],
  aliases: [
    { keyword: 'rontgen', kind: 'category', locationType: 'Lab', name: 'Radiologi' },
    { keyword: 'obat', kind: 'category', locationType: 'Apotek', name: 'Apotek Rawat Jalan' },
    { keyword: 'UGD', kind: 'category', locationType: 'IGD', name: 'IGD Umum' },
    { keyword: 'dokter gigi', kind: 'category', locationType: 'Poli', name: 'Poli Gigi' },
    { keyword: 'WC', kind: 'facility_type', name: 'Toilet Pria' },
  ],
};
