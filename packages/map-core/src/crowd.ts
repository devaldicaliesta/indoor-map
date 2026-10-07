import type { SnapshotGraph, SnapshotNodeRole } from '@indoor/domain';
import {
  type CrowdFacing,
  type CrowdFrame,
  type CrowdLook,
  lookKey,
  uniqueLooks,
} from './crowd-sprite';
import type { LngLat } from './georef';

/**
 * Ilustrasi keramaian: orang mini yang berjalan di sepanjang graf jalur atau berdiri (sendiri
 * atau berkelompok mengobrol). Bukan data pengunjung nyata; murni hiasan peta. Simulasi bekerja
 * dalam meter lokal dan deterministik per benih agar lantai yang sama selalu berisi orang yang sama.
 */

export type CrowdGraph = Pick<SnapshotGraph, 'nodes' | 'edges'>;

export interface CrowdOptions {
  /** Benih acak, misalnya id venue; lantai yang sama menghasilkan orang dan posisi awal yang sama. */
  seed: string;
  /** Orang per 100 m jalur di setiap lantai (bawaan 6). */
  density?: number;
  /** Batas orang per lantai (bawaan 40). */
  maxPerFloor?: number;
  /**
   * Ruang tempat orang berdiri di dalamnya (zona festival, toko, ruang tunggu); ruang kecil
   * kadang kosong, ruang luas berisi beberapa orang.
   */
  areas?: readonly CrowdArea[];
}

export interface CrowdArea {
  floorId: string;
  /** Cincin luar poligon (WGS84). */
  ring: readonly LngLat[];
}

export interface CrowdPerson {
  id: number;
  look: CrowdLook;
  /** Kunci tampilan; sama dengan `lookKey(look)` dan unik di satu kerumunan. */
  key: string;
  floorId: string;
  /** Pejalan berpindah dari node ke node; yang lain berdiri di tempat. */
  walker: boolean;
  speed: number;
  from: number;
  to: number;
  along: number;
  /** Detik berhenti tersisa (melihat-lihat di depan toko, menunggu). */
  pause: number;
  /** Sedang di dalam lift atau tangga: tidak digambar sampai `pause` habis. */
  away: boolean;
  /** Geser ke samping dari garis jalur (m) agar orang tidak berbaris di satu garis. */
  lane: number;
  offset: [number, number];
  /** Posisi berdiri (m) untuk yang tidak berjalan. */
  spot: [number, number];
  /** Arah jalan dalam derajat dari utara searah jarum jam. */
  heading: number;
  distance: number;
  facing: CrowdFacing;
  /** Detik sampai orang yang berdiri menoleh; `Infinity` untuk anggota kelompok. */
  turnIn: number;
}

interface Neighbor {
  node: number;
  length: number;
}

interface FloorNet {
  points: [number, number][];
  roles: SnapshotNodeRole[];
  neighbors: Neighbor[][];
  /** Ruas jalur (bukan ruas masuk ruang) untuk tempat orang muncul. */
  paths: { a: number; b: number; length: number }[];
  pathLength: number;
  doors: number[];
  connectors: number[];
}

export interface Crowd {
  people: CrowdPerson[];
  nets: Map<string, FloorNet>;
  random: () => number;
  origin: { lng: number; lat: number; kx: number; ky: number };
}

const DEFAULT_DENSITY = 6;
const DEFAULT_MAX = 40;
const WALKER_SHARE = 0.68;
/** Panjang setengah langkah: setiap jarak ini bingkai kaki berganti. */
const STRIDE_M = 0.42;
/** Ambang sinus arah agar orang yang berjalan tegak lurus layar tidak berkedip kiri-kanan. */
const FACING_DEADZONE = 0.18;
const LANE_M = 0.7;
const OFFSET_EASE_S = 0.45;
/** Luas per orang di dalam ruang dan batasnya; jarak minimum dari dinding. */
const AREA_PER_PERSON_M2 = 200;
const MAX_PER_AREA = 12;
const MAX_IN_AREAS_PER_FLOOR = 60;
const WALL_GAP_M = 0.6;

/** PRNG kecil (mulberry32) dengan benih dari teks (FNV-1a). */
export function seededRandom(seed: string): () => number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  let state = h >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const between = (random: () => number, min: number, max: number) => min + random() * (max - min);

