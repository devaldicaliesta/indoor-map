/**
 * Encoder QR Code (ISO/IEC 18004) mode byte, koreksi galat M, versi 1–40, mask dipilih otomatis
 * dengan penalti standar. Dibuat sendiri agar QR titik asal tidak bergantung layanan atau paket
 * luar; mengikuti struktur encoder rujukan Project Nayuki (MIT).
 */

/** Matriks modul: `true` = gelap. Baris lalu kolom, tanpa zona tenang. */
export type QrMatrix = boolean[][];

/** Jumlah codeword koreksi per blok dan jumlah blok untuk level M, indeks = versi. */
const ECC_PER_BLOCK = [
  -1, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28,
  28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28,
];
const BLOCKS = [
  -1, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5, 5, 8, 9, 9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25,
  26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49,
];
/** Bit format level M (01) sebelum mask format. */
const ECC_FORMAT_BITS = 0;

function rawModules(version: number): number {
  let result = (16 * version + 128) * version + 64;
  if (version >= 2) {
    const align = Math.floor(version / 7) + 2;
    result -= (25 * align - 10) * align - 55;
    if (version >= 7) result -= 36;
  }
  return result;
}

function dataCodewords(version: number): number {
  return (
    Math.floor(rawModules(version) / 8) - (ECC_PER_BLOCK[version] ?? 0) * (BLOCKS[version] ?? 0)
  );
}

function multiply(x: number, y: number): number {
  let z = 0;
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11d);
    z ^= ((y >>> i) & 1) * x;
  }
  return z;
}

function divisor(degree: number): number[] {
  const result = new Array<number>(degree).fill(0);
  result[degree - 1] = 1;
  let root = 1;
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < result.length; j++) {
      result[j] = multiply(result[j] ?? 0, root);
      if (j + 1 < result.length) result[j] = (result[j] ?? 0) ^ (result[j + 1] ?? 0);
    }
    root = multiply(root, 0x02);
  }
  return result;
}

function remainder(data: readonly number[], div: readonly number[]): number[] {
  const result = div.map(() => 0);
  for (const b of data) {
    const factor = b ^ (result.shift() ?? 0);
    result.push(0);
    div.forEach((coef, i) => {
      result[i] = (result[i] ?? 0) ^ multiply(coef, factor);
    });
  }
  return result;
}

function withEcc(data: readonly number[], version: number): number[] {
  const blocks = BLOCKS[version] ?? 1;
  const eccLen = ECC_PER_BLOCK[version] ?? 0;
  const raw = Math.floor(rawModules(version) / 8);
  const shortBlocks = blocks - (raw % blocks);
  const shortLen = Math.floor(raw / blocks);
  const div = divisor(eccLen);
  const parts: number[][] = [];
  for (let i = 0, k = 0; i < blocks; i++) {
    const dataLen = shortLen - eccLen + (i < shortBlocks ? 0 : 1);
    const chunk = data.slice(k, k + dataLen);
    k += dataLen;
    const block = [...chunk, ...remainder(chunk, div)];
    if (i < shortBlocks) block.splice(dataLen, 0, 0);
    parts.push(block);
  }
  const result: number[] = [];
  for (let i = 0; i < (parts[0]?.length ?? 0); i++) {
    parts.forEach((block, j) => {
      if (i !== shortLen - eccLen || j >= shortBlocks) result.push(block[i] ?? 0);
    });
  }
  return result;
}

function alignmentPositions(version: number): number[] {
  if (version === 1) return [];
  const count = Math.floor(version / 7) + 2;
  const step = Math.floor((version * 8 + count * 3 + 5) / (count * 4 - 4)) * 2;
  const result = [6];
  for (let pos = version * 4 + 10; result.length < count; pos -= step) result.splice(1, 0, pos);
  return result;
}

class Grid {
  readonly version: number;
  readonly size: number;
  readonly dark: boolean[][];
  readonly fixed: boolean[][];

  constructor(version: number) {
    this.version = version;
    this.size = version * 4 + 17;
    this.dark = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
    this.fixed = Array.from({ length: this.size }, () => new Array<boolean>(this.size).fill(false));
  }

  set(x: number, y: number, dark: boolean) {
    const row = this.dark[y];
    const fixedRow = this.fixed[y];
    if (!row || !fixedRow) return;
    row[x] = dark;
    fixedRow[x] = true;
  }

