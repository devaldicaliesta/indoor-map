import { COMMON_FACILITY_TYPES, category, templateField, type VenueTemplate } from './template';

export const airportStation: VenueTemplate = {
  venueType: 'airport_station',
  label: 'Bandara atau stasiun',
  description: 'Gerbang, konter check-in, lounge, toko, dan layanan penumpang.',
  locationTypes: [
    {
      name: 'Gerbang',
      icon: 'departures',
      color: '#3d5a80',
      fields: [templateField('Nomor gerbang', 'text', { isRequired: true, isSearchable: true })],
      categories: [category('Keberangkatan', 'departures'), category('Kedatangan', 'arrivals')],
    },
    {
      name: 'Konter',
      icon: 'information',
      color: '#2f6f4f',
      fields: [
        templateField('Operator', 'text', { isSearchable: true }),
        templateField('Jam buka', 'opening_hours'),
      ],
      categories: [
        category('Check-in', 'departures'),
        category('Tiket', 'ticket-office'),
        category('Bagasi', 'baggage-claim'),
      ],
    },
    {
      name: 'Lounge',
      icon: 'waiting-area',
      color: '#6a4c93',
      fields: [templateField('Jam buka', 'opening_hours'), templateField('Akses', 'text')],
      categories: [category('Lounge')],
    },
    {
      name: 'Toko dan Kuliner',
      icon: 'shopping',
      color: '#b26a00',
      fields: [templateField('Jam buka', 'opening_hours'), templateField('Telepon', 'link')],
      categories: [
        category('Kuliner', 'restaurant'),
        category('Oleh-oleh', 'gifts'),
        category('Kebutuhan Perjalanan'),
      ],
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
