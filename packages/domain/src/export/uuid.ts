const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: string): boolean => UUID.test(value);

/**
 * Namespace UUID v5 untuk fitur turunan export (alamat, footprint, anchor, occupant). Tetap,
 * agar export berulang dari versi yang sama menghasilkan id yang sama dan sistem penerima bisa
 * memperbarui datanya alih-alih menggandakan.
 */
const EXPORT_NAMESPACE = '62466dbb-b027-4344-81be-17474e559db7';

const hex = (bytes: Uint8Array) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');

/** UUID versi 5 (RFC 9562, SHA-1) dari `name` di dalam `namespace`. */
export async function uuidV5(name: string, namespace = EXPORT_NAMESPACE): Promise<string> {
  const ns = Uint8Array.from(namespace.replace(/-/g, '').match(/../g) ?? [], (h) =>
    Number.parseInt(h, 16),
  );
  const text = new TextEncoder().encode(name);
  const input = new Uint8Array(ns.length + text.length);
  input.set(ns);
  input.set(text, ns.length);
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-1', input)).slice(0, 16);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x50;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const h = hex(bytes);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