function buildNets(graph: CrowdGraph, floorIds: readonly string[], origin: Crowd['origin']) {
  const wanted = new Set(floorIds);
  const nets = new Map<string, FloorNet>();
  const slot = new Map<string, { floorId: string; index: number }>();
  for (const node of graph.nodes) {
    if (!wanted.has(node.floorId)) continue;
    let net = nets.get(node.floorId);
    if (!net) {
      net = {
        points: [],
        roles: [],
        neighbors: [],
        paths: [],
        pathLength: 0,
        doors: [],
        connectors: [],
      };
      nets.set(node.floorId, net);
    }
    const [lng, lat] = node.coordinates;
    slot.set(node.id, { floorId: node.floorId, index: net.points.length });
    net.points.push([(lng - origin.lng) * origin.kx, (lat - origin.lat) * origin.ky]);
    net.roles.push(node.role);
    net.neighbors.push([]);
  }
  for (const edge of graph.edges) {
    const a = slot.get(edge.from);
    const b = slot.get(edge.to);
    const net = nets.get(edge.floorId);
    if (!a || !b || !net || a.floorId !== edge.floorId || b.floorId !== edge.floorId) continue;
    const pa = net.points[a.index] as [number, number];
    const pb = net.points[b.index] as [number, number];
    const length = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]);
    if (length < 0.05) continue;
    net.neighbors[a.index]?.push({ node: b.index, length });
    net.neighbors[b.index]?.push({ node: a.index, length });
    if (net.roles[a.index] !== 'entrance' && net.roles[b.index] !== 'entrance') {
      net.paths.push({ a: a.index, b: b.index, length });
      net.pathLength += length;
    }
  }
  for (const net of nets.values()) {
    net.roles.forEach((role, i) => {
      if (!net.neighbors[i]?.length) return;
      if (role === 'entrance') net.doors.push(i);
      if (role === 'connector') net.connectors.push(i);
    });
  }
  return nets;
}

/** Ruas jalur acak, berbobot panjang ruas. */
function randomPath(net: FloorNet, random: () => number) {
  let target = random() * net.pathLength;
  for (const path of net.paths) {
    target -= path.length;
    if (target <= 0) return path;
  }
  return net.paths[net.paths.length - 1];
}

const pointOf = (net: FloorNet, i: number) => net.points[i] ?? [0, 0];

function headingOf(net: FloorNet, from: number, to: number) {
  const [ax, ay] = pointOf(net, from);
  const [bx, by] = pointOf(net, to);
  return ((Math.atan2(bx - ax, by - ay) * 180) / Math.PI + 360) % 360;
}

function blankPerson(id: number, look: CrowdLook, floorId: string): CrowdPerson {
  return {
    id,
    look,
    key: lookKey(look),
    floorId,
    walker: false,
    speed: 0,
    from: 0,
    to: 0,
    along: 0,
    pause: 0,
    away: false,
    lane: 0,
    offset: [0, 0],
    spot: [0, 0],
    heading: 90,
    distance: 0,
    facing: 'right',
    turnIn: Number.POSITIVE_INFINITY,
  };
}

