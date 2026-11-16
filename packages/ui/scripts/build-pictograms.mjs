import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const STROKE = 1.75;

const SOURCES = {
  wifi: 'wifi',
  'phone-charging': 'battery-charging',
  'customer-service': 'headset',
  help: 'circle-question-mark',
  'lost-and-found': 'search',
  lockers: 'lock-keyhole',
  'nursing-room': 'milk',
  'drinking-water': 'glass-water',
  trash: 'trash',
  recycling: 'recycle',
  'smoking-area': 'cigarette',
  shower: 'shower-head',
  'post-office': 'mail',
  'money-changer': 'banknote',
  bank: 'landmark',
  cashier: 'credit-card',
  'ticket-office': 'ticket',
  directory: 'map',
  'meeting-point': 'flag',
  reception: 'concierge-bell',
  chapel: 'church',
  'umbrella-storage': 'umbrella',
  printing: 'printer',
  'opening-hours': 'clock',
  'waiting-area': 'armchair',
  telephone: 'phone',
  hotel: 'hotel',
  laundry: 'washing-machine',
  'bicycle-parking': 'bike',
  'motorcycle-parking': 'motorbike',
  car: 'car',
  'drop-off': 'car-front',
  taxi: 'car-taxi-front',
  bus: 'bus',
  shuttle: 'bus-front',
  train: 'train-front',
  tram: 'tram-front',
  departures: 'plane-takeoff',
  arrivals: 'plane-landing',
  airport: 'plane',
  ferry: 'ship',
  'baggage-claim': 'baggage-claim',
  luggage: 'luggage',
  'fuel-station': 'fuel',
  'ev-charging': 'plug-zap',
  'loading-dock': 'truck',
  immigration: 'stamp',
  'security-check': 'scan-line',
  restaurant: 'utensils',
  'food-court': 'utensils-crossed',
  cafe: 'coffee',
  drinks: 'cup-soda',
  bakery: 'croissant',
  'ice-cream': 'ice-cream-cone',
  'cake-shop': 'cake-slice',
  'fast-food': 'sandwich',
  pizza: 'pizza',
  noodles: 'soup',
  'healthy-food': 'salad',
  chicken: 'drumstick',
  seafood: 'fish',
  snacks: 'popcorn',
  fruit: 'apple',
  breakfast: 'egg-fried',
  kitchen: 'chef-hat',
  shop: 'store',
  shopping: 'shopping-bag',
  supermarket: 'shopping-cart',
  minimarket: 'shopping-basket',
  fashion: 'shirt',
  jewelry: 'gem',
  watches: 'watch',
  optician: 'glasses',
  electronics: 'laptop',
  'mobile-phones': 'smartphone',
  bookstore: 'book-open',
  gifts: 'gift',
  florist: 'flower',
  beauty: 'sparkles',
  salon: 'scissors',
  toys: 'toy-brick',
  furniture: 'sofa',
  hardware: 'hammer',
  promotion: 'percent',
  hospital: 'hospital',
  clinic: 'clipboard-plus',
  pharmacy: 'pill',
  'emergency-room': 'ambulance',
  laboratory: 'microscope',
  'sample-collection': 'test-tube',
  radiology: 'radiation',
  vaccination: 'syringe',
  cardiology: 'heart-pulse',
  pediatrics: 'baby',
  neurology: 'brain',
  ophthalmology: 'eye',
  ent: 'ear',
  dental: 'face-slightly-smiling',
  orthopedics: 'bone',
  inpatient: 'bed',
  'patient-registration': 'id-card',
  'blood-donation': 'droplet',
  dialysis: 'droplets',
  'temperature-check': 'thermometer',
  physiotherapy: 'activity',
  stethoscope: 'stethoscope',
  classroom: 'presentation',
  library: 'library',
  'academic-office': 'graduation-cap',
  school: 'school',
  'science-lab': 'flask-conical',
  'computer-lab': 'monitor',
  'art-studio': 'palette',
  'music-room': 'music',
  'study-room': 'notebook-pen',
  'faculty-office': 'user-round',
  auditorium: 'mic',
  office: 'briefcase',
  'meeting-room': 'users',
  'video-conference': 'video',
  workspace: 'lamp-desk',
  pantry: 'refrigerator',
  archive: 'archive',
  'server-room': 'server',
  administration: 'file-text',
  finance: 'calculator',
  'human-resources': 'contact',
  'guest-room': 'handshake',
  'office-building': 'building-complex',
  'access-card': 'key-round',
  'fire-alarm': 'siren',
  'smoke-detector': 'alarm-smoke',
  'fire-hazard': 'flame',
  'security-post': 'shield-check',
  cctv: 'cctv',
  ppe: 'hard-hat',
  warning: 'triangle-alert',
  'high-voltage': 'zap',
  biohazard: 'biohazard',
  'no-smoking': 'cigarette-off',
  'no-entry': 'ban',
  'restricted-area': 'lock',
  'emergency-phone': 'phone-call',
  aed: 'heart',
  construction: 'construction',
  'life-buoy': 'life-buoy',
  'evacuation-route': 'route',
  wheelchair: 'accessibility',
  'hearing-loop': 'audio-lines',
  deaf: 'ear-off',
  blind: 'eye-off',
  'sign-language': 'hand',
  priority: 'person-standing',
  'guide-dog': 'dog',
  assistance: 'heart-handshake',
  cinema: 'clapperboard',
  arcade: 'gamepad-2',
  karaoke: 'mic-vocal',
  gym: 'dumbbell',
  'swimming-pool': 'waves-ladder',
  playground: 'puzzle',
  park: 'trees',
  garden: 'flower-2',
  theater: 'drama',
  gallery: 'image',
  'photo-spot': 'camera',
  event: 'party-popper',
  'sports-field': 'volleyball',
  'live-music': 'guitar',
  'pet-area': 'paw-print',
  'amusement-ride': 'ferris-wheel',
  entrance: 'door-open',
  exit: 'log-out',
  door: 'door-closed',
  warehouse: 'warehouse',
  'production-area': 'factory',
  forklift: 'forklift',
  container: 'container',
  parcels: 'package',
  'power-outlet': 'plug',
  ventilation: 'fan',
  maintenance: 'wrench',
  'utility-room': 'cog',
  bathroom: 'bath',
  'key-handover': 'key',
  mailbox: 'mailbox',
  'outdoor-area': 'sun',
  building: 'building',
  directions: 'signpost',
};