  finder(cx: number, cy: number) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const d = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < this.size && y >= 0 && y < this.size) this.set(x, y, d !== 2 && d !== 4);
      }
    }
  }

  functionPatterns() {
    for (let i = 0; i < this.size; i++) {
      this.set(6, i, i % 2 === 0);
      this.set(i, 6, i % 2 === 0);
    }
    this.finder(3, 3);
    this.finder(this.size - 4, 3);
    this.finder(3, this.size - 4);
    const positions = alignmentPositions(this.version);
    const last = positions.length - 1;
    positions.forEach((x, i) => {
      positions.forEach((y, j) => {
        if ((i === 0 && j === 0) || (i === 0 && j === last) || (i === last && j === 0)) return;
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            this.set(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
          }
        }
      });
    });
    this.format(0);
    this.versionBits();
  }

  format(mask: number) {
    const data = (ECC_FORMAT_BITS << 3) | mask;
    let rem = data;
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
    const bits = ((data << 10) | rem) ^ 0x5412;
    const bit = (i: number) => ((bits >>> i) & 1) !== 0;
    for (let i = 0; i <= 5; i++) this.set(8, i, bit(i));
    this.set(8, 7, bit(6));
    this.set(8, 8, bit(7));
    this.set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) this.set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) this.set(this.size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) this.set(8, this.size - 15 + i, bit(i));
    this.set(8, this.size - 8, true);
  }

  versionBits() {
    if (this.version < 7) return;
    let rem = this.version;
    for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1f25);
    const bits = (this.version << 12) | rem;
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >>> i) & 1) !== 0;
      const a = this.size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      this.set(a, b, dark);
      this.set(b, a, dark);
    }
  }

  codewords(data: readonly number[]) {
    let i = 0;
    for (let right = this.size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < this.size; vert++) {
        for (let j = 0; j < 2; j++) {
          const x = right - j;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? this.size - 1 - vert : vert;
          const row = this.dark[y];
          if (!this.fixed[y]?.[x] && row && i < data.length * 8) {
            row[x] = (((data[i >>> 3] ?? 0) >>> (7 - (i & 7))) & 1) !== 0;
            i++;
          }
        }
      }
    }
  }

  applyMask(mask: number) {
    for (let y = 0; y < this.size; y++) {
      const row = this.dark[y];
      if (!row) continue;
      for (let x = 0; x < this.size; x++) {
        if (this.fixed[y]?.[x]) continue;
        const flip = [
          (x + y) % 2 === 0,
          y % 2 === 0,
          x % 3 === 0,
          (x + y) % 3 === 0,
          (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
          ((x * y) % 2) + ((x * y) % 3) === 0,
          (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
          (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
        ][mask];
        if (flip) row[x] = !row[x];
      }
    }
  }
}

/** Penalti standar: deret sewarna, blok 2×2, pola mirip finder, dan keseimbangan gelap. */
function penalty(dark: readonly boolean[][]): number {
  const size = dark.length;
  const at = (x: number, y: number, transpose: boolean) =>
    (transpose ? dark[x]?.[y] : dark[y]?.[x]) ?? false;
  let score = 0;
  for (const transpose of [false, true]) {
    for (let y = 0; y < size; y++) {
      let run = 1;
      for (let x = 1; x <= size; x++) {
        if (x < size && at(x, y, transpose) === at(x - 1, y, transpose)) {
          run++;
          continue;
        }
        if (run >= 5) score += run - 2;
        run = 1;
      }
      // Pola 1:1:3:1:1 dengan empat modul terang di salah satu sisi.
      for (let x = 0; x + 11 <= size; x++) {
        const bits = Array.from({ length: 11 }, (_, k) => at(x + k, y, transpose));
        const core = [true, false, true, true, true, false, true];
        const left = bits.slice(0, 4).every((b) => !b) && core.every((b, k) => bits[4 + k] === b);
        const right = core.every((b, k) => bits[k] === b) && bits.slice(7).every((b) => !b);
        if (left || right) score += 40;
      }
    }
  }
  for (let y = 0; y + 1 < size; y++) {
    for (let x = 0; x + 1 < size; x++) {
      const c = at(x, y, false);
      if (c === at(x + 1, y, false) && c === at(x, y + 1, false) && c === at(x + 1, y + 1, false)) {
        score += 3;
      }
    }
  }
  const total = dark.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
  const k = Math.ceil(Math.abs(total * 20 - size * size * 10) / (size * size)) - 1;
  return score + Math.max(0, k) * 10;
}

/** Bit data: mode byte, panjang, isi, terminator, dan pengisi sampai kapasitas versi. */
function dataBytes(bytes: readonly number[], version: number): number[] {
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };
  const capacity = dataCodewords(version) * 8;
  push(0b0100, 4);
  push(bytes.length, version <= 9 ? 8 : 16);
  for (const b of bytes) push(b, 8);
  push(0, Math.min(4, capacity - bits.length));
  push(0, (8 - (bits.length % 8)) % 8);
  const result: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    result.push(bits.slice(i, i + 8).reduce((acc, b) => (acc << 1) | b, 0));
  }
  for (let pad = 0xec; result.length < capacity / 8; pad ^= 0xec ^ 0x11) result.push(pad);
  return result;
}

/** Byte UTF-8; paket domain tidak memakai API DOM seperti `TextEncoder`. */
function utf8(text: string): number[] {
  const bytes: number[] = [];
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    if (code < 0x80) bytes.push(code);
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 63));
    else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 63), 0x80 | (code & 63));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 63),
        0x80 | ((code >> 6) & 63),
        0x80 | (code & 63),
      );
    }
  }
  return bytes;
}

/** QR untuk `text` (UTF-8) dengan versi terkecil yang muat; melempar galat bila terlalu panjang. */
export function encodeQr(text: string): QrMatrix {
  const bytes = utf8(text);
  let version = 1;
  while (version <= 40) {
    const headerBits = 4 + (version <= 9 ? 8 : 16);
    if (headerBits + bytes.length * 8 <= dataCodewords(version) * 8) break;
    version++;
  }
  if (version > 40) throw new Error('Teks terlalu panjang untuk QR.');
  const codewords = withEcc(dataBytes(bytes, version), version);
  let best: QrMatrix | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (let mask = 0; mask < 8; mask++) {
    const grid = new Grid(version);
    grid.functionPatterns();
    grid.codewords(codewords);
    grid.applyMask(mask);
    grid.format(mask);
    const score = penalty(grid.dark);
    if (score < bestScore) {
      bestScore = score;
      best = grid.dark;
    }
  }
  return best ?? [];
}

/**
 * Path SVG satu warna untuk matriks QR, satu persegi per modul, dalam satuan modul dengan zona
 * tenang `quiet` modul di setiap sisi.
 */
export function qrSvgPath(matrix: QrMatrix, quiet = 4): string {
  const parts: string[] = [];
  matrix.forEach((row, y) => {
    row.forEach((dark, x) => {
      if (dark) parts.push(`M${x + quiet} ${y + quiet}h1v1h-1z`);
    });
  });
  return parts.join('');
}
