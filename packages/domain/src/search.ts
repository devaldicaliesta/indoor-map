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

/** Kata kueri sepanjang ini (huruf saja) boleh salah ketik satu huruf. */
export const TYPO_MIN_LENGTH = 5;

const NOT_ALPHANUMERIC = /[^\p{L}\p{N}]+/u;
const LETTERS_ONLY = /^\p{L}+$/u;

function parts(chunk: string): string[] {
  return chunk.split(NOT_ALPHANUMERIC).filter(Boolean);
}

/**
 * Kata teks yang dicari: tanda baca memisahkan kata, sehingga "GF-A01" bisa ditemukan lewat
 * "a01". Bentuk tanpa tanda baca ("gfa01") ikut disimpan untuk yang mengetik kode tanpa "-".
 */
export function searchWords(text: string): string[] {
  const words: string[] = [];
  for (const chunk of normalizeSearchText(text).split(' ')) {
    const pieces = parts(chunk);
    words.push(...pieces);
    if (pieces.length > 1) words.push(pieces.join(''));
  }
  return words;
}

/** Kata kueri: dinormalkan lalu dipisah di spasi dan tanda baca. */
export function queryWords(query: string): string[] {
  return parts(normalizeSearchText(query));
}

/**
 * Jarak edit `a` dan `b` paling banyak satu: sisip, hapus, atau ganti satu huruf, atau tukar
 * dua huruf bersebelahan ("radiolgoi"). Dihitung linear tanpa matriks.
 */
export function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (long.length - short.length > 1) return false;
  let i = 0;
  while (i < short.length && short[i] === long[i]) i++;
  if (short.length < long.length) return short.slice(i) === long.slice(i + 1);
  if (short.slice(i + 1) === long.slice(i + 1)) return true;
  return (
    short[i] === long[i + 1] && short[i + 1] === long[i] && short.slice(i + 2) === long.slice(i + 2)
  );
}

export type WordMatch = 'exact' | 'prefix' | 'typo';

/**
 * Cara satu kata kueri cocok dengan satu kata teks. Salah ketik hanya untuk kata huruf saja
 * yang cukup panjang (kode seperti "a01" harus persis), dan dibandingkan dengan awalan kata
 * sepanjang kueri ±1 agar tetap cocok selagi pengunjung mengetik ("radilo" → "radiologi").
 */
export function matchWord(queryWord: string, word: string): WordMatch | null {
  if (word === queryWord) return 'exact';
  if (word.startsWith(queryWord)) return 'prefix';
  if (queryWord.length < TYPO_MIN_LENGTH || !LETTERS_ONLY.test(queryWord)) return null;
  for (let length = queryWord.length - 1; length <= queryWord.length + 1; length++) {
    if (length <= word.length && withinOneEdit(queryWord, word.slice(0, length))) return 'typo';
  }
  return null;
}

export interface SearchScore {
  /** Kata kueri yang hanya cocok lewat salah ketik; 0 = semua cocok persis atau sebagai awalan. */
  typos: number;
  /** Kata kueri muncul berurutan seperti diketik, misalnya kode "rad-01". */
  phrase: boolean;
  /** Kata kueri yang sama persis dengan kata teks. */
  exact: number;
}

const MATCH_RANK: Record<WordMatch, number> = { typo: 1, prefix: 2, exact: 3 };

/** Semua kata kueri harus cocok dengan salah satu kata teks; `null` bila ada yang tidak. */
export function scoreWords(query: readonly string[], words: readonly string[]): SearchScore | null {
  if (query.length === 0) return null;
  let typos = 0;
  let exact = 0;
  for (const queryWord of query) {
    let best: WordMatch | null = null;
    for (const word of words) {
      const match = matchWord(queryWord, word);
      if (match && (!best || MATCH_RANK[match] > MATCH_RANK[best])) best = match;
      if (best === 'exact') break;
    }
    if (!best) return null;
    if (best === 'typo') typos++;
    if (best === 'exact') exact++;
  }
  const phrase = ` ${words.join(' ')}`.includes(` ${query.join(' ')}`);
  return { typos, phrase, exact };
}

/** Urutan relevansi: tanpa salah ketik dulu, lalu frasa utuh, lalu kata yang sama persis. */
export function compareSearchScores(a: SearchScore, b: SearchScore): number {
  return a.typos - b.typos || Number(b.phrase) - Number(a.phrase) || b.exact - a.exact;
}

export interface PreparedSearchEntry<T> {
  entry: T;
  words: string[];
}

/** Kata setiap entri dipecah sekali (per snapshot), bukan setiap kali pengunjung mengetik. */
export function prepareSearchEntries<T extends { text: string }>(
  entries: readonly T[],
): PreparedSearchEntry<T>[] {
  return entries.map((entry) => ({ entry, words: searchWords(entry.text) }));
}

export interface SearchHit<T> {
  entry: T;
  score: SearchScore;
}

/**
 * Entri yang cocok dengan kueri, paling relevan lebih dulu; entri dengan skor sama tetap
 * dalam urutan masukan. Kueri tanpa huruf atau angka tidak menghasilkan apa pun.
 */
export function searchEntries<T>(
  prepared: readonly PreparedSearchEntry<T>[],
  query: string,
): SearchHit<T>[] {
  const words = queryWords(query);
  if (words.length === 0) return [];
  const hits: SearchHit<T>[] = [];
  for (const { entry, words: entryWords } of prepared) {
    const score = scoreWords(words, entryWords);
    if (score) hits.push({ entry, score });
  }
  return hits.sort((a, b) => compareSearchScores(a.score, b.score));
}