/** Membuat kerumunan untuk lantai yang tampil; tampilan setiap orang unik di seluruh kerumunan. */
export function createCrowd(
  graph: CrowdGraph,
  floorIds: readonly string[],
  options: CrowdOptions,
): Crowd {
  const random = seededRandom(`${options.seed}|${[...floorIds].sort().join(',')}`);
  const first = graph.nodes.find((node) => floorIds.includes(node.floorId));
  const lat0 = first?.coordinates[1] ?? 0;
  const origin = {
    lng: first?.coordinates[0] ?? 0,
    lat: lat0,
    kx: 111_320 * Math.cos((lat0 * Math.PI) / 180),
    ky: 110_574,
  };
  const nets = buildNets(graph, floorIds, origin);
  const density = options.density ?? DEFAULT_DENSITY;
  const max = options.maxPerFloor ?? DEFAULT_MAX;
  const counts = floorIds.map((floorId) => {
    const net = nets.get(floorId);
    if (!net?.paths.length) return 0;
    return Math.min(max, Math.max(3, Math.round((net.pathLength / 100) * density)));
  });
  const spots = areaSpots(options.areas ?? [], floorIds, origin, random);
  const looks = uniqueLooks(counts.reduce((sum, n) => sum + n, 0) + spots.length, random);
  const people: CrowdPerson[] = [];
  for (const spot of spots) {
    const look = looks[people.length];
    if (!look) break;
    const person = blankPerson(people.length, look, spot.floorId);
    person.spot = spot.at;
    person.facing = random() < 0.5 ? 'left' : 'right';
    person.turnIn = between(random, 2, 9);
    people.push(person);
  }
  floorIds.forEach((floorId, f) => {
    const net = nets.get(floorId);
    const count = counts[f] ?? 0;
    if (!net || count === 0) return;
    const walkers = Math.round(count * WALKER_SHARE);
    let placed = 0;
    while (placed < count) {
      const look = looks[people.length];
      if (!look) break;
      if (placed < walkers) {
        people.push(spawnWalker(blankPerson(people.length, look, floorId), net, random));
        placed += 1;
        continue;
      }
      // Yang berdiri: sendiri, berdua, atau bertiga mengobrol.
      const roll = random();
      const size = Math.min(count - placed, roll < 0.45 ? 1 : roll < 0.85 ? 2 : 3);
      const group: CrowdPerson[] = [];
      for (let i = 0; i < size; i++) {
        const member = looks[people.length + i];
        if (member) group.push(blankPerson(people.length + i, member, floorId));
      }
      placeGroup(group, net, random);
      people.push(...group);
      placed += group.length;
    }
  });
  return { people, nets, random, origin };
}

/** Luas poligon (m²) dengan rumus shoelace. */
function polygonArea(ring: readonly [number, number][]) {
  let sum = 0;
  ring.forEach(([x0, y0], i) => {
    const [x1, y1] = ring[(i + 1) % ring.length] ?? [x0, y0];
    sum += x0 * y1 - x1 * y0;
  });
  return Math.abs(sum) / 2;
}

function insidePolygon(ring: readonly [number, number][], [x, y]: [number, number]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] ?? [0, 0];
    const [xj, yj] = ring[j] ?? [0, 0];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function distanceToRing(ring: readonly [number, number][], [x, y]: [number, number]) {
  let best = Number.POSITIVE_INFINITY;
  ring.forEach(([ax, ay], i) => {
    const [bx, by] = ring[(i + 1) % ring.length] ?? [ax, ay];
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(x - (ax + t * dx), y - (ay + t * dy)));
  });
  return best;
}

/** Titik berdiri acak di dalam ruang, tidak menempel dinding. */
function areaSpots(
  areas: readonly CrowdArea[],
  floorIds: readonly string[],
  origin: Crowd['origin'],
  random: () => number,
): { floorId: string; at: [number, number] }[] {
  const spots: { floorId: string; at: [number, number] }[] = [];
  const perFloor = new Map<string, number>();
  for (const area of areas) {
    if (!floorIds.includes(area.floorId) || area.ring.length < 3) continue;
    const ring = area.ring.map(([lng, lat]): [number, number] => [
      (lng - origin.lng) * origin.kx,
      (lat - origin.lat) * origin.ky,
    ]);
    const wanted = Math.min(
      MAX_PER_AREA,
      Math.floor(polygonArea(ring) / AREA_PER_PERSON_M2 + random() * 0.7),
    );
    const xs = ring.map(([x]) => x);
    const ys = ring.map(([, y]) => y);
    const [minX, maxX, minY, maxY] = [
      Math.min(...xs),
      Math.max(...xs),
      Math.min(...ys),
      Math.max(...ys),
    ];
    for (let n = 0, tries = 0; n < wanted && tries < wanted * 30; tries++) {
      if ((perFloor.get(area.floorId) ?? 0) >= MAX_IN_AREAS_PER_FLOOR) break;
      const at: [number, number] = [between(random, minX, maxX), between(random, minY, maxY)];
      if (!insidePolygon(ring, at) || distanceToRing(ring, at) < WALL_GAP_M) continue;
      spots.push({ floorId: area.floorId, at });
      perFloor.set(area.floorId, (perFloor.get(area.floorId) ?? 0) + 1);
      n += 1;
    }
  }
  return spots;
}

