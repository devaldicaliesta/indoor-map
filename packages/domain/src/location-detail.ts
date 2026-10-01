import type {
  SnapshotFieldType,
  SnapshotFieldValue,
  SnapshotLocation,
  SnapshotLocationType,
} from './snapshot';

export interface DisplayField {
  key: string;
  label: string;
  type: SnapshotFieldType;
  value: SnapshotFieldValue;
}

/**
 * Field kustom di detail lokasi, urut definisi tipe lokasinya. Snapshot hanya membawa field yang
 * ditandai tampil; yang kosong dilewati. Jam operasional tampil sebagai status buka/tutup (T-304),
 * bukan sebagai baris field.
 */
export function displayFields(
  location: Pick<SnapshotLocation, 'fields'>,
  locationType: Pick<SnapshotLocationType, 'fields'> | undefined,
): DisplayField[] {
  return (locationType?.fields ?? []).flatMap((field) => {
    const value = location.fields[field.key];
    if (value === undefined || field.type === 'opening_hours') return [];
    if (Array.isArray(value) && value.length === 0) return [];
    return [{ key: field.key, label: field.label, type: field.type, value }];
  });
}

const HTTP_URL = /^https?:\/\/[^\s/?#]+[^\s]*$/i;

/**
 * Isi field tautan yang aman dijadikan `href`: hanya http(s), sehingga nilai seperti
 * `javascript:` tidak pernah bisa dijalankan dari halaman pengunjung.
 */
export function externalUrl(value: SnapshotFieldValue): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return HTTP_URL.test(trimmed) ? trimmed : null;
}
