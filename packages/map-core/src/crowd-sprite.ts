import type { PixelImage } from './layers/graph-hatch';

/**
 * Orang mini bergaya pixel art untuk ilustrasi keramaian di peta. Setiap orang punya tampilan
 * sendiri (warna kulit, rambut/kerudung, baju, bawahan, sepatu, aksesori, dewasa/anak) sehingga
 * tidak ada dua orang yang sama dalam satu peta. Nilai warna di sini data gambar, bukan token UI.
 */

const SKIN = ['#f6d5b8', '#e8b98e', '#c98e62', '#a0673f', '#6e4426'] as const;
const HAIR = ['#1d1a17', '#3b2619', '#6b4123', '#a9a39a', '#c99a45', '#3f5fa8'] as const;
const HIJAB = [
  '#2f4b7c',
  '#8b3a62',
  '#d9bf98',
  '#3f6e4f',
  '#26282b',
  '#b9c9da',
  '#c2553f',
] as const;
const TOP = [
  '#e5484d',
  '#f2994a',
  '#f5c518',
  '#3aa76d',
  '#1aa2a6',
  '#2c3e66',
  '#6fb3e0',
  '#8e5bd6',
  '#e57fae',
  '#f4f4f2',
  '#8a8f96',
  '#8a2b3a',
] as const;
const WHITE_TOP = '#f4f4f2';
const BOTTOM = ['#3c5a88', '#2a2d31', '#c2a878', '#6b7178', '#6a4a35', '#25324d'] as const;
const SHOES = ['#1f1f1f', '#ececec', '#6b4423', '#b8322d'] as const;
const BAGS = ['#2a2d31', '#7a5230', '#3f6e4f', '#b8322d'] as const;

export const HAIR_STYLES = [
  'short',
  'side',
  'long',
  'bun',
  'curly',
  'cap',
  'hijab',
  'buzz',
] as const;
export const TOP_STYLES = ['tee', 'long', 'stripe', 'jacket'] as const;
export const BOTTOM_STYLES = ['pants', 'shorts', 'skirt'] as const;
export const ACCESSORIES = ['none', 'backpack', 'bag', 'glasses', 'phone'] as const;

export type HairStyle = (typeof HAIR_STYLES)[number];
export type TopStyle = (typeof TOP_STYLES)[number];
export type BottomStyle = (typeof BOTTOM_STYLES)[number];
export type Accessory = (typeof ACCESSORIES)[number];

/** Tampilan satu orang; angka adalah indeks palet. */
export interface CrowdLook {
  child: boolean;
  skin: number;
  hair: HairStyle;
  /** Warna rambut, atau warna kerudung/topi untuk `hijab` dan `cap`. */
  hairColor: number;
  top: TopStyle;
  topColor: number;
  bottom: BottomStyle;
  bottomColor: number;
  shoes: number;
  accessory: Accessory;
  /** Warna tas untuk `backpack` dan `bag`. */
  bagColor: number;
}

/** Bingkai gambar: berdiri dan dua langkah kaki. */
export const CROWD_FRAMES = ['stand', 'stepA', 'stepB'] as const;
export type CrowdFrame = (typeof CROWD_FRAMES)[number];
export type CrowdFacing = 'left' | 'right';

/** Gambar dibuat 2× (setiap piksel seni = 2 × 2 piksel) dan dipasang dengan pixelRatio 2. */
export const CROWD_PIXEL_RATIO = 2;
const FIGURE_WIDTH = 10;

const pick = <T>(list: readonly T[], random: () => number): T =>
  list[Math.floor(random() * list.length)] as T;
const index = (length: number, random: () => number) => Math.floor(random() * length);

/** Kunci tampilan yang terlihat: bagian yang tertutup (warna rambut di balik kerudung) diabaikan. */
export function lookKey(look: CrowdLook): string {
  const bag = look.accessory === 'backpack' || look.accessory === 'bag' ? look.bagColor : -1;
  return [
    look.child ? 'c' : 'a',
    look.skin,
    look.hair,
    look.hairColor,
    look.top,
    look.topColor,
    look.bottom,
    look.bottomColor,
    look.shoes,
    look.accessory,
    bag,
  ].join('.');
}

/**
 * Tampilan acak dengan peluang yang mendekati keramaian nyata: anak sesekali, rambut gelap lebih
 * sering, kerudung cukup sering (venue di Indonesia).
 */