function spawnWalker(person: CrowdPerson, net: FloorNet, random: () => number): CrowdPerson {
  const path = randomPath(net, random);
  if (!path) return person;
  const forward = random() < 0.5;
  person.walker = true;
  person.from = forward ? path.a : path.b;
  person.to = forward ? path.b : path.a;
  person.along = random() * path.length;
  person.speed = person.look.child ? between(random, 1.15, 1.6) : between(random, 0.95, 1.5);
  person.lane = between(random, -LANE_M, LANE_M);
  person.heading = headingOf(net, person.from, person.to);
  person.offset = lateral(person.heading, person.lane);
  person.distance = random() * STRIDE_M * 2;
  return person;
}

/** Geser samping (m) tegak lurus arah jalan, ke kiri untuk `lane` positif. */
function lateral(heading: number, lane: number): [number, number] {
  const rad = (heading * Math.PI) / 180;
  return [-Math.cos(rad) * lane, Math.sin(rad) * lane];
}

function placeGroup(group: CrowdPerson[], net: FloorNet, random: () => number) {
  // Orang yang sendirian kadang berdiri di depan pintu ruang (melihat etalase).
  const door = group.length === 1 && net.doors.length > 0 && random() < 0.35;
  let center: [number, number];
  if (door) {
    const node = net.doors[Math.floor(random() * net.doors.length)] ?? 0;
    const out = net.neighbors[node]?.[0];
    const [dx, dy] = pointOf(net, node);
    const [px, py] = out ? pointOf(net, out.node) : [dx, dy];
    const t = out ? Math.min(1, 0.9 / Math.max(out.length, 0.9)) : 0;
    center = [dx + (px - dx) * t, dy + (py - dy) * t];
  } else {
    const path = randomPath(net, random);
    const [ax, ay] = path ? pointOf(net, path.a) : [0, 0];
    const [bx, by] = path ? pointOf(net, path.b) : [0, 0];
    const t = between(random, 0.15, 0.85);
    const side = lateral(path ? headingOf(net, path.a, path.b) : 0, between(random, -0.8, 0.8));
    center = [ax + (bx - ax) * t + side[0], ay + (by - ay) * t + side[1]];
  }
  const spread = 0.65;
  group.forEach((person, i) => {
    const angle = group.length === 1 ? 0 : (2 * Math.PI * i) / group.length + random() * 0.4;
    const x = center[0] + (group.length === 1 ? 0 : Math.cos(angle) * spread);
    const y = center[1] + (group.length === 1 ? 0 : Math.sin(angle) * spread);
    person.spot = [x, y];
    if (group.length === 1) {
      person.facing = random() < 0.5 ? 'left' : 'right';
      person.turnIn = between(random, 2, 7);
    } else {
      // Anggota kelompok saling berhadapan.
      person.facing = x <= center[0] ? 'right' : 'left';
    }
  });
}

/** Memilih ruas berikutnya: cenderung lurus, kadang masuk ke depan ruang, jarang berbalik. */
function nextNode(net: FloorNet, person: CrowdPerson, random: () => number): number {
  const at = person.to;
  const options = (net.neighbors[at] ?? []).filter(
    (n) => n.node !== person.from || (net.neighbors[at]?.length ?? 0) === 1,
  );
  if (options.length === 0) return person.from;
  const weights = options.map((n) => {
    if (net.roles[n.node] === 'entrance') return 0.12;
    const turn = Math.abs(((headingOf(net, at, n.node) - person.heading + 540) % 360) - 180);
    return 0.35 + (1 + Math.cos((turn * Math.PI) / 180)) / 2;
  });
  let roll = random() * weights.reduce((sum, w) => sum + w, 0);
  for (let i = 0; i < options.length; i++) {
    roll -= weights[i] ?? 0;
    if (roll <= 0) return options[i]?.node ?? person.from;
  }
  return options[options.length - 1]?.node ?? person.from;
}

