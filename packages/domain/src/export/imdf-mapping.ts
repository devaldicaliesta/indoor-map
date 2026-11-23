import type { SnapshotFeatureKind, SnapshotOutdoorSubtype } from '../snapshot.ts';
import type { VenueType } from '../venue.ts';
import type {
  ImdfAmenityCategory,
  ImdfOccupantCategory,
  ImdfUnitCategory,
  ImdfVenueCategory,
} from './imdf-categories.ts';

/** Padanan data PanduArah ke kategori IMDF. */
export const VENUE_CATEGORY_BY_TYPE: Record<
  VenueType,
  { venue: ImdfVenueCategory; occupant: ImdfOccupantCategory }
> = {
  hospital: { venue: 'healthcarefacility', occupant: 'healthcare' },
  campus: { venue: 'university', occupant: 'education' },
  office: { venue: 'businesscampus', occupant: 'professionalservices' },
  airport_station: { venue: 'transitstation', occupant: 'travelservices' },
  factory_warehouse: { venue: 'businesscampus', occupant: 'localservices' },
  shopping_center: { venue: 'shoppingcenter', occupant: 'shopping' },
  custom: { venue: 'businesscampus', occupant: 'localservices' },
};

/** Jenis fitur poligon yang menjadi unit IMDF; jenis lain tidak berbentuk ruang. */
export const UNIT_CATEGORY_BY_KIND: Partial<Record<SnapshotFeatureKind, ImdfUnitCategory>> = {
  unit: 'room',
  corridor: 'walkway',
  elevator: 'elevator',
  escalator: 'escalator',
  stairs: 'stairs',
  non_walkable: 'structure',
  outdoor_area: 'unenclosedarea',
};

export const OUTDOOR_UNIT_CATEGORY: Record<SnapshotOutdoorSubtype, ImdfUnitCategory> = {
  road: 'road',
  garden: 'vegetation',
  parking: 'parking',
};

/** Ikon bawaan jenis fasilitas (`builtin:<kunci>`) yang punya padanan kategori amenity. */
export const AMENITY_CATEGORY_BY_ICON: Readonly<Record<string, ImdfAmenityCategory>> = {
  'toilet-male': 'restroom',
  'toilet-female': 'restroom',
  'toilet-accessible': 'restroom',
  bathroom: 'restroom',
  'prayer-room': 'prayerroom',
  chapel: 'prayerroom',
  atm: 'atm',
  'first-aid': 'firstaid',
  information: 'information',
  help: 'information',
  directory: 'information',
  reception: 'information',
  'customer-service': 'guestservices',
  'assembly-point': 'meetingpoint',
  'meeting-point': 'meetingpoint',
  elevator: 'elevator',
  escalator: 'escalator',
  stairs: 'stairs',
  parking: 'parking',
  car: 'parking',
  'motorcycle-parking': 'parking',
  'bicycle-parking': 'parking',
  wifi: 'wifi',
  'phone-charging': 'powerchargingstation',
  'ev-charging': 'powerchargingstation',
  'power-outlet': 'powerchargingstation',
  'lost-and-found': 'lostandfound',
  lockers: 'coinlocker',
  'nursing-room': 'mothersroom',
  'drinking-water': 'drinkingfountain',
  'smoking-area': 'smokingarea',
  shower: 'shower',
  mailbox: 'mailbox',
  'post-office': 'mailbox',
  cashier: 'cashier',
  'ticket-office': 'ticketing',
  telephone: 'phone',
  taxi: 'taxi',
  bus: 'bus',
  shuttle: 'shuttle',
  train: 'transit',
  tram: 'transit',
  immigration: 'immigration',
  'security-check': 'security',
  'security-post': 'security',
  'baggage-claim': 'baggageclaim',
  luggage: 'baggagestorage',
  'umbrella-storage': 'storage',
  'waiting-area': 'seating',
  restaurant: 'foodservice',
  'food-court': 'foodservice',
  cafe: 'eatingdrinking',
  drinks: 'eatingdrinking',
  library: 'library',
  aed: 'defibrillator',
  wheelchair: 'wheelchairassist',
  playground: 'childplayarea',
  'swimming-pool': 'swimmingpool',
  gym: 'recreation',
  entrance: 'entry',
};