export function randomLook(random: () => number): CrowdLook {
  const child = random() < 0.14;
  const hairRoll = random();
  const hair: HairStyle =
    hairRoll < 0.22
      ? 'hijab'
      : child
        ? pick(['short', 'side', 'bun', 'curly', 'cap'] as const, random)
        : pick(
            HAIR_STYLES.filter((style) => style !== 'hijab'),
            random,
          );
  const darkHair = random() < 0.7;
  const topColor = index(TOP.length, random);
  // Garis dan bagian dalam jaket berwarna putih; di baju putih keduanya tidak terlihat.
  const top =
    TOP[topColor] === WHITE_TOP ? pick(['tee', 'long'] as const, random) : pick(TOP_STYLES, random);
  return {
    child,
    skin: index(SKIN.length, random),
    hair,
    hairColor:
      hair === 'hijab'
        ? index(HIJAB.length, random)
        : hair === 'cap'
          ? index(TOP.length, random)
          : darkHair
            ? index(2, random)
            : index(HAIR.length, random),
    top,
    topColor,
    bottom:
      hair === 'hijab' && random() < 0.5
        ? 'skirt'
        : pick(['pants', 'pants', 'shorts', 'skirt'] as const, random),
    bottomColor: index(BOTTOM.length, random),
    shoes: index(SHOES.length, random),
    accessory: child
      ? pick(['none', 'none', 'backpack'] as const, random)
      : pick(['none', 'none', ...ACCESSORIES.slice(1)] as const, random),
    bagColor: index(BAGS.length, random),
  };
}

/** `count` tampilan yang semuanya berbeda (berdasarkan `lookKey`). */
export function uniqueLooks(count: number, random: () => number): CrowdLook[] {
  const looks: CrowdLook[] = [];
  const seen = new Set<string>();
  for (let attempt = 0; looks.length < count && attempt < count * 200; attempt++) {
    const look = randomLook(random);
    const key = lookKey(look);
    if (seen.has(key)) continue;
    seen.add(key);
    looks.push(look);
  }
  return looks;
}

type Rgb = readonly [number, number, number];

const rgb = (hex: string): Rgb => [
  Number.parseInt(hex.slice(1, 3), 16),
  Number.parseInt(hex.slice(3, 5), 16),
  Number.parseInt(hex.slice(5, 7), 16),
];
const shade = (color: Rgb, factor: number): Rgb =>
  color.map((c) => Math.max(0, Math.min(255, Math.round(c * factor)))) as unknown as Rgb;

const INK: Rgb = [17, 20, 24];
const WHITE: Rgb = [248, 248, 246];

/** Kisi gambar sementara: `null` = transparan. */
class Grid {
  readonly width: number;
  readonly height: number;
  readonly cells: (Rgb | null)[];
  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = new Array(width * height).fill(null);
  }
  set(x: number, y: number, color: Rgb) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return;
    this.cells[y * this.width + x] = color;
  }
  get(x: number, y: number): Rgb | null {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return null;
    return this.cells[y * this.width + x] ?? null;
  }
  rect(x0: number, y0: number, x1: number, y1: number, color: Rgb) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) this.set(x, y, color);
  }
}

/** Tinggi badan dalam piksel seni (tanpa tepi dan bayangan). */
const figureHeight = (look: CrowdLook) => (look.child ? 15 : 19);

/**
 * Menggambar orang menghadap kanan di kisi 10 kolom. Kepala besar (gaya chibi) baris 1–7,
 * badan dan lengan di bawahnya, lalu kaki; bingkai langkah merenggangkan kaki bergantian.
 */
