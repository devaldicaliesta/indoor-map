import { COMMON_FACILITY_TYPES, category, templateField, type VenueTemplate } from './template';

export const factoryWarehouse: VenueTemplate = {
  venueType: 'factory_warehouse',
  label: 'Pabrik atau gudang',
  description: 'Area produksi, gudang, dock bongkar muat, dan kantor.',
  locationTypes: [
    {
      name: 'Area Produksi',
      icon: 'production-area',
      color: '#3d5a80',
      fields: [
        templateField('APD wajib', 'text', { isRequired: true }),
        templateField('Shift', 'select', { options: ['Pagi', 'Siang', 'Malam', 'Non-shift'] }),
      ],
      categories: [
        category('Lini Produksi', 'production-area'),
        category('Quality Control'),
        category('Perawatan Mesin', 'maintenance'),
      ],
    },
    {
      name: 'Gudang',
      icon: 'warehouse',
      color: '#7a5c3d',
      fields: [
        templateField('Jenis barang', 'text', { isSearchable: true }),
        templateField('Kapasitas (palet)', 'number', { isVisible: false }),
      ],
      categories: [category('Bahan Baku'), category('Barang Jadi'), category('Suku Cadang')],
    },
    {
      name: 'Dock',
      icon: 'loading-dock',
      color: '#b26a00',
      fields: [templateField('Nomor dock', 'text', { isRequired: true, isSearchable: true })],
      categories: [category('Bongkar'), category('Muat')],
    },
    {
      name: 'Kantor',
      icon: 'information',
      color: '#2f6f4f',
      fields: [templateField('Ekstensi telepon', 'text')],
      categories: [
        category('Administrasi', 'administration'),
        category('K3', 'ppe'),
        category('Pos Keamanan', 'security-post'),
      ],
    },
  ],
  facilityTypes: [...COMMON_FACILITY_TYPES, { name: 'Parkir', icon: 'parking', isSafety: false }],
  aliases: [
    { keyword: 'loading', kind: 'category', locationType: 'Dock', name: 'Muat' },
    { keyword: 'satpam', kind: 'category', locationType: 'Kantor', name: 'Pos Keamanan' },
  ],
};
