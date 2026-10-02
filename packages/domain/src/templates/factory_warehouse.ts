import { COMMON_FACILITY_TYPES, category, templateField, type VenueTemplate } from './template';

export const factoryWarehouse: VenueTemplate = {
  venueType: 'factory_warehouse',
  label: 'Pabrik atau gudang',
  description: 'Area produksi, gudang, dock bongkar muat, dan kantor.',
  locationTypes: [
    {
      name: 'Area Produksi',
      icon: null,
      color: '#3d5a80',
      fields: [
        templateField('APD wajib', 'text', { isRequired: true }),
        templateField('Shift', 'select', { options: ['Pagi', 'Siang', 'Malam', 'Non-shift'] }),
      ],
      categories: [
        category('Lini Produksi'),
        category('Quality Control'),
        category('Perawatan Mesin'),
      ],
    },
    {
      name: 'Gudang',
      icon: null,
      color: '#7a5c3d',
      fields: [
        templateField('Jenis barang', 'text', { isSearchable: true }),
        templateField('Kapasitas (palet)', 'number', { isVisible: false }),
      ],
      categories: [category('Bahan Baku'), category('Barang Jadi'), category('Suku Cadang')],
    },
    {
      name: 'Dock',
      icon: null,
      color: '#b26a00',
      fields: [templateField('Nomor dock', 'text', { isRequired: true, isSearchable: true })],
      categories: [category('Bongkar'), category('Muat')],
    },
    {
      name: 'Kantor',
      icon: 'information',
      color: '#2f6f4f',
      fields: [templateField('Ekstensi telepon', 'text')],
      categories: [category('Administrasi'), category('K3'), category('Pos Keamanan')],
    },
  ],
  facilityTypes: [...COMMON_FACILITY_TYPES, { name: 'Parkir', icon: 'parking', isSafety: false }],
  aliases: [
    { keyword: 'loading', kind: 'category', locationType: 'Dock', name: 'Muat' },
    { keyword: 'satpam', kind: 'category', locationType: 'Kantor', name: 'Pos Keamanan' },
  ],
};