function drawFigure(look: CrowdLook, frame: CrowdFrame): Grid {
  const height = figureHeight(look);
  const grid = new Grid(FIGURE_WIDTH, height);
  const skin = rgb(SKIN[look.skin] ?? SKIN[0]);
  const hairColor = rgb(
    (look.hair === 'hijab' ? HIJAB : look.hair === 'cap' ? TOP : HAIR)[look.hairColor] ?? HAIR[0],
  );
  const naturalHair = rgb(HAIR[look.hairColor % 2] ?? HAIR[0]);
  const top = rgb(TOP[look.topColor] ?? TOP[0]);
  const bottom = rgb(BOTTOM[look.bottomColor] ?? BOTTOM[0]);
  const shoes = rgb(SHOES[look.shoes] ?? SHOES[0]);
  const bag = rgb(BAGS[look.bagColor] ?? BAGS[0]);

  // Kepala: wajah baris 3–6, dagu baris 7.
  grid.rect(2, 2, 7, 6, skin);
  grid.rect(3, 7, 6, 7, skin);
  grid.set(5, 4, INK);
  grid.set(7, 4, INK);

  // Badan dan lengan.
  const torsoTop = 8;
  const torsoBottom = look.child ? 11 : 13;
  const handRow = torsoBottom - 1;
  grid.rect(2, torsoTop, 7, torsoBottom, top);
  for (const x of [1, 8]) {
    const sleeveEnd = look.top === 'long' || look.top === 'jacket' ? handRow - 1 : torsoTop + 1;
    grid.rect(x, torsoTop, x, sleeveEnd, top);
    grid.rect(x, sleeveEnd + 1, x, handRow, skin);
  }
  if (look.top === 'stripe') {
    for (let y = torsoTop + 1; y <= torsoBottom; y += 2) grid.rect(2, y, 7, y, WHITE);
  }
  if (look.top === 'jacket') {
    grid.rect(5, torsoTop, 6, torsoBottom, WHITE);
    grid.rect(4, torsoTop, 4, torsoBottom, shade(top, 0.7));
  }

  // Kaki: bawahan, kulit (celana pendek/rok), sepatu di baris terakhir.
  const legTop = torsoBottom + 1;
  const shoeRow = height - 1;
  // Langkah A: kaki merenggang; langkah B: kaki berpapasan dengan kaki belakang terangkat.
  const legs: { x: number; hip: number; lifted: boolean }[] =
    frame === 'stepA'
      ? [
          { x: 2, hip: 3, lifted: false },
          { x: 6, hip: 5, lifted: false },
        ]
      : [
          { x: 3, hip: 3, lifted: frame === 'stepB' },
          { x: 5, hip: 5, lifted: false },
        ];
  const coverEnd =
    look.bottom === 'pants' ? shoeRow - 1 : look.bottom === 'shorts' ? legTop + 1 : legTop + 2;
  for (const leg of legs) {
    // Pinggul tetap di tempat; hanya bagian bawah kaki yang bergeser.
    grid.rect(leg.hip, legTop, leg.hip + 1, legTop, bottom);
    const foot = leg.lifted ? shoeRow - 1 : shoeRow;
    for (let y = legTop + 1; y < foot; y++) {
      grid.rect(leg.x, y, leg.x + 1, y, y <= coverEnd ? bottom : skin);
    }
    // Sepatu menjorok satu piksel ke depan (arah hadap).
    grid.rect(leg.x, foot, leg.x + 2, foot, shoes);
  }
  if (look.bottom === 'skirt') {
    const hem = Math.min(coverEnd, shoeRow - 2);
    grid.rect(2, legTop, 7, hem, bottom);
    grid.rect(1, hem, 8, hem, bottom);
  }

  // Rambut, topi, atau kerudung (menghadap kanan: rambut bagian belakang di kolom kiri).
  switch (look.hair) {
    case 'short':
      grid.rect(3, 1, 6, 1, hairColor);
      grid.rect(2, 2, 7, 2, hairColor);
      grid.rect(2, 3, 2, 4, hairColor);
      break;
    case 'side':
      grid.rect(3, 1, 7, 1, hairColor);
      grid.rect(2, 2, 7, 2, hairColor);
      grid.rect(2, 3, 4, 3, hairColor);
      grid.rect(2, 4, 2, 5, hairColor);
      break;
    case 'long':
      grid.rect(3, 1, 6, 1, hairColor);
      grid.rect(2, 2, 7, 2, hairColor);
      grid.rect(1, 3, 2, look.child ? 9 : 11, hairColor);
      grid.set(3, 3, hairColor);
      break;
    case 'bun':
      grid.rect(2, 0, 3, 0, hairColor);
      grid.rect(3, 1, 6, 1, hairColor);
      grid.rect(2, 2, 7, 2, hairColor);
      grid.rect(2, 3, 2, 4, hairColor);
      break;
    case 'curly':
      grid.rect(2, 0, 6, 0, hairColor);
      grid.rect(1, 1, 7, 2, hairColor);
      grid.rect(1, 3, 2, 5, hairColor);
      for (const [x, y] of [
        [2, 0],
        [4, 0],
        [6, 0],
        [1, 2],
        [3, 1],
        [5, 1],
        [7, 2],
        [1, 4],
      ] as const) {
        grid.set(x, y, shade(hairColor, 1.45));
      }
      break;
    case 'cap':
      grid.rect(3, 0, 6, 0, hairColor);
      grid.rect(2, 1, 7, 2, hairColor);
      grid.rect(7, 2, 9, 2, shade(hairColor, 0.75));
      grid.rect(2, 3, 2, 4, naturalHair);
      break;
    case 'hijab':
      grid.rect(3, 0, 6, 0, hairColor);
      grid.rect(2, 1, 7, 2, hairColor);
      grid.rect(1, 2, 3, 7, hairColor);
      grid.rect(1, 8, 8, 9, hairColor);
      grid.rect(4, 7, 7, 7, hairColor);
      grid.set(8, 3, hairColor);
      grid.rect(8, 6, 8, 7, hairColor);
      break;
    case 'buzz':
      grid.rect(3, 1, 6, 1, shade(hairColor, 1.1));
      grid.rect(2, 2, 7, 2, shade(skin, 0.85));
      grid.set(2, 2, hairColor);
      grid.set(7, 2, hairColor);
      break;
  }

  // Aksesori.
  switch (look.accessory) {
    case 'backpack':
      grid.rect(0, torsoTop + 1, 1, torsoBottom - 1, bag);
      grid.set(2, torsoTop, shade(bag, 0.8));
      break;
    case 'bag':
      for (let i = 0; i < 4; i++) grid.set(3 + i, torsoTop + i, shade(bag, 0.8));
      grid.rect(7, torsoBottom - 1, 9, torsoBottom, bag);
      break;
    case 'glasses':
      grid.rect(4, 4, 7, 4, INK);
      break;
    case 'phone':
      grid.rect(9, handRow - 2, 9, handRow - 1, INK);
      grid.set(8, handRow - 1, skin);
      break;
    case 'none':
      break;
  }
  return grid;
}

