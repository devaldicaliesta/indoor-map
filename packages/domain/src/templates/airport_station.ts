import { COMMON_FACILITY_TYPES, category, templateField, type VenueTemplate } from './template';

export const airportStation: VenueTemplate = {
  venueType: 'airport_station',
  label: 'Bandara atau stasiun',
  description: 'Gerbang, konter check-in, lounge, toko, dan layanan penumpang.',
  locationTypes: [
    {
      name: 'Gerbang',
      icon: null,
      color: '#3d5a80',
      fields: [templateField('Nomor gerbang', 'text', { isRequired: true, isSearchable: true })],
      categories: [category('Keberangkatan'), category('Kedatangan')],
    },
    {
      name: 'Konter',
      icon: 'information',
      color: '#2f6f4f',
      fields: [
        templateField('Operator', 'text', { isSearchable: true }),
        templateField('Jam buka', 'opening_hours'),
      ],
      categories: [category('Check-in'), category('Tiket'), category('Bagasi')],
    },
    {
      name: 'Lounge',
      icon: null,
      color: '#6a4c93',
      fields: [templateField('Jam buka', 'opening_hours'), templateField('Akses', 'text')],
      categories: [category('Lounge')],
    },
    {
      name: 'Toko dan Kuliner',
      icon: null,
      color: '#b26a00',
      fields: [templateField('Jam buka', 'opening_hours'), templateField('Telepon', 'link')],
      categories: [category('Kuliner'), category('Oleh-oleh'), category('Kebutuhan Perjalanan')],
    },
  ],
  facilityTypes: [
    ...COMMON_FACILITY_TYPES,
    { name: 'ATM', icon: 'atm', isSafety: false },
    { name: 'Parkir', icon: 'parking', isSafety: false },
  ],
  aliases: [
    { keyword: 'gate', kind: 'category', locationType: 'Gerbang', name: 'Keberangkatan' },
    { keyword: 'makan', kind: 'category', locationType: 'Toko dan Kuliner', name: 'Kuliner' },
  ],
};
