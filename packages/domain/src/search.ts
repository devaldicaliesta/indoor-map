// Tanpa impor: modul ini dimuat builder snapshot di Edge Function Deno (lihat snapshot.ts).
/**
 * Teks untuk pencarian yang tidak peka huruf besar/kecil dan diakritik: huruf kecil,
 * tanpa diakritik, spasi dirapikan. Satu aturan untuk Admin dan indeks pencarian Visitor.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Salah ketik hanya ditoleransi untuk kata dari huruf saja sepanjang ini atau lebih. Kode dan
 * angka (`gf-a01`, `1203`) harus tepat, agar kode unit tidak menemukan unit sebelahnya.
 */
export const TYPO_MIN_LETTERS = 5;
const TYPO_WORD = new RegExp(`^\\p{L}{${TYPO_MIN_LETTERS},}$`, 'u');

const EDGE_PUNCTUATION = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;
const INNER_SEPARATOR = /[^\p{L}\p{N}]+/gu;

/** Kata-kata dipisah spasi, tanpa tanda baca di tepinya. */
function plainWords(text: string): string[] {
  return text
    .split(/\s+/)
    .map((word) => word.replace(EDGE_PUNCTUATION, ''))
    .filter(Boolean);
}

/**
 * Kata-kata teks yang sudah dinormalkan. Kata bersambung seperti kode `gu-l1-020` juga
 * menyumbang potongan mulai setiap bagiannya (`l1-020`, `020`), sehingga kode bisa dicari dari
 * bagian mana pun.
 */
export function searchWords(text: string): string[] {
  const words: string[] = [];
  for (const word of plainWords(text)) {
    words.push(word);
    for (const separator of word.matchAll(INNER_SEPARATOR)) {
      words.push(word.slice(separator.index + separator[0].length));
    }
  }
  return words;
}

/** Kata kueri dari teks bebas yang diketik pengunjung. */
export function queryTokens(query: string): string[] {
  return plainWords(normalizeSearchText(query));
}

/**
 * Benar bila `a` dan `b` berbeda paling banyak satu suntingan: satu huruf disisipkan, dihapus,
 * atau diganti, atau dua huruf bersebelahan tertukar.
 */
export function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (a.length > b.length) return a.slice(i + 1) === b.slice(i);
  if (a.length < b.length) return a.slice(i) === b.slice(i + 1);
  if (a.slice(i + 1) === b.slice(i + 1)) return true;
  return a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2);
}

export type TokenMatch = 'exact' | 'prefix' | 'typo';

/** Salah ketik ringan terhadap awalan kata: awalan sepanjang kata kueri ±1 huruf. */
function typoPrefix(token: string, word: string): boolean {
  for (const length of [token.length, token.length + 1, token.length - 1]) {
    if (length <= word.length && withinOneEdit(token, word.slice(0, length))) return true;
  }
  return false;
}

/**
 * Kecocokan terbaik satu kata kueri dengan kata-kata sebuah teks: sama persis, awalan, atau
 * (untuk kata ≥ 5 huruf) awalan dengan satu salah ketik, sehingga "radilogi" menemukan
 * "radiologi" dan "radil" sudah menemukannya saat masih diketik.
 */
export function matchToken(token: string, words: readonly string[]): TokenMatch | null {
  const typoAllowed = TYPO_WORD.test(token);
  let best: TokenMatch | null = null;
  for (const word of words) {
    if (word === token) return 'exact';
    if (word.startsWith(token)) best = 'prefix';
    else if (!best && typoAllowed && typoPrefix(token, word)) best = 'typo';
  }
  return best;
}

const TOKEN_SCORE: Record<TokenMatch, number> = { exact: 3, prefix: 2, typo: 1 };
/** Teks yang sama persis atau diawali seluruh kueri (biasanya nama) naik ke atas. */
const WHOLE_TEXT_BONUS = 3;
const TEXT_PREFIX_BONUS = 2;

export interface PreparedSearchEntry<T> {
  entry: T;
  /** Teks yang sudah dinormalkan. */
  text: string;
  words: string[];
}

/** Kata-kata setiap entri dipecah sekali, bukan pada setiap ketikan. */
export function prepareSearch<T extends { text: string }>(
  entries: readonly T[],
): PreparedSearchEntry<T>[] {
  return entries.map((entry) => {
    const text = normalizeSearchText(entry.text);
    return { entry, text, words: searchWords(text) };
  });
}

/**
 * Skor kecocokan kueri terhadap satu entri: setiap kata kueri harus cocok dengan salah satu
 * kata entri, jadi "ruang tunggu" menemukan "Ruang Tunggu Umum" tetapi tidak "Ruang Rapat".
 * `null` bila ada kata kueri yang tidak cocok.
 */
export function scoreEntry(
  tokens: readonly string[],
  prepared: Pick<PreparedSearchEntry<unknown>, 'text' | 'words'>,
): number | null {
  if (tokens.length === 0) return null;
  let score = 0;
  for (const token of tokens) {
    const match = matchToken(token, prepared.words);
    if (!match) return null;
    score += TOKEN_SCORE[match];
  }
  const whole = tokens.join(' ');
  if (prepared.text === whole) score += WHOLE_TEXT_BONUS;
  else if (prepared.text.startsWith(whole)) score += TEXT_PREFIX_BONUS;
  return score;
}

export interface SearchMatch<T> {
  entry: T;
  score: number;
}

/**
 * Entri yang cocok dengan kueri, skor tertinggi lebih dulu; skor sama diurutkan dengan
 * `tieBreak`, lalu teks yang lebih pendek (nama yang paling mirip kueri), lalu abjad.
 */
export function searchEntries<T extends { text: string }>(
  prepared: readonly PreparedSearchEntry<T>[],
  query: string,
  tieBreak: (a: T, b: T) => number = () => 0,
): SearchMatch<T>[] {
  const tokens = queryTokens(query);
  const matches: (SearchMatch<T> & { text: string })[] = [];
  for (const item of prepared) {
    const score = scoreEntry(tokens, item);
    if (score !== null) matches.push({ entry: item.entry, score, text: item.text });
  }
  matches.sort(
    (a, b) =>
      b.score - a.score ||
      tieBreak(a.entry, b.entry) ||
      a.text.length - b.text.length ||
      (a.text < b.text ? -1 : a.text > b.text ? 1 : 0),
  );
  return matches.map(({ entry, score }) => ({ entry, score }));
}
