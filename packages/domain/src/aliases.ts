/** Sasaran alias pencarian (tabel `search_aliases`). */
export type AliasTarget =
  | { kind: 'location'; id: string }
  | { kind: 'category'; id: string }
  | { kind: 'facility_type'; id: string };

export const ALIAS_MAX_LENGTH = 60;
export const ALIASES_MAX = 20;

/**
 * Alias dari isian (dipisah koma atau baris baru): dirapikan, tanpa duplikat (huruf besar/kecil
 * dianggap sama), dan tanpa yang sama dengan nama sasarannya sendiri.
 */
export function normalizeAliases(input: string, ownName = ''): string[] {
  const seen = new Set([ownName.trim().toLocaleLowerCase('id')]);
  const out: string[] = [];
  for (const part of input.split(/[,\n]/)) {
    const keyword = part.trim().replace(/\s+/g, ' ');
    const key = keyword.toLocaleLowerCase('id');
    if (!keyword || seen.has(key)) continue;
    seen.add(key);
    out.push(keyword);
  }
  return out;
}

export type AliasProblem = 'too_long' | 'too_many';

export function checkAliases(aliases: readonly string[]): AliasProblem[] {
  const problems: AliasProblem[] = [];
  if (aliases.some((a) => a.length > ALIAS_MAX_LENGTH)) problems.push('too_long');
  if (aliases.length > ALIASES_MAX) problems.push('too_many');
  return problems;
}
