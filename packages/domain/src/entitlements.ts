/** Fitur berbayar yang dibuka lisensi (`features` di berkas lisensi). */
export const PAID_FEATURES = ['3d', 'info_point', 'cad_import'] as const;
export type PaidFeature = (typeof PAID_FEATURES)[number];

export const FEATURE_LABELS: Record<PaidFeature, string> = {
  '3d': 'Tampilan 3D',
  info_point: 'Info Point',
  cad_import: 'Impor denah CAD (DXF)',
};

/** Keterangan pada kontrol yang terkunci. */
export const lockedFeatureMessage = (feature: PaidFeature) =>
  `${FEATURE_LABELS[feature]} tidak termasuk paket lisensi ini.`;

/** Fitur berbayar yang aktif; nama lain di berkas lisensi diabaikan. */
export function enabledFeatures(licenseFeatures: readonly string[]): PaidFeature[] {
  return PAID_FEATURES.filter((f) => licenseFeatures.includes(f));
}

/**
 * Snapshot hanya membawa fitur yang dibuka lisensi: `enabledFeatures` dari lisensi berlaku dan
 * Info Point dibuang bila fiturnya tidak ada. Dipakai saat publish dan rollback, sehingga versi
 * lama yang diterbitkan ulang juga mengikuti paket sekarang.
 */
export function applyEntitlements<
  T extends { enabledFeatures: string[]; infoPoints: readonly unknown[] },
>(snapshot: T, licenseFeatures: readonly string[]): T {
  const features = enabledFeatures(licenseFeatures);
  return {
    ...snapshot,
    enabledFeatures: features,
    infoPoints: features.includes('info_point') ? snapshot.infoPoints : [],
  };
}