const num = (value) => Number(value ?? 0);

function points(value) {
  const list = String(value)
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  const pairs = [];
  for (let i = 0; i + 1 < list.length; i += 2) pairs.push(`${list[i]} ${list[i + 1]}`);
  return pairs;
}

function ellipse(cx, cy, rx, ry) {
  return `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0z`;
}

function rect({ x, y, width, height, rx, ry }) {
  const [left, top, w, h] = [num(x), num(y), num(width), num(height)];
  const rX = Math.min(num(rx ?? ry), w / 2);
  const rY = Math.min(num(ry ?? rx), h / 2);
  if (!rX || !rY) return `M${left} ${top}h${w}v${h}h${-w}z`;
  return (
    `M${left + rX} ${top}h${w - 2 * rX}a${rX} ${rY} 0 0 1 ${rX} ${rY}v${h - 2 * rY}` +
    `a${rX} ${rY} 0 0 1 ${-rX} ${rY}h${-(w - 2 * rX)}a${rX} ${rY} 0 0 1 ${-rX} ${-rY}` +
    `v${-(h - 2 * rY)}a${rX} ${rY} 0 0 1 ${rX} ${-rY}z`
  );
}

function toPath([tag, attrs]) {
  switch (tag) {
    case 'path':
      return attrs.d;
    case 'circle':
      return ellipse(num(attrs.cx), num(attrs.cy), num(attrs.r), num(attrs.r));
    case 'ellipse':
      return ellipse(num(attrs.cx), num(attrs.cy), num(attrs.rx), num(attrs.ry));
    case 'rect':
      return rect(attrs);
    case 'line':
      return `M${num(attrs.x1)} ${num(attrs.y1)}L${num(attrs.x2)} ${num(attrs.y2)}`;
    case 'polyline':
      return `M${points(attrs.points).join('L')}`;
    case 'polygon':
      return `M${points(attrs.points).join('L')}z`;
    default:
      throw new Error(`Elemen ${tag} belum didukung`);
  }
}

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, '..', 'package.json'));
function packageRoot(entry) {
  let dir = dirname(entry);
  while (!existsSync(join(dir, 'package.json')) || !dir.endsWith('lucide-react'))
    dir = dirname(dir);
  return dir;
}

const lucideRoot = packageRoot(require.resolve('lucide-react'));
const version = JSON.parse(readFileSync(join(lucideRoot, 'package.json'), 'utf8')).version;

const lines = [];
for (const [key, name] of Object.entries(SOURCES)) {
  const module = await import(
    pathToFileURL(join(lucideRoot, 'dist', 'esm', 'icons', `${name}.mjs`)).href
  );
  const parts = module.__iconData.node.map((node) => `{ d: '${toPath(node)}', stroke: STROKE }`);
  lines.push(`  '${key}': [${parts.join(', ')}],`);
}

const output = `import type { PictogramKey } from '@indoor/domain';
import type { PictogramPart } from './shapes';

const STROKE = ${STROKE};

export const LUCIDE_VERSION = '${version}';

export const LIBRARY_SHAPES: Partial<Record<PictogramKey, readonly PictogramPart[]>> = {
${lines.join('\n')}
};
`;

const target = join(here, '..', 'src', 'pictograms', 'library.ts');
writeFileSync(target, output);
execFileSync(
  process.execPath,
  [require.resolve('@biomejs/biome/bin/biome'), 'format', '--write', target],
  {
    stdio: 'inherit',
  },
);
console.log(`${Object.keys(SOURCES).length} ikon dari lucide ${version}`);