/** Tepi gelap di sekeliling sosok, lalu bayangan lonjong di bawah kaki. */
function withOutline(figure: Grid): Grid {
  const out = new Grid(figure.width + 2, figure.height + 3);
  for (let y = 0; y < figure.height; y++) {
    for (let x = 0; x < figure.width; x++) {
      const color = figure.get(x, y);
      if (color) out.set(x + 1, y + 1, color);
    }
  }
  const outline: [number, number][] = [];
  for (let y = 0; y < out.height; y++) {
    for (let x = 0; x < out.width; x++) {
      if (out.get(x, y)) continue;
      const near = [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ].some(([nx, ny]) => figure.get((nx ?? 0) - 1, (ny ?? 0) - 1) !== null);
      if (near) outline.push([x, y]);
    }
  }
  for (const [x, y] of outline) out.set(x, y, INK);
  return out;
}

const OUTLINE_ALPHA = 220;
const SHADOW: Rgb = [17, 20, 24];

/** Gambar RGBA satu orang pada satu bingkai dan arah hadap. */
export function renderCrowdSprite(
  look: CrowdLook,
  frame: CrowdFrame,
  facing: CrowdFacing,
): PixelImage {
  const grid = withOutline(drawFigure(look, frame));
  const scale = CROWD_PIXEL_RATIO;
  const width = grid.width * scale;
  const height = grid.height * scale;
  const data = new Uint8Array(width * height * 4);
  const shadowRow = grid.height - 1;
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      let color = grid.get(x, y);
      let alpha = color === INK ? OUTLINE_ALPHA : 255;
      if (!color && y === shadowRow && x >= 1 && x <= grid.width - 2) {
        color = SHADOW;
        alpha = x === 1 || x === grid.width - 2 ? 30 : 60;
      }
      if (!color) continue;
      const sourceX = facing === 'right' ? x : grid.width - 1 - x;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i = ((y * scale + dy) * width + sourceX * scale + dx) * 4;
          data[i] = color[0];
          data[i + 1] = color[1];
          data[i + 2] = color[2];
          data[i + 3] = alpha;
        }
      }
    }
  }
  return { width, height, data };
}
