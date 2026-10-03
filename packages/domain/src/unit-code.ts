/** Kode unit dibandingkan tanpa spasi tepi dan tanpa membedakan huruf besar/kecil. */
export function normalizeUnitCode(code: string): string {
  return code.trim().toUpperCase();
}
