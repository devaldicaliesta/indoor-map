// Tanpa impor: modul ini dimuat builder snapshot di Edge Function Deno (lihat snapshot.ts).
export type NameProblem = 'required' | 'too_long' | 'duplicate';

/**
 * Nama wajib, dibatasi panjangnya, dan unik di antara `others` tanpa membedakan huruf
 * besar/kecil, agar "Toilet" dan "toilet" tidak kembar.
 */
export function checkUniqueName(
  name: string,
  others: readonly { id: string; name: string }[],
  selfId: string | null,
  max: number,
): NameProblem[] {
  const value = name.trim();
  if (!value) return ['required'];
  if (value.length > max) return ['too_long'];
  const lower = value.toLocaleLowerCase('id');
  const clash = others.some(
    (other) => other.id !== selfId && other.name.trim().toLocaleLowerCase('id') === lower,
  );
  return clash ? ['duplicate'] : [];
}

/** Urutan tampil: `sortOrder`, lalu nama. */
export function sortByOrder<T extends { name: string; sortOrder: number }>(
  items: readonly T[],
): T[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'id'));
}
