import type { FeatureKind } from './feature';
import type { Geometry } from './geometry';

/**
 * Jenis awal fitur yang baru digambar, sebelum dipilih di panel properti (T-109):
 * poligon = unit (atau area luar di lapisan Area Luar), garis = dinding, titik = pintu.
 */
export function defaultFeatureKind(geometry: Geometry['type'], isOutdoor: boolean): FeatureKind {
  switch (geometry) {
    case 'Polygon':
    case 'MultiPolygon':
      return isOutdoor ? 'outdoor_area' : 'unit';
    case 'LineString':
      return 'wall';
    case 'Point':
      return 'door';
  }
}

/**
 * Kode unit berikutnya dengan awalan tertentu, misalnya `GU-L1-007`. Kode unit wajib
 * ada untuk jenis unit dan unik per venue; kode otomatis bisa diganti pengguna.
 */
export function nextUnitCode(prefix: string, existing: readonly string[]): string {
  const pattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(\\d+)$`, 'i');
  const highest = existing.reduce((max, code) => {
    const match = pattern.exec(code);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}-${String(highest + 1).padStart(3, '0')}`;
}
