/**
 * Versi Perjanjian Lisensi Pengguna Akhir (EULA) yang berlaku = tanggal terbit naskah
 * `docs/legal/eula.md`. Naikkan saat isinya berubah: aktivasi berikutnya wajib menyetujui ulang.
 * Bebas zod dan berimpor `.ts` agar bisa dimuat Edge Function `license-activate`.
 */
export const EULA_VERSION = '2026-10-30';

const VERSION_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isEulaVersion(value: unknown): value is string {
  return typeof value === 'string' && VERSION_PATTERN.test(value);
}

/** Aktivasi wajib menyertakan persetujuan bila versi berlaku belum pernah disetujui. */
export function needsEulaAcceptance(acceptedVersion: string | null): boolean {
  return acceptedVersion !== EULA_VERSION;
}
