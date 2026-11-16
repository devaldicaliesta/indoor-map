import type { DrawKind, MapFeatureProperties } from './feature';

export const DEFAULT_MODEL = 'builtin:tree';

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

/**
 * Properti setelah jenis fitur diganti: atribut unit hanya ada pada unit (kode baru dibuat
 * bila perlu, status awal kosong), subjenis hanya pada area luar, jenis fasilitas hanya
 * pada fasilitas. Fasilitas tanpa jenis ditolak karena database mewajibkannya.
 */
export function changeFeatureKind(
  properties: MapFeatureProperties,
  next: DrawKind,
  newUnitCode: () => string,
): MapFeatureProperties {
  const {
    unitCode: _code,
    unitStatus: _status,
    areaM2: _area,
    subtype: _subtype,
    facilityTypeId: _facilityType,
    model: _model,
    modelScale: _scale,
    modelRotation: _rotation,
    baseHeight: _baseHeight,
    ...rest
  } = properties;
  const result: MapFeatureProperties = { ...rest, kind: next.kind };
  if (next.kind === 'facility') {
    const facilityTypeId =
      next.facilityTypeId ??
      (properties.kind === 'facility' ? properties.facilityTypeId : undefined);
    if (!facilityTypeId) throw new Error('Fasilitas membutuhkan jenis fasilitas.');
    result.facilityTypeId = facilityTypeId;
  }
  if (next.kind === 'unit') {
    if (properties.kind === 'unit') {
      if (properties.unitCode) result.unitCode = properties.unitCode;
      if (properties.unitStatus) result.unitStatus = properties.unitStatus;
      if (properties.areaM2 !== undefined) result.areaM2 = properties.areaM2;
    } else {
      result.unitCode = newUnitCode();
      result.unitStatus = 'vacant';
    }
  }
  if (next.kind === 'outdoor_area') result.subtype = next.subtype ?? 'road';
  if (next.kind === 'model3d') {
    result.model =
      next.model ?? (properties.kind === 'model3d' ? properties.model : undefined) ?? DEFAULT_MODEL;
    if (properties.kind === 'model3d') {
      if (properties.modelScale !== undefined) result.modelScale = properties.modelScale;
      if (properties.modelRotation !== undefined) result.modelRotation = properties.modelRotation;
      if (properties.baseHeight !== undefined) result.baseHeight = properties.baseHeight;
    }
  }
  return result;
}