/** Tiba di node: berhenti di depan ruang, masuk lift/tangga lalu keluar dari konektor lain. */
function arrive(net: FloorNet, person: CrowdPerson, random: () => number) {
  const at = person.to;
  const role = net.roles[at];
  if (role === 'entrance') {
    person.pause = between(random, 2, 6);
  } else if (role === 'connector' && net.connectors.length > 1 && random() < 0.6) {
    // Seolah naik lift atau tangga: muncul lagi dari konektor lain setelah sebentar.
    const others = net.connectors.filter((node) => node !== at);
    const exit = others[Math.floor(random() * others.length)] ?? at;
    person.pause = between(random, 1.5, 4);
    person.away = true;
    person.from = exit;
    person.to = exit;
  } else if (random() < 0.05) {
    person.pause = between(random, 1, 3);
  }
  const next = nextNode(
    net,
    { ...person, from: person.from === person.to ? -1 : person.from },
    random,
  );
  person.from = person.to;
  person.to = next;
  person.along = 0;
  person.heading = headingOf(net, person.from, person.to);
}

const edgeLength = (net: FloorNet, from: number, to: number) =>
  net.neighbors[from]?.find((n) => n.node === to)?.length ?? 0;

/** Memajukan simulasi `dt` detik. */
export function stepCrowd(crowd: Crowd, dt: number): void {
  const { random } = crowd;
  for (const person of crowd.people) {
    if (!person.walker) {
      person.turnIn -= dt;
      if (person.turnIn <= 0) {
        person.facing = person.facing === 'left' ? 'right' : 'left';
        person.turnIn = between(random, 2.5, 8);
      }
      continue;
    }
    const net = crowd.nets.get(person.floorId);
    if (!net) continue;
    if (person.pause > 0) {
      person.pause = Math.max(0, person.pause - dt);
      if (person.pause === 0) person.away = false;
      continue;
    }
    let remaining = person.speed * dt;
    person.distance += remaining;
    for (let guard = 0; remaining > 0 && guard < 8; guard++) {
      const length = edgeLength(net, person.from, person.to);
      const left = length - person.along;
      if (remaining < left) {
        person.along += remaining;
        remaining = 0;
      } else {
        remaining -= Math.max(0, left);
        arrive(net, person, random);
        if (person.pause > 0) break;
      }
    }
    const target = lateral(person.heading, person.lane);
    const ease = Math.min(1, dt / OFFSET_EASE_S);
    person.offset = [
      person.offset[0] + (target[0] - person.offset[0]) * ease,
      person.offset[1] + (target[1] - person.offset[1]) * ease,
    ];
  }
}

/** Posisi orang dalam meter lokal. */
export function personMeters(crowd: Crowd, person: CrowdPerson): [number, number] {
  if (!person.walker) return person.spot;
  const net = crowd.nets.get(person.floorId);
  if (!net) return person.spot;
  const [ax, ay] = pointOf(net, person.from);
  const [bx, by] = pointOf(net, person.to);
  const length = edgeLength(net, person.from, person.to);
  const t = length > 0 ? Math.min(1, person.along / length) : 0;
  return [ax + (bx - ax) * t + person.offset[0], ay + (by - ay) * t + person.offset[1]];
}

export function personPosition(crowd: Crowd, person: CrowdPerson): LngLat {
  const [x, y] = personMeters(crowd, person);
  const { origin } = crowd;
  return [origin.lng + x / origin.kx, origin.lat + y / origin.ky];
}

export function personFrame(person: CrowdPerson, animate = true): CrowdFrame {
  if (!person.walker || person.pause > 0 || !animate) return 'stand';
  return Math.floor(person.distance / STRIDE_M) % 2 === 0 ? 'stepA' : 'stepB';
}

/**
 * Arah hadap di layar: pejalan menghadap ke kanan bila arah jalannya ke kanan layar pada rotasi
 * peta `bearing`. Dekat tegak lurus layar arah sebelumnya dipertahankan.
 */
export function personFacing(person: CrowdPerson, bearing: number): CrowdFacing {
  if (!person.walker) return person.facing;
  const s = Math.sin(((person.heading - bearing) * Math.PI) / 180);
  if (s > FACING_DEADZONE) person.facing = 'right';
  else if (s < -FACING_DEADZONE) person.facing = 'left';
  return person.facing;
}
