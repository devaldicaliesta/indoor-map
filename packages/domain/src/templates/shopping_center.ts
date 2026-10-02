import { COMMON_FACILITY_TYPES, category, templateField, type VenueTemplate } from './template';

export const shoppingCenter: VenueTemplate = {
  venueType: 'shopping_center',
  label: 'Pusat perbelanjaan',
  description: 'Toko dan tenant per kategori, kuliner, hiburan, dan layanan pengunjung.',
  locationTypes: [
    {
      name: 'Tenant',
      icon: null,
      color: '#b26a00',
      fields: [
        templateField('Jam buka', 'opening_hours'),
        templateField('Telepon', 'link'),
        templateField('Situs web', 'link'),
        templateField('Merek', 'text', { isSearchable: true }),
      ],
      categories: [
        category('Fashion'),
        category('Kuliner'),
        category('Elektronik'),
        category('Kesehatan dan Kecantikan'),
        category('Supermarket'),
        category('Hiburan'),
      ],
    },
    {
      name: 'Layanan Pengunjung',
      icon: 'information',
      color: '#2f6f4f',
      fields: [templateField('Jam layanan', 'opening_hours')],
      categories: [category('Customer Service'), category('Ruang Laktasi'), category('Penitipan')],
    },
  ],
  facilityTypes: [
    ...COMMON_FACILITY_TYPES,
    { name: 'ATM', icon: 'atm', isSafety: false },
    { name: 'Parkir', icon: 'parking', isSafety: false },
  ],
  aliases: [
    { keyword: 'makan', kind: 'category', locationType: 'Tenant', name: 'Kuliner' },
    { keyword: 'baju', kind: 'category', locationType: 'Tenant', name: 'Fashion' },
    { keyword: 'bioskop', kind: 'category', locationType: 'Tenant', name: 'Hiburan' },
  ],
};
